'use client';

// Price-drop alert signup. Posts to /api/alerts with kind='price'.
// User picks a service (or "any") and gets a one-line email when its price
// drops in any country. This is the retention loop: prices move → email →
// they come back. Same anti-bot pattern as SuggestForm (honeypot + _t).

import { useEffect, useState } from 'react';

export default function PriceDropAlert({ services }: { services: { slug: string; name: string }[] }) {
  const [posted, setPosted] = useState(false);
  const [loadedAt] = useState(() => Date.now());

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('subscribed') === '1') {
        setPosted(true);
        url.searchParams.delete('subscribed');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  if (posted) {
    return (
      <div className="suggest-card suggest-thanks" style={{ marginTop: '1rem' }}>
        <strong>You're on the list.</strong>
        <div>We'll email you the moment a tracked price drops. One line, no spam, unsubscribe anytime.</div>
      </div>
    );
  }

  return (
    <form
      className="suggest-card"
      action="/api/alerts"
      method="POST"
      style={{ marginTop: '1rem' }}
    >
      <h3 style={{ margin: '0 0 0.4rem' }}>🔔 Get a price-drop alert</h3>
      <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.9rem' }}>
        We watch prices every hour. Pick a service and we'll email you the second it gets cheaper somewhere.
      </p>
      <input type="hidden" name="kind" value="price" />
      <input type="hidden" name="_t" value={loadedAt} />
      <div className="hp-field" aria-hidden="true">
        <label>Website (leave blank)
          <input type="text" name="url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="suggest-row">
        <label>
          <span>Service</span>
          <select name="service">
            <option value="">Any service</option>
            {services
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
          </select>
        </label>
      </div>
      <input type="email" name="email" required placeholder="you@example.com" />
      <button type="submit">Alert me on price drops →</button>
    </form>
  );
}
