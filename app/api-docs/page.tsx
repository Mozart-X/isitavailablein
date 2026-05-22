// /api-docs — developer-facing page for the public availability API.
// Sells the future paid B2B tier ($200-2000/mo) and ranks for
// "country availability API", "service blocked-country API" type queries.

import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Availability API — service-by-country JSON/CSV',
  description: 'Free REST API for service availability data across 70+ services and 61 countries. JSON or CSV. Updated continuously. Paid tier available for compliance/SaaS teams.',
  alternates: { canonical: '/api-docs' },
};

export default function ApiDocsPage() {
  return (
    <article>
      <h1>Availability API</h1>
      <p style={{ fontSize: '1.1rem' }}>
        Free REST API for our service-by-country availability database.
        Updated automatically. Use it to power compliance checks, regional
        feature flags, or any app that needs to know "is X available in Y."
      </p>

      <h2>Data quality, honestly</h2>
      <p style={{ background: '#fffbea', borderLeft: '3px solid #ffc107', padding: '0.7rem 1rem', borderRadius: '0 6px 6px 0' }}>
        Every row in our response includes a <code>source_type</code> field
        so you know exactly where the data came from:
      </p>
      <ul>
        <li><strong><code>official_scraped</code></strong> — parsed from the provider&rsquo;s own published country list (ChatGPT, Claude, Netflix, Gemini, Spotify, Stripe, Coinbase, Uber). Re-verified every 2 hours.</li>
        <li><strong><code>curated</code></strong> — for providers with no clean public country list (Binance restricted-persons rules, regional dating-app bans). Hand-maintained, last-verified date in <code>last_verified</code>.</li>
        <li><strong><code>baseline-seed</code></strong> — initial seed value for a newly-added service awaiting its first scrape.</li>
      </ul>
      <p>
        If your use case requires only first-party scraped data, filter for{' '}
        <code>source_type=official_scraped</code> in your code. Paid tier customers can
        request all-scraped-only data as a feed.
      </p>

      <h2>Quickstart</h2>
      <pre style={{ background: '#1a1a1a', color: '#eee', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
{`# All availability rows (default 500 max, up to 5000)
curl https://isitavailablein.com/api/v1/availability

# Filter by service
curl 'https://isitavailablein.com/api/v1/availability?service=chatgpt'

# Filter by country (ISO2)
curl 'https://isitavailablein.com/api/v1/availability?country=NP'

# Filter by status
curl 'https://isitavailablein.com/api/v1/availability?status=no'

# Combine filters + CSV format
curl 'https://isitavailablein.com/api/v1/availability?country=CN&status=no&format=csv'`}
      </pre>

      <h2>Response schema (JSON)</h2>
      <pre style={{ background: '#1a1a1a', color: '#eee', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
{`{
  "meta": {
    "count": 1,
    "limit": 500,
    "generated_at": "2026-05-23T...",
    "docs": "https://isitavailablein.com/api-docs"
  },
  "filters": { "service": "chatgpt", "country": "CN", "status": null, "format": "json" },
  "data": [
    {
      "service_slug": "chatgpt",
      "service_name": "ChatGPT",
      "service_category": "AI",
      "country_iso2": "CN",
      "country_name": "China",
      "status": "no",            // yes | no | partial | vpn_only
      "signup_friction": null,    // easy | medium | hard | blocked | null
      "payment_ok": null,         // yes | no | workaround | null
      "phone_verify_ok": null,    // yes | no | workaround | null
      "workaround": null,         // free-text instruction
      "last_verified": "2026-04-22",
      "source": "openai-official"
    }
  ]
}`}
      </pre>

      <h2>Query parameters</h2>
      <table>
        <thead><tr><th>Param</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>service</code></td><td>string (slug)</td><td>—</td><td>e.g. <code>chatgpt</code>, <code>netflix</code>. See <a href="/services">/services</a> for full list.</td></tr>
          <tr><td><code>country</code></td><td>ISO2 string</td><td>—</td><td>e.g. <code>NP</code>, <code>US</code>, <code>CN</code></td></tr>
          <tr><td><code>status</code></td><td>enum</td><td>—</td><td><code>yes</code>, <code>no</code>, <code>partial</code>, <code>vpn_only</code></td></tr>
          <tr><td><code>format</code></td><td><code>json</code> or <code>csv</code></td><td><code>json</code></td><td>CSV uses standard comma-quoting</td></tr>
          <tr><td><code>limit</code></td><td>integer</td><td>500</td><td>Max 5000</td></tr>
        </tbody>
      </table>

      <h2>Rate limits</h2>
      <p>
        Free tier: <strong>1,000 requests per day per IP</strong>. CORS is open so
        the API is callable from browsers (used by our public embed widget too).
        Responses are CDN-cached for ~10 minutes.
      </p>

      <h2>Paid tier — coming for SaaS &amp; compliance teams</h2>
      <p>
        Need higher rate limits, an SLA, historical data, change webhooks, or a
        signed data dump for compliance audit? We're rolling out a paid tier
        for fintech / SaaS teams who need authoritative service-availability data.
      </p>
      <ul>
        <li><strong>Standard</strong> — 100k req/day, 99.9% SLA, change webhooks. From <strong>$199/mo</strong>.</li>
        <li><strong>Business</strong> — unlimited req, dedicated support, custom integrations, signed quarterly snapshots. From <strong>$799/mo</strong>.</li>
        <li><strong>Enterprise</strong> — co-branded reports, dedicated data steward, custom service additions. Contact for pricing.</li>
      </ul>
      <p>
        Interested? <a href="/contact">Get in touch</a> with your use case and we'll set up a call.
      </p>

      <h2>Code samples</h2>
      <h3>JavaScript (browser or Node)</h3>
      <pre style={{ background: '#1a1a1a', color: '#eee', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
{`const res = await fetch('https://isitavailablein.com/api/v1/availability?service=chatgpt&country=CN');
const { data } = await res.json();
console.log(data[0].status); // "no"`}
      </pre>
      <h3>Python</h3>
      <pre style={{ background: '#1a1a1a', color: '#eee', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
{`import requests
r = requests.get('https://isitavailablein.com/api/v1/availability',
                 params={'service': 'chatgpt', 'country': 'CN'})
print(r.json()['data'][0]['status'])`}
      </pre>

      <h2>Attribution</h2>
      <p>
        The free tier asks (but doesn't require) that you link back to{' '}
        <a href="https://isitavailablein.com">isitavailablein.com</a> as the data
        source. A canonical attribution line:
      </p>
      <pre style={{ background: '#f5f5f5', padding: '0.6rem 0.9rem', borderRadius: 6 }}>
{`Data: IsItAvailableIn (isitavailablein.com)`}
      </pre>

      <h2>License</h2>
      <p>
        Free tier output is provided AS-IS for non-mission-critical use. For
        compliance, contractual or financial decisions, use the paid tier with
        an SLA + signed data attestation.
      </p>
    </article>
  );
}
