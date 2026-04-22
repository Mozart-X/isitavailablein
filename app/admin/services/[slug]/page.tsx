export const runtime = 'edge';

import { notFound } from 'next/navigation';
import { q } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default async function EditService({ params }: { params: { slug: string } }) {
  const svcRows = await q('SELECT * FROM services WHERE slug = ?', [params.slug]);
  if (!svcRows[0]) notFound();
  const service = svcRows[0];
  const countries = await q('SELECT * FROM countries ORDER BY name');
  const av = await q('SELECT * FROM availability WHERE service_id = ?', [service.id]);
  const byIso = new Map(av.map((a: any) => [a.country_iso2, a]));

  return (
    <>
      <p><a href="/admin/services">← All services</a></p>
      <h1>{service.name} <span className="category-tag">{service.category}</span></h1>
      <p>{service.description}</p>
      <p style={{ color: '#666' }}>Click any status to cycle: yes → partial → vpn_only → no → unknown → yes.</p>

      <table>
        <thead><tr><th>Country</th><th>Status</th><th>Source</th><th>Verified</th><th>Notes</th></tr></thead>
        <tbody>
          {countries.map((c: any) => {
            const a: any = byIso.get(c.iso2);
            const status = a?.status || 'unknown';
            return (
              <tr key={c.iso2}>
                <td>{c.flag} {c.name}</td>
                <td>
                  <form action="/api/admin/status" method="POST" style={{ display: 'inline' }}>
                    <input type="hidden" name="service_id" value={service.id} />
                    <input type="hidden" name="iso2" value={c.iso2} />
                    <input type="hidden" name="cycle" value="1" />
                    <input type="hidden" name="current" value={status} />
                    <button type="submit" className={`status-badge status-${status}`} style={{ border: 0, cursor: 'pointer' }}>
                      {status}
                    </button>
                  </form>
                </td>
                <td style={{ fontSize: '0.85rem', color: '#666' }}>{a?.source || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: '#666' }}>{a?.last_verified || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: '#666' }}>{a?.notes || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
