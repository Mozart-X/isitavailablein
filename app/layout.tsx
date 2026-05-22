import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import OutboundTracker from '@/components/OutboundTracker';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://isitavailablein.com'),
  title: {
    default: 'IsItAvailableIn — Check service availability by country',
    template: '%s | IsItAvailableIn'
  },
  description: 'Find out if ChatGPT, Netflix, Revolut, Binance and 50+ services are available in your country. Updated daily.',
  openGraph: { type: 'website', siteName: 'IsItAvailableIn' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true }
};

const EZOIC_ENABLED = process.env.NEXT_PUBLIC_EZOIC_ENABLED;
const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // e.g. G-XXXXXXXXXX
const CF_BEACON = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN; // Cloudflare Web Analytics token
// Sovrn Commerce (formerly VigLink): auto-monetizes outbound links to thousands
// of merchants via one signup. The default below is the user's Sovrn ID;
// override via env var if you ever rotate.
const SOVRN_ID = process.env.NEXT_PUBLIC_SOVRN_ID || '4139c3824c3211b7c02d4b3a981dd485';
// Adsterra: display ad network with no traffic minimum. Set the JS direct-link
// or banner zone ID once approved. We render their script if set.
const ADSTERRA_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {SOVRN_ID && (
          <>
            <Script
              id="sovrn-init"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `var vglnk = {key: '${SOVRN_ID}'};`
              }}
            />
            <Script
              async
              strategy="afterInteractive"
              src="https://cdn.viglink.com/api/vglnk.js"
            />
          </>
        )}
        {ADSTERRA_KEY && (
          <Script
            async
            strategy="afterInteractive"
            data-cfasync="false"
            src={`//pl${ADSTERRA_KEY}.profitableratecpm.com/${ADSTERRA_KEY}/invoke.js`}
          />
        )}
        {EZOIC_ENABLED && (
          <>
            <Script
              id="ezstandalone-init"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.ezstandalone=window.ezstandalone||{};window.ezstandalone.cmd=window.ezstandalone.cmd||[];`
              }}
            />
            <Script
              async
              strategy="afterInteractive"
              src="//www.ezojs.com/ezoic/sa.min.js"
            />
          </>
        )}
        {PLAUSIBLE && (
          <Script
            defer
            data-domain={PLAUSIBLE}
            src="https://plausible.io/js/script.js"
          />
        )}
        {CF_BEACON && (
          <Script
            defer
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${CF_BEACON}"}`}
          />
        )}
        {GA_ID && (
          <>
            <Script
              async
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`
              }}
            />
          </>
        )}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="alternate" type="application/rss+xml" title="Recent availability changes" href="/changes/rss.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://isitavailablein.com/#website',
                  url: 'https://isitavailablein.com/',
                  name: 'IsItAvailableIn',
                  description: 'Check if online services are available in your country, with local pricing and workarounds.',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://isitavailablein.com/search?q={search_term_string}',
                    'query-input': 'required name=search_term_string'
                  }
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://isitavailablein.com/#org',
                  name: 'IsItAvailableIn',
                  url: 'https://isitavailablein.com/',
                  logo: 'https://isitavailablein.com/favicon.svg'
                }
              ]
            })
          }}
        />
      </head>
      <body>
        <header className="site-header">
          <a href="/" className="logo">IsItAvailableIn<span>.com</span></a>
          <nav>
            <a href="/best-vpn">Best VPN</a>
            <a href="/deals">Deals</a>
            <a href="/api-docs">API</a>
          </nav>
        </header>
        <main>{children}</main>
        <OutboundTracker />
        <footer className="site-footer">
          <p>Data updated daily from official sources. Not legal advice. <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
          <p className="site-credit">Designed by Abhii 👾</p>
        </footer>
      </body>
    </html>
  );
}
