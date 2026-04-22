export const runtime = 'edge';

import { recentScrapes } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default async function ScrapeLog() {
  const rows = await recentScrapes(100);
  return (
    <>
      <h1>Scrape log</h1>
      {rows.length === 0 ? <p>No scrape runs logged yet.</p> : (
        <table>
          <thead><tr><th>When</th><th>Service</th><th>Source</th><th>OK</th><th>Changed</th><th>Unchanged</th><th>Skipped</th><th>Error</th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} style={{ background: r.ok ? 'white' : '#ffe8e8' }}>
                <td>{new Date(r.run_at).toLocaleString()}</td>
                <td>{r.service_slug}</td>
                <td><code>{r.source}</code></td>
                <td>{r.ok ? '✅' : '❌'}</td>
                <td>{r.changed}</td>
                <td>{r.unchanged}</td>
                <td>{r.skipped}</td>
                <td style={{ fontSize: '0.85rem', color: '#a30000' }}>{r.error || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
