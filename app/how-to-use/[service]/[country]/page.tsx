// /how-to-use/[service]/[country] — high-intent tutorial pages.
//
// Why this route exists separately from /[slug] availability pages:
// - /is-netflix-available-in-china → informational query (low intent)
// - /how-to-use-netflix-in-china  → transactional query (HIGH intent)
//
// The transactional query has 5-10× more search volume + 3-5× higher
// affiliate conversion because the searcher is asking "I want to do
// this thing, what do I buy?" Their intent matches our affiliate stack.
//
// Only generate pages for (service, country) combos where status is
// no / partial / vpn_only — those are the combos where the tutorial
// actually has value (and our affiliate stack is relevant).

import { notFound } from 'next/navigation';
import { getAllServices, getAllCountries, getService, getCountry, getAvailability } from '@/lib/db';
import MoneyStack from '@/components/MoneyStack';
import VpnComparison from '@/components/VpnComparison';
import { vpnLink, virtualCardLink, esimLink } from '@/lib/affiliate';
import type { Metadata } from 'next';

export const revalidate = 86400;

export async function generateStaticParams() {
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);
  const params: { service: string; country: string }[] = [];

  // For SEO + crawl-budget reasons, only generate pages for blocked/restricted
  // combos. Available-everywhere pairs don't need a "how to use" guide.
  for (const s of services) {
    for (const c of countries) {
      const a = await getAvailability(s.id, c.iso2);
      const status = a?.status || 'unknown';
      if (status === 'no' || status === 'partial' || status === 'vpn_only') {
        params.push({ service: s.slug, country: c.slug });
      }
    }
  }
  return params;
}

async function resolve(serviceSlug: string, countrySlug: string) {
  const [service, country] = await Promise.all([getService(serviceSlug), getCountry(countrySlug)]);
  if (!service || !country) return null;
  const avail = await getAvailability(service.id, country.iso2);
  // Only render the page for blocked/restricted statuses. For 'yes' or
  // 'unknown', 404 — those don't need a how-to.
  const status = avail?.status || 'unknown';
  if (status !== 'no' && status !== 'partial' && status !== 'vpn_only') return null;
  return { service, country, avail, status };
}

export async function generateMetadata({ params }: { params: { service: string; country: string } }): Promise<Metadata> {
  const r = await resolve(params.service, params.country);
  if (!r) return { title: 'Not found' };
  const year = new Date().getFullYear();
  const title = `How to use ${r.service.name} in ${r.country.name} (${year}) — step by step`;
  const description = `Step-by-step guide to access ${r.service.name} from ${r.country.name}. VPN, payment, and account verification. Updated ${year}.`;
  const ogUrl = `/og?t=${encodeURIComponent(`How to use ${r.service.name} in ${r.country.name}`)}&s=${encodeURIComponent('Step-by-step guide with VPN, card, eSIM')}&v=vpn`;
  return {
    title,
    description,
    alternates: { canonical: `/how-to-use/${params.service}/${params.country}` },
    openGraph: { title, description, images: [ogUrl] },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  };
}

