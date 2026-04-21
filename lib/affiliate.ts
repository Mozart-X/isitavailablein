// Affiliate link helpers. Fall back to the canonical site if env not set.
export function vpnLink(provider: 'nord' | 'surfshark' = 'nord'): { href: string; label: string } {
  if (provider === 'surfshark') {
    return { href: process.env.NEXT_PUBLIC_SURFSHARK_AFF || 'https://surfshark.com', label: 'Get Surfshark' };
  }
  return { href: process.env.NEXT_PUBLIC_NORDVPN_AFF || 'https://nordvpn.com', label: 'Get NordVPN' };
}
