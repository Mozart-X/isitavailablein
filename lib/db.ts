// Data layer. During build, loads entire dataset into memory once
// (avoids SQLite concurrent-read issues). At runtime with Turso, same approach
// gives instant reads & low egress.
//
// If you need fresh data on every request (e.g. for the /api/report endpoint
// after a user submits), call exec() directly or clear the cache.

import { createClient, type Client } from '@libsql/client/web';

export type Status = 'yes' | 'no' | 'partial' | 'vpn_only' | 'unknown';

export type Service = {
  id: number;
  slug: string;
  name: string;
  category: string;
  official_url: string;
  geo_page_url: string | null;
  description: string | null;
};

export type Country = {
  iso2: string;
  name: string;
  slug: string;
  flag: string;
};

export type YesNoWorkaround = 'yes' | 'no' | 'workaround' | 'unknown' | null;
export type SignupFriction = 'easy' | 'medium' | 'hard' | 'blocked' | 'unknown' | null;

export type Availability = {
  service_id: number;
  country_iso2: string;
  status: Status;
  source: string | null;
  notes: string | null;
  last_verified: string;
  payment_ok: YesNoWorkaround;
  phone_verify_ok: YesNoWorkaround;
  signup_friction: SignupFriction;
  workaround: string | null;
};

export type Pricing = {
  service_id: number;
  country_iso2: string;
  tier: string;
  price_local: number | null;
  currency_local: string | null;
  price_usd: number | null;
  period: string | null;
  source: string | null;
  updated_at: string;
};

export type Change = {
  id: number;
  service_id: number;
  country_iso2: string;
  old_status: string | null;
  new_status: string;
  source: string | null;
  changed_at: string;
  service_name: string;
  service_slug: string;
  country_name: string;
  country_slug: string;
};

let _client: Client | null = null;
function getClient(): Client {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL not set');
  _client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  return _client;
}

type Cache = {
  services: Service[];
  countries: Country[];
  availability: Availability[];
  changes: Change[];
  pricing: Pricing[];
  serviceBySlug: Map<string, Service>;
  serviceById: Map<number, Service>;
  countryBySlug: Map<string, Country>;
  countryByIso: Map<string, Country>;
  availByKey: Map<string, Availability>; // `${serviceId}|${iso2}`
  availBySvc: Map<number, Availability[]>;
  availByCountry: Map<string, Availability[]>;
  priceByKey: Map<string, Pricing[]>; // `${serviceId}|${iso2}` -> tiers
};

let _cache: Cache | null = null;
let _cacheAt = 0;
let _loading: Promise<Cache> | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — keeps site fresh without rebuild

async function load(): Promise<Cache> {
  const c = getClient();

  // `pricing` may not exist yet on older DBs — guard with try/catch.
  let pricing: Pricing[] = [];
  const [svcRes, ctryRes, avRes, clRes] = await Promise.all([
    c.execute('SELECT * FROM services ORDER BY name'),
    c.execute('SELECT * FROM countries ORDER BY name'),
    c.execute('SELECT * FROM availability'),
    c.execute(`SELECT cl.*, s.name as service_name, s.slug as service_slug,
               co.name as country_name, co.slug as country_slug
               FROM change_log cl
               JOIN services s ON cl.service_id = s.id
               JOIN countries co ON cl.country_iso2 = co.iso2
               ORDER BY cl.changed_at DESC LIMIT 200`)
  ]);
  try {
    const pRes = await c.execute('SELECT * FROM pricing');
    pricing = pRes.rows as unknown as Pricing[];
  } catch { /* table may not exist before migration */ }

  const services = svcRes.rows as unknown as Service[];
  const countries = ctryRes.rows as unknown as Country[];
  const availability = avRes.rows as unknown as Availability[];
  const changes = clRes.rows as unknown as Change[];

  // Normalize numbers (libsql may return bigint-ish)
  services.forEach((s) => (s.id = Number(s.id)));
  availability.forEach((a) => (a.service_id = Number(a.service_id)));
  changes.forEach((c) => (c.id = Number(c.id), c.service_id = Number(c.service_id)));

  const serviceBySlug = new Map(services.map((s) => [s.slug, s]));
  const serviceById = new Map(services.map((s) => [s.id, s]));
  const countryBySlug = new Map(countries.map((c) => [c.slug, c]));
  const countryByIso = new Map(countries.map((c) => [c.iso2, c]));
  const availByKey = new Map(availability.map((a) => [`${a.service_id}|${a.country_iso2}`, a]));

  const availBySvc = new Map<number, Availability[]>();
  const availByCountry = new Map<string, Availability[]>();
  for (const a of availability) {
    if (!availBySvc.has(a.service_id)) availBySvc.set(a.service_id, []);
    availBySvc.get(a.service_id)!.push(a);
    if (!availByCountry.has(a.country_iso2)) availByCountry.set(a.country_iso2, []);
    availByCountry.get(a.country_iso2)!.push(a);
  }

  pricing.forEach((p) => {
    p.service_id = Number(p.service_id);
    if (p.price_local != null) p.price_local = Number(p.price_local);
    if (p.price_usd != null) p.price_usd = Number(p.price_usd);
  });
  const priceByKey = new Map<string, Pricing[]>();
  for (const p of pricing) {
    const k = `${p.service_id}|${p.country_iso2}`;
    if (!priceByKey.has(k)) priceByKey.set(k, []);
    priceByKey.get(k)!.push(p);
  }

  return {
    services, countries, availability, changes, pricing,
    serviceBySlug, serviceById, countryBySlug, countryByIso,
    availByKey, availBySvc, availByCountry, priceByKey
  };
}

