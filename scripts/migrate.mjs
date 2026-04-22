// Idempotent migration: adds new columns + pricing table.
// Safe to run many times. Swallows "duplicate column" errors.
import { createClient } from '@libsql/client';
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
];

for (const s of statements) await tryRun(s);
console.log('migration done');
process.exit(0);
