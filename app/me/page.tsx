// /me — personalized dashboard. Auto-detects visitor's country via
// Cloudflare CF-IPCountry header, then renders 'what works / what's
// blocked from where YOU are right now'.
//
// Why this is the viral feature:
// - Screenshot-worthy ("47% of major apps are blocked from where I am")
// - Personalized = sticky (people return to check)
// - Share-driven (people share THEIR result, not a generic page)
// - Massive top-of-page affiliate hook for blocked-country visitors

import { headers } from 'next/headers';
import { getAllCountries, getCountry, getAvailabilityForCountry } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import MoneyStack from '@/components/MoneyStack';
import VpnCta from '@/components/VpnCta';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic'; // need fresh CF header per request
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'What\'s blocked where you are — instant check',
  description: 'Auto-detects your country and shows every major online service blocked or restricted for you right now. No signup.',
  alternates: { canonical: '/me' },
};

export default async function MePage() {
  const h = headers();
  const cfIso = (h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || '').toUpperCase();

  // Fallback: if we can't detect, show a country picker.
  if (!cfIso || cfIso === 'XX' || cfIso === 'T1') {
    const countries = await getAllCountries();
    return (
      <article>
        <h1>What's blocked where you are?</h1>
        <p>
          We couldn't auto-detect your country (you might be on a VPN, a proxy, or a privacy
          browser that strips geolocation). Pick yours below:
        </p>
        <div className="grid">
          {countries.map((c) => (
            <a key={c.slug} href={`/country/${c.slug}`}>
              <span>{c.flag} {c.name}</span>
              <span>→</span>
            </a>
          ))}
        </div>
      </article>
    );
  }

  const country = await getCountry(cfIso.toLowerCase()) ||
    // Try matching by ISO2 in DB if slug lookup fails
    (await getAllCountries()).find((c) => c.iso2 === cfIso);

  if (!country) {
    return (
      <article>
        <h1>What's blocked where you are?</h1>
        <p>We detected you're in <strong>{cfIso}</strong> but we don't have data for that country yet.</p>
        <p><a href="/countries">Browse the countries we track →</a></p>
      </article>
    );
  }

  const rows = await getAvailabilityForCountry(country.iso2);
  const blocked = rows.filter((r) => r.status === 'no');
  const restricted = rows.filter((r) => r.status === 'partial' || r.status === 'vpn_only');
  const working = rows.filter((r) => r.status === 'yes');
  const pctBlocked = rows.length > 0 ? Math.round((blocked.length / rows.length) * 100) : 0;
  const year = new Date().getFullYear();

  // Group blocked by category for skim-friendly listicle structure
  const byCat: Record<string, typeof blocked> = {};
  for (const r of blocked) {
    const cat = r.category || 'Other';
    (byCat[cat] = byCat[cat] || []).push(r);
  }
  const sortedCats = Object.keys(byCat).sort((a, b) => byCat[b].length - byCat[a].length);

  return (
    <article>
      <h1>👋 You're in {country.flag} {country.name}</h1>
      <p style={{ fontSize: '1.1rem', color: '#333' }}>
        Here's what we see for your IP right now. {blocked.length > 0
          ? <>You have <strong>{blocked.length} major services blocked</strong>{restricted.length > 0 && <> + {restricted.length} restricted</>}.</>
          : <>You have <strong>full access</strong> to the {rows.length} major services we track. Lucky.</>}
      </p>

      <div className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-num">{blocked.length}</span>
          <span className="stats-bar-label">apps blocked for you</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{restricted.length}</span>
          <span className="stats-bar-label">partially restricted</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{working.length}</span>
          <span className="stats-bar-label">work normally</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{pctBlocked}%</span>
          <span className="stats-bar-label">of major services blocked</span>
        </div>
      </div>

      {blocked.length > 0 && (
        <>
          <VpnCta variant="banner" countryName={country.name} />

          {sortedCats.map((cat) => (
            <section key={cat}>
              <h2>{cat} — blocked ({byCat[cat].length})</h2>
              <div className="grid">
                {byCat[cat].map((r) => (
                  <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, country.slug)}`}>
                    <span>{r.service_name}</span>
                    <span className="status-badge status-no">Blocked for you</span>
                  </a>
                ))}
              </div>
            </section>
          ))}

          {restricted.length > 0 && (
            <section>
              <h2>Partially restricted</h2>
              <div className="grid">
                {restricted.map((r) => (
                  <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, country.slug)}`}>
                    <span>{r.service_name}</span>
                    <span className={`status-badge status-${r.status}`}>{r.status === 'vpn_only' ? 'VPN only' : 'Partial'}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <MoneyStack countryName={country.name} heading={`Unblock everything from ${country.name}`} />
        </>
      )}

      <section>
        <h2>Share this</h2>
        <p>
          Hit your friends with how much is blocked where you are. The page auto-personalizes
          for whoever opens it — they'll see THEIR own country's data.
        </p>
        <div className="grid">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${pctBlocked}% of major apps are blocked for me in ${country.name}. What about you?`)}&url=${encodeURIComponent('https://isitavailablein.com/me')}`}
            target="_blank"
            rel="noopener"
          >Tweet this →</a>
          <a href={`/apps-banned-in/${country.slug}`}>Full list of apps banned in {country.name}</a>
          <a href={`/best-vpn-for/${country.slug}`}>Best VPN for {country.name}</a>
        </div>
      </section>

      <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '2rem' }}>
        Auto-detected from your IP via Cloudflare. We don't store your IP — only a one-way salted hash for spam protection. <a href="/privacy">Privacy details →</a>
      </p>
    </article>
  );
}
