import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, makeToken, ADMIN_COOKIE } from '@/lib/admin-auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get('password') || '');
  const next = String(form.get('next') || '/admin');

  if (!verifyPassword(password)) {
    const url = new URL('/admin/login', req.url);
    url.searchParams.set('err', '1');
    if (next) url.searchParams.set('next', next);
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  const token = await makeToken();
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}
