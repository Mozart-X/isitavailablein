// Idempotent migration: adds new columns + pricing table.
// Also ensures every service in data/services.json exists in DB,
// and seeds baseline availability for new (service, country) pairs only —
// existing scraped rows are NEVER overwritten (INSERT OR IGNORE).
// Safe to run many times.
import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const client = process.env.TURSO_DATABASE_URL
  ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${path.join(root, 'data.db')}` });

async function tryRun(sql) {
  try {
    await client.execute(sql);
    console.log('OK:', sql.slice(0, 80));
  } catch (e) {
    if (/duplicate column|already exists/i.test(e.message)) {
      console.log('skip (exists):', sql.slice(0, 80));
    } else {
      throw e;
    }
  }
}

const statements = [
  // Usability signals (richer than just status)
  `ALTER TABLE availability ADD COLUMN payment_ok TEXT`,       // yes|no|workaround|unknown
  `ALTER TABLE availability ADD COLUMN phone_verify_ok TEXT`,  // yes|no|workaround|unknown
  `ALTER TABLE availability ADD COLUMN signup_friction TEXT`,  // easy|medium|hard|blocked|unknown
  `ALTER TABLE availability ADD COLUMN workaround TEXT`,       // short text e.g. "virtual card + Indian SIM"

  // Pricing table (per service × country × tier)
  `CREATE TABLE IF NOT EXISTS pricing (
    service_id INTEGER NOT NULL,
    country_iso2 TEXT NOT NULL,
    tier TEXT NOT NULL DEFAULT 'standard',
    price_local REAL,
    currency_local TEXT,
    price_usd REAL,
    period TEXT DEFAULT 'month',
    source TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (service_id, country_iso2, tier),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_pricing_service ON pricing(service_id)`,
  `CREATE INDEX IF NOT EXISTS idx_pricing_country ON pricing(country_iso2)`,

  // Suggestions / feedback / contact
  `CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL,
    body TEXT NOT NULL,
    contact TEXT,
    ip_hash TEXT,
    reviewed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_suggestions_reviewed ON suggestions(reviewed)`,

  // Community confirmations — proprietary moat data.
  // Anyone can scrape OpenAI's supported-countries page (AI can do this).
  // Nobody else has 1,000 anonymous user confirmations of "I confirm
  // ChatGPT works in Iran with NordVPN as of [date]". That's the moat.
  // Plus: each new confirmation = "page updated today" signal to Google.
  `CREATE TABLE IF NOT EXISTS confirmations (
    id INTEGER PRIMARY KEY,
    service_id INTEGER NOT NULL,
    country_iso2 TEXT NOT NULL,
    status TEXT NOT NULL,             -- yes | no | partial | vpn_only
    vpn_used TEXT,                    -- free-text, e.g. "NordVPN" / "ExpressVPN" / "none"
    notes TEXT,                       -- optional one-line user note
    ip_hash TEXT,                     -- for rate limiting only
    user_agent_hash TEXT,             -- secondary rate limit signal
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_conf_pair ON confirmations(service_id, country_iso2)`,
  `CREATE INDEX IF NOT EXISTS idx_conf_recent ON confirmations(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_conf_iphash ON confirmations(ip_hash)`,

  // ETag / Last-Modified cache for conditional GETs. Lets scrapers
  // skip re-processing when the source page hasn't changed.
  `CREATE TABLE IF NOT EXISTS etag_cache (
    url TEXT PRIMARY KEY,
    etag TEXT,
    last_modified TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // Email alert subscriptions (newsletter + targeted change alerts).
  // The owned-audience layer. Compounds with traffic and eventually
  // unlocks newsletter sponsorship revenue.
  `CREATE TABLE IF NOT EXISTS alert_subs (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL,            -- 'targeted' or 'digest'
    email TEXT NOT NULL,
    email_hash TEXT NOT NULL,
    service_id INTEGER,            -- null for digest subs
    country_iso2 TEXT,             -- null for digest subs
    confirmed INTEGER NOT NULL DEFAULT 0,
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_sent_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_alert_kind ON alert_subs(kind)`,
  `CREATE INDEX IF NOT EXISTS idx_alert_pair ON alert_subs(service_id, country_iso2)`,
  `CREATE INDEX IF NOT EXISTS idx_alert_email ON alert_subs(email_hash)`,
];

for (const s of statements) await tryRun(s);

// --- Ensure services + baseline availability exist for everything in services.json ---
// This is the part that lets us add new services to JSON and have them appear in prod
// after the next workflow run, without touching existing scraped data.
try {
  const services = JSON.parse(fs.readFileSync(path.join(root, 'data', 'services.json'), 'utf8'));
  const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
  const restrictions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'known-restrictions.json'), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);

  // Find current max service id so we can assign IDs to brand-new services
  // without colliding with existing rows.
  const maxIdRow = await client.execute('SELECT COALESCE(MAX(id), 0) AS m FROM services');
  let nextId = Number(maxIdRow.rows[0].m) + 1;

  let newServices = 0;
  let newAvailRows = 0;

  for (const s of services) {
    const existing = await client.execute({ sql: 'SELECT id FROM services WHERE slug = ?', args: [s.slug] });
    let serviceId;
    if (existing.rows.length === 0) {
      serviceId = nextId++;
      await client.execute({
        sql: `INSERT INTO services (id, slug, name, category, official_url, geo_page_url, description)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [serviceId, s.slug, s.name, s.category, s.official_url, s.geo_page_url, s.description]
      });
      newServices++;
    } else {
      serviceId = Number(existing.rows[0].id);
      // Update metadata in case JSON changed (description, urls, category) — safe.
      await client.execute({
        sql: `UPDATE services SET name=?, category=?, official_url=?, geo_page_url=?, description=?
              WHERE id = ?`,
        args: [s.name, s.category, s.official_url, s.geo_page_url, s.description, serviceId]
      });
    }

    // Baseline availability — ONLY insert if no row exists for (service, country).
    // INSERT OR IGNORE guarantees we never clobber scraper-written data.
    const r = restrictions[s.slug] || {};
    const explicit = new Map();
    for (const [status, list] of Object.entries(r)) {
      if (status.startsWith('_') || !Array.isArray(list)) continue;
      for (const iso of list) explicit.set(iso, status);
    }
    for (const c of countries) {
      const status = explicit.get(c.iso2) || 'yes';
      const res = await client.execute({
        sql: `INSERT OR IGNORE INTO availability (service_id, country_iso2, status, source, last_verified)
              VALUES (?, ?, ?, ?, ?)`,
        args: [serviceId, c.iso2, status, 'baseline-seed', today]
      });
      if (res.rowsAffected) newAvailRows++;
    }
  }
  console.log(`Services ensured: +${newServices} new, +${newAvailRows} new availability rows`);
} catch (e) {
  console.error('Service ensure step failed (non-fatal):', e.message);
}

// --- Community consensus auto-flip ---
// Real users in real countries beat any scraper. When 3+ community
// confirmations in the last 30 days agree on a status different from
// what's in the DB, flip the DB to match the community.
// Result: stale cells self-correct as soon as enough real users report.
// No manual overrides, no code touches, no prompts needed.
//
// Rules:
//   - Min 3 confirmations in last 30 days for that (service, country)
//   - Majority status >= 60% of recent reports
//   - Majority status != current DB status
//   - Source becomes 'community-consensus' with the confirmation count
//   - Logged to change_log so it appears on /changes
try {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await client.execute(`
    SELECT
      service_id,
      country_iso2,
      status,
      COUNT(*) AS n
    FROM confirmations
    WHERE created_at > datetime('now','-30 days')
    GROUP BY service_id, country_iso2, status
  `);

  // Aggregate per (service, country) pair
  const byPair = new Map();
  for (const r of rows.rows) {
    const k = `${r.service_id}|${r.country_iso2}`;
    if (!byPair.has(k)) byPair.set(k, { total: 0, byStatus: {}, service_id: Number(r.service_id), country_iso2: String(r.country_iso2) });
    const agg = byPair.get(k);
    agg.byStatus[String(r.status)] = Number(r.n);
    agg.total += Number(r.n);
  }

  let flipped = 0;
  for (const agg of byPair.values()) {
    if (agg.total < 3) continue; // need minimum signal
    // Find majority status
    let topStatus = null, topCount = 0;
    for (const [s, n] of Object.entries(agg.byStatus)) {
      if (n > topCount) { topStatus = s; topCount = n; }
    }
    const ratio = topCount / agg.total;
    if (ratio < 0.6) continue; // no clear consensus

    // Compare with current DB status
    const cur = await client.execute({
      sql: 'SELECT status FROM availability WHERE service_id = ? AND country_iso2 = ?',
      args: [agg.service_id, agg.country_iso2]
    });
    const currentStatus = cur.rows[0]?.status || null;
    if (currentStatus === topStatus) continue; // already agrees

    // Flip the DB to match the community
    const source = `community-consensus:${topCount}/${agg.total}`;
    await client.execute({
      sql: `UPDATE availability
            SET status = ?, source = ?, last_verified = ?
            WHERE service_id = ? AND country_iso2 = ?`,
      args: [topStatus, source, today, agg.service_id, agg.country_iso2]
    });
    // Log to change_log so it surfaces on /changes
    await client.execute({
      sql: `INSERT INTO change_log (service_id, country_iso2, old_status, new_status, source)
            VALUES (?, ?, ?, ?, ?)`,
      args: [agg.service_id, agg.country_iso2, currentStatus, topStatus, source]
    });
    flipped++;
  }
  console.log(`Community consensus: flipped ${flipped} cells`);
} catch (e) {
  console.error('Community consensus step failed (non-fatal):', e.message);
}

// --- Manual overrides (emergency only, deprecated path) ---
// Use community confirmations instead. Kept as last-resort for the
// bootstrap period before community data exists for a given cell.
try {
  const overridesPath = path.join(root, 'data', 'manual-overrides.json');
  if (fs.existsSync(overridesPath)) {
    const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
    const today = new Date().toISOString().slice(0, 10);
    let applied = 0;
    for (const [serviceSlug, byCountry] of Object.entries(overrides)) {
      if (serviceSlug.startsWith('_')) continue;
      const svc = await client.execute({ sql: 'SELECT id FROM services WHERE slug = ?', args: [serviceSlug] });
      if (!svc.rows.length) { console.warn(`override: unknown service ${serviceSlug}`); continue; }
      const serviceId = Number(svc.rows[0].id);
      for (const [iso2, val] of Object.entries(byCountry || {})) {
        if (typeof val !== 'object' || !val || !val.status) continue;
        await client.execute({
          sql: `UPDATE availability
                SET status = ?, source = ?, last_verified = ?
                WHERE service_id = ? AND country_iso2 = ?`,
          args: [val.status, 'manual-override', today, serviceId, iso2]
        });
        applied++;
      }
    }
    console.log(`Manual overrides applied: ${applied} cells`);
  }
} catch (e) {
  console.error('Manual overrides step failed (non-fatal):', e.message);
}

console.log('migration done');
process.exit(0);
