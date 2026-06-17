import { getAllServices, getAllCountries } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import { FEATURED_COUNTRIES, FEATURED_COMBOS } from '@/lib/focus';
import Finder from '@/components/Finder';
import SuggestForm from '@/components/SuggestForm';

export const revalidate = 3600;

export default async function HomePage() {
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);

  const serviceBySlug = new Map(services.map((s) => [s.slug, s]));
  const countryBySlug = new Map(countries.map((c) => [c.slug, c]));

  // Featured censored markets that exist in the DB.
  const featured = FEATURED_COUNTRIES.filter((f) => countryBySlug.has(f.slug));

  // High-intent "currently blocked" combos that resolve to real pages.
  const combos = FEATURED_COMBOS
    .map(([sv, co]) => {
      const s = serviceBySlug.get(sv);
      const c = countryBySlug.get(co);
      return s && c ? { s, c } : null;
    })
    .filter(Boolean) as { s: any; c: any }[];

  return (
    <>
      <section className="hero">
        <h1>Blocked where you are? See what still works.</h1>
        <p>
          Check if ChatGPT, TikTok, Telegram, WhatsApp, Netflix and {services.length}+ services are
          restricted in your country — and exactly how to get around it.
        </p>
        <Finder
          services={services.map((s) => ({ slug: s.slug, name: s.name, category: s.category }))}
          countries={countries.map((c) => ({ slug: c.slug, name: c.name, iso2: c.iso2, flag: c.flag }))}
        />
      </section>

      <section>
        <h2>Most-restricted countries</h2>
        <p style={{ color: '#666', marginTop: 0, fontSize: '0.95rem' }}>
          What’s blocked, and how to unblock it:
        </p>
        <div className="grid">
          {featured.map((f) => (
            <a key={f.slug} href={`/apps-banned-in/${f.slug}`}>
              <span>{f.flag} {f.name}</span>
              <span>What’s blocked →</span>
            </a>
          ))}
        </div>
      </section>

      {combos.length > 0 && (
        <section>
          <h2>Commonly blocked right now</h2>
          <div className="grid">
            {combos.map(({ s, c }) => (
              <a key={`${s.slug}-${c.slug}`} href={`/${buildAvailabilitySlug(s.slug, c.slug)}`}>
                <span>{s.name} <small>in</small> {c.flag} {c.name}</span>
                <span>→</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <SuggestForm />
    </>
  );
}
