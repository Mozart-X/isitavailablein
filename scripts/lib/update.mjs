// Shared helper for scrapers. Reads/writes the DB, logs changes + runs.

import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

let _client = null;
function client() {
  if (_client) return _client;
  _client = process.env.TURSO_DATABASE_URL
    ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
    : createClient({ url: `file:${path.join(root, 'data.db')}` });
  return _client;
}

async function query(sql, args = []) {
  const r = await client().execute({ sql, args });
  return r.rows;
}
async function run(sql, args = []) {
  await client().execute({ sql, args });
}

async function logRun(serviceSlug, source, ok, stats, error) {
  try {
    await run(
      `INSERT INTO scrape_log (service_slug, source, ok, changed, unchanged, skipped, error)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serviceSlug, source, ok ? 1 : 0, stats?.changed || 0, stats?.unchanged || 0, stats?.skipped || 0, error || null]
    );
  } catch (e) { console.error('logRun failed:', e.message); }
}

// Exported helper: log a "source unchanged" run when fetchText returns null
// (HTTP 304 Not Modified). Lets scrapers early-return without DB churn.
export async function logUnchanged(serviceSlug, source) {
  await logRun(serviceSlug, source + ':not-modified', true, { changed: 0, unchanged: 0, skipped: 0 });
}

export async function applyUpdate(serviceSlug, source, statusByIso) {
  try {
    const svcRows = await query('SELECT id FROM services WHERE slug = ?', [serviceSlug]);
    if (!svcRows.length) throw new Error(`Service not found: ${serviceSlug}`);
    const serviceId = Number(svcRows[0].id);

    const countries = await query('SELECT iso2 FROM countries');
    const validIso = new Set(countries.map((c) => c.iso2));
    const today = new Date().toISOString().slice(0, 10);

    let changed = 0, unchanged = 0, skipped = 0;
    for (const [iso, newStatus] of Object.entries(statusByIso || {})) {
      if (!validIso.has(iso)) { skipped++; continue; }
      const existing = await query('SELECT status FROM availability WHERE service_id = ? AND country_iso2 = ?', [serviceId, iso]);
      const oldStatus = existing[0]?.status || null;
      if (oldStatus === newStatus) {
        await run('UPDATE availability SET last_verified = ?, source = ? WHERE service_id = ? AND country_iso2 = ?',
          [today, source, serviceId, iso]);
        unchanged++;
        continue;
      }
      // Auto-infer friction + workaround based on status. Never overrides existing explicit values.
      let inferFriction = null, inferWorkaround = null;
      if (newStatus === 'vpn_only') { inferFriction = 'hard'; inferWorkaround = 'Use a VPN set to a supported region'; }
      else if (newStatus === 'no') { inferFriction = 'blocked'; }
      else if (newStatus === 'partial') { inferFriction = 'medium'; }
      else if (newStatus === 'yes') { inferFriction = 'easy'; }

      await run(
        `INSERT INTO availability (service_id, country_iso2, status, source, last_verified, signup_friction, workaround)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(service_id, country_iso2) DO UPDATE SET
           status=excluded.status,
           source=excluded.source,
           last_verified=excluded.last_verified,
           signup_friction=COALESCE(availability.signup_friction, excluded.signup_friction),
           workaround=COALESCE(availability.workaround, excluded.workaround)`,
        [serviceId, iso, newStatus, source, today, inferFriction, inferWorkaround]
      );
      await run(
        `INSERT INTO change_log (service_id, country_iso2, old_status, new_status, source) VALUES (?, ?, ?, ?, ?)`,
        [serviceId, iso, oldStatus, newStatus, source]
      );
      changed++;
    }

    const stats = { changed, unchanged, skipped };
    console.log(`[${serviceSlug}] changed=${changed} unchanged=${unchanged} skipped=${skipped} (source=${source})`);
    await logRun(serviceSlug, source, true, stats);
    return stats;
  } catch (e) {
    await logRun(serviceSlug, source, false, null, e.message);
    throw e;
  }
}

// Upsert pricing rows. Accepts an array of { iso, tier, price_local, currency, price_usd, period }.
// Safe to call repeatedly; `ON CONFLICT` updates existing rows.
export async function applyPricing(serviceSlug, source, rows) {
  try {
    const svcRows = await query('SELECT id FROM services WHERE slug = ?', [serviceSlug]);
    if (!svcRows.length) throw new Error(`Service not found: ${serviceSlug}`);
    const serviceId = Number(svcRows[0].id);
    const countries = await query('SELECT iso2 FROM countries');
    const validIso = new Set(countries.map((c) => c.iso2));
    let wrote = 0, skipped = 0;
    for (const r of rows || []) {
      if (!validIso.has(r.iso)) { skipped++; continue; }
      await run(
        `INSERT INTO pricing (service_id, country_iso2, tier, price_local, currency_local, price_usd, period, source, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(service_id, country_iso2, tier) DO UPDATE SET
           price_local=excluded.price_local,
           currency_local=excluded.currency_local,
           price_usd=excluded.price_usd,
           period=excluded.period,
           source=excluded.source,
           updated_at=excluded.updated_at`,
        [serviceId, r.iso, r.tier || 'standard', r.price_local ?? null, r.currency ?? null, r.price_usd ?? null, r.period || 'month', source]
      );
      wrote++;
    }
    console.log(`[pricing:${serviceSlug}] wrote=${wrote} skipped=${skipped}`);
    await logRun(serviceSlug, `${source}:pricing`, true, { changed: wrote, unchanged: 0, skipped });
    return { wrote, skipped };
  } catch (e) {
    await logRun(serviceSlug, `${source}:pricing`, false, null, e.message);
    throw e;
  }
}

// fetchText with conditional GET support (ETag + Last-Modified).
// We remember the last ETag/Last-Modified per URL in the etag_cache table.
// If the source hasn't changed, the server responds 304 and we return null —
// signaling the caller to skip processing entirely. This saves both bandwidth
// AND Turso writes when pages haven't actually changed.
//
// Returns: { text, status } — text is null if 304 Not Modified
export async function fetchText(url) {
  let etag = null, lastModified = null;
  try {
    const cached = await query('SELECT etag, last_modified FROM etag_cache WHERE url = ?', [url]);
    if (cached.length) {
      etag = cached[0].etag;
      lastModified = cached[0].last_modified;
    }
  } catch {}

  const headers = {
    'User-Agent': 'IsItAvailableIn-Bot/1.0 (+https://isitavailablein.com)',
    'Accept': 'text/html,application/xhtml+xml',
  };
  if (etag) headers['If-None-Match'] = etag;
  if (lastModified) headers['If-Modified-Since'] = lastModified;

  const r = await fetch(url, { headers });

  // 304 Not Modified — source hasn't changed since last fetch.
  // Return the body as null; caller should skip scrape.
  if (r.status === 304) return null;

  if (!r.ok) throw new Error(`Fetch ${url} failed: ${r.status}`);

  // Remember new ETag/Last-Modified for next time.
  const newEtag = r.headers.get('etag');
  const newLastMod = r.headers.get('last-modified');
  if (newEtag || newLastMod) {
    try {
      await run(
        `INSERT INTO etag_cache (url, etag, last_modified, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(url) DO UPDATE SET
           etag=excluded.etag, last_modified=excluded.last_modified, updated_at=excluded.updated_at`,
        [url, newEtag, newLastMod]
      );
    } catch {}
  }
  return await r.text();
}

// Baseline helper: given blocklist + partial list, produce status map for ALL_ISO.
export const ALL_ISO = ['US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','PT','CH','AT','BE','PL','GR','CZ','HU','RO','TR','RU','UA','JP','KR','CN','HK','TW','SG','MY','TH','VN','PH','ID','IN','PK','BD','NP','LK','AE','SA','IL','EG','ZA','NG','KE','MA','BR','MX','AR','CL','CO','PE','NZ','IR','CU','KP','SY'];

export function buildStatusMap({ no = [], partial = [], vpn_only = [], onlyAvailable = null } = {}) {
  const out = {};
  const noSet = new Set(no), pSet = new Set(partial), vSet = new Set(vpn_only);
  const availSet = onlyAvailable ? new Set(onlyAvailable) : null;
  for (const iso of ALL_ISO) {
    if (noSet.has(iso)) out[iso] = 'no';
    else if (pSet.has(iso)) out[iso] = 'partial';
    else if (vSet.has(iso)) out[iso] = 'vpn_only';
    else if (availSet) out[iso] = availSet.has(iso) ? 'yes' : 'no';
    else out[iso] = 'yes';
  }
  return out;
}
