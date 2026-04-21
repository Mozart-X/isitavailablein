import { pendingReports } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default async function Reports() {
  const rows = await pendingReports();
  return (
    <>
      <h1>Pending user reports ({rows.length})</h1>
      {rows.length === 0 ? <p>No pending reports.</p> : (
        <table>
          <thead><tr><th>When</th><th>Service</th><th>Country</th><th>Reported</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.service_name}</td>
                <td>{r.flag} {r.country_name}</td>
                <td><span className={`status-badge status-${r.reported_status}`}>{r.reported_status}</span></td>
                <td>
                  <form action="/api/admin/report-action" method="POST" style={{ display: 'inline-flex', gap: '0.5rem' }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button name="action" value="apply" type="submit" style={{ background: '#0a6b28', color: 'white', border: 0, padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer' }}>Apply</button>
                    <button name="action" value="reject" type="submit" style={{ background: '#888', color: 'white', border: 0, padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer' }}>Reject</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
