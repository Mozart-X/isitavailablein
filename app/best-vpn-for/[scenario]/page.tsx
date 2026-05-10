// /best-vpn-for/[scenario] — dynamic per-service or per-country VPN comparison.
// scenario = service slug ("chatgpt") OR country slug ("china").
// Generates ~130 pages from existing data, all targeting high-volume affiliate
// keywords like "best vpn for china", "best vpn for netflix".

import { notFound } from 'next/navigation';
import { getAllServices, getAllCountries, getService, getCountry } from '@/lib/db';
import VpnComparison from '@/components/VpnComparison';
import MoneyStack from '@/components/MoneyStack';
import type { Metadata } from 'next';

export const revalidate = 86400;

export async function generateStaticParams() {
  const [services, countries] = await Promise.all([getAllServices(), getAllCountries()]);
  const params: { scenario: string }[] = [];
  for (const s of services) params.push({ scenario: s.slug });
  for (const c of countries) params.push({ scenario: c.slug });
  return params;
}

async function resolve(scenario: string) {
  const [service, country] = await Promise.all([getService(scenario), getCountry(scenario)]);
  if (service) return { kind: 'service' as const, service, name: service.name };
  if (country) return { kind: 'country' as const, country, name: country.name };
  return null;
}

export async function generateMetadata({ params }: { params: { scenario: string } }): Promise<Metadata> {
  const r = await resolve(params.scenario);
  if (!r) return { title: 'Not found' };
  return {
    title: `Best VPN for ${r.name} (${new Date().getFullYear()})`,
    description: `Which VPN actually works for ${r.name}? We compare NordVPN, Surfshark and ExpressVPN on price, servers, and reliability.`,
    alternates: { canonical: `/best-vpn-for/${params.scenario}` }
  };
}

export default async function Page({ params }: { params: { scenario: string } }) {
  const r = await resolve(params.scenario);
  if (!r) notFound();
  const year = new Date().getFullYear();

  const intro = r.kind === 'service'
    ? `Looking to unblock ${r.name}? Whether ${r.name} is geo-restricted where you live, or you want access to a different region's catalog, a VPN is the standard fix. Here are the three that actually work for ${r.name} in ${year}, ranked by our testing.`
    : `Need a VPN that works in ${r.name}? Whether you're a resident dealing with blocked apps or a traveler heading there, these are the three VPNs that reliably work in ${r.name} this year. Ranked by server availability, speed, and unblocking power.`;

  return (
    <article>
      <h1>Best VPN for {r.name} ({year})</h1>
      <p style={{ fontSize: '1.05rem' }}>{intro}</p>

      <VpnComparison />

      <h2>Why {r.kind === 'service' ? `for ${r.name}` : `in ${r.name}`}?</h2>
      {r.kind === 'service' ? (
        <p>
          {r.name} uses IP-based and sometimes payment-based geo-detection. A VPN solves the IP
          side: pick a server in a country where {r.name} is fully available, connect, then sign
          up or log in normally. For payment-restricted services, you'll also need a card whose
          BIN matches a supported country — see the full stack below.
        </p>
      ) : (
        <p>
          {r.name} restricts a number of major apps and services. A VPN reroutes your traffic
          through a server abroad, so blocked apps see a foreign IP and respond as normal.
          Pick a VPN with strong obfuscation if {r.name} actively blocks VPN protocols
          (NordVPN's "Obfuscated servers" and ExpressVPN's "Lightway" both work for this).
        </p>
      )}

      <h2>How to pick</h2>
      <ol>
        <li><strong>Server in your target country.</strong> For {r.kind === 'service' ? 'streaming/regional services' : `accessing apps blocked in ${r.name}`}, you need a server actually located in a supported region.</li>
        <li><strong>Speed.</strong> For streaming and gaming, prioritise low-ping servers. NordVPN and ExpressVPN consistently top the speed tests.</li>
        <li><strong>Money-back guarantee.</strong> All three above give you 30 days to test. Use it.</li>
        <li><strong>Obfuscation</strong> (only matters in {r.kind === 'country' && ['CN', 'IR', 'RU', 'AE'].includes((r as any).country?.iso2) ? `${r.name} and similar` : 'restrictive countries like China, Iran, UAE'}). Hides the fact you're using a VPN from deep-packet inspection.</li>
      </ol>

      <MoneyStack
        serviceName={r.kind === 'service' ? r.name : undefined}
        countryName={r.kind === 'country' ? r.name : undefined}
        heading={`The full ${r.name} access stack`}
      />

      <h2>Related</h2>
      <div className="grid">
        <a href="/best-vpn">All VPNs compared →</a>
        {r.kind === 'service' && <a href={`/service/${(r as any).service.slug}`}>Where is {r.name} available?</a>}
        {r.kind === 'country' && <a href={`/country/${(r as any).country.slug}`}>What's available in {r.name}?</a>}
        {r.kind === 'country' && <a href={`/apps-banned-in/${(r as any).country.slug}`}>Apps banned in {r.name}</a>}
      </div>
    </article>
  );
}
