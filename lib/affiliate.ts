// Affiliate link helpers.
//
// ─────────────────────────────────────────────────────────────────────────
// WHY VPN LINKS WEREN'T FORWARDING TO YOUR AFFILIATE (read this):
// Links used to come ONLY from NEXT_PUBLIC_*_AFF env vars. That silently
// failed two ways and sent every click to the bare site (= $0 commission):
//   1. NEXT_PUBLIC_* vars are inlined at BUILD time. Setting one in Cloudflare
//      after the build already ran — or in the wrong (Preview vs Production)
//      scope — does nothing. The bundle keeps the bare-domain fallback.
//   2. An unset var falls back to the canonical domain with no visible error,
//      so it looks like it "works" while earning nothing.
//
// FIX: paste your real tracking URL for each program into AFFILIATE_URLS
// below, commit, deploy. That's it. These are committed on purpose — an
// affiliate tracking URL is NOT a secret (it's visible in every outbound
// link anyway), and hardcoding it here removes both traps above.
//
// Precedence per program:  AFFILIATE_URLS entry  →  env var  →  bare site.
// Leave an entry blank to keep the old env-var behaviour for that one.
// ─────────────────────────────────────────────────────────────────────────

const AFFILIATE_URLS: Record<string, string> = {
  // ↓↓↓ PASTE YOUR REAL AFFILIATE URLS HERE ↓↓↓  (blank = not earning)
  nord:      '', // NordVPN    e.g. https://go.nordvpn.net/aff_c?offer_id=15&aff_id=YOURID&url_id=902
  surfshark: '', // Surfshark  e.g. https://get.surfshark.net/aff_c?offer_id=926&aff_id=YOURID
  express:   '', // ExpressVPN e.g. https://www.expressvpn.com/order?a_fid=YOURID
  wise:      '', // Wise       e.g. https://wise.com/invite/dic/YOURID
  revolut:   '', // Revolut
  airalo:    '', // Airalo     e.g. https://airalo.tpx.lt/YOURID  (or your Impact/Partnerize link)
  saily:     '', // Saily
  binance:   '', // Binance    e.g. https://accounts.binance.com/register?ref=YOURID
  bybit:     '', // Bybit      e.g. https://www.bybit.com/invite?ref=YOURID
  // ↑↑↑ paste whichever programs you're approved for; leave the rest blank ↑↑↑
};

type Aff = { href: string; label: string; sub?: string };

// AFFILIATE_URLS entry wins; then env var; then the bare (non-earning) site.
function resolve(key: string, envUrl: string | undefined, fallback: string): string {
  return AFFILIATE_URLS[key]?.trim() || envUrl?.trim() || fallback;
}

/** True if a real tracking URL is configured for this program (i.e. it will earn). */
export function isAffiliateLive(key: keyof typeof AFFILIATE_URLS, envUrl?: string): boolean {
  return Boolean(AFFILIATE_URLS[key]?.trim() || envUrl?.trim());
}

export function vpnLink(provider: 'nord' | 'surfshark' | 'express' = 'nord'): Aff {
  if (provider === 'surfshark') {
    return {
      href: resolve('surfshark', process.env.NEXT_PUBLIC_SURFSHARK_AFF, 'https://surfshark.com'),
      label: 'Get Surfshark',
      sub: '$2.19/mo · unlimited devices · 30-day refund',
    };
  }
  if (provider === 'express') {
    return {
      href: resolve('express', process.env.NEXT_PUBLIC_EXPRESSVPN_AFF, 'https://www.expressvpn.com'),
      label: 'Get ExpressVPN',
      sub: '$6.67/mo · fastest servers · 30-day refund',
    };
  }
  return {
    href: resolve('nord', process.env.NEXT_PUBLIC_NORDVPN_AFF, 'https://nordvpn.com'),
    label: 'Get NordVPN',
    sub: '$3.39/mo · 6,400+ servers in 111 countries · 30-day refund',
  };
}

// Virtual card / multi-currency card. Solves "my country's card is rejected at checkout"
// — a huge unmet need when signing up for ChatGPT Plus, Netflix, Spotify etc from
// restricted regions.
export function virtualCardLink(provider: 'wise' | 'revolut' = 'wise'): Aff {
  if (provider === 'revolut') {
    return {
      href: resolve('revolut', process.env.NEXT_PUBLIC_REVOLUT_AFF, 'https://www.revolut.com'),
      label: 'Get a Revolut card',
      sub: 'Free virtual cards · works at international checkouts',
    };
  }
  return {
    href: resolve('wise', process.env.NEXT_PUBLIC_WISE_AFF, 'https://wise.com'),
    label: 'Get a Wise card',
    sub: 'Multi-currency virtual card · accepted globally',
  };
}

// Travel eSIM. Targets the digital-nomad / "I'm visiting X next month" audience.
// Bounty per signup is decent ($1-5) and the audience is highly relevant to
// "is X available in Y" search intent.
export function esimLink(provider: 'airalo' | 'saily' = 'airalo'): Aff {
  if (provider === 'saily') {
    return {
      href: resolve('saily', process.env.NEXT_PUBLIC_SAILY_AFF, 'https://saily.com'),
      label: 'Get a Saily eSIM',
      sub: 'From $3 · activate before you fly',
    };
  }
  return {
    href: resolve('airalo', process.env.NEXT_PUBLIC_AIRALO_AFF, 'https://www.airalo.com'),
    label: 'Get an Airalo eSIM',
    sub: '200+ countries · works in 5 min',
  };
}

// Crypto exchange — alternative on-ramp for users whose local payment methods
// can't reach the service they want. High bounty ($10-100 per funded account).
export function cryptoLink(provider: 'binance' | 'bybit' = 'binance'): Aff {
  if (provider === 'bybit') {
    return {
      href: resolve('bybit', process.env.NEXT_PUBLIC_BYBIT_AFF, 'https://www.bybit.com'),
      label: 'Open a Bybit account',
      sub: 'Crypto on/off-ramp · low fees',
    };
  }
  return {
    href: resolve('binance', process.env.NEXT_PUBLIC_BINANCE_AFF, 'https://www.binance.com'),
    label: 'Open a Binance account',
    sub: 'Largest exchange · 350+ coins',
  };
}
