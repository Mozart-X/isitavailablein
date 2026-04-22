'use client';

// Client-side finder: two simple selects (service + country) and a big "Check" button.
// Fast UX: no server roundtrip until user commits. Hydrates with top-5 popular combos
// and an autodetected country via navigator.language as a default.

import { useMemo, useState, useEffect } from 'react';
import { buildAvailabilitySlug } from '@/lib/url';

type Lite = { slug: string; name: string; category?: string; iso2?: string; flag?: string };

export default function Finder({ services, countries }: { services: Lite[]; countries: Lite[] }) {
  const [service, setService] = useState('');
  const [country, setCountry] = useState('');

  // Auto-detect country from browser locale on first paint (nicer UX).
  useEffect(() => {
    if (country) return;
    try {
      const loc = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
      const region = loc.split('-')[1]?.toUpperCase();
      if (region) {
        const match = countries.find((c) => c.iso2 === region);
        if (match) setCountry(match.slug);
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services]
  );
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  );

  const canGo = service && country;
  const href = canGo ? `/${buildAvailabilitySlug(service, country)}` : '#';

  return (
    <form
      className="finder"
      action={href}
      onSubmit={(e) => { if (!canGo) e.preventDefault(); }}
    >
      <div className="finder-row">
        <label>
          <span>Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)} required>
            <option value="">— pick one —</option>
            {sortedServices.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} required>
            <option value="">— pick one —</option>
            {sortedCountries.map((c) => (
              <option key={c.slug} value={c.slug}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!canGo}>Check</button>
      </div>
    </form>
  );
}
