import { getAllCountries } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All countries',
  description: 'Browse all countries we track.'
};

export default async function Page() {
  const countries = await getAllCountries();
  return (
    <article>
      <h1>All countries ({countries.length})</h1>
      <div className="grid">
        {countries.map((c) => (
          <a key={c.iso2} href={`/country/${c.slug}`}>
            <span>{c.flag} {c.name}</span>
            <span>→</span>
          </a>
        ))}
      </div>
    </article>
  );
}
