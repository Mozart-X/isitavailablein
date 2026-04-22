import { notFound } from 'next/navigation';
import { getAllServices, getAllCountries, getService, getCountry, getAvailability, getPricing, getAvailabilityForCountry } from '@/lib/db';
import { parseAvailabilitySlug, buildAvailabilitySlug, statusAnswer } from '@/lib/url';
import { vpnLink } from '@/lib/affiliate';
import AdSlot from '@/components/AdSlot';
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
  const [avail, pricing, sameCountry] = await Promise.all([
    getAvailability(service.id, country.iso2),
    getPricing(service.id, country.iso2),
    getAvailabilityForCountry(country.iso2)
  ]);
  // Alternatives: same category, works in this country, excluding current.
  const alternatives = sameCountry
    .filter((x) => x.category === service.category && x.service_slug !== service.slug && x.status === 'yes')
    .slice(0, 6);
  return { service, country, avail, pricing, alternatives };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const r = await resolve(params.slug);
  if (!r) return { title: 'Not found' };
  const { service, country, avail } = r;
  const status = avail?.status || 'unknown';
  const ans = statusAnswer(status);
  const title = `Is ${service.name} available in ${country.name}? (${ans.word})`;
  const description = `${ans.sentence} Last verified ${avail?.last_verified || 'recently'}. See sources, alternatives, and how to access ${service.name} in ${country.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/${params.slug}` },
    openGraph: { title, description }
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const r = await resolve(params.slug);
  if (!r) notFound();
  const { service, country, avail, pricing, alternatives } = r;
  const status = avail?.status || 'unknown';
  const ans = statusAnswer(status);
  const isUnavailable = status === 'no' || status === 'vpn_only';

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
  const vpn = vpnLink('nord');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: `Is ${service.name} available in ${country.name}?`,
      acceptedAnswer: { '@type': 'Answer', text: ans.sentence }
    }]
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com' },
      { '@type': 'ListItem', position: 2, name: service.name, item: `/service/${service.slug}` },
      { '@type': 'ListItem', position: 3, name: country.name, item: `/${params.slug}` }
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
        <p className="answer-meta">
          Last verified: <strong>{avail?.last_verified || 'unknown'}</strong>
          {avail?.source && <> · Source: <code>{avail.source}</code></>}
        </p>
      </div>

      {isUnavailable && (
        <div className="cta-banner">
          <div>
            <strong>Access {service.name} from {country.name} with a VPN</strong>
            <div>Unblock {service.name} in under a minute.</div>
          </div>
          <a href={vpn.href} rel="nofollow sponsored" target="_blank">{vpn.label} →</a>
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
                <div className="sub">Does a local +{country.iso2} number get accepted?</div>
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
          <table className="price-table">
            <thead><tr><th>Tier</th><th>Local price</th><th>USD</th><th>Period</th></tr></thead>
            <tbody>
              {pricing.map((p) => (
                <tr key={p.tier}>
                  <td>{p.tier}</td>
                  <td>{p.price_local != null ? `${p.price_local} ${p.currency_local || ''}` : '—'}</td>
                  <td className="price-usd">{p.price_usd != null ? `$${p.price_usd.toFixed(2)}` : '—'}</td>
                  <td>/{p.period || 'month'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>Prices shown in local currency where available. USD conversions are approximate.</p>
        </>
      )}

      <AdSlot slot="answer-top" style={{ minHeight: 90 }} />

      <h2>About {service.name}</h2>
      <p>{service.description} <a href={service.official_url} rel="nofollow" target="_blank">Official site ↗</a></p>

      <h2>Help us keep this accurate</h2>
      <p>Are you in {country.name} right now? Tell us if {service.name} works for you:</p>
      <div className="report-btns">
        <form action="/api/report" method="POST">
          <input type="hidden" name="service_id" value={service.id} />
          <input type="hidden" name="country_iso2" value={country.iso2} />
          <button name="status" value="yes" type="submit">✅ Works for me</button>
          <button name="status" value="no" type="submit">❌ Blocked</button>
          <button name="status" value="vpn_only" type="submit">🔐 Only with VPN</button>
        </form>
      </div>

      <div className="sources">
        <strong>Sources & verification:</strong>{' '}
        {service.geo_page_url ? <a href={service.geo_page_url} rel="nofollow" target="_blank">{service.name} supported countries page</a> : 'Compiled from public reports and official statements.'}
      </div>

      <AdSlot slot="answer-bottom" style={{ minHeight: 250 }} />

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

      <h2>Related</h2>
      <div className="grid">
        <a href={`/service/${service.slug}`}>All countries for {service.name}</a>
        <a href={`/service/${service.slug}/price`}>Price by country for {service.name}</a>
        <a href={`/country/${country.slug}`}>All services in {country.name}</a>
      </div>
    </article>
  );
}
