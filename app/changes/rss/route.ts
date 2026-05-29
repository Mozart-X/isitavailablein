// /changes/rss.xml — RSS feed of recent service-availability changes.
// Auto-distribution channel. Picked up by:
//   - IFTTT / Zapier / Make.com workflows
//   - News aggregators (Feedly, Inoreader, Reeder)
//   - Notion (database embed), Slack (RSS app), Discord (RSS bots)
//   - Tech bloggers' "weekly link round-ups"
//
// Each external republish = backlink + free distribution. RSS is dead
// for normal users but very alive for power users who run automations.

import { getRecentChanges } from '@/lib/db';

export const runtime = 'edge';
export const revalidate = 600;

function esc(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] as string));
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com';
  const changes = await getRecentChanges(50);

  const items = changes.map((c: any) => {
    const slug = `is-${c.service_slug}-available-in-${c.country_slug}`;
    const url = `${base}/${slug}`;
    const title = `${c.service_name} in ${c.country_name}: ${c.old_status || 'unknown'} → ${c.new_status}`;
    const desc = `${c.service_name} availability in ${c.country_name} changed from ${c.old_status || 'unknown'} to ${c.new_status}. Source: ${c.source || 'verified'}.`;
    const pub = new Date(c.changed_at).toUTCString();
    return `    <item>
      <title>${esc(title)}</title>
      <link>${esc(url)}</link>
      <description>${esc(desc)}</description>
      <pubDate>${pub}</pubDate>
      <guid isPermaLink="false">${esc(`${c.service_slug}-${c.country_iso2}-${c.changed_at}`)}</guid>
      <category>${esc(c.category || 'Availability')}</category>
    </item>`;
  }).join('\n');

  const lastBuild = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IsItAvailableIn — Recent availability changes</title>
    <link>${base}/changes</link>
    <atom:link href="${base}/changes/rss" rel="self" type="application/rss+xml"/>
    <description>Automatic feed of services that launched, were blocked, or changed status in any country worldwide.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
