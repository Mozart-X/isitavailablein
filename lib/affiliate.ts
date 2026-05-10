// Affiliate link helpers. All fall back to canonical site if env not set,
// so the page never breaks — it just doesn't earn until env vars are filled in.

type Aff = { href: string; label: string; sub?: string };

export function vpnLink(provider: 'nord' | 'surfshark' | 'express' = 'nord'): Aff {
  if (provider === 'surfshark') {
    return {
      href: process.env.NEXT_PUBLIC_SURFSHARK_AFF || 'https://surfshark.com',
      label: 'Get Surfshark',
      sub: '$2.19/mo · unlimited devices · 30-day refund',
    };
  }
  if (provider === 'express') {
    return {
      href: process.env.NEXT_PUBLIC_EXPRESSVPN_AFF || 'https://www.expressvpn.com',
      label: 'Get ExpressVPN',
      sub: '$6.67/mo · fastest servers · 30-day refund',
    };
  }
  return {
    href: process.env.NEXT_PUBLIC_NORDVPN_AFF || 'https://nordvpn.com',
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
      href: process.env.NEXT_PUBLIC_REVOLUT_AFF || 'https://www.revolut.com',
      label: 'Get a Revolut card',
      sub: 'Free virtual cards · works at international checkouts',
    };
  }
  return {
    href: process.env.NEXT_PUBLIC_WISE_AFF || 'https://wise.com',
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
      href: process.env.NEXT_PUBLIC_SAILY_AFF || 'https://saily.com',
      label: 'Get a Saily eSIM',
      sub: 'From $3 · activate before you fly',
    };
  }
  return {
    href: process.env.NEXT_PUBLIC_AIRALO_AFF || 'https://www.airalo.com',
    label: 'Get an Airalo eSIM',
    sub: '200+ countries · works in 5 min',
  };
}

// Crypto exchange — alternative on-ramp for users whose local payment methods
// can't reach the service they want. High bounty ($10-100 per funded account).
export function cryptoLink(provider: 'binance' | 'bybit' = 'binance'): Aff {
  if (provider === 'bybit') {
    return {
      href: process.env.NEXT_PUBLIC_BYBIT_AFF || 'https://www.bybit.com',
      label: 'Open a Bybit account',
      sub: 'Crypto on/off-ramp · low fees',
    };
  }
  return {
    href: process.env.NEXT_PUBLIC_BINANCE_AFF || 'https://www.binance.com',
    label: 'Open a Binance account',
    sub: 'Largest exchange · 350+ coins',
  };
}
