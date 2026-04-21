import { notFound } from 'next/navigation';
import { getAllCountries, getCountry, getAvailabilityForCountry } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const countries = await getAllCountries();
  return countries.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCountry(params.slug);
  if (!c) return { title: 'Not found' };
  return {
    title: `What services are available in ${c.name}?`,
    description: `Complete list of online services (ChatGPT, Netflix, banking, crypto, streaming) available in ${c.name}. Updated daily.`,
    alternates: { canonical: `/country/${params.slug}` }
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const c = await getCountry(params.slug);
  if (!c) notFound();
  const rows = await getAvailabilityForCountry(c.iso2);

  const categories = [...new Set(rows.map((r) => r.category))];
  const blocked = rows.filter((r) => r.status === 'no');

  return (
    <article>
      <h1>{c.flag} What's available in {c.name}?</h1>
      <p>Availability status for {rows.length} online services in {c.name}. Last updated daily.</p>

      {blocked.length > 0 && (
        <>
          <h2>❌ Blocked in {c.name} ({blocked.length})</h2>
          <div className="grid">
            {blocked.map((r) => (
              <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, c.slug)}`}>
                <span>{r.service_name}</span>
                <span className="status-badge status-no">No</span>
              </a>
            ))}
          </div>
        </>
      )}

      {categories.map((cat) => {
        const items = rows.filter((r) => r.category === cat && r.status !== 'no');
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h2>{cat}</h2>
            <div className="grid">
              {items.map((r) => (
                <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, c.slug)}`}>
                  <span>{r.service_name}</span>
                  <span className={`status-badge status-${r.status}`}>{r.status}</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </article>
  );
}
