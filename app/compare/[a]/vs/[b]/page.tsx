// /compare/[a]/vs/[b] — country-pair comparison.
// Target audience: expats moving from country A to country B,
// digital nomads, "where should I live for ChatGPT access" googlers.
// High-volume queries: "what's blocked in china vs india", etc.
//
// Generates ~3,000 pages from existing data (61 × 60 directional pairs, but
// we cap each country to top-10 most relevant destinations to limit bloat).

import { notFound } from 'next/navigation';
import { getAllCountries, getCountry, getAvailabilityForCountry } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import MoneyStack from '@/components/MoneyStack';
import type { Metadata } from 'next';

export const revalidate = 86400;

// Cap generated pages to top destination pairs per origin country.
// 61 × 10 = 610 pages — manageable for crawl budget, still rich SEO surface.
const TOP_PAIRS_PER_COUNTRY = 10;

// Hand-picked "interesting" comparison destinations per origin. These are
// the migration corridors and "is X better than Y" queries with real search
// volume. If a pair isn't here, we still serve it dynamically — but won't
// pre-render it.
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

export async function generateStaticParams() {
  const countries = await getAllCountries();
  const slugs = new Set(countries.map((c) => c.slug));
  const params: { a: string; b: string }[] = [];
  for (const [a, destinations] of Object.entries(NOTABLE_PAIRS)) {
    if (!slugs.has(a)) continue;
    for (const b of destinations.slice(0, TOP_PAIRS_PER_COUNTRY)) {
      if (slugs.has(b) && a !== b) params.push({ a, b });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: { a: string; b: string } }): Promise<Metadata> {
  const [aC, bC] = await Promise.all([getCountry(params.a), getCountry(params.b)]);
  if (!aC || !bC) return { title: 'Not found' };
  const year = new Date().getFullYear();
  const title = `${aC.name} vs ${bC.name}: service availability compared (${year})`;
  const description = `Compare what online services work in ${aC.name} vs ${bC.name}. Streaming, banking, social, AI — what's available where, and what's blocked in each.`;
  const ogUrl = `/og?t=${encodeURIComponent(`${aC.flag} ${aC.name} vs ${bC.flag} ${bC.name}`)}&s=${encodeURIComponent('Service availability — full comparison')}&v=default`;
  return {
    title,
    description,
    alternates: { canonical: `/compare/${params.a}/vs/${params.b}` },
    openGraph: { title, description, images: [ogUrl] },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  };
}

export default async function Page({ params }: { params: { a: string; b: string } }) {
  const [aC, bC] = await Promise.all([getCountry(params.a), getCountry(params.b)]);
  if (!aC || !bC || aC.slug === bC.slug) notFound();
  const [aRows, bRows] = await Promise.all([
    getAvailabilityForCountry(aC.iso2),
    getAvailabilityForCountry(bC.iso2),
  ]);

  const aByService = new Map(aRows.map((r) => [r.service_slug, r]));
  const bByService = new Map(bRows.map((r) => [r.service_slug, r]));

  // Build a diff: services where the two countries DISAGREE
  // (one blocks, the other allows — the most interesting rows).
  type DiffRow = { service_slug: string; service_name: string; category: string; aStatus: string; bStatus: string };
  const allSlugs = new Set([...aByService.keys(), ...bByService.keys()]);
  const diff: DiffRow[] = [];
  const same: DiffRow[] = [];
  for (const slug of allSlugs) {
    const a = aByService.get(slug);
    const b = bByService.get(slug);
    if (!a || !b) continue;
    const row: DiffRow = { service_slug: slug, service_name: a.service_name, category: a.category, aStatus: a.status, bStatus: b.status };
    if (a.status !== b.status) diff.push(row);
    else same.push(row);
  }

  const onlyInA = diff.filter((r) => r.bStatus === 'no' && r.aStatus === 'yes');
  const onlyInB = diff.filter((r) => r.aStatus === 'no' && r.bStatus === 'yes');
  const restricted = diff.filter((r) => r.aStatus !== r.bStatus && !(onlyInA.includes(r) || onlyInB.includes(r)));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What's available in ${aC.name} but blocked in ${bC.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: onlyInA.length
            ? `${onlyInA.length} services: ${onlyInA.slice(0, 8).map((r) => r.service_name).join(', ')}${onlyInA.length > 8 ? '…' : ''}`
            : `None of the services we track are available in ${aC.name} but blocked in ${bC.name}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What's available in ${bC.name} but blocked in ${aC.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: onlyInB.length
            ? `${onlyInB.length} services: ${onlyInB.slice(0, 8).map((r) => r.service_name).join(', ')}${onlyInB.length > 8 ? '…' : ''}`
            : `None of the services we track are available in ${bC.name} but blocked in ${aC.name}.`,
        },
      },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>{aC.flag} {aC.name} vs {bC.flag} {bC.name}: service availability compared</h1>
      <p style={{ fontSize: '1.05rem' }}>
        Moving between {aC.name} and {bC.name}? Wondering which has more apps available?
        Here's the full diff for {Math.max(aRows.length, bRows.length)} major online services.
      </p>

      <div className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-num">{diff.length}</span>
          <span className="stats-bar-label">services with different status</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{onlyInA.length}</span>
          <span className="stats-bar-label">work in {aC.name}, not in {bC.name}</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{onlyInB.length}</span>
          <span className="stats-bar-label">work in {bC.name}, not in {aC.name}</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{same.length}</span>
          <span className="stats-bar-label">same status in both</span>
        </div>
      </div>

      {onlyInA.length > 0 && (
        <section>
          <h2>✅ Works in {aC.name} — ❌ Blocked in {bC.name}</h2>
          <p style={{ color: '#666' }}>
            If you're moving from {aC.name} to {bC.name}, you'll lose access to these. A VPN restores them.
          </p>
          <div className="grid">
            {onlyInA.map((r) => (
              <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, bC.slug)}`}>
                <span>{r.service_name}</span>
                <span className="status-badge status-no">{bC.flag} ❌</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {onlyInB.length > 0 && (
        <section>
          <h2>❌ Blocked in {aC.name} — ✅ Works in {bC.name}</h2>
          <p style={{ color: '#666' }}>
            Moving from {aC.name} to {bC.name}? These unlock for you.
          </p>
          <div className="grid">
            {onlyInB.map((r) => (
              <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, aC.slug)}`}>
                <span>{r.service_name}</span>
                <span className="status-badge status-yes">{bC.flag} ✅</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {restricted.length > 0 && (
        <section>
          <h2>Other status differences</h2>
          <p style={{ color: '#666' }}>
            Partial availability, VPN-only, or other status mismatches between the two countries.
          </p>
          <table>
            <thead><tr><th>Service</th><th>{aC.flag} {aC.name}</th><th>{bC.flag} {bC.name}</th></tr></thead>
            <tbody>
              {restricted.map((r) => (
                <tr key={r.service_slug}>
                  <td><a href={`/service/${r.service_slug}`}>{r.service_name}</a></td>
                  <td><span className={`status-badge status-${r.aStatus}`}>{r.aStatus}</span></td>
                  <td><span className={`status-badge status-${r.bStatus}`}>{r.bStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <MoneyStack
        countryName={aC.name === 'United States' ? bC.name : aC.name}
        heading="Bridge the gap — same stack works either direction"
      />

      <section>
        <h2>Related</h2>
        <div className="grid">
          <a href={`/country/${aC.slug}`}>All services in {aC.name}</a>
          <a href={`/country/${bC.slug}`}>All services in {bC.name}</a>
          <a href={`/apps-banned-in/${aC.slug}`}>Apps banned in {aC.name}</a>
          <a href={`/apps-banned-in/${bC.slug}`}>Apps banned in {bC.name}</a>
          <a href={`/best-vpn-for/${aC.slug}`}>Best VPN for {aC.name}</a>
          <a href={`/best-vpn-for/${bC.slug}`}>Best VPN for {bC.name}</a>
        </div>
      </section>
    </article>
  );
}
