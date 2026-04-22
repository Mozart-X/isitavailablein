export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav style={{ background: '#1a1a1a', color: 'white', padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <strong>Admin</strong>
        <a href="/admin" style={{ color: '#9cf' }}>Dashboard</a>
        <a href="/admin/reports" style={{ color: '#9cf' }}>Reports</a>
        <a href="/admin/services" style={{ color: '#9cf' }}>Services</a>
        <a href="/admin/scrape-log" style={{ color: '#9cf' }}>Scrape log</a>
        <a href="/admin/suggestions" style={{ color: '#9cf' }}>Suggestions</a>
        <span style={{ marginLeft: 'auto' }}><a href="/" style={{ color: '#9cf' }}>← Public site</a></span>
      </nav>
      <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>{children}</div>
    </div>
  );
}
