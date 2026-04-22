import { notFound } from 'next/navigation';
import { getAllServices, getService, getPricingForService, getAllCountries } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const services = await getAllServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = await getService(params.slug);
  if (!service) return { title: 'Not found' };
  const title = `${service.name} price by country — cheapest to most expensive`;
  const description = `Compare ${service.name} subscription prices across countries. Find the cheapest country and local-currency prices.`;
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

  // Sort: cheapest USD first, nulls last.
  const sorted = [...pricing].sort((a, b) => {
    if (a.price_usd == null && b.price_usd == null) return 0;
    if (a.price_usd == null) return 1;
    if (b.price_usd == null) return -1;
    return a.price_usd - b.price_usd;
  });

  const tiers = [...new Set(sorted.map((p) => p.tier))];

  return (
    <article>
      <p><a href={`/service/${service.slug}`}>← {service.name}</a></p>
      <h1>{service.name} price by country</h1>
      <p>Cheapest country first. Prices shown in local currency with approximate USD equivalent. Refreshed every 2 hours.</p>

      {sorted.length === 0 ? (
        <p>No pricing data yet. This page fills in automatically as pricing data is collected.</p>
      ) : (
        <>
          {tiers.map((tier) => {
            const tierRows = sorted.filter((p) => p.tier === tier);
            if (tierRows.length === 0) return null;
            return (
              <div key={tier}>
                <h2 style={{ textTransform: 'capitalize' }}>{tier}</h2>
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Country</th><th>Local price</th><th>USD</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierRows.map((p, i) => {
                      const c = byIso.get(p.country_iso2);
                      return (
                        <tr key={p.country_iso2}>
                          <td>{i + 1}</td>
                          <td>{c ? `${c.flag} ${c.name}` : p.country_iso2}</td>
                          <td>{p.price_local != null ? `${p.price_local} ${p.currency_local || ''}` : '—'}</td>
                          <td className="price-usd">{p.price_usd != null ? `$${p.price_usd.toFixed(2)}` : '—'}</td>
                          <td>{c && <a href={`/is-${service.slug}-available-in-${c.slug}`}>details →</a>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}

      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '2rem' }}>
        Using a VPN or foreign payment method to sign up in a cheaper region may violate the service's terms of use.
        Some services geo-lock billing based on IP + payment-card origin.
      </p>
    </article>
  );
}
