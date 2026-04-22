import { getRecentChanges, getLastScrapeAt } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 3600;

function relTime(iso: string | null): string {
  if (!iso) return 'recently';
  const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
  if (isNaN(t)) return 'recently';
  const diff = Date.now() - t;
  const min = Math.round(diff / 60000);
  if (min < 2) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const d = Math.round(hr / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
}

export const metadata: Metadata = {
  title: 'Recent availability changes',
  description: 'Services newly launched, blocked, or restricted by country. Updated daily.'
};

export default async function Page() {
  const [changes, lastScrape] = await Promise.all([
    getRecentChanges(100),
    getLastScrapeAt()
  ]);
  return (
    <article>
      <h1>Recent availability changes</h1>
      <p>Automatic checks detect when services become available, blocked, or restricted in new countries. Last checked <strong>{relTime(lastScrape)}</strong>.</p>
      {changes.length === 0 ? <p style={{ color: '#666' }}>No changes detected yet. Last checked {relTime(lastScrape)}.</p> : (
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
