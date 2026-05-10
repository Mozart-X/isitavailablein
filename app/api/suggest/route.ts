import { NextRequest, NextResponse } from 'next/server';
import { exec, queryRaw } from '@/lib/db';

export const runtime = 'edge';

const KINDS = new Set(['service', 'country', 'feedback', 'bug', 'other']);

// Common spam phrases from SEO / link-building / "we noticed your website" emails.
// Lowercased substrings — any match → silently drop.
const SPAM_PATTERNS = [
  'seo services', 'seo service', 'seo agency', 'seo expert', 'seo company',
  'first page of google', 'first page on google', 'google first page',
  'rank your website', 'rank your site', 'rank higher',
  'increase traffic', 'targeted traffic', 'organic listings',
  'web design services', 'web development services',
  'project manager', 'account manager will contact',
  'send us "no"', 'send us " no "', 'reply with "no"', 'reply no',
  'send you a quote', 'price list',
  'crypto.com/exch', 'binance.com/en/activity', // referral link spam
  'backlink', 'link building service',
  'digital marketing services',
  'noticed your website', 'came across your website', 'came across your site',
  'doesn\'t show in', 'do not show in the organic',
];

// Block common spammer free-mail patterns from the contact field.
const SPAM_EMAIL_DOMAINS = [
  'briannawebsolution', // exact spammer hit
];

function looksLikeSpam(body: string, contact: string | null): string | null {
  const b = body.toLowerCase();
  for (const p of SPAM_PATTERNS) {
    if (b.includes(p)) return `pattern:${p}`;
  }
  // Many URLs in body = spam
  const urlMatches = b.match(/https?:\/\/|www\./g);
  if (urlMatches && urlMatches.length >= 3) return 'too_many_urls';
  // Repeating same word ≥6 times (link spam pattern)
  const words = b.split(/\s+/).filter((w) => w.length > 4);
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  if (Object.values(counts).some((n) => n >= 6)) return 'word_repeat';
  if (contact) {
    const c = contact.toLowerCase();
    for (const d of SPAM_EMAIL_DOMAINS) if (c.includes(d)) return `email:${d}`;
  }
  return null;
}

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

  // --- ANTI-SPAM LAYER 1: Honeypot ---
  // Bots blindly fill every field. The "url" / "website" fields are hidden
  // from real users via CSS; any value here = bot. Pretend it worked.
  const honeypot = String(form.get('url') || '') + String(form.get('website') || '');
  if (honeypot.trim()) {
    return NextResponse.redirect((req.headers.get('referer') || '/') + '?suggested=1', 303);
  }

  // --- ANTI-SPAM LAYER 2: Time-to-fill ---
  // Form sets a timestamp via JS on load. Submissions <3s after load are bots.
  // Missing _t entirely = also bot (real users have JS).
  const tStr = String(form.get('_t') || '');
  const tNum = Number(tStr);
  if (!tNum || Date.now() - tNum < 3000) {
    return NextResponse.redirect((req.headers.get('referer') || '/') + '?suggested=1', 303);
  }

  // --- Validation ---
  if (!KINDS.has(kind)) return NextResponse.json({ ok: false, error: 'bad kind' }, { status: 400 });
  if (body.length < 3 || body.length > 2000) return NextResponse.json({ ok: false, error: 'body must be 3-2000 chars' }, { status: 400 });

  // --- ANTI-SPAM LAYER 3: Pattern matching ---
  const spamHit = looksLikeSpam(body, contact);
  if (spamHit) {
    // Pretend it worked so bot doesn't retry.
    return NextResponse.redirect((req.headers.get('referer') || '/') + '?suggested=1', 303);
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const ip_hash = await hashIp(ip);

  // --- ANTI-SPAM LAYER 4: Rate limit per IP hash ---
  // Max 1 submission per 60 seconds per IP hash. Honest users hit this never.
  try {
    const recent = await queryRaw(
      `SELECT 1 FROM suggestions WHERE ip_hash = ? AND created_at > datetime('now', '-60 seconds') LIMIT 1`,
      [ip_hash]
    );
    if (recent.length > 0) {
      return NextResponse.redirect((req.headers.get('referer') || '/') + '?suggested=1', 303);
    }
  } catch {}

  await exec(
    `INSERT INTO suggestions (kind, body, contact, ip_hash) VALUES (?, ?, ?, ?)`,
    [kind, body, contact, ip_hash]
  );

  const referer = req.headers.get('referer') || '/';
  const sep = referer.includes('?') ? '&' : '?';
  return NextResponse.redirect(referer + sep + 'suggested=1', 303);
}
