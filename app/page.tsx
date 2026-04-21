import { getAllServices, getAllCountries, getRecentChanges } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';

export const revalidate = 3600;

export default async function HomePage() {
  const [services, countries, changes] = await Promise.all([
    getAllServices(),
    getAllCountries(),
    getRecentChanges(10)
  ]);

  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <>
      <section className="hero">
        <h1>Is it available in my country?</h1>
        <p>Check whether ChatGPT, Netflix, Revolut, Binance and {services.length}+ services work in your country. Updated daily from official sources.</p>
      </section>

      <h2>Popular checks</h2>
      <div className="grid">
        {services.slice(0, 12).flatMap((s) =>
          ['US', 'GB', 'NP', 'IN'].map((iso) => {
            const c = countries.find((x) => x.iso2 === iso);
            if (!c) return null;
            return (
              <a key={`${s.slug}-${c.slug}`} href={`/${buildAvailabilitySlug(s.slug, c.slug)}`}>
                <span>Is {s.name} in {c.name}?</span>
                <span>{c.flag}</span>
              </a>
            );
          })
        )}
      </div>

      <h2>Browse by category</h2>
      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: '2rem' }}>
          <h3><span className="category-tag">{cat}</span></h3>
          <div className="grid">
            {services.filter((s) => s.category === cat).map((s) => (
              <a key={s.slug} href={`/service/${s.slug}`}>
                <span>{s.name}</span>
                <span>→</span>
              </a>
            ))}
          </div>
        </div>
      ))}

      <h2>Recent changes</h2>
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

      <h2>Browse by country</h2>
      <div className="grid">
        {countries.map((c) => (
          <a key={c.iso2} href={`/country/${c.slug}`}>
            <span>{c.flag} {c.name}</span>
            <span>→</span>
          </a>
        ))}
      </div>
    </>
  );
}
