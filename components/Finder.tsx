'use client';

// Minimal finder. The site is called "Is It Available In?" — so the hero
// should ask that one question. One form, two selects, one submit. Anyone
// who wants to browse rather than ask can use the small links below.

import { useMemo, useState } from 'react';
import { buildAvailabilitySlug } from '@/lib/url';

type Lite = { slug: string; name: string; category?: string; iso2?: string; flag?: string };

export default function Finder({ services, countries }: { services: Lite[]; countries: Lite[] }) {
  const [service, setService] = useState('');
  const [country, setCountry] = useState('');

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services]
  );
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (service && country) {
      window.location.href = `/${buildAvailabilitySlug(service, country)}`;
    } else if (service) {
      window.location.href = `/service/${service}`;
    } else if (country) {
      window.location.href = `/country/${country}`;
    }
  }

  return (
    <div className="finder">
      <form className="finder-inline" onSubmit={submit}>
        <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Service">
          <option value="">Service…</option>
          {sortedServices.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
          <option value="">Country…</option>
          {sortedCountries.map((c) => (
            <option key={c.slug} value={c.slug}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>
          ))}
        </select>
        <button type="submit" disabled={!service && !country}>Check</button>
      </form>
      <div className="finder-quick-links">
        Or browse <a href="/services">all services</a> · <a href="/countries">all countries</a>
      </div>
    </div>
  );
}
