'use client';

// Global outbound-click tracker. Fires GA4 events whenever a user clicks
// any external link (target=_blank or different host), so we can SEE
// affiliate clicks happening in real time instead of being blind.
//
// Event fired: outbound_click  { url, merchant, page_path }
// merchant is derived from hostname for grouped reporting.

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const MERCHANT_MAP: Array<[RegExp, string]> = [
  [/nordvpn\.com|go\.nordvpn\.com/i, 'nordvpn'],
  [/surfshark\.com/i, 'surfshark'],
  [/expressvpn\.com/i, 'expressvpn'],
  [/wise\.com/i, 'wise'],
  [/revolut\.com/i, 'revolut'],
  [/airalo\.com/i, 'airalo'],
  [/saily\.com/i, 'saily'],
  [/binance\.com/i, 'binance'],
  [/bybit\.com/i, 'bybit'],
  [/viglink\.com|sovrn/i, 'sovrn-redirect'],
];

function classify(href: string): string {
  for (const [re, name] of MERCHANT_MAP) if (re.test(href)) return name;
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export default function OutboundTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Walk up the DOM looking for an anchor; some clicks land on inner spans.
      let el: HTMLElement | null = e.target as HTMLElement;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (!a.href) return;
      // Skip same-origin links.
      try {
        const u = new URL(a.href, window.location.href);
        if (u.origin === window.location.origin) return;
      } catch { return; }
      const merchant = classify(a.href);
      const sponsored = a.rel?.includes('sponsored') ? 'yes' : 'no';
      // Fire GA4 event. dataLayer.push is safer than direct gtag — works
      // whether GA loaded yet or not (queues until it's ready).
      try {
        (window.dataLayer = window.dataLayer || []).push({
          event: 'outbound_click',
          outbound_url: a.href,
          outbound_merchant: merchant,
          outbound_sponsored: sponsored,
          page_path: window.location.pathname,
        });
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'outbound_click', {
            url: a.href,
            merchant,
            sponsored,
            page_path: window.location.pathname,
          });
        }
      } catch {}
    }
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true } as any);
  }, []);
  return null;
}
