// Map country names (as they appear on scraped pages) to ISO2 codes.
// Extend as scrapers discover new names.

export const NAME_TO_ISO2 = {
  'united states': 'US', 'usa': 'US', 'u.s.': 'US', 'u.s.a.': 'US', 'united states of america': 'US',
  'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB', 'britain': 'GB',
  'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ',
  'germany': 'DE', 'france': 'FR', 'italy': 'IT', 'spain': 'ES',
  'netherlands': 'NL', 'holland': 'NL',
  'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK', 'finland': 'FI',
  'ireland': 'IE', 'portugal': 'PT', 'switzerland': 'CH', 'austria': 'AT',
  'belgium': 'BE', 'poland': 'PL', 'greece': 'GR', 'czechia': 'CZ', 'czech republic': 'CZ',
  'hungary': 'HU', 'romania': 'RO', 'turkey': 'TR', 'türkiye': 'TR',
  'russia': 'RU', 'russian federation': 'RU', 'ukraine': 'UA',
  'japan': 'JP', 'south korea': 'KR', 'korea, republic of': 'KR', 'republic of korea': 'KR',
  'china': 'CN', "people's republic of china": 'CN', 'prc': 'CN',
  'hong kong': 'HK', 'taiwan': 'TW',
  'singapore': 'SG', 'malaysia': 'MY', 'thailand': 'TH', 'vietnam': 'VN', 'viet nam': 'VN',
  'philippines': 'PH', 'indonesia': 'ID',
  'india': 'IN', 'pakistan': 'PK', 'bangladesh': 'BD', 'nepal': 'NP', 'sri lanka': 'LK',
  'united arab emirates': 'AE', 'uae': 'AE', 'saudi arabia': 'SA', 'israel': 'IL',
  'egypt': 'EG', 'south africa': 'ZA', 'nigeria': 'NG', 'kenya': 'KE', 'morocco': 'MA',
  'brazil': 'BR', 'mexico': 'MX', 'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO', 'peru': 'PE',
  'iran': 'IR', 'iran, islamic republic of': 'IR',
  'cuba': 'CU',
  'north korea': 'KP', "korea, democratic people's republic of": 'KP',
  'syria': 'SY', 'syrian arab republic': 'SY'
};

export function toIso2(name) {
  if (!name) return null;
  const k = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return NAME_TO_ISO2[k] || null;
}
