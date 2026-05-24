// /alerts — email subscription. Two streams:
//   1. Weekly digest: every Sunday, summary of which services/countries changed
//   2. Targeted alerts: "notify me when ChatGPT launches in Nepal" etc.
//
// Why this matters: owned audience compounds. Newsletter at ~500 subs starts
// attracting sponsorship. At ~5000 it becomes a meaningful revenue line on
// top of affiliate. Plus retention — alert recipients return to the site.

import { getAllServices, getAllCountries } from '@/lib/db';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Alerts — get notified when service availability changes',
  description: 'Free email alerts when a service launches in your country, exits a market, or changes price. Or get a weekly digest of every change worldwide.',
  alternates: { canonical: '/alerts' },
};

export default async function AlertsPage() {
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);
  const sortedServices = [...services].sort((a, b) => a.name.localeCompare(b.name));
  const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <article>
      <h1>📬 Get alerts when things change</h1>
      <p style={{ fontSize: '1.05rem' }}>
        Two ways to stay current without checking the site every day. Both free, both no spam.
      </p>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', marginTop: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>🎯 Targeted alert</h2>
        <p>
          Get an email <em>only</em> when a specific service-in-country status changes.
          E.g. &ldquo;ChatGPT in Nepal: blocked → available&rdquo;. Zero noise otherwise.
        </p>
        <form action="/api/alerts" method="POST" style={{ display: 'grid', gap: '0.6rem', maxWidth: 540 }}>
          <input type="hidden" name="kind" value="targeted" />
          <input type="hidden" name="_t" value={Date.now()} />
          <div className="hp-field" aria-hidden="true">
            <label>Website <input type="text" name="url" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <label style={{ fontSize: '0.85rem', color: '#555' }}>Service to watch
            <select name="service" required style={{ display: 'block', width: '100%', padding: '0.6rem', marginTop: '0.25rem', borderRadius: 8, border: '1px solid #ccc' }}>
              <option value="">Choose a service…</option>
              {sortedServices.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '0.85rem', color: '#555' }}>Country to watch
            <select name="country" required style={{ display: 'block', width: '100%', padding: '0.6rem', marginTop: '0.25rem', borderRadius: 8, border: '1px solid #ccc' }}>
              <option value="">Choose a country…</option>
              {sortedCountries.map((c) => <option key={c.slug} value={c.iso2}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '0.85rem', color: '#555' }}>Your email
            <input type="email" name="email" required placeholder="you@example.com" style={{ display: 'block', width: '100%', padding: '0.6rem', marginTop: '0.25rem', borderRadius: 8, border: '1px solid #ccc' }} />
          </label>
          <button type="submit" style={{ padding: '0.75rem 1.2rem', background: '#0066cc', color: 'white', border: 0, borderRadius: 8, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
            Email me when status changes →
          </button>
        </form>
      </section>

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.5rem', marginTop: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>📨 Weekly digest</h2>
        <p>
          Every Sunday: one short email summarising every service / country status change of
          the past week. Skim in 30 seconds.
        </p>
        <form action="/api/alerts" method="POST" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: 540 }}>
          <input type="hidden" name="kind" value="digest" />
          <input type="hidden" name="_t" value={Date.now()} />
          <div className="hp-field" aria-hidden="true">
            <label>Website <input type="text" name="url" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <input type="email" name="email" required placeholder="you@example.com" style={{ flex: '1 1 200px', padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc' }} />
          <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#00a37a', color: 'white', border: 0, borderRadius: 8, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
            Subscribe (free) →
          </button>
        </form>
      </section>

      <h2>FAQ</h2>
      <h3>How often will you email me?</h3>
      <p>
        Targeted alerts only when the exact status changes — could be never. Weekly digest is once
        per week, period. No promo emails, no upsells. Unsubscribe link in every email.
      </p>
      <h3>What do you do with my email?</h3>
      <p>
        Stored only to send the alert you asked for. Never sold, never shared, never used for
        anything else. See <a href="/privacy">privacy</a>.
      </p>
      <h3>Is this really free?</h3>
      <p>
        Yes. We make money from VPN affiliate links when a blocked service is detected — never
        from your email.
      </p>
    </article>
  );
}
