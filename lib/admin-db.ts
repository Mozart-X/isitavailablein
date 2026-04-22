// Admin-only DB helpers. Always fresh (no cache), for mutable views.
import { createClient, type Client } from '@libsql/client/web';

let _c: Client | null = null;
function c(): Client {
  if (_c) return _c;
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL not set');
  _c = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return _c;
}

export async function q<T = any>(sql: string, args: any[] = []): Promise<T[]> {
  const r = await c().execute({ sql, args });
  return r.rows as unknown as T[];
}
export async function run(sql: string, args: any[] = []) {
  await c().execute({ sql, args });
}

export async function adminStats() {
  const [svc, ctry, av, r, cl, sl] = await Promise.all([
    q('SELECT COUNT(*) as n FROM services'),
    q('SELECT COUNT(*) as n FROM countries'),
    q('SELECT COUNT(*) as n FROM availability'),
    q('SELECT COUNT(*) as n FROM user_reports WHERE reviewed = 0'),
    q('SELECT COUNT(*) as n FROM change_log'),
    q('SELECT COUNT(*) as n FROM scrape_log WHERE ok = 0 AND run_at > datetime("now","-7 days")')
  ]);
  return {
    services: Number(svc[0].n),
    countries: Number(ctry[0].n),
    availability: Number(av[0].n),
    pendingReports: Number(r[0].n),
    changes: Number(cl[0].n),
    recentFailedScrapes: Number(sl[0].n)
  };
}

export async function pendingReports() {
  return q(`
    SELECT ur.*, s.name as service_name, s.slug as service_slug,
           c.name as country_name, c.slug as country_slug, c.flag
    FROM user_reports ur
    JOIN services s ON ur.service_id = s.id
    JOIN countries c ON ur.country_iso2 = c.iso2
    WHERE ur.reviewed = 0
    ORDER BY ur.created_at DESC LIMIT 100
  `);
}

export async function recentScrapes(limit = 50) {
  return q('SELECT * FROM scrape_log ORDER BY run_at DESC LIMIT ?', [limit]);
}

export async function applyReport(reportId: number, apply: boolean) {
  const rows = await q('SELECT * FROM user_reports WHERE id = ?', [reportId]);
  if (!rows[0]) return;
  const rep = rows[0];
  if (apply) {
    const today = new Date().toISOString().slice(0, 10);
    const cur = await q('SELECT status FROM availability WHERE service_id = ? AND country_iso2 = ?', [rep.service_id, rep.country_iso2]);
    const old = cur[0]?.status || null;
    if (old !== rep.reported_status) {
      await run(
        `INSERT INTO availability (service_id, country_iso2, status, source, last_verified)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(service_id, country_iso2) DO UPDATE SET status=excluded.status, source=excluded.source, last_verified=excluded.last_verified`,
        [rep.service_id, rep.country_iso2, rep.reported_status, 'user-report+admin', today]
      );
      await run(
        `INSERT INTO change_log (service_id, country_iso2, old_status, new_status, source) VALUES (?, ?, ?, ?, ?)`,
        [rep.service_id, rep.country_iso2, old, rep.reported_status, 'user-report+admin']
      );
    }
    await run('UPDATE user_reports SET reviewed = 1, applied = 1 WHERE id = ?', [reportId]);
  } else {
    await run('UPDATE user_reports SET reviewed = 1, applied = 0 WHERE id = ?', [reportId]);
  }
}

export async function setDetails(serviceId: number, iso2: string, d: {
  payment_ok?: string | null; phone_verify_ok?: string | null;
  signup_friction?: string | null; workaround?: string | null;
}) {
  const validYN = ['yes','no','workaround','unknown',''];
  const validFr = ['easy','medium','hard','blocked','unknown',''];
  const norm = (v: any, set: string[]) => {
    const s = (v ?? '').toString().trim().toLowerCase();
    if (!set.includes(s)) return null;
    return s || null;
  };
  const payment = norm(d.payment_ok, validYN);
  const phone = norm(d.phone_verify_ok, validYN);
  const friction = norm(d.signup_friction, validFr);
  const workaround = (d.workaround ?? '').toString().trim() || null;
  const today = new Date().toISOString().slice(0, 10);
  // Ensure row exists (status=unknown if missing) then update detail columns.
  await run(
    `INSERT INTO availability (service_id, country_iso2, status, source, last_verified, payment_ok, phone_verify_ok, signup_friction, workaround)
     VALUES (?, ?, 'unknown', 'admin-manual', ?, ?, ?, ?, ?)
     ON CONFLICT(service_id, country_iso2) DO UPDATE SET
       payment_ok=excluded.payment_ok,
       phone_verify_ok=excluded.phone_verify_ok,
       signup_friction=excluded.signup_friction,
       workaround=excluded.workaround`,
    [serviceId, iso2, today, payment, phone, friction, workaround]
  );
}

export async function setPricing(serviceId: number, iso2: string, tier: string, p: {
  price_local?: number | null; currency_local?: string | null;
  price_usd?: number | null; period?: string | null;
}) {
  const t = (tier || 'standard').toString().trim().toLowerCase() || 'standard';
  const priceLocal = p.price_local != null && !isNaN(Number(p.price_local)) ? Number(p.price_local) : null;
  const priceUsd = p.price_usd != null && !isNaN(Number(p.price_usd)) ? Number(p.price_usd) : null;
  const cur = (p.currency_local ?? '').toString().trim().toUpperCase() || null;
  const period = (p.period ?? 'month').toString().trim().toLowerCase() || 'month';
  await run(
    `INSERT INTO pricing (service_id, country_iso2, tier, price_local, currency_local, price_usd, period, source, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'admin-manual', datetime('now'))
     ON CONFLICT(service_id, country_iso2, tier) DO UPDATE SET
       price_local=excluded.price_local,
       currency_local=excluded.currency_local,
       price_usd=excluded.price_usd,
       period=excluded.period,
       source=excluded.source,
       updated_at=excluded.updated_at`,
    [serviceId, iso2, t, priceLocal, cur, priceUsd, period]
  );
}

export async function setStatus(serviceId: number, iso2: string, status: string, note: string | null) {
  const valid = ['yes', 'no', 'partial', 'vpn_only', 'unknown'];
  if (!valid.includes(status)) throw new Error('bad status');
  const today = new Date().toISOString().slice(0, 10);
  const cur = await q('SELECT status FROM availability WHERE service_id = ? AND country_iso2 = ?', [serviceId, iso2]);
  const old = cur[0]?.status || null;
  await run(
    `INSERT INTO availability (service_id, country_iso2, status, source, notes, last_verified)
     VALUES (?, ?, ?, 'admin-manual', ?, ?)
     ON CONFLICT(service_id, country_iso2) DO UPDATE SET status=excluded.status, source=excluded.source, notes=excluded.notes, last_verified=excluded.last_verified`,
    [serviceId, iso2, status, note, today]
  );
  if (old !== status) {
    await run(
      `INSERT INTO change_log (service_id, country_iso2, old_status, new_status, source) VALUES (?, ?, ?, ?, 'admin-manual')`,
      [serviceId, iso2, old, status]
    );
  }
}
