import { NextRequest, NextResponse } from 'next/server';
import { exec } from '@/lib/db';

export const runtime = 'edge';

const KINDS = new Set(['service', 'country', 'feedback', 'bug', 'other']);

async function hashIp(ip: string): Promise<string> {
  const salt = process.env.IP_SALT || 'default-salt';
  const data = new TextEncoder().encode(ip + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const kind = String(form.get('kind') || 'feedback');
  const body = String(form.get('body') || '').trim();
  const contact = String(form.get('contact') || '').trim().slice(0, 200) || null;

  if (!KINDS.has(kind)) return NextResponse.json({ ok: false, error: 'bad kind' }, { status: 400 });
  if (body.length < 3 || body.length > 2000) return NextResponse.json({ ok: false, error: 'body must be 3-2000 chars' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const ip_hash = await hashIp(ip);

  await exec(
    `INSERT INTO suggestions (kind, body, contact, ip_hash) VALUES (?, ?, ?, ?)`,
    [kind, body, contact, ip_hash]
  );

  const referer = req.headers.get('referer') || '/';
  const sep = referer.includes('?') ? '&' : '?';
  return NextResponse.redirect(referer + sep + 'suggested=1', 303);
}
