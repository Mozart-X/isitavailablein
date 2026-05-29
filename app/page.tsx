import { getAllServices, getAllCountries, getRecentChanges, getLastScrapeAt, getScrapeActivity, getRecentPriceChanges } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import Finder from '@/components/Finder';
import SuggestForm from '@/components/SuggestForm';

export const revalidate = 3600;

// Hand-picked popular combinations. Keep this short — it's a teaser, not a directory.
const POPULAR: Array<[string, string]> = [
  ['chatgpt', 'china'],
  ['chatgpt', 'turkey'],
  ['netflix', 'india'],
  ['spotify', 'pakistan'],
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
  const [services, countries, changes, lastScrape, activity, priceDrops] = await Promise.all([
    getAllServices(),
    getAllCountries(),
    getRecentChanges(8),
    getLastScrapeAt(),
    getScrapeActivity(),
    getRecentPriceChanges(6, true)
  ]);

  // Filter to changes from the last 3 days. Older changes are stale on the
  // homepage — they make the same Uber/Stripe batch from a week ago look
  // like "fresh news" every visit. If none are recent, we show a live
  // activity dashboard instead.
  const recentCutoff = Date.now() - 3 * 24 * 3600 * 1000;
  const recentChanges = changes.filter((c: any) => {
    const t = new Date(String(c.changed_at).replace(' ', 'T') + 'Z').getTime();
    return !isNaN(t) && t > recentCutoff;
  });

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
        <h2>Live data feed</h2>
        {recentChanges.length > 0 ? (
          <>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
              Recent status flips detected in the last 14 days:
            </p>
            <table>
              <thead><tr><th>When</th><th>Service</th><th>Country</th><th>Change</th></tr></thead>
              <tbody>
                {recentChanges.map((c: any) => (
                  <tr key={c.id}>
                    <td>{new Date(c.changed_at).toLocaleDateString()}</td>
                    <td><a href={`/service/${c.service_slug}`}>{c.service_name}</a></td>
                    <td><a href={`/country/${c.country_slug}`}>{c.country_name}</a></td>
                    <td><span className={`status-badge status-${c.old_status}`}>{c.old_status || '—'}</span> → <span className={`status-badge status-${c.new_status}`}>{c.new_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <p style={{ color: '#444', fontSize: '0.95rem' }}>
              No status flips in the last 14 days — services we track are{' '}
              <strong>currently stable</strong> in their countries.
            </p>
            <div className="stats-bar">
              <div className="stats-bar-item">
                <span className="stats-bar-num">{activity.totalRuns24h}</span>
                <span className="stats-bar-label">checks in last 24h</span>
              </div>
              <div className="stats-bar-item">
                <span className="stats-bar-num">{activity.totalRuns7d}</span>
                <span className="stats-bar-label">checks in last 7 days</span>
              </div>
              <div className="stats-bar-item">
                <span className="stats-bar-num">{services.length}</span>
                <span className="stats-bar-label">services tracked</span>
              </div>
              <div className="stats-bar-item">
                <span className="stats-bar-num">{relTime(lastScrape)}</span>
                <span className="stats-bar-label">last check</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              <a href="/changes">See full change history →</a>
            </p>
          </>
        )}
      </section>

      <section>
        <h2>💸 Recent price drops</h2>
        {priceDrops.length > 0 ? (
          <>
            <p style={{ color: '#666', fontSize: '0.95rem', marginTop: 0 }}>
              Subscriptions that just got cheaper in some country:
            </p>
            <table>
              <thead><tr><th>Service</th><th>Country</th><th>Now</th></tr></thead>
              <tbody>
                {priceDrops.map((d) => (
                  <tr key={d.id}>
                    <td><a href={`/cheapest/${d.service_slug}`}>{d.service_name}</a></td>
                    <td>{d.flag ? `${d.flag} ` : ''}{d.country_name}</td>
                    <td>
                      <span style={{ color: '#888' }}>${d.old_usd?.toFixed(2)}</span>{' → '}
                      <strong style={{ color: '#0a7d33' }}>${d.new_usd?.toFixed(2)}</strong>
                      {d.pct != null && <span style={{ color: '#0a7d33', fontWeight: 600 }}> ({d.pct}%)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              <a href="/cheapest">Track prices & get drop alerts →</a>
            </p>
          </>
        ) : (
          <p style={{ color: '#444', fontSize: '0.95rem' }}>
            Find the <a href="/cheapest">cheapest country for every subscription</a> — and get an email the moment a price drops.
          </p>
        )}
      </section>

      <SuggestForm />
    </>
  );
}
