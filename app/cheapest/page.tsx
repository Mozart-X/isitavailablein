// /cheapest — the price-arbitrage hub. This is the page built to be
// bookmarked and revisited: it ranks every service by how much you can
// save buying from the cheapest country, and shows a live feed of recent
// price drops. The recurring hook = prices move, so the answer changes.

import { getCheapestPerService, getRecentPriceChanges, getAllServices } from '@/lib/db';
import PriceDropAlert from '@/components/PriceDropAlert';
import type { Metadata } from 'next';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Cheapest country for every subscription — live price tracker',
  description: 'Netflix, Spotify, YouTube Premium, ChatGPT and more cost up to 90% less in some countries. Live ranking of where each service is cheapest, updated as prices move.',
  alternates: { canonical: '/cheapest' },
};

function ago(iso: string): string {
  const t = new Date(String(iso).replace(' ', 'T') + 'Z').getTime();
  if (isNaN(t)) return '';
  const d = Math.round((Date.now() - t) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  return `${Math.round(d / 30)}mo ago`;
}

export default async function CheapestHub() {
  const [ranked, drops, services] = await Promise.all([
    getCheapestPerService(),
    getRecentPriceChanges(12),
    getAllServices(),
  ]);

  const topSaving = ranked[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which subscriptions are cheapest in other countries?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: topSaving
            ? `${topSaving.service.name} has the biggest gap right now — about ${topSaving.savings_pct}% cheaper in ${topSaving.cheapest_country} ($${topSaving.cheapest_usd.toFixed(2)}/mo) than in the most expensive country.`
            : 'Many streaming and AI subscriptions cost far less in lower-income regions; this page ranks them live.',
        },
      },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>💸 Cheapest country for every subscription</h1>
      <p style={{ fontSize: '1.05rem', color: '#444' }}>
        The same subscription can cost <strong>5–10× more</strong> depending on the country it's billed in.
        We track {services.length}+ services and rank them by how much you can save. Prices move — check back,
        or get a one-line email the moment a price drops.
      </p>

      <PriceDropAlert services={services.map((s) => ({ slug: s.slug, name: s.name }))} />

      {drops.length > 0 && (
        <section>
          <h2>🔻 Recent price moves</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 0 }}>
            Live from our hourly tracker — newest first.
          </p>
          <table>
            <thead><tr><th>When</th><th>Service</th><th>Country</th><th>Change</th></tr></thead>
            <tbody>
              {drops.map((d) => (
                <tr key={d.id}>
                  <td>{ago(d.changed_at)}</td>
                  <td><a href={`/cheapest/${d.service_slug}`}>{d.service_name}</a></td>
                  <td>{d.flag ? `${d.flag} ` : ''}{d.country_name}</td>
                  <td>
                    <span style={{ color: '#888' }}>${d.old_usd?.toFixed(2)}</span>
                    {' → '}
                    <strong style={{ color: d.direction === 'drop' ? '#0a7d33' : '#b00' }}>
                      ${d.new_usd?.toFixed(2)}
                    </strong>
                    {d.pct != null && (
                      <span style={{ color: d.direction === 'drop' ? '#0a7d33' : '#b00', fontWeight: 600 }}>
                        {' '}({d.pct > 0 ? '+' : ''}{d.pct}%)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>Biggest savings right now</h2>
        {ranked.length === 0 ? (
          <p>Building the price index — check back shortly.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Service</th><th>Cheapest in</th><th>Price</th><th>You save</th><th></th></tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.service.slug}>
                  <td><strong>{r.service.name}</strong></td>
                  <td>{r.cheapest_country}</td>
                  <td>${r.cheapest_usd.toFixed(2)}/mo</td>
                  <td><span style={{ color: '#0a7d33', fontWeight: 700 }}>up to {r.savings_pct}%</span></td>
                  <td><a href={`/cheapest/${r.service.slug}`}>Rank by country →</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>How paying the cheaper price works</h2>
        <p>
          Many services bill by your payment method's country, not your physical location. A VPN set to the
          cheaper region during signup, plus a card that matches that region, often unlocks the local price.
          Streaming services that check your IP at playback are the main exception.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#888' }}>
          Prices are tracked in local currency and converted to USD for ranking. Conversions are approximate
          and for comparison only.
        </p>
      </section>
    </article>
  );
}
