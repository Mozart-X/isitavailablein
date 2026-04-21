import { getAllServices } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'All services',
  description: 'Browse all services we track.'
};

export default async function Page() {
  const services = await getAllServices();
  const categories = [...new Set(services.map((s) => s.category))];
  return (
    <article>
      <h1>All services ({services.length})</h1>
      {categories.map((cat) => (
        <div key={cat}>
          <h2><span className="category-tag">{cat}</span></h2>
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
    </article>
  );
}
