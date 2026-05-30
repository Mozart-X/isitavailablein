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

export type PriceChange = {
  id: number;
  service_id: number;
  country_iso2: string;
  tier: string;
  old_usd: number | null;
  new_usd: number | null;
  pct: number | null;
  direction: 'drop' | 'rise' | string;
  changed_at: string;
  service_name: string;
  service_slug: string;
  country_name: string;
  country_slug: string;
  flag: string;
};

// Recent price movements (drops + rises) for the feed. Fresh-ish — uses the
// 5-min cache via a direct query; cheap enough to run uncached.
export async function getRecentPriceChanges(limit = 20, dropsOnly = false): Promise<PriceChange[]> {
  try {
    const rows = await queryRaw(
      `SELECT pl.*, s.name AS service_name, s.slug AS service_slug,
              co.name AS country_name, co.slug AS country_slug, co.flag AS flag
       FROM price_log pl
       JOIN services s ON pl.service_id = s.id
       JOIN countries co ON pl.country_iso2 = co.iso2
       ${dropsOnly ? "WHERE pl.direction = 'drop'" : ''}
       ORDER BY pl.changed_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map((r: any) => ({
      ...r,
      id: Number(r.id),
      service_id: Number(r.service_id),
      old_usd: r.old_usd == null ? null : Number(r.old_usd),
      new_usd: r.new_usd == null ? null : Number(r.new_usd),
      pct: r.pct == null ? null : Number(r.pct),
    })) as PriceChange[];
  } catch { return []; }
}

export type CheapestRow = {
  service: Service;
  cheapest_usd: number;
  cheapest_iso2: string;
  cheapest_country: string;
  cheapest_slug: string;
  dearest_usd: number;
  savings_pct: number;
  countries: number;
};

// Per-service cheapest country + max savings %, for the /cheapest hub ranking.
// Built from the in-memory cache — no extra DB round-trips.
export async function getCheapestPerService(): Promise<CheapestRow[]> {
  const c = await cache();
  const out: CheapestRow[] = [];
  for (const svc of c.services) {
    const prices = c.pricing.filter((p) => p.service_id === svc.id && p.price_usd != null);
    if (prices.length < 2) continue; // need a spread to show "savings"
    // cheapest tier per country
    const byCountry = new Map<string, number>();
    for (const p of prices) {
      const cur = byCountry.get(p.country_iso2);
      if (cur == null || (p.price_usd as number) < cur) byCountry.set(p.country_iso2, p.price_usd as number);
    }
    const entries = [...byCountry.entries()].sort((a, b) => a[1] - b[1]);
    if (entries.length < 2) continue;
    const [cheapIso, cheapUsd] = entries[0];
    const dearUsd = entries[entries.length - 1][1];
    if (dearUsd <= 0) continue;
    const ctry = c.countryByIso.get(cheapIso);
    out.push({
      service: svc,
      cheapest_usd: cheapUsd,
      cheapest_iso2: cheapIso,
      cheapest_country: ctry?.name || cheapIso,
      cheapest_slug: ctry?.slug || '',
      dearest_usd: dearUsd,
      savings_pct: Math.round(((dearUsd - cheapUsd) / dearUsd) * 100),
      countries: entries.length,
    });
  }
  return out.sort((a, b) => b.savings_pct - a.savings_pct);
}

// Price history snapshots for a (service, country) — oldest→newest, for sparklines.
export async function getPriceHistory(serviceId: number, iso2: string, tier = 'standard'): Promise<{ price_usd: number; recorded_at: string }[]> {
  try {
    const rows = await queryRaw(
      `SELECT price_usd, recorded_at FROM price_history
       WHERE service_id = ? AND country_iso2 = ? AND tier = ? AND price_usd IS NOT NULL
       ORDER BY recorded_at ASC LIMIT 60`,
      [serviceId, iso2, tier]
    );
    return rows.map((r: any) => ({ price_usd: Number(r.price_usd), recorded_at: String(r.recorded_at) }));
  } catch { return []; }
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

// Community confirmation counts for a (service, country) pair.
// Used to show the trust signal on availability pages.
export async function getConfirmationCounts(serviceId: number, iso2: string): Promise<{
  yes: number; no: number; partial: number; vpn_only: number;
  total: number; recent_30d: number;
  recent_status: { status: string; count: number }[];
}> {
  const empty = { yes: 0, no: 0, partial: 0, vpn_only: 0, total: 0, recent_30d: 0, recent_status: [] as { status: string; count: number }[] };
  try {
    const rows = await queryRaw(
      `SELECT status, COUNT(*) AS n,
              SUM(CASE WHEN created_at > datetime('now','-30 days') THEN 1 ELSE 0 END) AS recent
       FROM confirmations
       WHERE service_id = ? AND country_iso2 = ?
       GROUP BY status`,
      [serviceId, iso2]
    );
    let total = 0, recent = 0;
    const out = { ...empty };
    const recentByStatus: { status: string; count: number }[] = [];
    for (const r of rows as any[]) {
      const s = String(r.status);
      const n = Number(r.n || 0);
      const rec = Number(r.recent || 0);
      total += n;
      recent += rec;
      if (s === 'yes' || s === 'no' || s === 'partial' || s === 'vpn_only') (out as any)[s] = n;
      if (rec > 0) recentByStatus.push({ status: s, count: rec });
    }
    recentByStatus.sort((a, b) => b.count - a.count);
    return { ...out, total, recent_30d: recent, recent_status: recentByStatus };
  } catch { return empty; }
}

// ── Live status layer (the "DownDetector for geo-blocks" engine) ──────────
// All built on the existing confirmations stream — no schema change.

export type TrendingPair = {
  service: Service | undefined;
  country: Country | undefined;
  total: number;
  no: number;
  vpn_only: number;
  yes: number;
  partial: number;
  blocked_pct: number;
  verdict: 'blocked' | 'vpn_only' | 'working' | 'partial';
  last_at: string;
};

// Pairs with the most community reports in the last N hours — the live board.
// "verdict" is the majority recent status; blocked_pct drives the red/green.
export async function getTrendingReports(hours = 48, limit = 12): Promise<TrendingPair[]> {
  try {
    const c = await cache();
    const rows = await queryRaw(
      `SELECT service_id, country_iso2,
              COUNT(*) AS total,
              SUM(CASE WHEN status='no' THEN 1 ELSE 0 END) AS no,
              SUM(CASE WHEN status='vpn_only' THEN 1 ELSE 0 END) AS vpn_only,
              SUM(CASE WHEN status='yes' THEN 1 ELSE 0 END) AS yes,
              SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END) AS partial,
              MAX(created_at) AS last_at
       FROM confirmations
       WHERE created_at > datetime('now', ?)
       GROUP BY service_id, country_iso2
       ORDER BY total DESC, last_at DESC
       LIMIT ?`,
      [`-${hours} hours`, limit]
    );
    return (rows as any[]).map((r) => {
      const total = Number(r.total) || 0;
      const no = Number(r.no) || 0, vpn_only = Number(r.vpn_only) || 0;
      const yes = Number(r.yes) || 0, partial = Number(r.partial) || 0;
      const counts: [TrendingPair['verdict'], number][] = [
        ['blocked', no], ['vpn_only', vpn_only], ['working', yes], ['partial', partial],
      ];
      counts.sort((a, b) => b[1] - a[1]);
      return {
        service: c.serviceById.get(Number(r.service_id)),
        country: c.countryByIso.get(String(r.country_iso2)),
        total, no, vpn_only, yes, partial,
        blocked_pct: total ? Math.round(((no + vpn_only) / total) * 100) : 0,
        verdict: counts[0][0],
        last_at: String(r.last_at),
      };
    }).filter((p) => p.service && p.country);
  } catch { return []; }
}

export type WorkingMethod = { vpn: string; count: number; last_at: string };

// Which VPNs/methods recent users say WORK for a pair — ranked. The single
// most valuable, perishable, monetizable datapoint we own.
export async function getWorkingMethods(serviceId: number, iso2: string, days = 21): Promise<WorkingMethod[]> {
  try {
    const rows = await queryRaw(
      `SELECT vpn_used AS vpn, COUNT(*) AS n, MAX(created_at) AS last_at
       FROM confirmations
       WHERE service_id = ? AND country_iso2 = ?
         AND status IN ('yes','vpn_only')
         AND vpn_used IS NOT NULL AND TRIM(vpn_used) != ''
         AND created_at > datetime('now', ?)
       GROUP BY vpn_used COLLATE NOCASE
       ORDER BY n DESC, last_at DESC
       LIMIT 5`,
      [serviceId, iso2, `-${days} days`]
    );
    return (rows as any[]).map((r) => ({ vpn: String(r.vpn), count: Number(r.n) || 0, last_at: String(r.last_at) }));
  } catch { return []; }
}

export type LiveReport = {
  service: Service | undefined;
  country: Country | undefined;
  status: string;
  vpn_used: string | null;
  notes: string | null;
  created_at: string;
};

// Newest individual reports — the live ticker. Anonymized (no IP/UA).
export async function getRecentReports(limit = 15): Promise<LiveReport[]> {
  try {
    const c = await cache();
    const rows = await queryRaw(
      `SELECT service_id, country_iso2, status, vpn_used, notes, created_at
       FROM confirmations ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return (rows as any[]).map((r) => ({
      service: c.serviceById.get(Number(r.service_id)),
      country: c.countryByIso.get(String(r.country_iso2)),
      status: String(r.status),
      vpn_used: r.vpn_used ? String(r.vpn_used) : null,
      notes: r.notes ? String(r.notes) : null,
      created_at: String(r.created_at),
    })).filter((r) => r.service && r.country);
  } catch { return []; }
}

