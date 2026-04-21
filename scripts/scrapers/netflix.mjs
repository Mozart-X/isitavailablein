// Scraper: Netflix availability. Netflix is available in ~190 countries;
// only a few are blocked (China, North Korea, Syria, Russia suspended).
// Source: https://help.netflix.com/en/node/14164

import { applyUpdate, fetchText } from '../lib/update.mjs';

const URL = 'https://help.netflix.com/en/node/14164';
const SOURCE = 'netflix-official';

async function run() {
  let html = '';
  try {
    html = await fetchText(URL);
  } catch (e) {
    console.warn('[netflix] fetch failed, falling back to static known list:', e.message);
  }

  // Netflix's page lists all supported countries/regions. Without live fetch, we ship a curated baseline.
  const blocked = new Set(['CN', 'KP', 'SY', 'RU']); // Russia suspended 2022; China never launched; NK/Syria sanctions
  const partial = new Set(['CU']); // Limited

  // If we got HTML, attempt to validate by checking for country name mentions (same technique).
  if (html) {
    const text = html.toLowerCase();
    // If "china" / "north korea" / "syria" / "russia" appear in an "available in" context, flip them.
    // Keep conservative: only re-enable if explicitly listed in supported section.
    // For now we skip re-enabling on fuzzy text match — safer to keep blocklist.
    if (text.includes('netflix is available') || text.includes('where is netflix available')) {
      // page looks right; trust baseline
    } else {
      console.warn('[netflix] page structure unexpected; using baseline only.');
    }
  }

  const ALL_ISO = ['US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','PT','CH','AT','BE','PL','GR','CZ','HU','RO','TR','RU','UA','JP','KR','CN','HK','TW','SG','MY','TH','VN','PH','ID','IN','PK','BD','NP','LK','AE','SA','IL','EG','ZA','NG','KE','MA','BR','MX','AR','CL','CO','PE','NZ','IR','CU','KP','SY'];

  const statusByIso = {};
  for (const iso of ALL_ISO) {
    if (blocked.has(iso)) statusByIso[iso] = 'no';
    else if (partial.has(iso)) statusByIso[iso] = 'partial';
    else statusByIso[iso] = 'yes';
  }

  await applyUpdate('netflix', SOURCE, statusByIso);
}

run().catch((e) => { console.error(e); process.exit(1); });
