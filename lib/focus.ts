// The site's focus: restricted-access markets. This is the strategic spine —
// the censored-country "is X blocked / how do I get around it" pages are the
// only ones with real demand, real intent, real money (VPN affiliate), and a
// reason to be fresh. Everything else ("is Spotify available in Germany? Yes")
// is thin filler that made the site read as a 4,670-page content farm and got
// it rejected by every ad network. We index/feature the focus, noindex the rest.

// Heavily + notably censored markets (ISO2). Ranked from data/known-restrictions.json.
export const RESTRICTED_ISO = new Set([
  // heavy censorship
  'IR', 'SY', 'CN', 'CU', 'RU', 'KP',
  // notable restrictions / high unblock demand
  'TR', 'PK', 'BD', 'VN', 'NP', 'LK', 'EG', 'ID', 'TH', 'PH', 'IN', 'UA',
  // regional restrictions
  'NG', 'KE', 'MA', 'AE', 'SA', 'HK',
]);

// Top markets to feature on the homepage + hubs (highest unblock intent).
// Slugs from data/countries.json.
export const FEATURED_COUNTRIES: { slug: string; iso2: string; name: string; flag: string }[] = [
  { slug: 'iran', iso2: 'IR', name: 'Iran', flag: '🇮🇷' },
  { slug: 'china', iso2: 'CN', name: 'China', flag: '🇨🇳' },
  { slug: 'russia', iso2: 'RU', name: 'Russia', flag: '🇷🇺' },
  { slug: 'turkey', iso2: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { slug: 'syria', iso2: 'SY', name: 'Syria', flag: '🇸🇾' },
  { slug: 'pakistan', iso2: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { slug: 'egypt', iso2: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { slug: 'uae', iso2: 'AE', name: 'UAE', flag: '🇦🇪' },
  { slug: 'indonesia', iso2: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { slug: 'bangladesh', iso2: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { slug: 'vietnam', iso2: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { slug: 'india', iso2: 'IN', name: 'India', flag: '🇮🇳' },
];

// High-intent service+country combos to feature (real restrictions, the pages
// that actually rank/convert). Keep current — these are the breadwinners.
export const FEATURED_COMBOS: Array<[string, string]> = [
  ['chatgpt', 'china'],
  ['chatgpt', 'iran'],
  ['tiktok', 'syria'],
  ['telegram', 'india'],
  ['whatsapp', 'uae'],
  ['netflix', 'turkey'],
  ['tinder', 'iran'],
  ['discord', 'china'],
];

// A page is worth indexing/featuring only when it actually says something
// useful: the service is restricted, it's a censored market, we have a price,
// or the data is genuinely verified. Plain "available, nothing to add" pages in
// unrestricted countries are thin — noindex them so Google sees a focused
// restricted-access resource, not filler.
export function isHighValue(opts: {
  status?: string | null;
  iso2?: string | null;
  source?: string | null;
  hasPricing?: boolean;
}): boolean {
  const { status, iso2, source, hasPricing } = opts;
  if (status && status !== 'yes' && status !== 'unknown') return true; // no / vpn_only / partial
  if (iso2 && RESTRICTED_ISO.has(iso2)) return true;
  if (hasPricing) return true;
  if (/^(official|community-consensus)/.test(source || '')) return true;
  return false;
}
