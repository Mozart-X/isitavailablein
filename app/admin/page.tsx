export const runtime = 'edge';

import { adminStats } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const s = await adminStats();
  const cards: [string, number, string][] = [
    ['Services', s.services, '/admin/services'],
    ['Countries', s.countries, ''],
    ['Availability rows', s.availability, ''],
    ['Pending reports', s.pendingReports, '/admin/reports'],
    ['Total changes logged', s.changes, '/changes'],
    ['Failed scrapes (7d)', s.recentFailedScrapes, '/admin/scrape-log']
  ];
  return (
    <>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {cards.map(([label, n, href]) => (
          <a key={label} href={href || '#'} style={{
            background: 'white', padding: '1.25rem', borderRadius: 8, border: '1px solid #ddd', display: 'block', color: 'inherit'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem', color: n > 0 && label.includes('Failed') ? '#a30000' : n > 0 && label.includes('Pending') ? '#b37a00' : '#1a1a1a' }}>{n}</div>
          </a>
        ))}
      </div>
    </>
  );
}
