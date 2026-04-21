// Data layer. During build, loads entire dataset into memory once
// (avoids SQLite concurrent-read issues). At runtime with Turso, same approach
// gives instant reads & low egress.
//
// If you need fresh data on every request (e.g. for the /api/report endpoint
// after a user submits), call exec() directly or clear the cache.

import { createClient, type Client } from '@libsql/client';
import path from 'node:path';

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

export type Availability = {
  service_id: number;
  country_iso2: string;
  status: Status;
  source: string | null;
  notes: string | null;
  last_verified: string;
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
  if (process.env.TURSO_DATABASE_URL) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  } else {
    const p = path.join(process.cwd(), 'data.db');
    _client = createClient({ url: `file:${p}` });
  }
  return _client;
}

type Cache = {
  services: Service[];
  countries: Country[];
  availability: Availability[];
  changes: Change[];
  serviceBySlug: Map<string, Service>;
  serviceById: Map<number, Service>;
  countryBySlug: Map<string, Country>;
  countryByIso: Map<string, Country>;
  availByKey: Map<string, Availability>; // `${serviceId}|${iso2}`
  availBySvc: Map<number, Availability[]>;
  availByCountry: Map<string, Availability[]>;
};

let _cache: Cache | null = null;
let _loading: Promise<Cache> | null = null;

async function load(): Promise<Cache> {
  const c = getClient();

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

  return {
    services, countries, availability, changes,
    serviceBySlug, serviceById, countryBySlug, countryByIso,
    availByKey, availBySvc, availByCountry
  };
}

async function cache(): Promise<Cache> {
  if (_cache) return _cache;
  if (_loading) return _loading;
  _loading = load().then((c) => { _cache = c; _loading = null; return c; });
  return _loading;
}

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

// Direct DB writes (bypass cache). Used by /api/report.
export async function exec(sql: string, params: any[] = []) {
  await getClient().execute({ sql, args: params });
}