async function cache(): Promise<Cache> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) return _cache;
  if (_loading) return _loading;
  _loading = load().then((c) => { _cache = c; _cacheAt = Date.now(); _loading = null; return c; });
  return _loading;
}

export function invalidateCache() { _cache = null; _cacheAt = 0; }

export async function getService(slug: string): Promise<Service | null> {
  return (await cache()).serviceBySlug.get(slug) ?? null;
}

export async function getCountry(slug: string): Promise<Country | null> {
  return (await cache()).countryBySlug.get(slug) ?? null;
}

export async function getAllServices(): Promise<Service[]> {
  return (await cache()).services;
}

export async function getAllCountries(): Promise<Country[]> {
  return (await cache()).countries;
}

export async function getAvailability(serviceId: number, iso2: string): Promise<Availability | null> {
  return (await cache()).availByKey.get(`${serviceId}|${iso2}`) ?? null;
}

export async function getAvailabilityForService(serviceId: number): Promise<(Availability & { country_name: string; country_slug: string })[]> {
  const c = await cache();
  const rows = c.availBySvc.get(serviceId) || [];
  return rows.map((a) => {
    const ctry = c.countryByIso.get(a.country_iso2)!;
    return { ...a, country_name: ctry.name, country_slug: ctry.slug };
  }).sort((a, b) => a.country_name.localeCompare(b.country_name));
}

export async function getAvailabilityForCountry(iso2: string): Promise<(Availability & { service_name: string; service_slug: string; category: string })[]> {
  const c = await cache();
  const rows = c.availByCountry.get(iso2) || [];
  return rows.map((a) => {
    const svc = c.serviceById.get(a.service_id)!;
    return { ...a, service_name: svc.name, service_slug: svc.slug, category: svc.category };
  }).sort((a, b) => (a.category + a.service_name).localeCompare(b.category + b.service_name));
}

export async function getRecentChanges(limit = 30): Promise<Change[]> {
  return (await cache()).changes.slice(0, limit);
}

export async function getPricing(serviceId: number, iso2: string): Promise<Pricing[]> {
  return (await cache()).priceByKey.get(`${serviceId}|${iso2}`) ?? [];
}

export async function getPricingForService(serviceId: number): Promise<Pricing[]> {
  return (await cache()).pricing.filter((p) => p.service_id === serviceId);
}

// Most recent successful scrape timestamp (ISO string). Fresh query — don't cache.
export async function getLastScrapeAt(): Promise<string | null> {
  try {
    const r = await getClient().execute('SELECT run_at FROM scrape_log WHERE ok = 1 ORDER BY run_at DESC LIMIT 1');
    const row = r.rows[0] as any;
    return row?.run_at ?? null;
  } catch { return null; }
}

// Direct DB writes (bypass cache). Used by /api/report.
export async function exec(sql: string, params: any[] = []) {
  await getClient().execute({ sql, args: params });
}

// Direct DB read (bypass cache). Used by anti-spam rate limiter etc.
export async function queryRaw(sql: string, params: any[] = []): Promise<any[]> {
  const r = await getClient().execute({ sql, args: params });
  return r.rows as any[];
}

// Aggregate scrape activity stats — used to prove the scraper is alive
// even when no status changes are detected (which is itself good news).
export async function getScrapeActivity(): Promise<{
  totalRuns24h: number;
  totalRuns7d: number;
  servicesChecked24h: string[];
  lastRunPerService: Array<{ service_slug: string; last_run: string }>;
}> {
  try {
    const [a, b, c, d] = await Promise.all([
      getClient().execute(`SELECT COUNT(*) AS n FROM scrape_log WHERE ok=1 AND run_at > datetime('now','-24 hours')`),
      getClient().execute(`SELECT COUNT(*) AS n FROM scrape_log WHERE ok=1 AND run_at > datetime('now','-7 days')`),
      getClient().execute(`SELECT DISTINCT service_slug FROM scrape_log WHERE ok=1 AND run_at > datetime('now','-24 hours') ORDER BY service_slug`),
      getClient().execute(`SELECT service_slug, MAX(run_at) AS last_run FROM scrape_log WHERE ok=1 GROUP BY service_slug ORDER BY last_run DESC LIMIT 20`),
    ]);
    return {
      totalRuns24h: Number((a.rows[0] as any)?.n || 0),
      totalRuns7d: Number((b.rows[0] as any)?.n || 0),
      servicesChecked24h: (c.rows as any[]).map((r) => String(r.service_slug)),
      lastRunPerService: (d.rows as any[]).map((r) => ({ service_slug: String(r.service_slug), last_run: String(r.last_run) })),
    };
  } catch {
    return { totalRuns24h: 0, totalRuns7d: 0, servicesChecked24h: [], lastRunPerService: [] };
  }
}
