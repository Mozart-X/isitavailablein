// Stripe: parse the official supported-countries page.
// Source: https://stripe.com/global

import { applyUpdate, fetchText, logUnchanged } from '../lib/update.mjs';
import { NAME_TO_ISO2, toIso2 } from '../lib/country-map.mjs';

const URL = 'https://stripe.com/global';
const SOURCE = 'stripe-global-page';
const FALLBACK_AVAILABLE = ['US','GB','CA','AU','NZ','IE','DE','FR','IT','ES','NL','SE','NO','DK','FI','PT','CH','AT','BE','PL','GR','CZ','HU','RO','JP','SG','MY','TH','HK','BR','MX','AE','IL'];

async function run() {
  let html = '';
  try { html = await fetchText(URL); } catch (e) { console.warn('[stripe] fetch failed:', e?.message); }
  if (html === null) { console.log('[stripe] source unchanged'); return logUnchanged('stripe', SOURCE); }

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

  if (supported.size >= 15) {
    for (const iso of all) statusByIso[iso] = supported.has(iso) ? 'yes' : 'no';
    console.log(`[stripe] parsed ${supported.size} countries from page`);
  } else {
    const set = new Set(FALLBACK_AVAILABLE);
    for (const iso of all) statusByIso[iso] = set.has(iso) ? 'yes' : 'no';
    console.warn(`[stripe] only ${supported.size} matched, using fallback`);
  }
  await applyUpdate('stripe', SOURCE, statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
