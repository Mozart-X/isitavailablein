import { MetadataRoute } from 'next';
import { getAllServices, getAllCountries } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com';
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/changes`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/services`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/countries`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/best-vpn`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/deals`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
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
  for (const s of services) {
    for (const c of countries) {
      entries.push({
        url: `${base}/${buildAvailabilitySlug(s.slug, c.slug)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5
      });
    }
  }
  return entries;
}
