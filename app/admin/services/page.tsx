export const runtime = 'edge';

import { q } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default async function AdminServices() {
  const services = await q('SELECT * FROM services ORDER BY category, name');
  return (
    <>
      <h1>Services ({services.length})</h1>
      <p>Click a service to edit per-country status.</p>
      <table>
        <thead><tr><th>Category</th><th>Name</th><th>Slug</th><th>Edit</th></tr></thead>
        <tbody>
          {services.map((s: any) => (
            <tr key={s.id}>
              <td><span className="category-tag">{s.category}</span></td>
              <td>{s.name}</td>
              <td><code>{s.slug}</code></td>
              <td><a href={`/admin/services/${s.slug}`}>Edit →</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
