// /hire — uses this site as portfolio proof to land paid freelance gigs.
// The site itself won't pay rent for months; this page can pay it in days
// if shared on Upwork bid messages, Twitter, Reddit /r/forhire, etc.

import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Hire me to build a site like this',
  description: 'I built isitavailablein.com — a 4,670-page Next.js + Cloudflare SEO site with scrapers, edge runtime, dynamic OG images and multi-affiliate stack. Hire me to build one for your niche.',
  alternates: { canonical: '/hire' },
  robots: { index: true, follow: true },
};

const TIERS = [
  {
    name: 'Affiliate boost',
    price: '$149',
    sub: 'Add monetization to your existing site',
    body: 'I install the multi-affiliate stack (VPN, virtual card, eSIM, crypto), auto-link layer (Sovrn), dynamic OG images for shareability, and FAQ schema for richer SERP results. Works with any Next.js, Astro, or static site.',
    delivery: '3-5 days',
    bullets: [
      'Sovrn Commerce JS integration',
      'Per-page contextual VPN/card/eSIM CTAs',
      'Dynamic OG images (1200×630) for social shares',
      'FAQ + Review schema for rich results',
      'Adsterra display ads if wanted',
    ],
  },
  {
    name: 'Comparison site (single niche)',
    price: '$799',
    sub: 'A full data-driven SEO site in your niche',
    body: 'I build a fresh Next.js + Cloudflare Pages site with up to 50 entries × 50 attributes (think /apps-banned-in/[country] structure but for your niche). Edge-runtime, deployed to your domain, multi-affiliate ready.',
    delivery: '10-14 days',
    bullets: [
      'Up to 50 entities, 50 attributes',
      'Edge-runtime with Turso/D1 DB',
      'Auto-generated comparison + listicle pages',
      'Sitemap + robots + Search Console hookup',
      'Multi-affiliate CTAs throughout',
      'Cloudflare Pages deploy + custom domain',
    ],
    featured: true,
  },
  {
    name: 'Like isitavailablein.com',
    price: '$2,499',
    sub: 'Full clone in your niche, no detail skipped',
    body: 'Everything in the tier above + scraper system, change tracking, admin dashboard, anti-spam suggest form, dynamic OG images per page, ~5,000 templated pages from your data. The complete kit.',
    delivery: '21-30 days',
    bullets: [
      'Up to 100 entities × 100 attributes (~10k pages)',
      'Auto-scrapers running every 2h (GH Actions)',
      'Change history + admin dashboard',
      'HMAC-signed admin sessions',
      'Anti-spam suggestion form',
      'Multi-affiliate + Sovrn auto-link',
      'Cloudflare Pages + Turso DB',
      'Full deployment + 30 days post-launch support',
    ],
  },
];

const PROOF = [
  { num: '4,670+', label: 'pages live in 8 weeks' },
  { num: '70', label: 'services × 61 countries tracked' },
  { num: '0', label: 'scraper failures in last 7 days' },
  { num: '798', label: 'automated checks per week' },
];

