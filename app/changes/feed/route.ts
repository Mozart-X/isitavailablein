// /changes/feed.json — JSON Feed v1.1 alternative to RSS.
// Same data, modern format. Picked up by NetNewsWire, Reeder, Inoreader,
// and custom Make/Zapier flows that prefer JSON over XML.

import { getRecentChanges } from '@/lib/db';

export const runtime = 'edge';
export const revalidate = 600;

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com';
  const changes = await getRecentChanges(50);

  const items = changes.map((c: any) => {
    const slug = `is-${c.service_slug}-available-in-${c.country_slug}`;
    return {
      id: `${c.service_slug}-${c.country_iso2}-${c.changed_at}`,
      url: `${base}/${slug}`,
      title: `${c.service_name} in ${c.country_name}: ${c.old_status || 'unknown'} → ${c.new_status}`,
      content_text: `${c.service_name} availability in ${c.country_name} changed from ${c.old_status || 'unknown'} to ${c.new_status}. Source: ${c.source || 'verified'}.`,
      date_published: new Date(c.changed_at).toISOString(),
      tags: [c.category || 'Availability', c.country_name],
    };
  });

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'IsItAvailableIn — Recent availability changes',
    home_page_url: `${base}/changes`,
    feed_url: `${base}/changes/feed`,
    description: 'Services that launched, were blocked, or changed status in any country worldwide.',
    language: 'en-us',
    items,
  };

  return new Response(JSON.stringify(feed), {
    headers: {
      'content-type': 'application/feed+json; charset=utf-8',
      'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
