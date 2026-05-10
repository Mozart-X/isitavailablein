// Re-usable VPN comparison table. Three providers, ranked, with editor's pick.
// Used on /best-vpn and /best-vpn-for/[scenario] pages.

import { vpnLink } from '@/lib/affiliate';

type Row = {
  rank: number;
  provider: 'nord' | 'surfshark' | 'express';
  name: string;
  priceFrom: string;
  servers: string;
  bestFor: string;
  refundDays: number;
  rating: string;
};

const ROWS: Row[] = [
  { rank: 1, provider: 'nord', name: 'NordVPN', priceFrom: '$3.39/mo', servers: '6,400+ in 111 countries', bestFor: 'Streaming, banking, all-rounder', refundDays: 30, rating: '4.8' },
  { rank: 2, provider: 'surfshark', name: 'Surfshark', priceFrom: '$2.19/mo', servers: '3,200+ in 100 countries', bestFor: 'Unlimited devices, cheap', refundDays: 30, rating: '4.6' },
  { rank: 3, provider: 'express', name: 'ExpressVPN', priceFrom: '$6.67/mo', servers: '3,000+ in 105 countries', bestFor: 'Fastest connections', refundDays: 30, rating: '4.7' },
];

export default function VpnComparison() {
  return (
    <table className="vpn-compare">
      <thead>
        <tr>
          <th>#</th>
          <th>VPN</th>
          <th>Price from</th>
          <th>Best for</th>
          <th>Refund</th>
          <th>Try</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((r) => {
          const aff = vpnLink(r.provider);
          return (
            <tr key={r.provider} className={r.rank === 1 ? 'rank-1' : ''}>
              <td><strong>#{r.rank}</strong></td>
              <td>
                <strong>{r.name}</strong>
                {r.rank === 1 && <span className="editors-pick">Editor's pick</span>}
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                  ⭐ {r.rating} · {r.servers}
                </div>
              </td>
              <td><strong>{r.priceFrom}</strong></td>
              <td style={{ fontSize: '0.88rem' }}>{r.bestFor}</td>
              <td>{r.refundDays}-day money-back</td>
              <td>
                <a
                  href={aff.href}
                  rel="nofollow sponsored noopener"
                  target="_blank"
                  className="vpn-compare-cta"
                >
                  Get {r.name} →
                </a>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
