export const dynamic = 'force-dynamic';

export default function LoginPage({ searchParams }: { searchParams: { next?: string; err?: string } }) {
  return (
    <div style={{ maxWidth: 360, margin: '3rem auto' }}>
      <h1>Admin login</h1>
      {searchParams.err && <p style={{ color: '#a30000' }}>Wrong password.</p>}
      <form action="/api/admin/login" method="POST">
        <input type="hidden" name="next" value={searchParams.next || '/admin'} />
        <input
          type="password"
          name="password"
          placeholder="Admin password"
          required
          autoFocus
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: 8 }}
        />
        <button type="submit" style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem', background: '#0066cc', color: 'white', border: 0, borderRadius: 8, fontSize: '1rem', cursor: 'pointer' }}>
          Sign in
        </button>
      </form>
      <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '1rem' }}>
        Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> to enable.
      </p>
    </div>
  );
}
