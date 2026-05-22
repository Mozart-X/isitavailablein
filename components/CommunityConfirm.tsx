'use client';

// Community confirmation widget. Shown on every availability + how-to page.
// Two functions:
//   1. Trust signal — shows count of recent user confirmations
//      ("Confirmed by 12 users in last 30 days")
//   2. Submit — anyone can vote on what they're seeing right now
//      Their submission re-dates the page in Google's eyes (freshness signal)
//
// Counts come pre-rendered server-side via props. Form posts to /api/confirm.

import { useEffect, useState } from 'react';

export type Counts = {
  yes: number;
  no: number;
  partial: number;
  vpn_only: number;
  total: number;
  recent_30d: number;
  recent_status: { status: string; count: number }[];
};

type Props = {
  serviceSlug: string;
  serviceName: string;
  countryIso2: string;
  countryName: string;
  countryFlag?: string;
  counts: Counts;
};

export default function CommunityConfirm({ serviceSlug, serviceName, countryIso2, countryName, countryFlag, counts }: Props) {
  const [done, setDone] = useState(false);
  const [loadedAt] = useState(() => Date.now());

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('confirmed') === '1') {
        setDone(true);
        url.searchParams.delete('confirmed');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  const topStatus = counts.recent_status[0];
  const consensus = topStatus && counts.recent_30d > 0
    ? Math.round((topStatus.count / counts.recent_30d) * 100)
    : null;

  return (
    <aside className="confirm-card">
      <div className="confirm-head">
        <strong>Community confirmations</strong>
        <span className="confirm-meta">
          {counts.total > 0 ? `${counts.total} all-time · ${counts.recent_30d} in last 30 days` : 'No reports yet — be the first.'}
        </span>
      </div>

      {counts.recent_30d > 0 && (
        <div className="confirm-stats">
          {counts.yes > 0 && <span className="confirm-pill confirm-pill-yes">✅ Yes · {counts.yes}</span>}
          {counts.partial > 0 && <span className="confirm-pill confirm-pill-partial">⚠ Partial · {counts.partial}</span>}
          {counts.vpn_only > 0 && <span className="confirm-pill confirm-pill-vpn">🔐 VPN · {counts.vpn_only}</span>}
          {counts.no > 0 && <span className="confirm-pill confirm-pill-no">❌ No · {counts.no}</span>}
          {consensus !== null && (
            <span className="confirm-consensus">
              {consensus}% report <strong>{topStatus.status === 'vpn_only' ? 'VPN-only' : topStatus.status}</strong>
            </span>
          )}
        </div>
      )}

      {done ? (
        <div className="confirm-thanks">
          <strong>Thanks — recorded.</strong> Your report helps everyone else find accurate info.
        </div>
      ) : (
        <form className="confirm-form" action="/api/confirm" method="POST">
          <div className="confirm-q">
            Are you in {countryFlag ? `${countryFlag} ` : ''}{countryName} right now? Tell us if {serviceName} works for you:
          </div>
          <input type="hidden" name="service" value={serviceSlug} />
          <input type="hidden" name="country" value={countryIso2} />
          <input type="hidden" name="_t" value={loadedAt} />
          {/* Honeypot */}
          <div className="hp-field" aria-hidden="true">
            <label>Website <input type="text" name="url" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <div className="confirm-btns">
            <button type="submit" name="status" value="yes">✅ Works for me</button>
            <button type="submit" name="status" value="vpn_only">🔐 Only with VPN</button>
            <button type="submit" name="status" value="no">❌ Blocked</button>
          </div>
          <details className="confirm-more">
            <summary>+ optional: VPN you used or one-line note</summary>
            <input type="text" name="vpn" placeholder="VPN used, e.g. NordVPN (optional)" maxLength={60} />
            <input type="text" name="notes" placeholder="One-line note, optional (no URLs)" maxLength={240} />
          </details>
        </form>
      )}
    </aside>
  );
}
