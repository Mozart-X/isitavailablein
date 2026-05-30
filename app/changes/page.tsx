import { getRecentChanges } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Recent availability changes',
  description: 'Services newly launched, blocked, or restricted by country.',
  alternates: { canonical: '/changes' }
};

export default async function Page() {
  const changes = await getRecentChanges(40);

  return (
    <article>
      <h1>Recent availability changes</h1>
      {changes.length === 0 ? (
        <p style={{ color: '#666' }}>No recent changes — the services we track are currently stable.</p>
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
    </article>
  );
}
