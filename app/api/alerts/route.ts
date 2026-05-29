// /api/alerts — email subscription endpoint.
// Two kinds: 'targeted' (notify on specific service-country status flip)
// and 'digest' (weekly summary email).
//
// Rate-limited; honeypot; anti-spam patterns (same as /api/suggest).
// Actual email sending is a separate cron worker (TBD); this endpoint
// just persists the subscription.

import { NextRequest, NextResponse } from 'next/server';
import { exec, queryRaw } from '@/lib/db';

export const runtime = 'edge';

// 'targeted' = specific service+country status flip
// 'digest'   = weekly summary of everything
// 'price'    = price drop for a service (any country); service optional = all
const KINDS = new Set(['targeted', 'digest', 'price']);

async function hash(s: string): Promise<string> {
  const salt = process.env.IP_SALT || 'default-salt';
  const data = new TextEncoder().encode(s + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const kind = String(form.get('kind') || '');
  const email = String(form.get('email') || '').trim().toLowerCase();
  const serviceSlug = String(form.get('service') || '').trim().toLowerCase() || null;
  const iso2 = String(form.get('country') || '').trim().toUpperCase() || null;

  const back = req.headers.get('referer') || '/alerts';
  const ok = back + (back.includes('?') ? '&' : '?') + 'subscribed=1';

  // Honeypot + time check
  if (String(form.get('url') || '').trim()) return NextResponse.redirect(ok, 303);
  const t = Number(form.get('_t') || 0);
  if (!t || Date.now() - t < 1500) return NextResponse.redirect(ok, 303);

  if (!KINDS.has(kind)) return NextResponse.json({ ok: false, error: 'bad_kind' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: 'bad_email' }, { status: 400 });
  if (kind === 'targeted' && (!serviceSlug || !iso2)) {
    return NextResponse.json({ ok: false, error: 'missing_target' }, { status: 400 });
  }
  // 'price' subs: service is optional (blank = all services), country ignored.

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = await hash(ip);
  const emailHash = await hash(email);

  // Rate limit: 3 subscriptions per IP per 24h
  try {
    const recent = await queryRaw(
      `SELECT COUNT(*) AS n FROM alert_subs WHERE ip_hash = ? AND created_at > datetime('now','-24 hours')`,
      [ipHash]
    );
    if (Number((recent[0] as any)?.n || 0) >= 3) return NextResponse.redirect(ok, 303);
  } catch {}

  try {
    // Resolve service_id if provided
    let serviceId: number | null = null;
    if (serviceSlug) {
      const svc = await queryRaw('SELECT id FROM services WHERE slug = ?', [serviceSlug]);
      if (!svc.length) return NextResponse.json({ ok: false, error: 'unknown_service' }, { status: 400 });
      serviceId = Number((svc[0] as any).id);
    }
    // price subs ignore country; one-click-unsubscribe token per sub.
    const subCountry = kind === 'price' ? null : iso2;
    const token = crypto.randomUUID().replace(/-/g, '');
    await exec(
      `INSERT INTO alert_subs (kind, email, email_hash, service_id, country_iso2, ip_hash, unsub_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kind, email, emailHash, serviceId, subCountry, ipHash, token]
    );
  } catch {
    // ignore — silent success keeps spammers from probing
  }

  return NextResponse.redirect(ok, 303);
}
