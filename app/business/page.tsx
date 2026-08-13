// /business — single commercial funnel. Everything a paying counterparty
// might want (API tiers, data licensing, advertising, partnerships) lives
// here instead of being scattered across /api-docs and a generic /contact.
// Ranks for "service availability API", "geo-restriction data provider".

import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For business — API, data licensing & partnerships',
  description:
    'Availability data for SaaS, fintech and compliance teams: a first-party-sourced service-by-country REST API, licensed data feeds, advertising, and partnerships.',
  alternates: { canonical: '/business' },
};

export default function BusinessPage() {
  return (
    <article>
      <h1>For business</h1>
      <p style={{ fontSize: '1.15rem', color: 'var(--ink-2)', maxWidth: 680 }}>
        We track whether {`{service}`} is available in {`{country}`} across 70+ services and
        61 countries — signup friction, payment acceptance, phone-verification, and
        known workarounds — sourced first-party from providers&rsquo; own published
        lists and re-verified every 2 hours. If your product needs that data, here&rsquo;s
        how to work with us.
      </p>

      <div className="cta-banner">
        <strong>Have a use case? Tell us what you need.</strong>
        <a href="/contact">Get in touch →</a>
      </div>

      {/* ---------- Availability API ---------- */}
      <h2>Availability API</h2>
      <p style={{ color: 'var(--ink-2)' }}>
        The same data that powers this site, as JSON/CSV over a REST API. The{' '}
        <a href="/api-docs">free tier</a> (1,000 req/day) is public and needs no key.
        Paid tiers add throughput, an SLA, historical data, and change webhooks.
        Every row carries a <code>source</code> and a <code>source_type</code> so you
        can filter to first-party-scraped data only.
      </p>

      <div className="hire-tiers">
        <div className="hire-tier">
          <div className="hire-tier-name">Free</div>
          <div className="hire-tier-price">$0</div>
          <div className="hire-tier-sub">For prototypes &amp; low-volume use</div>
          <ul>
            <li>1,000 requests / day per IP</li>
            <li>JSON &amp; CSV, all filters</li>
            <li>CDN-cached (~10 min)</li>
            <li>Best-effort, no SLA</li>
          </ul>
          <a className="hire-tier-cta" href="/api-docs">Read the docs</a>
        </div>

        <div className="hire-tier hire-tier-featured">
          <div className="hire-tier-badge">Most popular</div>
          <div className="hire-tier-name">Standard</div>
          <div className="hire-tier-price">$199<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--ink-3)' }}>/mo</span></div>
          <div className="hire-tier-sub">For SaaS with regional logic</div>
          <ul>
            <li>100k requests / day</li>
            <li>99.9% uptime SLA</li>
            <li>Change webhooks</li>
            <li>API key + email support</li>
          </ul>
          <a className="hire-tier-cta" href="/contact">Start a trial</a>
        </div>

        <div className="hire-tier">
          <div className="hire-tier-name">Business</div>
          <div className="hire-tier-price">$799<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--ink-3)' }}>/mo</span></div>
          <div className="hire-tier-sub">For compliance &amp; fintech</div>
          <ul>
            <li>Unlimited requests</li>
            <li>Signed quarterly snapshots for audit</li>
            <li>Historical / change-log access</li>
            <li>Custom integrations &amp; dedicated support</li>
          </ul>
          <a className="hire-tier-cta" href="/contact">Talk to us</a>
        </div>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--ink-3)' }}>
        Enterprise (co-branded reports, dedicated data steward, custom service
        additions) is priced per engagement — <a href="/contact">contact us</a>.
      </p>

      {/* ---------- Data licensing ---------- */}
      <h2>Data licensing &amp; partnerships</h2>
      <p style={{ color: 'var(--ink-2)' }}>
        Prefer a bulk feed over an API? We license the full dataset — availability,
        local pricing, and change history — as a scheduled CSV/Parquet drop, with an
        attestation of how each row was sourced. Good for market-intelligence,
        VPN/eSIM providers, and geo-compliance vendors who want to embed the data in
        their own product. We also partner on co-published research and data
        integrations.
      </p>
      <p><a href="/contact">Discuss a data deal →</a></p>

      {/* ---------- Advertising ---------- */}
      <h2>Advertising &amp; sponsorship</h2>
      <p style={{ color: 'var(--ink-2)' }}>
        Our audience is people actively trying to access a specific service in a
        specific country — high commercial intent for VPNs, eSIMs, fintech
        onboarding, and cross-border payments. We offer sponsored placements on
        relevant service/country pages, newsletter/alert sponsorships, and
        category-exclusive deals. Placements are labelled and kept clearly separate
        from our availability data.
      </p>
      <p><a href="/contact">Request a media kit →</a></p>

      {/* ---------- Affiliate / brand placement ---------- */}
      <h2>Brand &amp; affiliate placement</h2>
      <p style={{ color: 'var(--ink-2)' }}>
        If you run a VPN, eSIM, or fintech product and want to be considered for our{' '}
        <a href="/best-vpn">recommendation pages</a> and <a href="/deals">deals</a>,
        get in touch. We&rsquo;ll only feature products we can stand behind, and every
        commercial relationship is disclosed.
      </p>
      <p><a href="/contact">Propose a placement →</a></p>

      <div className="cta-banner" style={{ marginTop: '2.5rem' }}>
        <strong>Ready to talk?</strong>
        <a href="/contact">Contact us →</a>
      </div>
    </article>
  );
}
