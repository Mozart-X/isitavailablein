import { notFound } from 'next/navigation';
import { getAllServices, getAllCountries, getService, getCountry, getAvailability, getPricing, getAvailabilityForCountry, getConfirmationCounts, getWorkingMethods } from '@/lib/db';
import { parseAvailabilitySlug, buildAvailabilitySlug, statusAnswer } from '@/lib/url';
import { isHighValue } from '@/lib/focus';
import AdSlot from '@/components/AdSlot';
import PriceTable from '@/components/PriceTable';
import VpnCta from '@/components/VpnCta';
import MoneyStack from '@/components/MoneyStack';
import CommunityConfirm from '@/components/CommunityConfirm';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);
  const params: { slug: string }[] = [];
  for (const s of services) {
    for (const c of countries) {
      params.push({ slug: buildAvailabilitySlug(s.slug, c.slug) });
    }
  }
  return params;
}

async function resolve(slug: string) {
  const parsed = parseAvailabilitySlug(slug);
  if (!parsed) return null;
  const [service, country] = await Promise.all([getService(parsed.service), getCountry(parsed.country)]);
  if (!service || !country) return null;
  const [avail, pricing, sameCountry, confirmCounts, workingMethods] = await Promise.all([
    getAvailability(service.id, country.iso2),
    getPricing(service.id, country.iso2),
    getAvailabilityForCountry(country.iso2),
    getConfirmationCounts(service.id, country.iso2),
    getWorkingMethods(service.id, country.iso2)
  ]);
  // Alternatives: same category, works in this country, excluding current.
  const alternatives = sameCountry
    .filter((x) => x.category === service.category && x.service_slug !== service.slug && x.status === 'yes')
    .slice(0, 6);
  return { service, country, avail, pricing, alternatives, confirmCounts, workingMethods };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const r = await resolve(params.slug);
  if (!r) return { title: 'Not found' };
  const { service, country, avail, pricing } = r;
  const status = avail?.status || 'unknown';
  // Index only pages that say something useful (restricted status, censored
  // market, real price, or verified data). Noindex thin "available, nothing to
  // add" filler so the site reads as a focused restricted-access resource.
  const highValue = isHighValue({ status, iso2: country.iso2, source: avail?.source, hasPricing: !!(pricing && pricing.length) });
  const ans = statusAnswer(status);
  const title = `Is ${service.name} available in ${country.name}? (${ans.word})`;
  // Only claim freshness in the search snippet when the row is genuinely
  // verified (scraped/community). Baseline reference data must not imply a check.
  const verifiedSrc = /^(official|community-consensus)/.test(avail?.source || '');
  const freshness = verifiedSrc && avail?.last_verified ? ` Last checked ${avail.last_verified}.` : '';
  const description = `${ans.sentence}${freshness} See sources, alternatives, and how to access ${service.name} in ${country.name}.`;
  const ogVariant = status === 'no' || status === 'vpn_only' ? 'blocked' : status === 'yes' ? 'available' : 'default';
  const ogTitle = `${service.name} in ${country.flag} ${country.name}: ${ans.word}`;
  const ogSub = status === 'no' ? 'Blocked — see workarounds' : status === 'vpn_only' ? 'VPN required — see best VPNs' : status === 'partial' ? 'Partially available — see details' : 'Available — see pricing';
  const ogUrl = `/og?t=${encodeURIComponent(ogTitle)}&s=${encodeURIComponent(ogSub)}&v=${ogVariant}`;
  return {
    title,
    description,
    alternates: { canonical: `/${params.slug}` },
    robots: { index: highValue, follow: true },
    openGraph: { title, description, images: [ogUrl] },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const r = await resolve(params.slug);
  if (!r) notFound();
  const { service, country, avail, pricing, alternatives, confirmCounts, workingMethods } = r;
  const status = avail?.status || 'unknown';
  const ans = statusAnswer(status);
  const isUnavailable = status === 'no' || status === 'vpn_only';

  function methodAgo(iso: string): string {
    const t = new Date(String(iso).replace(' ', 'T') + 'Z').getTime();
    if (isNaN(t)) return '';
    const d = Math.round((Date.now() - t) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`;
  }

  const friction = avail?.signup_friction;
  const payOk = avail?.payment_ok;
  const phoneOk = avail?.phone_verify_ok;
  const hasAnyDetail = friction || payOk || phoneOk || avail?.workaround || (pricing && pricing.length);

  const tag = (v: string | null | undefined) => {
    if (!v || v === 'unknown') return { word: 'Unknown', className: 'status-unknown' };
    if (v === 'yes' || v === 'easy') return { word: v === 'yes' ? 'Yes' : 'Easy', className: 'status-yes' };
    if (v === 'no' || v === 'blocked') return { word: v === 'no' ? 'No' : 'Blocked', className: 'status-no' };
    if (v === 'workaround' || v === 'hard') return { word: v === 'workaround' ? 'Workaround' : 'Hard', className: 'status-vpn_only' };
    if (v === 'medium') return { word: 'Medium', className: 'status-partial' };
    return { word: v, className: 'status-unknown' };
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: `Is ${service.name} available in ${country.name}?`,
      acceptedAnswer: { '@type': 'Answer', text: ans.sentence }
    }]
  };

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com';
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: service.name, item: `${base}/service/${service.slug}` },
      { '@type': 'ListItem', position: 3, name: country.name, item: `${base}/${params.slug}` }
    ]
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="answer-box">
        <h1>Is {service.name} available in {country.flag} {country.name}?</h1>
        <div className="answer-big">
          <span className={`status-badge status-${status}`}>{ans.word}</span>
        </div>
        <p>{ans.sentence}</p>
        {avail?.notes && <p><em>{avail.notes}</em></p>}
        {/^(official|community-consensus)/.test(avail?.source || '') ? (
          <p className="answer-meta">
            {(avail?.source || '').startsWith('community-consensus')
              ? 'Confirmed by community reports'
              : 'Auto-checked from the official source'}
            {' · last checked '}<strong>{avail?.last_verified || 'recently'}</strong>
          </p>
        ) : (
          <p className="answer-meta data-reference">
            Reference data — <strong>not continuously verified</strong>, so it can lag real-world
            changes (temporary bans, new restrictions). <a href="#confirm-card">Know the current status in {country.name}? Confirm below ↓</a>
          </p>
        )}
      </div>

      {isUnavailable && (
        <VpnCta variant="banner" serviceName={service.name} countryName={country.name} />
      )}

      {workingMethods.length > 0 && (
        <div className="working-now">
          <h2 style={{ marginTop: 0 }}>✅ What’s working right now in {country.name}</h2>
          <p style={{ margin: '0 0 0.6rem', color: '#555', fontSize: '0.92rem' }}>
            Methods real users confirmed for {service.name} recently — freshest first:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
            {workingMethods.map((m) => (
              <li key={m.vpn} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #d7ead9', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                <span><strong style={{ color: '#0a7d33' }}>{m.vpn}</strong> <span style={{ color: '#888', fontSize: '0.85rem' }}>· {m.count} confirm{m.count > 1 ? 's' : ''} · {methodAgo(m.last_at)}</span></span>
              </li>
            ))}
          </ul>
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.85rem', color: '#888' }}>
            Community-reported, not guaranteed. <a href="#confirm-card">Confirm what worked for you →</a>
          </p>
        </div>
      )}

      {hasAnyDetail && (
        <>
          <h2>Details for {country.name}</h2>
          <div className="info-grid">
            {friction && (
              <div className="info-card">
                <div className="label">Signup friction</div>
                <div className="value"><span className={`status-badge ${tag(friction).className}`}>{tag(friction).word}</span></div>
              </div>
            )}
            {payOk && (
              <div className="info-card">
                <div className="label">Local card / payment</div>
                <div className="value"><span className={`status-badge ${tag(payOk).className}`}>{tag(payOk).word}</span></div>
                <div className="sub">Does a card issued in {country.name} work at checkout?</div>
              </div>
            )}
            {phoneOk && (
              <div className="info-card">
                <div className="label">Phone verification</div>
                <div className="value"><span className={`status-badge ${tag(phoneOk).className}`}>{tag(phoneOk).word}</span></div>
                <div className="sub">Does a local {country.name} number get accepted?</div>
              </div>
            )}
            {avail?.workaround && (
              <div className="info-card">
                <div className="label">Workaround</div>
                <div className="value" style={{ fontSize: '1rem', fontWeight: 500 }}>{avail.workaround}</div>
              </div>
            )}
          </div>
        </>
      )}

      {pricing && pricing.length > 0 && (
        <>
          <h2>Price in {country.name}</h2>
          <PriceTable
            rows={pricing.map((p) => ({
              country_iso2: country.iso2,
              tier: p.tier,
              price_local: p.price_local,
              currency_local: p.currency_local,
              price_usd: p.price_usd,
              period: p.period,
            }))}
            serviceSlug={service.slug}
            showCountry={false}
            caption={pricing.length === 1 ? pricing[0].tier : undefined}
          />
        </>
      )}

      <AdSlot slot="answer-top" style={{ minHeight: 90 }} />

      <h2>About {service.name}</h2>
      <p>{service.description} <a href={service.official_url} rel="nofollow" target="_blank">Official site ↗</a></p>

      <CommunityConfirm
        serviceSlug={service.slug}
        serviceName={service.name}
        countryIso2={country.iso2}
        countryName={country.name}
        countryFlag={country.flag}
        counts={confirmCounts}
      />

      <div className="sources">
        <strong>Sources & verification:</strong>{' '}
        {service.geo_page_url ? <a href={service.geo_page_url} rel="nofollow" target="_blank">{service.name} supported countries page</a> : 'Compiled from public reports and official statements.'}
      </div>

      <AdSlot slot="answer-bottom" style={{ minHeight: 250 }} />

      {isUnavailable && (
        <VpnCta variant="banner" serviceName={service.name} countryName={country.name} />
      )}

      {isUnavailable && alternatives.length > 0 && (
        <>
          <h2>Alternatives that work in {country.name}</h2>
          <div className="grid">
            {alternatives.map((alt) => (
              <a key={alt.service_slug} href={`/is-${alt.service_slug}-available-in-${country.slug}`}>
                <span>{alt.service_name}</span>
                <span className="status-badge status-yes">Yes</span>
              </a>
            ))}
          </div>
        </>
      )}

      {isUnavailable && <MoneyStack serviceName={service.name} countryName={country.name} />}

      {isUnavailable && (
        <div style={{ background: '#fffbea', border: '1px solid #ffc107', borderRadius: 12, padding: '1.1rem 1.3rem', margin: '1.5rem 0' }}>
          <strong style={{ fontSize: '1.05rem' }}>Want the step-by-step?</strong>
          <p style={{ margin: '0.35rem 0 0' }}>
            We have a full tutorial on{' '}
            <a href={`/how-to-use/${service.slug}/${country.slug}`} style={{ color: '#0066cc', fontWeight: 600 }}>
              how to use {service.name} in {country.name} →
            </a>
          </p>
        </div>
      )}

      <h2>Related</h2>
      <div className="grid">
        {isUnavailable && (
          <a href={`/how-to-use/${service.slug}/${country.slug}`}>
            How to use {service.name} in {country.name}
          </a>
        )}
        <a href={`/service/${service.slug}`}>All countries for {service.name}</a>
        <a href={`/service/${service.slug}/price`}>Price by country for {service.name}</a>
        <a href={`/country/${country.slug}`}>All services in {country.name}</a>
        <a href={`/best-vpn-for/${service.slug}`}>Best VPN for {service.name}</a>
        <a href={`/best-vpn-for/${country.slug}`}>Best VPN for {country.name}</a>
        <a href={`/cheapest/${service.slug}`}>Cheapest country for {service.name}</a>
        <a href={`/apps-banned-in/${country.slug}`}>Apps banned in {country.name}</a>
      </div>
    </article>
  );
}
