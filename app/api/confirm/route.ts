// /api/confirm — accepts community confirmations of service-in-country status.
// This is the moat: proprietary, user-verified data nobody else can scrape.
//
// Rate limited per IP hash (max 5 confirmations / 24h / IP, max 1 per same
// (service, country) pair / 24h). Anti-spam: short text, no URLs.

import { NextRequest, NextResponse } from 'next/server';
import { exec, queryRaw } from '@/lib/db';

export const runtime = 'edge';

const STATUSES = new Set(['yes', 'no', 'partial', 'vpn_only']);

async function hashStr(s: string): Promise<string> {
  const salt = process.env.IP_SALT || 'default-salt';
  const data = new TextEncoder().encode(s + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const serviceSlug = String(form.get('service') || '').trim().toLowerCase();
  const iso2 = String(form.get('country') || '').trim().toUpperCase();
  const status = String(form.get('status') || '').trim().toLowerCase();
  const vpn = String(form.get('vpn') || '').trim().slice(0, 60) || null;
  const notes = String(form.get('notes') || '').trim().slice(0, 240) || null;

  // Honeypot
  if (String(form.get('url') || '').trim()) {
    return NextResponse.redirect((req.headers.get('referer') || '/') + '?confirmed=1', 303);
  }
  // Time check
  const t = Number(form.get('_t') || 0);
  if (!t || Date.now() - t < 2500) {
    return NextResponse.redirect((req.headers.get('referer') || '/') + '?confirmed=1', 303);
  }
  if (!STATUSES.has(status)) return NextResponse.json({ ok: false, error: 'bad_status' }, { status: 400 });
  if (notes && /https?:\/\/|www\./i.test(notes)) {
    return NextResponse.redirect((req.headers.get('referer') || '/') + '?confirmed=1', 303);
  }

  // Resolve service + country to IDs
  try {
    const svc = await queryRaw('SELECT id FROM services WHERE slug = ?', [serviceSlug]);
    if (!svc.length) return NextResponse.json({ ok: false, error: 'unknown_service' }, { status: 400 });
    const country = await queryRaw('SELECT 1 FROM countries WHERE iso2 = ?', [iso2]);
    if (!country.length) return NextResponse.json({ ok: false, error: 'unknown_country' }, { status: 400 });
    const serviceId = Number((svc[0] as any).id);

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';
    const [ipHash, uaHash] = await Promise.all([hashStr(ip), hashStr(ua)]);

    // Rate limits
    const dailyTotal = await queryRaw(
      `SELECT COUNT(*) AS n FROM confirmations WHERE ip_hash = ? AND created_at > datetime('now','-24 hours')`,
      [ipHash]
    );
    if (Number((dailyTotal[0] as any)?.n || 0) >= 5) {
      return NextResponse.redirect((req.headers.get('referer') || '/') + '?confirmed=1', 303);
    }
    const pairRecent = await queryRaw(
      `SELECT 1 FROM confirmations WHERE ip_hash = ? AND service_id = ? AND country_iso2 = ? AND created_at > datetime('now','-24 hours') LIMIT 1`,
      [ipHash, serviceId, iso2]
    );
    if (pairRecent.length) {
      return NextResponse.redirect((req.headers.get('referer') || '/') + '?confirmed=1', 303);
    }

    await exec(
      `INSERT INTO confirmations (service_id, country_iso2, status, vpn_used, notes, ip_hash, user_agent_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serviceId, iso2, status, vpn, notes, ipHash, uaHash]
    );
  } catch {
    // Swallow; user sees success either way (anti-spam pattern).
  }

  return NextResponse.redirect((req.headers.get('referer') || '/') + '?confirmed=1', 303);
}
