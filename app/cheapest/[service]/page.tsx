// /cheapest/[service] — price arbitrage page.
// "Cheapest Netflix country", "ChatGPT Plus cheapest country" etc. are
// high-intent affiliate-friendly queries. Page sorts countries by USD price,
// highlights the savings, and slots VPN affiliate as the obvious way to pay
// the cheaper country's price.

import { notFound } from 'next/navigation';
import { getAllServices, getService, getPricingForService, getAvailabilityForService } from '@/lib/db';
import VpnCta from '@/components/VpnCta';
import MoneyStack from '@/components/MoneyStack';
import { buildAvailabilitySlug } from '@/lib/url';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: { params: { service: string } }): Promise<Metadata> {
  const s = await getService(params.service);
  if (!s) return { title: 'Not found' };
  return {
    title: `Cheapest country for ${s.name} (${new Date().getFullYear()})`,
    description: `Where is ${s.name} cheapest? Local prices ranked by country with USD conversion. Save by paying the lowest-priced region.`,
    alternates: { canonical: `/cheapest/${params.service}` }
  };
}

export default async function Page({ params }: { params: { service: string } }) {
  const s = await getService(params.service);
  if (!s) notFound();
  const [pricing, avail] = await Promise.all([
    getPricingForService(s.id),
    getAvailabilityForService(s.id)
  ]);

  if (!pricing || pricing.length === 0) {
    // Fall back gracefully — no pricing data yet for this service.
    return (
      <article>
        <h1>Cheapest country for {s.name}</h1>
        <p>
          We don't have local pricing data for {s.name} yet — sorry. We're working on it.
          In the meantime: <a href={`/service/${s.slug}`}>see where {s.name} is available →</a>
        </p>
      </article>
    );
  }

  const availMap = new Map(avail.map((a) => [a.country_iso2, a]));
  // Sort by USD price ascending. Drop rows without price_usd. Take cheapest tier per country.
  const byCountry: Record<string, typeof pricing[number]> = {};
  for (const p of pricing) {
    if (p.price_usd == null) continue;
    const existing = byCountry[p.country_iso2];
    if (!existing || p.price_usd < (existing.price_usd ?? Infinity)) {
      byCountry[p.country_iso2] = p;
    }
  }
  const sorted = Object.values(byCountry).sort((a, b) => (a.price_usd ?? 0) - (b.price_usd ?? 0));
  if (sorted.length === 0) {
    return (
      <article>
        <h1>Cheapest country for {s.name}</h1>
        <p>No USD-converted prices available yet for {s.name}. <a href={`/service/${s.slug}`}>Browse by country →</a></p>
      </article>
    );
  }

  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const savings = mostExpensive.price_usd && cheapest.price_usd
    ? Math.round(((mostExpensive.price_usd - cheapest.price_usd) / mostExpensive.price_usd) * 100)
    : null;

  const cheapestAvail = availMap.get(cheapest.country_iso2);
  const year = new Date().getFullYear();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What country has the cheapest ${s.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${cheapestAvail?.country_name || 'The lowest-priced region'} at ~$${cheapest.price_usd?.toFixed(2)}/${cheapest.period || 'month'}, compared to ~$${mostExpensive.price_usd?.toFixed(2)} in the most expensive country${savings ? ` — a saving of about ${savings}%` : ''}.`
        }
      },
      {
        '@type': 'Question',
        name: `Can I get ${s.name} at the cheapest country's price from anywhere?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Often yes. Many services bill based on your billing address and payment method's country, not your physical location. A VPN to the cheapest region + a virtual card from that region or a multi-currency card can let you sign up at the local price.`
        }
      }
    ]
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>Cheapest country for {s.name} ({year})</h1>
      <p style={{ fontSize: '1.05rem' }}>
        We track {s.name} pricing across {sorted.length} countries.
        The cheapest is <strong>{cheapestAvail?.country_name}</strong> at
        {' '}<strong>${cheapest.price_usd?.toFixed(2)}/{cheapest.period || 'mo'}</strong>
        {' '}— {savings ? `${savings}% cheaper` : 'significantly less'} than the most expensive
        region ({(availMap.get(mostExpensive.country_iso2)?.country_name) || mostExpensive.country_iso2}{' '}
        at ${mostExpensive.price_usd?.toFixed(2)}).
      </p>

      <div className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-num">${cheapest.price_usd?.toFixed(2)}</span>
          <span className="stats-bar-label">cheapest ({cheapestAvail?.country_name})</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">${mostExpensive.price_usd?.toFixed(2)}</span>
          <span className="stats-bar-label">most expensive</span>
        </div>
        {savings != null && (
          <div className="stats-bar-item">
            <span className="stats-bar-num">{savings}%</span>
            <span className="stats-bar-label">potential savings</span>
          </div>
        )}
        <div className="stats-bar-item">
          <span className="stats-bar-num">{sorted.length}</span>
          <span className="stats-bar-label">countries compared</span>
        </div>
      </div>

      <VpnCta variant="banner" serviceName={s.name} countryName={cheapestAvail?.country_name} />

      <h2>Full price ranking</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Country</th>
            <th>Local price</th>
            <th>USD</th>
            <th>Period</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const country = availMap.get(p.country_iso2);
            return (
              <tr key={p.country_iso2}>
                <td>#{i + 1}</td>
                <td>{country?.country_name || p.country_iso2}</td>
                <td>{p.price_local} {p.currency_local}</td>
                <td><strong>${p.price_usd?.toFixed(2)}</strong></td>
                <td>{p.period || 'month'}</td>
                <td>
                  {country?.country_slug && (
                    <a href={`/${buildAvailabilitySlug(s.slug, country.country_slug)}`}>See details →</a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Can you actually pay the cheapest country's price?</h2>
      <p>
        Sometimes. Services that bill by your physical IP (some streaming) will block this.
        Services that bill by your card BIN (many AI tools and subscriptions) will accept any
        card with a supported country code. The reliable workflow:
      </p>
      <ol>
        <li>VPN to {cheapestAvail?.country_name || 'the cheapest region'} during signup.</li>
        <li>Pay with a card or virtual card with that country's BIN, or with a multi-currency
            card that doesn't reveal your home country.</li>
        <li>Use the service normally — most don't re-check geo after sign-up.</li>
      </ol>

      <MoneyStack
        serviceName={s.name}
        countryName={cheapestAvail?.country_name}
        heading={`The full ${s.name} discount stack`}
      />

      <h2>Related</h2>
      <div className="grid">
        <a href={`/service/${s.slug}/price`}>Full {s.name} price by country</a>
        <a href={`/service/${s.slug}`}>Where is {s.name} available?</a>
        <a href={`/best-vpn-for/${s.slug}`}>Best VPN for {s.name}</a>
      </div>
    </article>
  );
}
