import { NextRequest, NextResponse } from 'next/server';
import { exec } from '@/lib/db';

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

  await exec(
    `INSERT INTO user_reports (service_id, country_iso2, reported_status, ip_hash) VALUES (?, ?, ?, ?)`,
    [service_id, country_iso2, status, ip_hash]
  );

  const referer = req.headers.get('referer') || '/';
  return NextResponse.redirect(referer + '?reported=1', 303);
}
