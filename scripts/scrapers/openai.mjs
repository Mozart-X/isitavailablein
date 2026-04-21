// Scraper: OpenAI / ChatGPT supported countries.
// Source: https://platform.openai.com/docs/supported-countries

import { applyUpdate, fetchText } from '../lib/update.mjs';
import { toIso2 } from '../lib/country-map.mjs';

const URL = 'https://platform.openai.com/docs/supported-countries';
const SOURCE = 'openai-official';

async function run() {
  const html = await fetchText(URL);

  // The page renders a long list of country names. Extract text inside <li> or after known markers.
  // Strategy: extract all text, then match against our known country-name dictionary.
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/&nbsp;/g, ' ')
                   .toLowerCase();

  // Countries OpenAI is AVAILABLE in — we'll find every known country mentioned in the supported list.
  // Because this page only lists SUPPORTED ones, any country in our DB that DOES NOT appear => 'no'.
  const supported = new Set();
  for (const nameKey of Object.keys(await import('../lib/country-map.mjs').then(m => m.NAME_TO_ISO2))) {
    // Rough: require word-boundary match to reduce false positives.
    const re = new RegExp(`(^|[^a-z])${nameKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(text)) {
      const iso = toIso2(nameKey);
      if (iso) supported.add(iso);
    }
  }

  if (supported.size < 20) {
    console.warn(`[openai] Only ${supported.size} countries matched — scrape may have failed. Aborting to avoid bad data.`);
    process.exit(1);
  }

  // Build status map: supported => yes; known-restricted => no for the rest.
  const ALL_ISO = ['US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','PT','CH','AT','BE','PL','GR','CZ','HU','RO','TR','RU','UA','JP','KR','CN','HK','TW','SG','MY','TH','VN','PH','ID','IN','PK','BD','NP','LK','AE','SA','IL','EG','ZA','NG','KE','MA','BR','MX','AR','CL','CO','PE','NZ','IR','CU','KP','SY'];

  const statusByIso = {};
  for (const iso of ALL_ISO) {
    statusByIso[iso] = supported.has(iso) ? 'yes' : 'no';
  }

  await applyUpdate('chatgpt', SOURCE, statusByIso);
}

run().catch((e) => { console.error(e); process.exit(1); });