export type KnownBlock = {
  service: Service;
  blocked: number;     // countries fully blocked
  vpn_only: number;    // countries VPN-only
  restricted: number;  // blocked + vpn_only
  sample: { country: Country; status: string }[];
};

// Baseline "known restrictions" from real availability data, so the live
// board is useful and SEO-rich even with zero community reports today.
// Honest: labeled as known restrictions, not "live outages".
export async function getKnownBlocks(limit = 15): Promise<KnownBlock[]> {
  const c = await cache();
  const out: KnownBlock[] = [];
  for (const svc of c.services) {
    const rows = c.availBySvc.get(svc.id) || [];
    let blocked = 0, vpn_only = 0;
    const sample: { country: Country; status: string }[] = [];
    for (const a of rows) {
      if (a.status === 'no' || a.status === 'vpn_only') {
        if (a.status === 'no') blocked++; else vpn_only++;
        const ctry = c.countryByIso.get(a.country_iso2);
        if (ctry && sample.length < 6) sample.push({ country: ctry, status: a.status });
      }
    }
    const restricted = blocked + vpn_only;
    if (restricted > 0) out.push({ service: svc, blocked, vpn_only, restricted, sample });
  }
  return out.sort((a, b) => b.restricted - a.restricted).slice(0, limit);
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
