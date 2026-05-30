// /live — the live access-status board. "DownDetector for geo-blocks."
// This is the recurring front door: what's blocked / working RIGHT NOW,
// from real community reports, with a known-restrictions baseline so the
// page is always useful. The reason people come back.

import { getTrendingReports, getRecentReports, getKnownBlocks } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import type { Metadata } from 'next';

// Short cache — this page is meant to feel live.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Live access status — what’s blocked right now, by country',
  description: 'Real-time community reports on which services are blocked, working, or VPN-only in each country right now — plus the VPNs people confirm are working today.',
  alternates: { canonical: '/live' },
};

function rel(iso: string): string {
  const t = new Date(String(iso).replace(' ', 'T') + 'Z').getTime();
  if (isNaN(t)) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const VERDICT: Record<string, { label: string; cls: string }> = {
  blocked: { label: '❌ Blocked', cls: 'status-no' },
  vpn_only: { label: '🔐 VPN only', cls: 'status-vpn_only' },
  working: { label: '✅ Working', cls: 'status-yes' },
  partial: { label: '⚠ Partial', cls: 'status-partial' },
};

function statusLabel(s: string): string {
  return s === 'vpn_only' ? '🔐 VPN only' : s === 'no' ? '❌ Blocked' : s === 'yes' ? '✅ Works' : '⚠ Partial';
}

export default async function LivePage() {
  const [trending, recent, known] = await Promise.all([
    getTrendingReports(48, 12),
    getRecentReports(14),
    getKnownBlocks(14),
  ]);

  const hasLive = trending.length > 0;

  return (
    <article>
      <h1>🚦 Live access status</h1>
      <p style={{ fontSize: '1.05rem', color: '#444' }}>
        What people are reporting blocked, working, or VPN-only <strong>right now</strong>, country by country.
        Hit something blocked? <a href="#report">Report it</a> — it helps the next person and updates this board instantly.
      </p>

      {hasLive ? (
        <section>
          <h2>🔥 Trending in the last 48 hours</h2>
          <table>
            <thead><tr><th>Service</th><th>Country</th><th>Crowd verdict</th><th>Reports</th><th>Last</th></tr></thead>
            <tbody>
              {trending.map((t) => (
                <tr key={`${t.service!.slug}-${t.country!.iso2}`}>
                  <td>{t.service!.name}</td>
                  <td>{t.country!.flag ? `${t.country!.flag} ` : ''}{t.country!.name}</td>
                  <td>
                    <span className={`status-badge ${VERDICT[t.verdict]?.cls || ''}`}>{VERDICT[t.verdict]?.label || t.verdict}</span>
                    {t.blocked_pct > 0 && t.verdict !== 'working' && (
                      <span style={{ color: '#b00', fontSize: '0.85rem', marginLeft: 6 }}>{t.blocked_pct}% blocked</span>
                    )}
                  </td>
                  <td>{t.total}</td>
                  <td>
                    <a href={`/${buildAvailabilitySlug(t.service!.slug, t.country!.slug)}`}>{rel(t.last_at)} →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
          <strong>No fresh community reports in the last 48 hours.</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#555' }}>
            That usually means things are stable — but if something just broke for you, you'll be the first to flag it.
            Below is what's <em>known</em> to be restricted from our availability tracking.
          </p>
        </section>
      )}

      {recent.length > 0 && (
        <section>
          <h2>📡 Latest reports</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recent.map((r, i) => (
              <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.95rem' }}>
                <a href={`/${buildAvailabilitySlug(r.service!.slug, r.country!.slug)}`} style={{ fontWeight: 600 }}>
                  {r.service!.name} in {r.country!.flag ? `${r.country!.flag} ` : ''}{r.country!.name}
                </a>{' '}
                <span>{statusLabel(r.status)}</span>
                {r.vpn_used && <span style={{ color: '#0a7d33' }}> · via {r.vpn_used}</span>}
                <span style={{ color: '#999' }}> · {rel(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Known restrictions right now</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 0 }}>
          Services with the most countries blocking or limiting access, from our availability data.
        </p>
        <table>
          <thead><tr><th>Service</th><th>Blocked in</th><th>VPN-only in</th><th>Where</th></tr></thead>
          <tbody>
            {known.map((k) => (
              <tr key={k.service.slug}>
                <td><a href={`/service/${k.service.slug}`}>{k.service.name}</a></td>
                <td>{k.blocked > 0 ? `${k.blocked} countries` : '—'}</td>
                <td>{k.vpn_only > 0 ? `${k.vpn_only} countries` : '—'}</td>
                <td style={{ fontSize: '0.9rem' }}>
                  {k.sample.map((s, i) => (
                    <span key={s.country.iso2}>
                      {i > 0 && ', '}
                      <a href={`/${buildAvailabilitySlug(k.service.slug, s.country.slug)}`}>
                        {s.country.flag ? `${s.country.flag} ` : ''}{s.country.name}
                      </a>
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="report" style={{ background: '#f7f9fc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem', marginTop: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>See something blocked? Report it.</h2>
        <p style={{ color: '#555' }}>
          Open any service-and-country page and tap <strong>Works / VPN-only / Blocked</strong>. Your report shows up
          here within minutes and helps everyone in your country. Want to know the moment something you rely on goes
          down or comes back? <a href="/alerts">Set a free alert →</a>
        </p>
      </section>
    </article>
  );
}