export default async function Page({ params }: { params: { service: string; country: string } }) {
  const r = await resolve(params.service, params.country);
  if (!r) notFound();
  const { service, country, status } = r;
  const vpn = vpnLink('nord');
  const card = virtualCardLink('wise');
  const esim = esimLink('airalo');
  const year = new Date().getFullYear();

  const statusWord = status === 'no' ? 'blocked' : status === 'vpn_only' ? 'VPN-only' : 'partially restricted';

  // HowTo JSON-LD — rich-result eligible. Google often shows HowTo as a
  // big card with steps in the SERP.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${service.name} in ${country.name}`,
    description: `Step-by-step guide to access ${service.name} from ${country.name} (${year}).`,
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '3' },
    supply: [
      { '@type': 'HowToSupply', name: 'A device (phone or laptop)' },
      { '@type': 'HowToSupply', name: 'An internet connection' },
    ],
    tool: [
      { '@type': 'HowToTool', name: 'A reliable VPN' },
      { '@type': 'HowToTool', name: 'A virtual or multi-currency card (if payment is restricted)' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        name: 'Install a VPN that works in ' + country.name,
        text: `Pick a VPN with servers in countries where ${service.name} is available. NordVPN's obfuscated servers are reliable in restrictive regions.`,
      },
      {
        '@type': 'HowToStep',
        name: 'Connect to a supported region',
        text: `Connect the VPN to a country where ${service.name} works (US, UK, or the nearest supported neighbor).`,
      },
      {
        '@type': 'HowToStep',
        name: `Sign up for or open ${service.name}`,
        text: `Create the account or log in normally while the VPN is active.`,
      },
      {
        '@type': 'HowToStep',
        name: 'Pay with a global-friendly card if needed',
        text: 'Some services reject cards from restricted-region BINs. A multi-currency card (Wise or Revolut) bypasses this.',
      },
    ],
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1>How to use {service.name} in {country.flag} {country.name} ({year})</h1>
      <p style={{ fontSize: '1.05rem', color: '#444' }}>
        {service.name} is {statusWord} in {country.name}.{' '}
        Here's the exact step-by-step that works in {year} — what to install, what to pay with,
        and what order to do it in.
      </p>

      <aside className="vpn-banner">
        <div className="vpn-banner-text">
          <div className="vpn-banner-heading">Skip the reading — get the tools</div>
          <div className="vpn-banner-sub">
            The stack: NordVPN (unblock IP) + Wise card (pay at checkout) + Airalo eSIM (if you need a local number). 30-day refund on all.
          </div>
        </div>
        <a href={vpn.href} rel="nofollow sponsored noopener" target="_blank" className="vpn-banner-cta">
          Get NordVPN →
        </a>
      </aside>

      <h2>Step 1 — Install a VPN with servers in a supported region</h2>
      <p>
        {service.name} detects your country mainly from your IP address.
        Connecting through a VPN gives you an IP from somewhere {service.name} works,
        and the service responds as if you're physically there.
      </p>
      <p>
        For {country.name} specifically, you want a VPN with strong obfuscation
        (so the local network can't tell you're using one) and stable servers in
        nearby supported countries:
      </p>
      <ul>
        <li><strong>NordVPN</strong> — best overall for {country.name}. Obfuscated servers + 6,400+ locations + 30-day refund. <a href={vpn.href} rel="nofollow sponsored noopener" target="_blank">Get NordVPN →</a></li>
        <li><strong>Surfshark</strong> — cheapest. Unlimited devices.</li>
        <li><strong>ExpressVPN</strong> — fastest. Best for streaming-heavy use.</li>
      </ul>

      <h2>Step 2 — Connect to a country where {service.name} works</h2>
      <p>
        Open the VPN app, search the country list for a region where {service.name} is
        fully supported (typically the United States, United Kingdom, Germany, or the
        Netherlands). One click to connect.
      </p>
      <p>
        <strong>Tip:</strong> if {service.name} has region-specific catalogs (Netflix, Prime
        Video, Disney+), you can pick the region with the catalog you want. Pick US for the
        widest catalog.
      </p>

      <h2>Step 3 — Open or sign up for {service.name}</h2>
      <p>
        With the VPN active, open the {service.name} app or website.
        {status === 'vpn_only' && ' It should now work where it didn\'t before.'}
        {status === 'no' && ' It should now load past whatever block you were seeing.'}
        {status === 'partial' && ' Full features that were previously limited should now appear.'}
      </p>
      <p>
        If you're creating a new account, use the VPN's country as your account country
        whenever it asks for region. Some services lock your account to its first detected
        region.
      </p>

      <h2>Step 4 — Pay with a global-friendly card (if it asks)</h2>
      <p>
        Many services accept your VPN-faked IP but reject your card because the card's BIN
        (first 6 digits) reveals it's from {country.name}. If you hit this:
      </p>
      <ul>
        <li>
          <strong>Wise multi-currency card</strong> — free virtual card, accepted globally.{' '}
          <a href={card.href} rel="nofollow sponsored noopener" target="_blank">Open a Wise account →</a>
        </li>
        <li>
          <strong>Revolut</strong> — alternative; some users find their card works on
          services that reject Wise's BIN, and vice versa.
        </li>
        <li>
          <strong>Crypto top-up of a virtual card</strong> — last resort if both are rejected.
        </li>
      </ul>

      <h2>Need a real phone number from the right country?</h2>
      <p>
        Some signups require SMS verification from a specific region. An eSIM activates
        in 5 minutes and gives you a real local number without changing your physical SIM.
        Airalo has plans in 200+ countries from $3.
      </p>
      <p>
        <a href={esim.href} rel="nofollow sponsored noopener" target="_blank">Browse Airalo eSIMs →</a>
      </p>

      <MoneyStack
        serviceName={service.name}
        countryName={country.name}
        heading={`The complete ${service.name}-in-${country.name} stack`}
      />

      <h2>What if it still doesn't work?</h2>
      <ul>
        <li><strong>Clear cookies + restart the app.</strong> Old session data can reveal your real location.</li>
        <li><strong>Try a different VPN server</strong> in the same country. Some IPs are flagged.</li>
        <li><strong>Use mobile data + VPN</strong> instead of WiFi if the WiFi router has DNS-level blocks.</li>
        <li><strong>Switch to obfuscated servers</strong> (NordVPN's "obfuscated" category) if standard servers don't connect.</li>
      </ul>

      <h2>Compare VPNs for this use case</h2>
      <VpnComparison />

      <h2>FAQ</h2>
      <h3>Is using a VPN legal in {country.name}?</h3>
      <p>
        Legal in most countries. A small number (China, Russia, Iran, North Korea, UAE)
        restrict or technically ban VPNs but enforcement against individuals is rare.
        Check current local rules.
      </p>
      <h3>Will {service.name} ban my account for using a VPN?</h3>
      <p>
        Account bans for VPN use are extremely rare. Services generally just block the
        connection, not the account. Use a reputable VPN (not a free one), don't switch
        regions wildly within the same session, and you're fine.
      </p>
      <h3>How much does this actually cost?</h3>
      <p>
        NordVPN: ~$3.39/month on the long plan. Wise card: free. Airalo eSIM: from $3 if
        needed. Total stack: under $4/month for a working {service.name} setup.
      </p>

      <h2>Related</h2>
      <div className="grid">
        <a href={`/${`is-${service.slug}-available-in-${country.slug}`}`}>Is {service.name} available in {country.name}?</a>
        <a href={`/best-vpn-for/${service.slug}`}>Best VPN for {service.name}</a>
        <a href={`/best-vpn-for/${country.slug}`}>Best VPN for {country.name}</a>
        <a href={`/apps-banned-in/${country.slug}`}>All apps banned in {country.name}</a>
      </div>
    </article>
  );
}
