import { getAllServices, getAllCountries, getRecentChanges, getLastScrapeAt } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import Finder from '@/components/Finder';
import SuggestForm from '@/components/SuggestForm';

export const revalidate = 3600;

// Hand-picked popular combinations. Keep this short — it's a teaser, not a directory.
const POPULAR: Array<[string, string]> = [
  ['chatgpt', 'united-states'],
  ['chatgpt', 'nepal'],
  ['netflix', 'india'],
  ['spotify', 'nepal'],
  ['revolut', 'united-kingdom'],
  ['binance', 'germany'],
];

function relTime(iso: string | null): string {
  if (!iso) return 'recently';
  const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  if (isNaN(t)) return 'recently';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 2) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const d = Math.round(hr / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

export default async function HomePage() {
  const [services, countries, changes, lastScrape] = await Promise.all([
    getAllServices(),
    getAllCountries(),
    getRecentChanges(8),
    getLastScrapeAt()
  ]);

  const serviceBySlug = new Map(services.map((s) => [s.slug, s]));
  const countryBySlug = new Map(countries.map((c) => [c.slug, c]));
  const popular = POPULAR
    .map(([sv, co]) => {
      const s = serviceBySlug.get(sv);
      const c = countryBySlug.get(co);
      return s && c ? { s, c } : null;
    })
    .filter(Boolean) as { s: any; c: any }[];

  return (
    <>
      <section className="hero">
        <h1>Can I use it from my country?</h1>
        <p>Availability, local price, signup friction, and workarounds for {services.length}+ online services across {countries.length} countries.</p>
        <Finder
          services={services.map((s) => ({ slug: s.slug, name: s.name, category: s.category }))}
          countries={countries.map((c) => ({ slug: c.slug, name: c.name, iso2: c.iso2, flag: c.flag }))}
        />
      </section>

      <section>
        <h2>Popular checks</h2>
        <div className="grid">
          {popular.map(({ s, c }) => (
            <a key={`${s.slug}-${c.slug}`} href={`/${buildAvailabilitySlug(s.slug, c.slug)}`}>
              <span>{s.name} <small>in</small> {c.flag} {c.name}</span>
              <span>→</span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2>Recent status changes</h2>
        {changes.length === 0 ? (
          <p style={{ color: '#666' }}>
            No changes detected yet. Last checked <strong>{relTime(lastScrape)}</strong>.
          </p>
        ) : (
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
        <p style={{ fontSize: '0.85rem', color: '#888' }}>
          Last checked: <strong>{relTime(lastScrape)}</strong>
          {' · '}<a href="/changes">See all changes →</a>
        </p>
      </section>

      <section>
        <h2>Browse all</h2>
        <p>
          <a href="/services">All {services.length} services</a> · <a href="/countries">All {countries.length} countries</a>
        </p>
      </section>

      <SuggestForm />
    </>
  );
}
