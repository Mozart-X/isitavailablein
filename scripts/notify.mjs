// Email notifier — the retention loop. Runs after every scrape (hourly cron).
//
// For each active subscriber, finds events newer than their watermark
// (last_sent_at, floored at the sub's created_at) and sends ONE summary email,
// then advances the watermark. Kinds:
//   targeted → status flips for their service+country (change_log)
//   price    → price DROPS for their service (or any service) (price_log)
//   digest   → weekly roundup of all changes + drops (max once / 7 days)
//
// Fully env-gated: with no RESEND_API_KEY set, it logs "email disabled" and
// exits 0 so the cron never breaks. Sending uses the Resend HTTP API (no deps).

import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_FROM = process.env.ALERT_FROM || 'IsItAvailableIn <alerts@isitavailablein.com>';
const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com').replace(/\/$/, '');
const MAX_EMAILS = Number(process.env.NOTIFY_MAX_EMAILS || 300); // safety cap per run

const client = process.env.TURSO_DATABASE_URL
  ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${path.join(root, 'data.db')}` });

const q = async (sql, args = []) => (await client.execute({ sql, args })).rows;
const run = async (sql, args = []) => { await client.execute({ sql, args }); };

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function shell(inner, unsubToken) {
  const unsub = `${SITE_URL}/api/unsubscribe?t=${unsubToken}`;
  return `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;line-height:1.5">
    <p style="font-size:18px;font-weight:700;margin:0 0 12px"><a href="${SITE_URL}" style="color:#0066cc;text-decoration:none">IsItAvailableIn</a></p>
    ${inner}
    <hr style="border:0;border-top:1px solid #eee;margin:24px 0 12px">
    <p style="font-size:12px;color:#999;margin:0">You're getting this because you subscribed at isitavailablein.com.
    <a href="${unsub}" style="color:#999">Unsubscribe</a> · one click, instant.</p>
  </div>`;
}

async function send(to, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: ALERT_FROM, to, subject, html }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`resend ${r.status}: ${t.slice(0, 200)}`);
  }
}

async function main() {
  if (!RESEND_API_KEY) {
    console.log('[notify] email disabled (no RESEND_API_KEY) — skipping. Subscriptions still collected.');
    process.exit(0);
  }

  const runStart = (await q(`SELECT datetime('now') AS now`))[0].now;
  const subs = await q(
    `SELECT id, kind, email, service_id, country_iso2, unsub_token,
            COALESCE(last_sent_at, created_at) AS watermark, last_sent_at
     FROM alert_subs WHERE unsubscribed = 0`
  );
  console.log(`[notify] ${subs.length} active subs; run watermark ${runStart}`);

  let sent = 0, failed = 0;
  for (const s of subs) {
    if (sent >= MAX_EMAILS) { console.log('[notify] hit MAX_EMAILS cap'); break; }
    const token = s.unsub_token || '';
    if (!token) continue; // safety: never send without an unsubscribe path

    try {
      let subject = null, inner = null;

      if (s.kind === 'targeted' && s.service_id != null && s.country_iso2) {
        const rows = await q(
          `SELECT cl.old_status, cl.new_status, cl.changed_at, sv.name AS svc, co.name AS ctry
           FROM change_log cl JOIN services sv ON cl.service_id = sv.id
           JOIN countries co ON cl.country_iso2 = co.iso2
           WHERE cl.service_id = ? AND cl.country_iso2 = ?
             AND cl.changed_at > ? AND cl.changed_at <= ?
           ORDER BY cl.changed_at DESC`,
          [s.service_id, s.country_iso2, s.watermark, runStart]
        );
        if (rows.length) {
          const r0 = rows[0];
          subject = `${r0.svc} in ${r0.ctry}: ${r0.old_status || '—'} → ${r0.new_status}`;
          inner = `<p style="font-size:16px">Status change you're watching:</p>` +
            rows.map((r) => `<p style="margin:6px 0"><strong>${esc(r.svc)}</strong> in <strong>${esc(r.ctry)}</strong>: ${esc(r.old_status || '—')} → <strong>${esc(r.new_status)}</strong></p>`).join('') +
            `<p style="margin-top:16px"><a href="${SITE_URL}" style="color:#0066cc">See full details →</a></p>`;
        }
      } else if (s.kind === 'price') {
        const args = [s.watermark, runStart];
        let svcClause = '';
        if (s.service_id != null) { svcClause = 'AND pl.service_id = ?'; args.push(s.service_id); }
        const rows = await q(
          `SELECT pl.old_usd, pl.new_usd, pl.pct, pl.changed_at, sv.name AS svc, sv.slug AS slug, co.name AS ctry
           FROM price_log pl JOIN services sv ON pl.service_id = sv.id
           JOIN countries co ON pl.country_iso2 = co.iso2
           WHERE pl.direction = 'drop' AND pl.changed_at > ? AND pl.changed_at <= ? ${svcClause}
           ORDER BY pl.changed_at DESC LIMIT 20`,
          args
        );
        if (rows.length) {
          const r0 = rows[0];
          subject = `Price drop: ${r0.svc} now $${Number(r0.new_usd).toFixed(2)} in ${r0.ctry}`;
          inner = `<p style="font-size:16px">📉 Prices dropped on services you're watching:</p>` +
            rows.map((r) => `<p style="margin:6px 0"><strong>${esc(r.svc)}</strong> in ${esc(r.ctry)}: <span style="color:#888">$${Number(r.old_usd).toFixed(2)}</span> → <strong style="color:#0a7d33">$${Number(r.new_usd).toFixed(2)}</strong>${r.pct != null ? ` (${Number(r.pct)}%)` : ''} — <a href="${SITE_URL}/cheapest/${esc(r.slug)}" style="color:#0066cc">where it's cheapest →</a></p>`).join('');
        }
      } else if (s.kind === 'digest') {
        // At most once every 7 days.
        const days = s.last_sent_at
          ? (await q(`SELECT (julianday(?) - julianday(?)) AS d`, [runStart, s.last_sent_at]))[0].d
          : 999;
        if (Number(days) < 7) continue;
        const [changes, drops] = await Promise.all([
          q(`SELECT sv.name AS svc, co.name AS ctry, cl.old_status, cl.new_status
             FROM change_log cl JOIN services sv ON cl.service_id = sv.id
             JOIN countries co ON cl.country_iso2 = co.iso2
             WHERE cl.changed_at > datetime('now','-7 days') ORDER BY cl.changed_at DESC LIMIT 25`),
          q(`SELECT sv.name AS svc, co.name AS ctry, pl.old_usd, pl.new_usd, pl.pct
             FROM price_log pl JOIN services sv ON pl.service_id = sv.id
             JOIN countries co ON pl.country_iso2 = co.iso2
             WHERE pl.direction='drop' AND pl.changed_at > datetime('now','-7 days') ORDER BY pl.changed_at DESC LIMIT 25`),
        ]);
        if (!changes.length && !drops.length) continue; // nothing worth a digest
        subject = `Weekly digest: ${changes.length} status changes, ${drops.length} price drops`;
        inner = `<p style="font-size:16px">Here's what moved this week.</p>`;
        if (drops.length) {
          inner += `<p style="font-weight:700;margin:14px 0 4px">📉 Price drops</p>` +
            drops.map((r) => `<p style="margin:4px 0">${esc(r.svc)} in ${esc(r.ctry)}: $${Number(r.old_usd).toFixed(2)} → <strong style="color:#0a7d33">$${Number(r.new_usd).toFixed(2)}</strong></p>`).join('');
        }
        if (changes.length) {
          inner += `<p style="font-weight:700;margin:14px 0 4px">🔁 Availability changes</p>` +
            changes.map((r) => `<p style="margin:4px 0">${esc(r.svc)} in ${esc(r.ctry)}: ${esc(r.old_status || '—')} → <strong>${esc(r.new_status)}</strong></p>`).join('');
        }
        inner += `<p style="margin-top:16px"><a href="${SITE_URL}/cheapest" style="color:#0066cc">See the live price tracker →</a></p>`;
      }

      if (subject && inner) {
        await send(s.email, subject, shell(inner, token));
        sent++;
      }
      // Advance watermark regardless (so we don't re-scan the same window),
      // but only for kinds that consume the per-event window. Digest uses its
      // own 7-day gate, so we still bump it to "now" after a send.
      if (subject && inner) {
        await run(`UPDATE alert_subs SET last_sent_at = ? WHERE id = ?`, [runStart, s.id]);
      }
    } catch (e) {
      failed++;
      console.error(`[notify] sub ${s.id} (${s.kind}) failed: ${e.message}`);
    }
  }

  console.log(`[notify] done — sent=${sent} failed=${failed}`);
  process.exit(0);
}

main().catch((e) => { console.error('[notify] fatal:', e.message); process.exit(0); });
