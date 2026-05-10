import { notFound } from 'next/navigation';
import { getAllServices, getService, getAvailabilityForService } from '@/lib/db';
import { buildAvailabilitySlug, statusAnswer } from '@/lib/url';
import VpnCta from '@/components/VpnCta';
import MoneyStack from '@/components/MoneyStack';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getService(params.slug);
  if (!s) return { title: 'Not found' };
  return {
    title: `Where is ${s.name} available? (Full country list)`,
    description: `Complete list of countries where ${s.name} is available, blocked, or partially available. Updated daily.`,
    alternates: { canonical: `/service/${params.slug}` }
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const s = await getService(params.slug);
  if (!s) notFound();
  const rows = await getAvailabilityForService(s.id);

  const yes = rows.filter((r) => r.status === 'yes');
  const no = rows.filter((r) => r.status === 'no');
  const partial = rows.filter((r) => r.status === 'partial');
  const vpn = rows.filter((r) => r.status === 'vpn_only');

  return (
    <article>
      <h1>Where is {s.name} available?</h1>
      <p><span className="category-tag">{s.category}</span> {s.description}</p>
      <p>
        <a href={s.official_url} rel="nofollow" target="_blank">Official site ↗</a>
        {' · '}
        <a href={`/service/${s.slug}/price`}>Price by country →</a>
      </p>

      {no.length > 0 && (
        <>
          <h2>❌ Not available in ({no.length})</h2>
          <div className="grid">
            {no.map((r) => (
              <a key={r.country_iso2} href={`/${buildAvailabilitySlug(s.slug, r.country_slug)}`}>
                <span>{r.country_name}</span>
                <span className="status-badge status-no">No</span>
              </a>
            ))}
          </div>
          <VpnCta variant="banner" serviceName={s.name} />
        </>
      )}

      {partial.length > 0 && (
        <>
          <h2>⚠️ Partially available ({partial.length})</h2>
          <div className="grid">
            {partial.map((r) => (
              <a key={r.country_iso2} href={`/${buildAvailabilitySlug(s.slug, r.country_slug)}`}>
                <span>{r.country_name}</span>
                <span className="status-badge status-partial">Partial</span>
              </a>
            ))}
          </div>
        </>
      )}

      {vpn.length > 0 && (
        <>
          <h2>🔐 VPN only ({vpn.length})</h2>
          <div className="grid">
            {vpn.map((r) => (
              <a key={r.country_iso2} href={`/${buildAvailabilitySlug(s.slug, r.country_slug)}`}>
                <span>{r.country_name}</span>
                <span className="status-badge status-vpn_only">VPN</span>
              </a>
            ))}
          </div>
        </>
      )}

      <h2>✅ Available in ({yes.length})</h2>
      <div className="grid">
        {yes.map((r) => (
          <a key={r.country_iso2} href={`/${buildAvailabilitySlug(s.slug, r.country_slug)}`}>
            <span>{r.country_name}</span>
            <span className="status-badge status-yes">Yes</span>
          </a>
        ))}
      </div>

      {no.length > 0 && <MoneyStack serviceName={s.name} />}

      <h2>Related</h2>
      <div className="grid">
        <a href={`/best-vpn-for/${s.slug}`}>Best VPN for {s.name}</a>
        <a href={`/cheapest/${s.slug}`}>Cheapest country for {s.name}</a>
        <a href={`/service/${s.slug}/price`}>Full price breakdown</a>
      </div>
    </article>
  );
}
