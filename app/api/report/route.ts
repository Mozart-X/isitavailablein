import { NextRequest, NextResponse } from 'next/server';
import { exec } from '@/lib/db';
import crypto from 'node:crypto';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const service_id = Number(form.get('service_id'));
  const country_iso2 = String(form.get('country_iso2') || '');
  const status = String(form.get('status') || '');

  if (!service_id || !country_iso2 || !['yes', 'no', 'partial', 'vpn_only'].includes(status)) {
    return NextResponse.json({ ok: false, error: 'bad input' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const ip_hash = crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'default-salt')).digest('hex').slice(0, 16);

  await exec(
    `INSERT INTO user_reports (service_id, country_iso2, reported_status, ip_hash) VALUES (?, ?, ?, ?)`,
    [service_id, country_iso2, status, ip_hash]
  );

  const referer = req.headers.get('referer') || '/';
  return NextResponse.redirect(referer + '?reported=1', 303);
}
