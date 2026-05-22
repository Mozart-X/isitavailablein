// Legacy report endpoint. The user-facing form was replaced by
// <CommunityConfirm /> which posts to /api/confirm. This endpoint is kept
// only because cached/old pages may still hit it. Hardened with:
// - Rate-limit: 1 submission per (ip_hash, service_id, country_iso2) per 60s
//   (fixes the 3-second double-click duplicate that came in 5/21)
// - Daily cap: 5 reports / 24h / IP
// New code should use /api/confirm; this endpoint is deprecation-track.

import { NextRequest, NextResponse } from 'next/server';
import { exec, queryRaw } from '@/lib/db';

export const runtime = 'edge';

async function hashIp(ip: string): Promise<string> {
  const salt = process.env.IP_SALT || 'default-salt';
  const data = new TextEncoder().encode(ip + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const service_id = Number(form.get('service_id'));
  const country_iso2 = String(form.get('country_iso2') || '');
  const status = String(form.get('status') || '');

  if (!service_id || !country_iso2 || !['yes', 'no', 'partial', 'vpn_only'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'bad input' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const ip_hash = await hashIp(ip);
  const referer = req.headers.get('referer') || '/';
  const successRedirect = referer + (referer.includes('?') ? '&' : '?') + 'reported=1';

  // Rate-limit 1: same (ip_hash, service_id, country_iso2) within 60s.
  // Stops the accidental double-click pattern we just saw in admin.
  try {
    const recentPair = await queryRaw(
      `SELECT 1 FROM user_reports
        WHERE ip_hash = ? AND service_id = ? AND country_iso2 = ?
          AND created_at > datetime('now','-60 seconds') LIMIT 1`,
      [ip_hash, service_id, country_iso2]
    );
    if (recentPair.length) return NextResponse.redirect(successRedirect, 303);

    // Rate-limit 2: 5 reports / 24h / IP.
    const dailyCount = await queryRaw(
      `SELECT COUNT(*) AS n FROM user_reports
        WHERE ip_hash = ? AND created_at > datetime('now','-24 hours')`,
      [ip_hash]
    );
    if (Number((dailyCount[0] as any)?.n || 0) >= 5) return NextResponse.redirect(successRedirect, 303);
  } catch {}

  await exec(
    `INSERT INTO user_reports (service_id, country_iso2, reported_status, ip_hash) VALUES (?, ?, ?, ?)`,
    [service_id, country_iso2, status, ip_hash]
  );

  return NextResponse.redirect(successRedirect, 303);
}