export default function HirePage() {
  return (
    <article>
      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.1, marginBottom: '0.5rem' }}>
          I built this site. I can build one for your niche.
        </h1>
        <p style={{ fontSize: '1.15rem', color: '#555', lineHeight: 1.5, maxWidth: 760 }}>
          You're reading the proof. <a href="/">isitavailablein.com</a> is a 4,670-page Next.js + Cloudflare site
          with edge-runtime DB queries, automated scrapers, dynamic OG images, multi-affiliate
          monetization, and rich-result schema — built in 8 weeks, solo. Hire me to do the same in
          your niche, or to upgrade a site you already have.
        </p>
      </section>

      <div className="stats-bar">
        {PROOF.map((p) => (
          <div key={p.label} className="stats-bar-item">
            <span className="stats-bar-num">{p.num}</span>
            <span className="stats-bar-label">{p.label}</span>
          </div>
        ))}
      </div>

      <h2>What I can build for you</h2>
      <div className="hire-tiers">
        {TIERS.map((t) => (
          <div key={t.name} className={`hire-tier ${t.featured ? 'hire-tier-featured' : ''}`}>
            {t.featured && <div className="hire-tier-badge">Most popular</div>}
            <div className="hire-tier-name">{t.name}</div>
            <div className="hire-tier-price">{t.price}</div>
            <div className="hire-tier-sub">{t.sub}</div>
            <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: 1.5 }}>{t.body}</p>
            <ul style={{ fontSize: '0.9rem', paddingLeft: '1.2rem', lineHeight: 1.7 }}>
              {t.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '0.5rem' }}>
              Delivery: <strong>{t.delivery}</strong>
            </div>
            <a
              href="/contact"
              className="hire-tier-cta"
            >
              Start a project →
            </a>
          </div>
        ))}
      </div>

      <h2>What I do well</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li><strong>Next.js 14 App Router + edge runtime</strong> deployed to Cloudflare Pages</li>
        <li><strong>Programmatic SEO</strong> at scale — generating 1,000-10,000 pages from data sources</li>
        <li><strong>Scraper systems</strong> that run on cron, log to DB, and survive site changes</li>
        <li><strong>Affiliate monetization</strong> — Sovrn, NordVPN, Wise, Airalo, multi-network stacks</li>
        <li><strong>Schema.org markup</strong> — FAQ, Review, BreadcrumbList for rich SERP results</li>
        <li><strong>Dynamic OG images</strong> via next/og — branded social previews on every page</li>
        <li><strong>Turso/libsql, Cloudflare D1</strong> — edge-compatible databases</li>
        <li><strong>GH Actions cron</strong> — reliable scheduled scraping pipelines</li>
      </ul>

      <h2>How to start</h2>
      <ol style={{ lineHeight: 1.8 }}>
        <li>Send a message via the <a href="/contact">contact page</a> with: your niche, what data you'd display, and which tier interests you.</li>
        <li>I reply within 24 hours with a scoped proposal + sample URL structure.</li>
        <li>50% upfront via Stripe / Wise. Remainder on delivery.</li>
        <li>You get the full repo (yours forever) + a deployed working site + 30-day support.</li>
      </ol>

      <h2>FAQ</h2>
      <h3>Why does the site I'm hiring you to build cost less than a normal agency?</h3>
      <p>
        Because I'm one person, not an agency. No account managers, no project leads, no
        upselling. Just code, deployed, working. The trade-off: I take a limited number of
        builds per month.
      </p>
      <h3>Do you do ongoing work / retainers?</h3>
      <p>
        Yes — $400/month gets you 8 hours of work per month (~2 hours/week) for bug fixes,
        scraper maintenance, new features, etc.
      </p>
      <h3>What if my niche is super specific / weird?</h3>
      <p>
        Specific niches are easier, not harder. The harder the niche to research, the more
        valuable the resulting site, the better the SEO opportunity. Send me the idea via the
        contact page.
      </p>
      <h3>Can you also do the content / writing?</h3>
      <p>
        For data-driven sites like this one, the "content" is largely templated from your data
        source. If you need standalone blog posts or long-form pages, I can include that for an
        extra $30 per 1,000-word page.
      </p>

      <section style={{ marginTop: '2.5rem', textAlign: 'center', padding: '1.5rem', background: '#0066cc', color: 'white', borderRadius: '12px' }}>
        <h2 style={{ color: 'white', marginTop: 0 }}>Ready to start?</h2>
        <p style={{ fontSize: '1.05rem', maxWidth: 600, margin: '0 auto 1rem' }}>
          Send me a one-paragraph brief via the contact page. I reply within 24 hours.
        </p>
        <a
          href="/contact"
          style={{ display: 'inline-block', padding: '0.85rem 1.6rem', background: 'white', color: '#0066cc', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}
        >
          Get in touch →
        </a>
      </section>
    </article>
  );
}
