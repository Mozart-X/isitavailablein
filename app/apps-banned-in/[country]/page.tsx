// /apps-banned-in-[country] — viral-shape listicle page.
// "Apps banned in China" gets 22k searches/mo. Templated per country from our
// existing availability data → dozens of listicle pages overnight, zero new
// scraping needed. Shareable, links well, anchors the MoneyStack affiliate
// CTAs at the highest-intent moment on the entire site.

import { notFound } from 'next/navigation';
import { getAllCountries, getCountry, getAvailabilityForCountry } from '@/lib/db';
import { buildAvailabilitySlug } from '@/lib/url';
import MoneyStack from '@/components/MoneyStack';
import VpnCta from '@/components/VpnCta';
import type { Metadata } from 'next';

export const revalidate = 3600;

export async function generateStaticParams() {
  const countries = await getAllCountries();
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: { country: string } }): Promise<Metadata> {
  const c = await getCountry(params.country);
  if (!c) return { title: 'Not found' };
  const title = `Apps banned in ${c.name} (${new Date().getFullYear()} updated list)`;
  const description = `Complete list of apps and services blocked in ${c.name}. Includes social media, streaming, AI, banking. How to access them with a VPN.`;
  const ogUrl = `/og?t=${encodeURIComponent(`Apps banned in ${c.flag} ${c.name}`)}&s=${encodeURIComponent('Complete list + how to access')}&v=blocked`;
  return {
    title,
    description,
    alternates: { canonical: `/apps-banned-in/${params.country}` },
    openGraph: { title, description, images: [ogUrl] },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  };
}

export default async function Page({ params }: { params: { country: string } }) {
  const c = await getCountry(params.country);
  if (!c) notFound();
  const rows = await getAvailabilityForCountry(c.iso2);

  const blocked = rows.filter((r) => r.status === 'no');
  const partial = rows.filter((r) => r.status === 'partial' || r.status === 'vpn_only');
  const total = rows.length;
  const pctBlocked = total > 0 ? Math.round((blocked.length / total) * 100) : 0;

  // Group blocked by category for readable listicle structure
  const byCat: Record<string, typeof blocked> = {};
  for (const r of blocked) {
    const cat = r.category || 'Other';
    (byCat[cat] = byCat[cat] || []).push(r);
  }
  const sortedCats = Object.keys(byCat).sort((a, b) => byCat[b].length - byCat[a].length);

  const year = new Date().getFullYear();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many apps are banned in ${c.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${blocked.length} of the ${total} major online services we track are completely blocked in ${c.name}, plus another ${partial.length} are partially restricted.`
        }
      },
      {
        '@type': 'Question',
        name: `How do I use blocked apps in ${c.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `A VPN is the most common way. It gives you an IP address from a country where the app works. NordVPN and Surfshark are the most reliable options for ${c.name}. For payment-restricted services, a virtual card from Wise or Revolut also helps.`
        }
      }
    ]
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>{c.flag} {blocked.length} apps banned in {c.name} ({year})</h1>
      <p style={{ fontSize: '1.05rem', color: '#444' }}>
        We track {total} major online services across {c.name}. <strong>{blocked.length}</strong> of
        them are completely blocked, and another <strong>{partial.length}</strong> are partially
        restricted or work only with a VPN. Here's the full list, grouped by category — plus how
        to actually access them.
      </p>

      <div className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-num">{blocked.length}</span>
          <span className="stats-bar-label">apps completely blocked</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{partial.length}</span>
          <span className="stats-bar-label">partially restricted</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">{pctBlocked}%</span>
          <span className="stats-bar-label">of major services affected</span>
        </div>
        <div className="stats-bar-item">
          <span className="stats-bar-num">~60 sec</span>
          <span className="stats-bar-label">to unblock with a VPN</span>
        </div>
      </div>

      <VpnCta variant="banner" countryName={c.name} />

      {sortedCats.map((cat) => (
        <section key={cat}>
          <h2>{cat} ({byCat[cat].length})</h2>
          <div className="grid">
            {byCat[cat].map((r) => (
              <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, c.slug)}`}>
                <span>{r.service_name}</span>
                <span className="status-badge status-no">Blocked</span>
              </a>
            ))}
          </div>
        </section>
      ))}

      {partial.length > 0 && (
        <section>
          <h2>Partially restricted ({partial.length})</h2>
          <p style={{ color: '#666' }}>
            These services technically work in {c.name} but with limited features, payment
            restrictions, or rely on workarounds.
          </p>
          <div className="grid">
            {partial.map((r) => (
              <a key={r.service_slug} href={`/${buildAvailabilitySlug(r.service_slug, c.slug)}`}>
                <span>{r.service_name}</span>
                <span className={`status-badge status-${r.status}`}>{r.status === 'vpn_only' ? 'VPN only' : 'Partial'}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <MoneyStack countryName={c.name} />

      <section>
        <h2>FAQ</h2>
        <h3>Is it legal to use a VPN in {c.name}?</h3>
        <p>
          VPN use is legal in most countries. A handful of governments restrict or technically ban
          VPNs (notably China, Russia, Iran, North Korea, UAE) — but enforcement against individual
          users is rare. Check current local rules before relying on one.
        </p>
        <h3>Can I just download these apps anyway?</h3>
        <p>
          Often the app installs fine — what's blocked is the server connection. So you'll see
          login errors, region warnings, or the app simply hangs. That's why an IP from a supported
          country (via VPN) is the standard fix.
        </p>
        <h3>What about payments?</h3>
        <p>
          Many services accept your VPN-faked location but reject your card because the BIN
          (first 6 digits) reveals it's from a restricted country. A virtual card from a
          multi-currency provider gets around this.
        </p>
      </section>

      <section>
        <h2>Related</h2>
        <div className="grid">
          <a href={`/country/${c.slug}`}>All services in {c.name}</a>
          <a href="/changes">Recent availability changes</a>
          <a href="/services">All tracked services</a>
        </div>
      </section>
    </article>
  );
}
