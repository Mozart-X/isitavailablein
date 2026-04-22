import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { setPricing, q } from '@/lib/admin-db';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const form = await req.formData();
  const service_id = Number(form.get('service_id'));
  const iso2 = String(form.get('iso2'));
  const tier = String(form.get('tier') || 'standard');
  const priceLocalRaw = form.get('price_local');
  const priceUsdRaw = form.get('price_usd');
  await setPricing(service_id, iso2, tier, {
    price_local: priceLocalRaw ? Number(priceLocalRaw) : null,
    currency_local: form.get('currency_local') as any,
    price_usd: priceUsdRaw ? Number(priceUsdRaw) : null,
    period: form.get('period') as any,
  });
  const svc = await q('SELECT slug FROM services WHERE id = ?', [service_id]);
  const back = svc[0] ? `/admin/services/${svc[0].slug}` : '/admin/services';
  return NextResponse.redirect(new URL(back, req.url), 303);
}
