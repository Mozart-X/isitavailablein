import { getRecentChanges } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Recent availability changes',
  description: 'Services newly launched, blocked, or restricted by country. Updated daily.'
};

export default async function Page() {
  const changes = await getRecentChanges(100);
  return (
    <article>
      <h1>Recent availability changes</h1>
      <p>Automatic daily checks detect when services become available, blocked, or restricted in new countries.</p>
      {changes.length === 0 ? <p>No changes yet — scrapers run daily.</p> : (
        <table>
          <thead><tr><th>When</th><th>Service</th><th>Country</th><th>Change</th><th>Source</th></tr></thead>
          <tbody>
            {changes.map((c: any) => (
              <tr key={c.id}>
                <td>{new Date(c.changed_at).toLocaleDateString()}</td>
                <td><a href={`/service/${c.service_slug}`}>{c.service_name}</a></td>
                <td><a href={`/country/${c.country_slug}`}>{c.country_name}</a></td>
                <td><span className={`status-badge status-${c.old_status}`}>{c.old_status || '—'}</span> → <span className={`status-badge status-${c.new_status}`}>{c.new_status}</span></td>
                <td>{c.source || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
