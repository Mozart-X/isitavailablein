// Parse the SEO slug "is-[service]-available-in-[country]" into parts.
// Accepts multi-word service/country slugs as long as the literal "-available-in-" separator exists.

export function parseAvailabilitySlug(slug: string): { service: string; country: string } | null {
  const marker = '-available-in-';
  if (!slug.startsWith('is-')) return null;
  const body = slug.slice(3);
  const i = body.indexOf(marker);
  if (i === -1) return null;
  const service = body.slice(0, i);
  const country = body.slice(i + marker.length);
  if (!service || !country) return null;
  return { service, country };
}

export function buildAvailabilitySlug(serviceSlug: string, countrySlug: string): string {
  return `is-${serviceSlug}-available-in-${countrySlug}`;
}

export function statusAnswer(status: string): { word: string; sentence: string } {
  switch (status) {
    case 'yes': return { word: 'Yes', sentence: 'Yes, it is available.' };
    case 'no':  return { word: 'No',  sentence: 'No, it is not available.' };
    case 'partial': return { word: 'Partial', sentence: 'Partially available — some features or tiers are restricted.' };
    case 'vpn_only': return { word: 'VPN only', sentence: 'Not officially available — accessible via VPN only.' };
    default: return { word: 'Unknown', sentence: 'Availability not confirmed yet.' };
  }
}
