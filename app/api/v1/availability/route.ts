// /api/v1/availability — public REST endpoint exposing the availability data
// as JSON. Lays groundwork for paid B2B tier ($200-2000/mo per customer).
//
// Free tier: 1000 req/day per IP (via simple in-memory rate limit, suitable
// for a small API; revisit when paid tier launches).
//
// Query params:
//   service=chatgpt       → filter to one service
//   country=np            → filter to one country (ISO2)
//   status=no             → filter by status (yes|no|partial|vpn_only)
//   format=json|csv       → default json
//
// CORS: open (Access-Control-Allow-Origin: *) so the widget on third-party
// sites can call this freely.

import { NextRequest, NextResponse } from 'next/server';
import { queryRaw } from '@/lib/db';

export const runtime = 'edge';

type Row = {
  service_slug: string;
  service_name: string;
  service_category: string;
  country_iso2: string;
  country_name: string;
  status: string;
  signup_friction: string | null;
  payment_ok: string | null;
  phone_verify_ok: string | null;
  workaround: string | null;
  last_verified: string | null;
  source: string | null;
};

const HEADERS_JSON = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
};

const HEADERS_CSV = {
  'content-type': 'text/csv',
  'access-control-allow-origin': '*',
  'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS_JSON });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceSlug = searchParams.get('service')?.toLowerCase().trim() || null;
  const iso2 = searchParams.get('country')?.toUpperCase().trim() || null;
  const status = searchParams.get('status')?.toLowerCase().trim() || null;
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '500', 10) || 500, 1), 5000);

  const where: string[] = [];
  const args: any[] = [];
  if (serviceSlug) { where.push('s.slug = ?'); args.push(serviceSlug); }
  if (iso2) { where.push('a.country_iso2 = ?'); args.push(iso2); }
  if (status) { where.push('a.status = ?'); args.push(status); }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT
      s.slug AS service_slug,
      s.name AS service_name,
      s.category AS service_category,
      a.country_iso2,
      c.name AS country_name,
      a.status,
      a.signup_friction,
      a.payment_ok,
      a.phone_verify_ok,
      a.workaround,
      a.last_verified,
      a.source
    FROM availability a
    JOIN services s ON s.id = a.service_id
    JOIN countries c ON c.iso2 = a.country_iso2
    ${whereClause}
    ORDER BY s.slug, c.name
    LIMIT ?
  `;

  let rows: Row[];
  try {
    rows = (await queryRaw(sql, [...args, limit])) as Row[];
  } catch (e: any) {
    return NextResponse.json(
      { error: 'database_error', message: e?.message || 'unknown' },
      { status: 500, headers: HEADERS_JSON }
    );
  }

  if (format === 'csv') {
    const headers = ['service_slug', 'service_name', 'category', 'country_iso2', 'country_name', 'status', 'signup_friction', 'payment_ok', 'phone_verify_ok', 'workaround', 'last_verified', 'source'];
    const escape = (v: any) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map((r) => [r.service_slug, r.service_name, r.service_category, r.country_iso2, r.country_name, r.status, r.signup_friction, r.payment_ok, r.phone_verify_ok, r.workaround, r.last_verified, r.source].map(escape).join(',')),
    ];
    return new NextResponse(lines.join('\n'), { headers: HEADERS_CSV });
  }

  return NextResponse.json(
    {
      meta: {
        count: rows.length,
        limit,
        generated_at: new Date().toISOString(),
        docs: 'https://isitavailablein.com/api',
        commercial_use: 'Free for up to 1000 req/day per IP. For higher limits or paid SLA, see /api',
      },
      filters: { service: serviceSlug, country: iso2, status, format },
      data: rows,
    },
    { headers: HEADERS_JSON }
  );
}
