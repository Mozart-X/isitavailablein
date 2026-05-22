// Spotify: parse the official "full list of territories" support article.
// Source: https://support.spotify.com/us/article/full-list-of-territories-where-spotify-is-available/

import { applyUpdate, fetchText } from '../lib/update.mjs';
import { NAME_TO_ISO2, toIso2 } from '../lib/country-map.mjs';

const URL = 'https://support.spotify.com/us/article/full-list-of-territories-where-spotify-is-available/';
const SOURCE = 'spotify-territories-page';
const FALLBACK_BLOCKED = ['CN', 'KP', 'SY', 'IR', 'CU'];

async function run() {
  let html = '';
  try { html = await fetchText(URL); } catch (e) { console.warn('[spotify] fetch failed:', e?.message); }

  const text = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .toLowerCase();

  const supported = new Set();
  for (const name of Object.keys(NAME_TO_ISO2)) {
    if (name.length < 3) continue;
    const re = new RegExp(`(^|[^a-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(text)) {
      const iso = toIso2(name);
      if (iso) supported.add(iso);
    }
  }

  const statusByIso = {};
  if (supported.size >= 30) {
    // Spotify lists ~180 territories. Anything not in the list = not supported.
    // We mark only the ones in our DB (others get applied via baseline).
    const all = ['US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','PT','CH','AT','BE','PL','GR','CZ','HU','RO','TR','RU','UA','JP','KR','CN','HK','TW','SG','MY','TH','VN','PH','ID','IN','PK','BD','NP','LK','AE','SA','IL','EG','ZA','NG','KE','MA','BR','MX','AR','CL','CO','PE','NZ','IR','CU','KP','SY'];
    for (const iso of all) statusByIso[iso] = supported.has(iso) ? 'yes' : 'no';
    console.log(`[spotify] parsed ${supported.size} countries from page`);
  } else {
    for (const iso of FALLBACK_BLOCKED) statusByIso[iso] = 'no';
    console.warn(`[spotify] only ${supported.size} matched, using fallback`);
  }
  await applyUpdate('spotify', SOURCE, statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
