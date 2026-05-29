// /api/unsubscribe?t=TOKEN — one-click unsubscribe from any alert email.
// Linked at the bottom of every email the notifier sends. Marks the row
// unsubscribed=1 (kept, not deleted, so we never re-add or double-count).

import { NextRequest } from 'next/server';
import { exec } from '@/lib/db';

export const runtime = 'edge';

function page(body: string): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe — IsItAvailableIn</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1.25rem;color:#222;line-height:1.5}a{color:#0066cc}</style></head><body>${body}</body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get('t') || '').trim();
  if (!token || token.length < 16) {
    return page('<h1>Invalid link</h1><p>This unsubscribe link looks malformed. <a href="/">Go home</a></p>');
  }
  try {
    await exec(`UPDATE alert_subs SET unsubscribed = 1 WHERE unsub_token = ?`, [token]);
  } catch {
    // silent — don't leak whether the token existed
  }
  return page(
    '<h1>You\'re unsubscribed ✅</h1><p>You won\'t get any more alert emails for this subscription. No hard feelings.</p><p><a href="/cheapest">Back to the price tracker</a></p>'
  );
}
