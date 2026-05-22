// Coinbase: parse the official licenses page (lists every country/state
// where Coinbase holds a license to operate).
// Source: https://www.coinbase.com/legal/licenses

import { applyUpdate, fetchText } from '../lib/update.mjs';
import { NAME_TO_ISO2, toIso2 } from '../lib/country-map.mjs';

const URL = 'https://www.coinbase.com/legal/licenses';
const SOURCE = 'coinbase-licenses-page';
const FALLBACK_BLOCKED = ['CN', 'CU', 'IR', 'KP', 'RU', 'SY', 'NP', 'PK', 'BD', 'LK', 'VN', 'NG', 'EG', 'MA', 'KE'];

async function run() {
  let html = '';
  try { html = await fetchText(URL); } catch (e) { console.warn('[coinbase] fetch failed:', e?.message); }

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

  const all = ['US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','PT','CH','AT','BE','PL','GR','CZ','HU','RO','TR','RU','UA','JP','KR','CN','HK','TW','SG','MY','TH','VN','PH','ID','IN','PK','BD','NP','LK','AE','SA','IL','EG','ZA','NG','KE','MA','BR','MX','AR','CL','CO','PE','NZ','IR','CU','KP','SY'];
  const statusByIso = {};

  if (supported.size >= 20) {
    for (const iso of all) statusByIso[iso] = supported.has(iso) ? 'yes' : 'no';
    console.log(`[coinbase] parsed ${supported.size} countries from page`);
  } else {
    for (const iso of FALLBACK_BLOCKED) statusByIso[iso] = 'no';
    console.warn(`[coinbase] only ${supported.size} matched, using fallback`);
  }
  await applyUpdate('coinbase', SOURCE, statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
