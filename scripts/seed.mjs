// Seed the DB with services, countries, and baseline availability.
// Uses @libsql/client (local file by default, Turso if TURSO_DATABASE_URL set).

import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const client = process.env.TURSO_DATABASE_URL
  ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${path.join(root, 'data.db')}` });

const schema = fs.readFileSync(path.join(root, 'lib', 'schema.sql'), 'utf8');
// Split schema into individual statements and exec each
const stmts = schema.split(';').map((s) => s.trim()).filter(Boolean);
for (const s of stmts) {
  await client.execute(s);
}

const services = JSON.parse(fs.readFileSync(path.join(root, 'data', 'services.json'), 'utf8'));
const countries = JSON.parse(fs.readFileSync(path.join(root, 'data', 'countries.json'), 'utf8'));
const restrictions = JSON.parse(fs.readFileSync(path.join(root, 'data', 'known-restrictions.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const inserts = [];

services.forEach((s, i) => {
  inserts.push({
    sql: `INSERT OR REPLACE INTO services (id, slug, name, category, official_url, geo_page_url, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [i + 1, s.slug, s.name, s.category, s.official_url, s.geo_page_url, s.description]
  });
});

countries.forEach((c) => {
  inserts.push({
    sql: `INSERT OR REPLACE INTO countries (iso2, name, slug, flag) VALUES (?, ?, ?, ?)`,
    args: [c.iso2, c.name, c.slug, c.flag]
  });
});

services.forEach((s, i) => {
  const sid = i + 1;
  const r = restrictions[s.slug] || {};
  const explicit = new Map();
  for (const [status, list] of Object.entries(r)) {
    if (status.startsWith('_') || !Array.isArray(list)) continue;
    for (const iso of list) explicit.set(iso, status);
  }
  for (const c of countries) {
    const status = explicit.get(c.iso2) || 'yes';
    inserts.push({
      sql: `INSERT OR REPLACE INTO availability (service_id, country_iso2, status, source, notes, last_verified)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [sid, c.iso2, status, 'baseline-seed', null, today]
    });
  }
});

console.log(`Executing ${inserts.length} insert statements (batched)...`);
await client.batch(inserts.map((i) => ({ sql: i.sql, args: i.args })), 'write');

const svc = await client.execute('SELECT COUNT(*) as n FROM services');
const ctry = await client.execute('SELECT COUNT(*) as n FROM countries');
const av = await client.execute('SELECT COUNT(*) as n FROM availability');
console.log(`Seeded: ${svc.rows[0].n} services, ${ctry.rows[0].n} countries, ${av.rows[0].n} availability rows.`);
