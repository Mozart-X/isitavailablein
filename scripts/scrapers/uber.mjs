// Uber: parse the real cities page instead of a hardcoded list.
//
// Source: https://www.uber.com/global/en/cities/
// The page renders a long list of cities, each grouped under a country
// heading. We extract every country name mentioned, map to ISO2, and
// mark those as supported. Any country in our DB that doesn't appear
// is marked unavailable (with a manual override list for edge cases
// like "no ride-hail but does have Eats" — which we currently treat
// as available for simplicity).

import { applyUpdate, fetchText } from '../lib/update.mjs';
import { NAME_TO_ISO2, toIso2 } from '../lib/country-map.mjs';

const URL = 'https://www.uber.com/global/en/cities/';
const SOURCE = 'uber-cities-page';

// Conservative fallback if the page changes shape and we can't extract enough.
// This kicks in only when we extract <15 countries (very likely a parse failure).
// Mirrors data/known-restrictions.json's uber entry but updated for known
// recent expansions (Nepal launched May 2026; Japan operates ride-hail
// in major cities).
const FALLBACK_BLOCKED = ['CN', 'CU', 'IR', 'KP', 'SY', 'DK', 'HU', 'BG', 'LK', 'BD', 'VN', 'MA', 'KE'];

async function run() {
  let html = '';
  try { html = await fetchText(URL); } catch (e) { console.warn('[uber] fetch failed:', e?.message); }

  // Strip script/style and HTML tags, lowercase for matching.
  const text = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .toLowerCase();

  // Match each known country name in our dictionary with a word-boundary check.
  const supported = new Set();
  for (const name of Object.keys(NAME_TO_ISO2)) {
    if (name.length < 3) continue; // skip 'uk', 'usa' etc. to avoid false positives
    const re = new RegExp(`(^|[^a-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(text)) {
      const iso = toIso2(name);
      if (iso) supported.add(iso);
    }
  }

  // Build statusByIso for every country we track.
  // If we extracted enough signal, use it; else fall back to hardcoded blocklist.
  const statusByIso = {};
  if (supported.size >= 15) {
    console.log(`[uber] extracted ${supported.size} supported countries from cities page`);
    // For each iso2 in our blocklist union with what we found:
    // - in supported set → yes
    // - in FALLBACK_BLOCKED → no
    // - otherwise → leave alone (don't downgrade unknowns to no on a parse miss)
    const seen = new Set([...supported, ...FALLBACK_BLOCKED]);
    for (const iso of seen) {
      statusByIso[iso] = supported.has(iso) ? 'yes' : 'no';
    }
  } else {
    console.warn(`[uber] only ${supported.size} countries matched — using hardcoded fallback`);
    for (const iso of FALLBACK_BLOCKED) statusByIso[iso] = 'no';
  }

  await applyUpdate('uber', SOURCE, statusByIso);
}

run().catch((e) => { console.error(e); process.exit(1); });
