import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, ADMIN_COOKIE } from '@/lib/admin-auth';
import { applyReport } from '@/lib/admin-db';

export async function POST(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const form = await req.formData();
  const id = Number(form.get('id'));
  const action = String(form.get('action'));
  if (!id || !['apply', 'reject'].includes(action)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await applyReport(id, action === 'apply');
  return NextResponse.redirect(new URL('/admin/reports', req.url), 303);
}
