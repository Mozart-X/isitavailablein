import { MetadataRoute } from 'next';
import { getAllServices, getAllCountries, getAvailabilityForService } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import { isHighValue } from '@/lib/focus';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com';
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/live`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/cheapest`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/changes`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/countries`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/best-vpn`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/deals`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/api-docs`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/me`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/alerts`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/best-vpn-quiz`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/review/nordvpn`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/review/surfshark`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/review/expressvpn`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 }
  ];

  for (const s of services) {
    entries.push({ url: `${base}/service/${s.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
    entries.push({ url: `${base}/cheapest/${s.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
    entries.push({ url: `${base}/best-vpn-for/${s.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
  }
  for (const c of countries) {
    entries.push({ url: `${base}/country/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
    entries.push({ url: `${base}/apps-banned-in/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 });
    entries.push({ url: `${base}/best-vpn-for/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
  }
  // Per-service availability, fetched once. Drives BOTH the high-value page
  // filter and the how-to-use list. We deliberately DON'T emit all 4,670
  // service×country combos — only pages that say something useful (restricted
  // status, censored market, real price, or verified data). Thin "available,
  // nothing to add" filler is left out of the sitemap so Google crawls quality.
  const countryByIso = new Map(countries.map((c) => [c.iso2, c]));
  for (const s of services) {
    const rows = await getAvailabilityForService(s.id);
    for (const r of rows) {
      const c = countryByIso.get(r.country_iso2);
      if (!c) continue;
      const restricted = r.status === 'no' || r.status === 'partial' || r.status === 'vpn_only';

      if (isHighValue({ status: r.status, iso2: r.country_iso2, source: (r as any).source })) {
        entries.push({
          url: `${base}/${buildAvailabilitySlug(s.slug, c.slug)}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: restricted ? 0.8 : 0.6,
        });
      }
      // How-to-use unblock guide — the highest-intent affiliate pages.
      if (restricted) {
        entries.push({
          url: `${base}/how-to-use/${s.slug}/${c.slug}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }
    }
  }

  // /compare/[a]/vs/[b] — country-pair comparison pages.
  // Mirror the hand-picked NOTABLE_PAIRS in the route file. Keep this in sync.
  const NOTABLE_PAIRS: Record<string, string[]> = {
    'china': ['united-states', 'singapore', 'hong-kong', 'taiwan', 'japan', 'south-korea', 'australia', 'canada', 'germany', 'united-kingdom'],
    'india': ['united-states', 'united-kingdom', 'canada', 'australia', 'germany', 'singapore', 'united-arab-emirates', 'pakistan', 'china', 'nepal'],
    'pakistan': ['united-arab-emirates', 'saudi-arabia', 'india', 'united-kingdom', 'united-states', 'canada', 'germany', 'australia', 'turkey', 'china'],
    'nepal': ['india', 'united-states', 'united-kingdom', 'australia', 'canada', 'germany', 'china', 'singapore', 'japan', 'south-korea'],
    'turkey': ['germany', 'united-states', 'united-kingdom', 'france', 'netherlands', 'russia', 'united-arab-emirates', 'canada', 'australia', 'iran'],
    'iran': ['united-arab-emirates', 'turkey', 'germany', 'united-states', 'canada', 'united-kingdom', 'sweden', 'australia', 'netherlands', 'france'],
    'russia': ['germany', 'turkey', 'united-states', 'united-kingdom', 'france', 'netherlands', 'canada', 'australia', 'china', 'kazakhstan'],
    'united-states': ['canada', 'united-kingdom', 'mexico', 'germany', 'australia', 'india', 'china', 'japan', 'france', 'singapore'],
    'united-kingdom': ['united-states', 'canada', 'australia', 'germany', 'france', 'spain', 'india', 'ireland', 'netherlands', 'portugal'],
    'germany': ['united-states', 'united-kingdom', 'france', 'netherlands', 'spain', 'austria', 'switzerland', 'turkey', 'poland', 'italy'],
  };
  const countrySlugs = new Set(countries.map((c) => c.slug));
  for (const [a, destinations] of Object.entries(NOTABLE_PAIRS)) {
    if (!countrySlugs.has(a)) continue;
    for (const b of destinations) {
      if (countrySlugs.has(b) && a !== b) {
        entries.push({
          url: `${base}/compare/${a}/vs/${b}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.75,
        });
      }
    }
  }

  return entries;
}
