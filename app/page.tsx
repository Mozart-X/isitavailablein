import { getAllServices, getAllCountries, getRecentChanges } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import Finder from '@/components/Finder';

export const revalidate = 3600;

const POPULAR_SERVICES = ['chatgpt', 'claude', 'netflix', 'spotify', 'revolut', 'binance'];
const POPULAR_COUNTRIES = ['united-states', 'united-kingdom', 'india', 'nepal', 'germany', 'brazil'];

export default async function HomePage() {
  const [services, countries, changes] = await Promise.all([
    getAllServices(),
    getAllCountries(),
    getRecentChanges(8)
  ]);

  const popSvc = POPULAR_SERVICES.map((s) => services.find((x) => x.slug === s)).filter(Boolean) as typeof services;
  const popCtry = POPULAR_COUNTRIES.map((s) => countries.find((x) => x.slug === s)).filter(Boolean) as typeof countries;

  return (
    <>
      <section className="hero">
        <h1>Can I use it from my country?</h1>
        <p>Availability, local price, signup friction, and workarounds for {services.length}+ online services across {countries.length} countries. Updated every 2 hours.</p>
        <Finder
          services={services.map((s) => ({ slug: s.slug, name: s.name, category: s.category }))}
          countries={countries.map((c) => ({ slug: c.slug, name: c.name, iso2: c.iso2, flag: c.flag }))}
        />
      </section>

      <section>
        <h2>Popular checks</h2>
        <div className="grid">
          {popSvc.flatMap((s) =>
            popCtry.map((c) => (
              <a key={`${s.slug}-${c.slug}`} href={`/${buildAvailabilitySlug(s.slug, c.slug)}`}>
                <span>{s.name} <small>in</small> {c.flag} {c.name}</span>
                <span>→</span>
              </a>
            ))
          )}
        </div>
      </section>

      <section>
        <h2>Recent status changes</h2>
        {changes.length === 0 ? <p>No changes logged yet.</p> : (
          <table>
            <thead><tr><th>When</th><th>Service</th><th>Country</th><th>Change</th></tr></thead>
            <tbody>
              {changes.map((c: any) => (
                <tr key={c.id}>
                  <td>{new Date(c.changed_at).toLocaleDateString()}</td>
                  <td><a href={`/service/${c.service_slug}`}>{c.service_name}</a></td>
                  <td><a href={`/country/${c.country_slug}`}>{c.country_name}</a></td>
                  <td><span className={`status-badge status-${c.old_status}`}>{c.old_status || '—'}</span> → <span className={`status-badge status-${c.new_status}`}>{c.new_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p><a href="/changes">See all changes →</a></p>
      </section>

      <section>
        <h2>Browse all</h2>
        <p>
          <a href="/services">All {services.length} services</a> · <a href="/countries">All {countries.length} countries</a>
        </p>
      </section>
    </>
  );
}
