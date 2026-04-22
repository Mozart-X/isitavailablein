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
  let pricing: any[] = [];
  try { pricing = await q('SELECT * FROM pricing WHERE service_id = ?', [service.id]); } catch {}
  const priceByIso = new Map<string, any[]>();
  for (const p of pricing) {
    if (!priceByIso.has(p.country_iso2)) priceByIso.set(p.country_iso2, []);
    priceByIso.get(p.country_iso2)!.push(p);
  }

  return (
    <>
      <p><a href="/admin/services">← All services</a></p>
      <h1>{service.name} <span className="category-tag">{service.category}</span></h1>
      <p>{service.description}</p>
      <p style={{ color: '#666' }}>Click status badge to cycle. Expand a row to edit details & pricing.</p>

      <table>
        <thead><tr><th>Country</th><th>Status</th><th>Payment</th><th>Phone</th><th>Friction</th><th>Edit</th></tr></thead>
        <tbody>
          {countries.map((c: any) => {
            const a: any = byIso.get(c.iso2) || {};
            const status = a.status || 'unknown';
            const prices = priceByIso.get(c.iso2) || [];
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
                <td style={{ fontSize: '0.85rem' }}>{a.payment_ok || '—'}</td>
                <td style={{ fontSize: '0.85rem' }}>{a.phone_verify_ok || '—'}</td>
                <td style={{ fontSize: '0.85rem' }}>{a.signup_friction || '—'}</td>
                <td>
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#0066cc' }}>edit</summary>
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: 6 }}>
                      <form action="/api/admin/details" method="POST" style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        <input type="hidden" name="service_id" value={service.id} />
                        <input type="hidden" name="iso2" value={c.iso2} />
                        <label style={{ fontSize: '0.75rem' }}>Payment
                          <select name="payment_ok" defaultValue={a.payment_ok || ''}>
                            <option value="">—</option>
                            <option>yes</option><option>no</option><option>workaround</option><option>unknown</option>
                          </select>
                        </label>
                        <label style={{ fontSize: '0.75rem' }}>Phone verify
                          <select name="phone_verify_ok" defaultValue={a.phone_verify_ok || ''}>
                            <option value="">—</option>
                            <option>yes</option><option>no</option><option>workaround</option><option>unknown</option>
                          </select>
                        </label>
                        <label style={{ fontSize: '0.75rem' }}>Signup friction
                          <select name="signup_friction" defaultValue={a.signup_friction || ''}>
                            <option value="">—</option>
                            <option>easy</option><option>medium</option><option>hard</option><option>blocked</option><option>unknown</option>
                          </select>
                        </label>
                        <label style={{ fontSize: '0.75rem', gridColumn: '1 / -1' }}>Workaround
                          <input name="workaround" defaultValue={a.workaround || ''} placeholder="e.g. virtual card + IN SIM" />
                        </label>
                        <button type="submit" style={{ gridColumn: '1 / -1', padding: '0.4rem', background: '#0066cc', color: 'white', border: 0, borderRadius: 4, cursor: 'pointer' }}>Save details</button>
                      </form>

                      <hr style={{ margin: '0.75rem 0', border: 0, borderTop: '1px solid #ddd' }} />
                      <strong style={{ fontSize: '0.8rem' }}>Pricing</strong>
                      {prices.length > 0 && (
                        <ul style={{ fontSize: '0.8rem', margin: '0.25rem 0', paddingLeft: '1.2rem' }}>
                          {prices.map((p: any) => (
                            <li key={p.tier}>{p.tier}: {p.price_local ?? '—'} {p.currency_local || ''} (~${p.price_usd ?? '—'}/{p.period})</li>
                          ))}
                        </ul>
                      )}
                      <form action="/api/admin/pricing" method="POST" style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(5, 1fr)', marginTop: '0.4rem' }}>
                        <input type="hidden" name="service_id" value={service.id} />
                        <input type="hidden" name="iso2" value={c.iso2} />
                        <input name="tier" placeholder="tier" defaultValue="standard" />
                        <input name="price_local" placeholder="local" type="number" step="0.01" />
                        <input name="currency_local" placeholder="USD" maxLength={3} />
                        <input name="price_usd" placeholder="USD eq" type="number" step="0.01" />
                        <input name="period" placeholder="month" defaultValue="month" />
                        <button type="submit" style={{ gridColumn: '1 / -1', padding: '0.4rem', background: '#0a6b28', color: 'white', border: 0, borderRadius: 4, cursor: 'pointer' }}>Save pricing</button>
                      </form>
                    </div>
                  </details>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
