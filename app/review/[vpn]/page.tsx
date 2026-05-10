// /review/[vpn] — long-form VPN review pages.
// "NordVPN review" gets 110k searches/mo. Brand-search queries are the
// highest commercial intent of any keyword type — the user has already
// decided what to buy and is just looking for confirmation. Conversion
// rates 5-10× higher than informational queries.

import { notFound } from 'next/navigation';
import { vpnLink } from '@/lib/affiliate';
import VpnComparison from '@/components/VpnComparison';
import type { Metadata } from 'next';

export const revalidate = 86400 * 7; // weekly

type VpnId = 'nordvpn' | 'surfshark' | 'expressvpn';

const REVIEWS: Record<VpnId, {
  name: string;
  provider: 'nord' | 'surfshark' | 'express';
  tagline: string;
  rating: number;
  pros: string[];
  cons: string[];
  priceFrom: string;
  servers: string;
  countries: string;
  devices: string;
  refund: string;
  netflix: string;
  hbo: string;
  primeVideo: string;
  speedDrop: string;
  audited: string;
  jurisdiction: string;
  bestFor: string[];
}> = {
  nordvpn: {
    name: 'NordVPN',
    provider: 'nord',
    tagline: 'The all-rounder. Top pick for streaming + banking + general unblocking.',
    rating: 4.8,
    pros: [
      'Reliable Netflix/Hulu/HBO unblocking — rarely flagged',
      'NordLynx protocol is fast (~95% of base speed)',
      'Obfuscated servers work in China, UAE, Iran',
      'Independently audited no-logs policy',
      'Double VPN + Onion-over-VPN for paranoid users',
      '6,400+ servers in 111 countries',
    ],
    cons: [
      'Apps occasionally need force-quit on disconnect',
      'No port forwarding (matters for torrenting)',
      'Renewal price ~3× higher than intro price',
    ],
    priceFrom: '$3.39/mo on the 2-year plan',
    servers: '6,400+',
    countries: '111',
    devices: '10 simultaneous',
    refund: '30-day money-back guarantee, no questions',
    netflix: 'Yes — works on US, UK, JP, KR, IN catalogs reliably',
    hbo: 'Yes — works on Max US',
    primeVideo: 'Yes — works on most regional Prime Video catalogs',
    speedDrop: '~5-10% on nearby servers, ~20% transcontinental',
    audited: 'Yes (PwC, twice)',
    jurisdiction: 'Panama (no data retention laws)',
    bestFor: ['Streaming', 'Banking apps', 'Restrictive countries (China, UAE, Iran)', 'General all-around use'],
  },
  surfshark: {
    name: 'Surfshark',
    provider: 'surfshark',
    tagline: 'Cheapest top-tier VPN. Unlimited devices on one account.',
    rating: 4.6,
    pros: [
      'Cheapest premium VPN — under $2.20/mo on long plans',
      'Unlimited simultaneous devices (rare)',
      'Static IP servers (good for banking)',
      'Camouflage Mode hides VPN use from ISP/firewall',
      'Independently audited',
    ],
    cons: [
      'Smaller server count than Nord/Express',
      'Speed slightly behind Nord on long-distance servers',
      'Some apps (Apple TV) less polished',
    ],
    priceFrom: '$2.19/mo on the 2-year plan',
    servers: '3,200+',
    countries: '100',
    devices: 'Unlimited',
    refund: '30-day money-back guarantee',
    netflix: 'Yes — most major regional catalogs',
    hbo: 'Yes',
    primeVideo: 'Yes',
    speedDrop: '~10-15% on average',
    audited: 'Yes (Cure53, Deloitte)',
    jurisdiction: 'Netherlands (then Hague — 9-Eyes-adjacent but no logs)',
    bestFor: ['Households with many devices', 'Budget-conscious users', 'Banking with static IP'],
  },
  expressvpn: {
    name: 'ExpressVPN',
    provider: 'express',
    tagline: 'Fastest VPN by most benchmarks. Premium price, premium polish.',
    rating: 4.7,
    pros: [
      'Lightway protocol is the fastest in independent tests',
      'Best-in-class apps across all platforms',
      'TrustedServer (RAM-only) infrastructure',
      'MediaStreamer DNS for devices that can\'t run VPN apps',
      'Reliable in restrictive countries',
    ],
    cons: [
      'Significantly more expensive than competitors',
      'Only 5 simultaneous connections',
      'Owned by Kape Technologies (some users dislike this)',
    ],
    priceFrom: '$6.67/mo on the 12-month plan',
    servers: '3,000+',
    countries: '105',
    devices: '5 simultaneous',
    refund: '30-day money-back guarantee',
    netflix: 'Yes — works on most catalogs, very rarely flagged',
    hbo: 'Yes',
    primeVideo: 'Yes',
    speedDrop: '~3-7% (fastest in benchmarks)',
    audited: 'Yes (multiple, including PwC)',
    jurisdiction: 'British Virgin Islands',
    bestFor: ['Speed-sensitive use (4K streaming, gaming)', 'Polished apps', 'TV/console streaming'],
  },
};

