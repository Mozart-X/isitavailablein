import { getAllServices, getAllCountries } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import Finder from '@/components/Finder';
import SuggestForm from '@/components/SuggestForm';

export const revalidate = 3600;

// Hand-picked popular combinations. Keep this short — a teaser, not a directory.
const POPULAR: Array<[string, string]> = [
  ['chatgpt', 'china'],
  ['chatgpt', 'turkey'],
  ['netflix', 'india'],
  ['spotify', 'pakistan'],
  ['revolut', 'united-kingdom'],
  ['binance', 'germany'],
];

export default async function HomePage() {
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);

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
        <p>Is it available, what it costs, and how to unlock it — {services.length}+ services across {countries.length} countries.</p>
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

      <SuggestForm />
    </>
  );
}
