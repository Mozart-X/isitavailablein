// /api/v1/geo — returns the caller's country ISO2 code from Cloudflare's
// CF-IPCountry edge header. Used by the embeddable widget to auto-detect
// the visitor's country.
//
// No persistence, no PII stored. Just a single-field passthrough.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const iso2 = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null;
  return NextResponse.json(
    { iso2: iso2 && iso2 !== 'XX' && iso2 !== 'T1' ? iso2 : null },
    {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
    },
  });
}
