import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

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

const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {ADSENSE && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}`}
            crossOrigin="anonymous"
          />
        )}
        {PLAUSIBLE && (
          <Script
            defer
            data-domain={PLAUSIBLE}
            src="https://plausible.io/js/script.js"
          />
        )}
        <link rel="alternate" type="application/rss+xml" title="Recent availability changes" href="/changes/rss.xml" />
      </head>
      <body>
        <header className="site-header">
          <a href="/" className="logo">IsItAvailableIn<span>.com</span></a>
          <nav>
            <a href="/changes">Recent changes</a>
            <a href="/services">All services</a>
            <a href="/countries">All countries</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>Data updated daily from official sources. Not legal advice. <a href="/about">About</a> · <a href="/contact">Contact</a></p>
        </footer>
      </body>
    </html>
  );
}
