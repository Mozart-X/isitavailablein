import { NextRequest, NextResponse } from 'next/server';
import { markSuggestionReviewed } from '@/lib/admin-db';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = Number(form.get('id'));
  if (Number.isFinite(id) && id > 0) {
    try { await markSuggestionReviewed(id); } catch { /* table may not exist yet */ }
  }
  return NextResponse.redirect(new URL('/admin/suggestions', req.url), 303);
}
