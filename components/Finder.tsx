'use client';

// Single, clean form: pick a service, pick a country, hit Check.
// Native <select> supports keyboard typeahead (type "ne" to jump to Netherlands),
// so we don't need a separate search bar — it was duplicating functionality.
// If only one side is filled we still route somewhere sensible.

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
    if (service && country) window.location.href = `/${buildAvailabilitySlug(service, country)}`;
    else if (service) window.location.href = `/service/${service}`;
    else if (country) window.location.href = `/country/${country}`;
  }

  const ready = !!service && !!country;
  const partial = (!!service && !country) || (!!country && !service);

  return (
    <form className="finder" onSubmit={submit}>
      <div className="finder-row">
        <label>
          <span>Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)} autoFocus>
            <option value="">Choose a service…</option>
            {sortedServices.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Choose a country…</option>
            {sortedCountries.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.flag ? `${c.flag} ` : ''}{c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!service && !country}>
          {ready ? 'Check' : 'Go'}
        </button>
      </div>
      {partial && (
        <p className="finder-hint">
          Pick both for a direct answer, or hit Go to browse {service ? 'this service' : 'this country'}.
        </p>
      )}
    </form>
  );
}
