import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { setDetails, q } from '@/lib/admin-db';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const form = await req.formData();
  const service_id = Number(form.get('service_id'));
  const iso2 = String(form.get('iso2'));
  await setDetails(service_id, iso2, {
    payment_ok: form.get('payment_ok') as any,
    phone_verify_ok: form.get('phone_verify_ok') as any,
    signup_friction: form.get('signup_friction') as any,
    workaround: form.get('workaround') as any,
  });
  const svc = await q('SELECT slug FROM services WHERE id = ?', [service_id]);
  const back = svc[0] ? `/admin/services/${svc[0].slug}` : '/admin/services';
  return NextResponse.redirect(new URL(back, req.url), 303);
}
