import { notFound } from 'next/navigation';
import { getAllServices, getAllCountries, getService, getCountry, getAvailability } from '@/lib/db';
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
  const avail = await getAvailability(service.id, country.iso2);
  return { service, country, avail };
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
  const { service, country, avail } = r;
  const status = avail?.status || 'unknown';
  const ans = statusAnswer(status);
  const isUnavailable = status === 'no' || status === 'vpn_only';
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

      <h2>Related</h2>
      <div className="grid">
        <a href={`/service/${service.slug}`}>All countries for {service.name}</a>
        <a href={`/country/${country.slug}`}>All services in {country.name}</a>
      </div>
    </article>
  );
}
