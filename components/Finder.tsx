'use client';

// Search-first finder. Single input, live suggestions mixing services & countries.
// Click a suggestion → go. Or pick both from the two compact selects + Check.
// If user submits with only one side filled, we still route somewhere sensible:
//   - service only → /service/[slug]
//   - country only → /country/[slug]
//   - both         → /is-[service]-available-in-[country]

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildAvailabilitySlug } from '@/lib/url';

type Lite = { slug: string; name: string; category?: string; iso2?: string; flag?: string };

type Suggestion =
  | { kind: 'service'; slug: string; label: string; sub?: string }
  | { kind: 'country'; slug: string; label: string; sub?: string };

export default function Finder({ services, countries }: { services: Lite[]; countries: Lite[] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [service, setService] = useState('');
  const [country, setCountry] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const rank = (name: string, slug: string): number => {
      const n = name.toLowerCase();
      if (n === needle || slug === needle) return 0;
      if (n.startsWith(needle) || slug.startsWith(needle)) return 1;
      if (n.includes(needle) || slug.includes(needle)) return 2;
      return 99;
    };
    const svc: Array<{ r: number; s: Suggestion }> = services
      .map((s) => ({ r: rank(s.name, s.slug), s: { kind: 'service' as const, slug: s.slug, label: s.name, sub: s.category } }))
      .filter((x) => x.r < 99);
    const ctry: Array<{ r: number; s: Suggestion }> = countries
      .map((c) => ({ r: rank(c.name, c.slug), s: { kind: 'country' as const, slug: c.slug, label: `${c.flag || ''} ${c.name}`.trim() } }))
      .filter((x) => x.r < 99);
    return [...svc, ...ctry].sort((a, b) => a.r - b.r).slice(0, 10).map((x) => x.s);
  }, [q, services, countries]);

  function go(sug: Suggestion) {
    // Clicking a suggestion always navigates to that single entity's page.
    // Users combine service+country via the selects below, not by typing.
    const href = sug.kind === 'service' ? `/service/${sug.slug}` : `/country/${sug.slug}`;
    window.location.href = href;
  }

  function submitSelects(e: React.FormEvent) {
    e.preventDefault();
    if (service && country) window.location.href = `/${buildAvailabilitySlug(service, country)}`;
    else if (service) window.location.href = `/service/${service}`;
    else if (country) window.location.href = `/country/${country}`;
  }

  const sortedServices = useMemo(() => [...services].sort((a, b) => a.name.localeCompare(b.name)), [services]);
  const sortedCountries = useMemo(() => [...countries].sort((a, b) => a.name.localeCompare(b.name)), [countries]);

  return (
    <div className="finder" ref={wrapRef}>
      <div className="finder-search">
        <input
          type="search"
          placeholder="Search a service or country (e.g. ChatGPT, Nepal)…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setFocusIdx(0); }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !suggestions.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') { e.preventDefault(); const s = suggestions[focusIdx]; if (s) go(s); }
            else if (e.key === 'Escape') setOpen(false);
          }}
          autoComplete="off"
        />
        {open && q.trim() && suggestions.length === 0 && (
          <ul className="finder-suggestions" role="listbox">
            <li style={{ color: '#888', cursor: 'default' }}>
              <span className="kind">—</span>
              <span className="label">No match. Try a different spelling or browse <a href="/services">all services</a>.</span>
            </li>
          </ul>
        )}
        {open && suggestions.length > 0 && (
          <ul className="finder-suggestions" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={`${s.kind}-${s.slug}`}
                role="option"
                aria-selected={i === focusIdx}
                className={i === focusIdx ? 'focused' : ''}
                onMouseEnter={() => setFocusIdx(i)}
                onMouseDown={(e) => { e.preventDefault(); go(s); }}
              >
                <span className="kind">{s.kind === 'service' ? 'Service' : 'Country'}</span>
                <span className="label">{s.label}</span>
                {s.sub && <span className="sub">{s.sub}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <details className="finder-advanced">
        <summary>Or pick from lists</summary>
        <form className="finder-row" onSubmit={submitSelects}>
          <label>
            <span>Service</span>
            <select value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">Any</option>
              {sortedServices.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </label>
          <label>
            <span>Country</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Any</option>
              {sortedCountries.map((c) => <option key={c.slug} value={c.slug}>{c.flag ? `${c.flag} ` : ''}{c.name}</option>)}
            </select>
          </label>
          <button type="submit" disabled={!service && !country}>Go</button>
        </form>
      </details>
    </div>
  );
}
