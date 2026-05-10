'use client';

// Inline suggestion / contact / request form.
// Posts to /api/suggest which redirects back with ?suggested=1.

import { useEffect, useState } from 'react';

export default function SuggestForm() {
  const [kind, setKind] = useState<'service' | 'country' | 'feedback' | 'bug' | 'other'>('service');
  const [posted, setPosted] = useState(false);
  // Form-load timestamp for time-to-fill anti-bot. Submissions <3s after load
  // are silently dropped server-side. Bots that auto-submit get filtered.
  const [loadedAt] = useState(() => Date.now());

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('suggested') === '1') {
        setPosted(true);
        url.searchParams.delete('suggested');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  if (posted) {
    return (
      <div className="suggest-card suggest-thanks">
        <strong>Thanks — got it.</strong>
        <div>Your suggestion is in. We review every one.</div>
        <button type="button" onClick={() => setPosted(false)} style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', border: '1px solid #ccc', background: 'white', borderRadius: 6, cursor: 'pointer' }}>
          Send another
        </button>
      </div>
    );
  }

  const placeholder =
    kind === 'service' ? 'Which service should we add? e.g. "Add Deezer"' :
    kind === 'country' ? 'Which country should we add? e.g. "Add Bhutan"' :
    kind === 'bug' ? 'Describe what went wrong' :
    kind === 'feedback' ? 'What would make this site more useful to you?' :
    'Say anything — comments, corrections, requests…';

  return (
    <form className="suggest-card" action="/api/suggest" method="POST">
      <h3 style={{ margin: '0 0 0.5rem' }}>Suggest or contact</h3>
      <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.9rem' }}>
        Missing a service or country? Spotted wrong info? Want to say hi? Drop a note below.
      </p>
      <div className="suggest-row">
        <label>
          <span>Type</span>
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as any)}>
            <option value="service">Request a service</option>
            <option value="country">Request a country</option>
            <option value="feedback">General feedback</option>
            <option value="bug">Report wrong info / bug</option>
            <option value="other">Other / comment</option>
          </select>
        </label>
      </div>
      <textarea name="body" required minLength={3} maxLength={2000} rows={3} placeholder={placeholder} />
      <input type="email" name="contact" placeholder="Your email (optional — only if you want a reply)" />
      {/* Honeypot — hidden from real users via CSS, bots fill every field. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Website (leave blank)
          <input type="text" name="url" tabIndex={-1} autoComplete="off" />
        </label>
        <label>
          Your website (leave blank)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="_t" value={loadedAt} />
      <button type="submit">Send</button>
    </form>
  );
}
