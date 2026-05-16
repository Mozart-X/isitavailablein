// /deals — VPN deals & coupons hub.
// "NordVPN coupon", "Surfshark deal" etc. are brand+commercial queries.
// Highest converting non-review keywords. Page is just an aggregator
// with affiliate links to the current best deals.

import { vpnLink, virtualCardLink, esimLink } from '@/lib/affiliate';
import type { Metadata } from 'next';

export const revalidate = 86400;

const year = new Date().getFullYear();

const ogUrl = `/og?t=${encodeURIComponent(`VPN Deals & Coupons ${year}`)}&s=${encodeURIComponent('Live discounts on NordVPN, Surfshark, ExpressVPN')}&v=deal`;
export const metadata: Metadata = {
  title: `Best VPN deals & coupons — ${year}`,
  description: `Live VPN discount codes for NordVPN, Surfshark, ExpressVPN. Plus deals on virtual cards (Wise, Revolut) and travel eSIMs (Airalo). Updated ${year}.`,
  alternates: { canonical: '/deals' },
  openGraph: { images: [ogUrl] },
  twitter: { card: 'summary_large_image', images: [ogUrl] },
};

const VPN_DEALS = [
  {
    provider: 'nord' as const,
    name: 'NordVPN',
    discount: 'Up to 74% off',
    headline: 'NordVPN 2-year plan',
    body: 'Save up to 74% on the 2-year plan + 3 extra months free with our link. Includes NordPass password manager.',
    badge: 'Best deal',
  },
  {
    provider: 'surfshark' as const,
    name: 'Surfshark',
    discount: 'From $2.19/mo',
    headline: 'Surfshark 2-year plan',
    body: 'Cheapest top-tier VPN. Unlimited devices, includes Surfshark Antivirus + alert.',
    badge: 'Cheapest',
  },
  {
    provider: 'express' as const,
    name: 'ExpressVPN',
    discount: '49% off + 3 months free',
    headline: 'ExpressVPN 1-year plan',
    body: 'Fastest VPN. 49% off the 12-month plan + 3 extra months free. 30-day refund.',
    badge: 'Fastest',
  },
];

export default function DealsPage() {
  const wise = virtualCardLink('wise');
  const revolut = virtualCardLink('revolut');
  const airalo = esimLink('airalo');

  return (
    <article>
      <h1>Best VPN deals & coupons ({year})</h1>
      <p style={{ fontSize: '1.05rem' }}>
        Live discount codes for the top VPNs we recommend. We update this page when prices
        change. All links open the provider's current best public offer — no sketchy
        "code-only" pages.
      </p>

      <h2>VPN deals</h2>
      <div className="deals-grid">
        {VPN_DEALS.map((d) => {
          const aff = vpnLink(d.provider);
          return (
            <div key={d.provider} className="deal-card">
              <div className="deal-badge">{d.badge}</div>
              <h3>{d.headline}</h3>
              <div className="deal-discount">{d.discount}</div>
              <p>{d.body}</p>
              <a
                href={aff.href}
                rel="nofollow sponsored noopener"
                target="_blank"
                className="deal-cta"
              >
                Claim {d.name} deal →
              </a>
              <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.6rem' }}>
                30-day money-back guarantee. Cancel anytime.
              </p>
            </div>
          );
        })}
      </div>

      <h2>Beyond VPN — other tools that pay off</h2>
      <p>If you're trying to access services from a restricted country, a VPN alone often isn't enough. These pair well:</p>
      <div className="deals-grid">
        <div className="deal-card">
          <div className="deal-badge">Free signup</div>
          <h3>Wise multi-currency card</h3>
          <div className="deal-discount">Free virtual cards</div>
          <p>Get a card whose BIN matches a "supported" country. Works at international checkouts where your local card is rejected. Free to open.</p>
          <a href={wise.href} rel="nofollow sponsored noopener" target="_blank" className="deal-cta">
            Open a Wise account →
          </a>
        </div>
        <div className="deal-card">
          <div className="deal-badge">Free signup</div>
          <h3>Revolut card</h3>
          <div className="deal-discount">Free</div>
          <p>Alternative to Wise. Issued in your name with a number that works at most international checkouts.</p>
          <a href={revolut.href} rel="nofollow sponsored noopener" target="_blank" className="deal-cta">
            Get Revolut →
          </a>
        </div>
        <div className="deal-card">
          <div className="deal-badge">From $3</div>
          <h3>Airalo eSIM</h3>
          <div className="deal-discount">200+ countries</div>
          <p>Need a real phone number from a specific country for SMS verification, or data while travelling? An eSIM activates in 5 minutes.</p>
          <a href={airalo.href} rel="nofollow sponsored noopener" target="_blank" className="deal-cta">
            Browse Airalo plans →
          </a>
        </div>
      </div>

      <h2>FAQ</h2>
      <h3>Are these the cheapest prices?</h3>
      <p>
        For the public offers, yes — providers don't show different prices to different users
        unless you have a specific affiliate code. Watch out for "exclusive code" sites that
        actually link to higher prices than the homepage.
      </p>
      <h3>Do you make money from these links?</h3>
      <p>
        Yes. If you sign up via our links, the provider pays us a commission at no extra cost
        to you. That's how we keep the site free. We only list providers we'd actually use
        ourselves.
      </p>
      <h3>Can I get a refund if it doesn't work?</h3>
      <p>
        All three VPNs above offer 30-day money-back guarantees. We've tested them and the
        refunds are processed without arguing.
      </p>
    </article>
  );
}
