import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { setStatus, q } from '@/lib/admin-db';

const CYCLE: Record<string, string> = {
  yes: 'partial', partial: 'vpn_only', vpn_only: 'no', no: 'unknown', unknown: 'yes'
};

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const form = await req.formData();
  const service_id = Number(form.get('service_id'));
  const iso2 = String(form.get('iso2'));
  const cycle = form.get('cycle') === '1';
  const current = String(form.get('current') || 'unknown');
  const explicit = form.get('status') ? String(form.get('status')) : null;
  const notes = form.get('notes') ? String(form.get('notes')) : null;

  const next = explicit || CYCLE[current] || 'yes';
  await setStatus(service_id, iso2, next, notes);

  // Redirect back to the edit page
  const svc = await q('SELECT slug FROM services WHERE id = ?', [service_id]);
  const back = svc[0] ? `/admin/services/${svc[0].slug}` : '/admin/services';
  return NextResponse.redirect(new URL(back, req.url), 303);
}
