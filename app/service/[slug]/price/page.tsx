import { notFound } from 'next/navigation';
import { getAllServices, getService, getPricingForService, getAllCountries } from '@/lib/db';
import PriceTable from '@/components/PriceTable';
import type { Metadata } from 'next';

export const runtime = 'edge';
export const revalidate = 3600;

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await getService(params.slug);
  if (!service) return { title: 'Not found' };
  const title = `${service.name} price by country — cheapest to most expensive`;
  const description = `Compare ${service.name} subscription prices across countries in any currency. Cheapest-country-first.`;
  return { title, description, alternates: { canonical: `/service/${service.slug}/price` }, openGraph: { title, description } };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const service = await getService(params.slug);
  if (!service) notFound();
  const [pricing, countries] = await Promise.all([
    getPricingForService(service.id),
    getAllCountries()
  ]);
  const byIso = new Map(countries.map((c) => [c.iso2, c]));

  const rows = pricing.map((p) => {
    const c = byIso.get(p.country_iso2);
    return {
      country_iso2: p.country_iso2,
      country_name: c?.name,
      country_flag: c?.flag,
      country_slug: c?.slug,
      tier: p.tier,
      price_local: p.price_local,
      currency_local: p.currency_local,
      price_usd: p.price_usd,
      period: p.period,
    };
  });

  return (
    <article>
      <p><a href={`/service/${service.slug}`}>← {service.name}</a></p>
      <h1>{service.name} price by country</h1>
      <p>Cheapest first. Switch the display currency to compare. Refreshed every 2 hours.</p>

      {rows.length === 0 ? (
        <p>No pricing data yet. Fills in automatically as pricing data is collected.</p>
      ) : (
        <PriceTable rows={rows} serviceSlug={service.slug} />
      )}

      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '2rem' }}>
        Using a VPN or foreign payment to sign up in a cheaper region may violate the service's terms of use. Some services geo-lock billing based on IP + card origin.
      </p>
    </article>
  );
}
