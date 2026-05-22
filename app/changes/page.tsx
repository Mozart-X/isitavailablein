import { getRecentChanges, getLastScrapeAt, getScrapeActivity } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 600;

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
  description: 'Services newly launched, blocked, or restricted by country. Updated daily.',
  alternates: { canonical: '/changes' }
};

export default async function Page() {
  const [changes, lastScrape, activity] = await Promise.all([
    getRecentChanges(100),
    getLastScrapeAt(),
    getScrapeActivity()
  ]);

  return (
    <article>
      <h1>Recent availability changes</h1>
      <p>
        When a service becomes available, blocked, or restricted in a country,
        the change is logged here. No change = no row.
      </p>

      <div className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-num">{activity.totalRuns24h}</span>
          <span className="stats-bar-label">checks in last 24h</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{activity.totalRuns7d}</span>
          <span className="stats-bar-label">checks in last 7 days</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{activity.servicesChecked24h.length}</span>
          <span className="stats-bar-label">services rechecked today</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{relTime(lastScrape)}</span>
          <span className="stats-bar-label">last check ran</span>
        </div>
      </div>

      <h2>Status changes</h2>
      {changes.length === 0 ? (
        <p style={{ color: '#666' }}>
          No status changes detected yet. The services we track are currently stable.
        </p>
      ) : (
        <>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Showing {changes.length} most recent changes.
          </p>
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
        </>
      )}

      {activity.lastRunPerService.length > 0 && (
        <>
          <h2>Latest activity</h2>
          <table>
            <thead><tr><th>Service</th><th>Last verified</th></tr></thead>
            <tbody>
              {activity.lastRunPerService.map((r) => (
                <tr key={r.service_slug}>
                  <td><a href={`/service/${r.service_slug}`}>{r.service_slug}</a></td>
                  <td>{relTime(r.last_run)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </article>
  );
}