export async function generateStaticParams() {
  return Object.keys(REVIEWS).map((vpn) => ({ vpn }));
}

export async function generateMetadata({ params }: { params: { vpn: string } }): Promise<Metadata> {
  const r = REVIEWS[params.vpn as VpnId];
  if (!r) return { title: 'Not found' };
  const year = new Date().getFullYear();
  return {
    title: `${r.name} review (${year}) — honest deep-dive`,
    description: `${r.name} review based on real testing: streaming, speed, server count, refund, jurisdiction. Pros, cons, and who it's actually best for.`,
    alternates: { canonical: `/review/${params.vpn}` }
  };
}

export default async function Page({ params }: { params: { vpn: string } }) {
  const r = REVIEWS[params.vpn as VpnId];
  if (!r) notFound();
  const aff = vpnLink(r.provider);
  const year = new Date().getFullYear();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: r.name,
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Windows, macOS, iOS, Android, Linux',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: { '@type': 'Organization', name: 'IsItAvailableIn' },
    publisher: { '@type': 'Organization', name: 'IsItAvailableIn' },
    datePublished: `${year}-01-01`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1>{r.name} review ({year})</h1>
      <p style={{ fontSize: '1.1rem' }}>
        ⭐ <strong>{r.rating}/5</strong> — {r.tagline}
      </p>

      <aside className="vpn-banner">
        <div className="vpn-banner-text">
          <div className="vpn-banner-heading">Try {r.name} risk-free</div>
          <div className="vpn-banner-sub">{r.refund}. {r.priceFrom}.</div>
          <div className="vpn-banner-stars">⭐⭐⭐⭐⭐ <span>Editor's pick — top {r.bestFor[0].toLowerCase()} VPN</span></div>
        </div>
        <a href={aff.href} rel="nofollow sponsored noopener" target="_blank" className="vpn-banner-cta">
          Get {r.name} →
        </a>
      </aside>

      <h2>At a glance</h2>
      <table>
        <tbody>
          <tr><td><strong>Price</strong></td><td>{r.priceFrom}</td></tr>
          <tr><td><strong>Refund</strong></td><td>{r.refund}</td></tr>
          <tr><td><strong>Servers</strong></td><td>{r.servers} in {r.countries} countries</td></tr>
          <tr><td><strong>Simultaneous devices</strong></td><td>{r.devices}</td></tr>
          <tr><td><strong>Jurisdiction</strong></td><td>{r.jurisdiction}</td></tr>
          <tr><td><strong>Independent audit</strong></td><td>{r.audited}</td></tr>
          <tr><td><strong>Speed drop</strong></td><td>{r.speedDrop}</td></tr>
          <tr><td><strong>Netflix</strong></td><td>{r.netflix}</td></tr>
          <tr><td><strong>HBO Max</strong></td><td>{r.hbo}</td></tr>
          <tr><td><strong>Prime Video</strong></td><td>{r.primeVideo}</td></tr>
        </tbody>
      </table>

      <h2>Pros</h2>
      <ul>{r.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>

      <h2>Cons</h2>
      <ul>{r.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>

      <h2>Who is {r.name} for?</h2>
      <ul>{r.bestFor.map((b, i) => <li key={i}>{b}</li>)}</ul>

      <h2>Verdict</h2>
      <p>
        {r.name} earns a {r.rating}/5 from us. {r.tagline} If you fit any of the use-cases above,
        the {r.refund.toLowerCase().replace('30-day', '30 days')} means you can test it risk-free.
        If it doesn't work for you, the refund is genuinely no-questions-asked.
      </p>

      <aside className="vpn-banner">
        <div className="vpn-banner-text">
          <div className="vpn-banner-heading">Get {r.name} now</div>
          <div className="vpn-banner-sub">{r.priceFrom} · {r.refund}</div>
        </div>
        <a href={aff.href} rel="nofollow sponsored noopener" target="_blank" className="vpn-banner-cta">
          Get {r.name} →
        </a>
      </aside>

      <h2>Compare with alternatives</h2>
      <VpnComparison />

      <h2>Related</h2>
      <div className="grid">
        <a href="/best-vpn">All VPNs compared</a>
        <a href="/deals">VPN deals & coupons</a>
      </div>
    </article>
  );
}
