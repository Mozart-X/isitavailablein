'use client';

// Two-bar finder: separate "browse by country" and "browse by service" flows.
// Combining them in one form was confusing — most users want one OR the other,
// not both at once. Submitting either navigates to the relevant browse page.
// For users who want a specific service-in-country check, a compact toggle
// below opens the combined form.

import { useMemo, useState } from 'react';
import { buildAvailabilitySlug } from '@/lib/url';

type Lite = { slug: string; name: string; category?: string; iso2?: string; flag?: string };

export default function Finder({ services, countries }: { services: Lite[]; countries: Lite[] }) {
  const [country, setCountry] = useState('');
  const [service, setService] = useState('');
  const [showCombo, setShowCombo] = useState(false);
  const [comboService, setComboService] = useState('');
  const [comboCountry, setComboCountry] = useState('');

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services]
  );
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries]
  );

  function goCountry(e: React.FormEvent) {
    e.preventDefault();
    if (country) window.location.href = `/country/${country}`;
  }
  function goService(e: React.FormEvent) {
    e.preventDefault();
    if (service) window.location.href = `/service/${service}`;
  }
  function goCombo(e: React.FormEvent) {
    e.preventDefault();
    if (comboService && comboCountry) {
      window.location.href = `/${buildAvailabilitySlug(comboService, comboCountry)}`;
    } else if (comboService) {
      window.location.href = `/service/${comboService}`;
    } else if (comboCountry) {
      window.location.href = `/country/${comboCountry}`;
    }
  }

  return (
    <div className="finder">
      <div className="finder-cards">
        <form className="finder-card" onSubmit={goCountry}>
          <div className="finder-card-label">🌍 Browse by country</div>
          <div className="finder-card-sub">See everything available (and blocked) in one country</div>
          <div className="finder-card-row">
            <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
              <option value="">Choose a country…</option>
              {sortedCountries.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.flag ? `${c.flag} ` : ''}{c.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!country}>Go</button>
          </div>
        </form>

        <form className="finder-card" onSubmit={goService}>
          <div className="finder-card-label">📱 Browse by service</div>
          <div className="finder-card-sub">See every country where one service works (or doesn't)</div>
          <div className="finder-card-row">
            <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Service">
              <option value="">Choose a service…</option>
              {sortedServices.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
            <button type="submit" disabled={!service}>Go</button>
          </div>
        </form>
      </div>

      <div className="finder-quick-links">
        <a href="/services">All services →</a>
        <span className="finder-quick-sep">·</span>
        <a href="/countries">All countries →</a>
      </div>

      <div className="finder-combo">
        <button
          type="button"
          className="finder-combo-toggle"
          onClick={() => setShowCombo((v) => !v)}
          aria-expanded={showCombo}
        >
          {showCombo ? '− ' : '+ '}
          Check a specific service-in-country combo
        </button>
        {showCombo && (
          <form onSubmit={goCombo} className="finder-combo-row">
            <select value={comboService} onChange={(e) => setComboService(e.target.value)} aria-label="Service">
              <option value="">Service…</option>
              {sortedServices.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
            <span className="finder-combo-in">in</span>
            <select value={comboCountry} onChange={(e) => setComboCountry(e.target.value)} aria-label="Country">
              <option value="">Country…</option>
              {sortedCountries.map((c) => (
                <option key={c.slug} value={c.slug}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>
              ))}
            </select>
            <button type="submit" disabled={!comboService && !comboCountry}>Check</button>
          </form>
        )}
      </div>
    </div>
  );
}
