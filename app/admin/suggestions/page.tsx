export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { listSuggestions } from '@/lib/admin-db';

export default async function SuggestionsPage() {
  const rows = await listSuggestions(200);
  return (
    <>
      <h1>Suggestions</h1>
      <p style={{ color: '#666' }}>{rows.length} items. Newest first.</p>
      {rows.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>When</th><th>Kind</th><th>Body</th><th>Contact</th><th>Reviewed</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{String(r.created_at).replace('T', ' ').slice(0, 16)}</td>
                <td><span className="category-tag">{r.kind}</span></td>
                <td style={{ maxWidth: 420 }}>{r.body}</td>
                <td style={{ fontSize: '0.85rem' }}>{r.contact || '—'}</td>
                <td>{r.reviewed ? 'yes' : 'no'}</td>
                <td>
                  {!r.reviewed && (
                    <form action="/api/admin/suggestions/mark" method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer' }}>Mark reviewed</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
