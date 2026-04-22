'use client';

import { useMemo, useState } from 'react';
import { FX, convert, fmt, COMMON_CURRENCIES } from '@/lib/fx';

type Row = {
  country_iso2: string;
  country_name?: string;
  country_flag?: string;
  country_slug?: string;
  tier: string;
  price_local: number | null;
  currency_local: string | null;
  price_usd: number | null;
  period: string | null;
};

export default function PriceTable({
  rows,
  serviceSlug,
  showCountry = true,
  caption,
}: {
  rows: Row[];
  serviceSlug: string;
  showCountry?: boolean;
  caption?: string;
}) {
  const [display, setDisplay] = useState<string>('USD');

  // Currencies present in the data, plus common ones — dedup + sort.
  const options = useMemo(() => {
    const present = new Set<string>(COMMON_CURRENCIES);
    rows.forEach((r) => { if (r.currency_local) present.add(r.currency_local.toUpperCase()); });
    return [...present].filter((c) => FX[c]).sort();
  }, [rows]);

  // Group by tier (keeps the page readable if multiple tiers exist).
  const tiers = useMemo(() => [...new Set(rows.map((r) => r.tier))], [rows]);

  // Pre-sort each tier by converted price ascending, nulls last.
  const rowsByTier = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const t of tiers) {
      const list = rows.filter((r) => r.tier === t).slice();
      list.sort((a, b) => {
        const av = convert(a.price_local, a.currency_local, display);
        const bv = convert(b.price_local, b.currency_local, display);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return av - bv;
      });
      map.set(t, list);
    }
    return map;
  }, [rows, tiers, display]);

  return (
    <div>
      <div className="currency-switcher">
        <label>
          <span>Show in:</span>
          <select value={display} onChange={(e) => setDisplay(e.target.value)}>
            {options.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <span className="muted">Rates approximate.</span>
      </div>

      {tiers.map((t) => {
        const tierRows = rowsByTier.get(t) || [];
        return (
          <div key={t} style={{ marginTop: '1rem' }}>
            {(tiers.length > 1 || caption) && (
              <h3 style={{ textTransform: 'capitalize', margin: '0.5rem 0' }}>
                {caption || t}
              </h3>
            )}
            <table className="price-table">
              <thead>
                <tr>
                  {showCountry && <th>#</th>}
                  {showCountry && <th>Country</th>}
                  <th>Local</th>
                  <th>{display}</th>
                  <th>Period</th>
                  {showCountry && <th></th>}
                </tr>
              </thead>
              <tbody>
                {tierRows.map((r, i) => {
                  const converted = convert(r.price_local, r.currency_local, display);
                  return (
                    <tr key={`${r.country_iso2}-${r.tier}`}>
                      {showCountry && <td>{i + 1}</td>}
                      {showCountry && (
                        <td>{r.country_flag ? `${r.country_flag} ` : ''}{r.country_name || r.country_iso2}</td>
                      )}
                      <td>{r.price_local != null ? `${r.price_local} ${r.currency_local || ''}` : '—'}</td>
                      <td className="price-usd">{fmt(converted, display)}</td>
                      <td>/{r.period || 'month'}</td>
                      {showCountry && (
                        <td>{r.country_slug && <a href={`/is-${serviceSlug}-available-in-${r.country_slug}`}>details →</a>}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
