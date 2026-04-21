// Scraper: Anthropic / Claude supported countries.
// Source: https://www.anthropic.com/supported-countries

import { applyUpdate, fetchText } from '../lib/update.mjs';
import { NAME_TO_ISO2, toIso2 } from '../lib/country-map.mjs';

const URL = 'https://www.anthropic.com/supported-countries';
const SOURCE = 'anthropic-official';

async function run() {
  const html = await fetchText(URL);

  const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                   .replace(/<style[\s\S]*?<\/style>/gi, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/&nbsp;/g, ' ')
                   .toLowerCase();

  const supported = new Set();
  for (const nameKey of Object.keys(NAME_TO_ISO2)) {
    const re = new RegExp(`(^|[^a-z])${nameKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(text)) {
      const iso = toIso2(nameKey);
      if (iso) supported.add(iso);
    }
  }

  if (supported.size < 20) {
    console.warn(`[anthropic] Only ${supported.size} countries matched — aborting.`);
    process.exit(1);
  }

  const ALL_ISO = ['US','GB','CA','AU','DE','FR','IT','ES','NL','SE','NO','DK','FI','IE','PT','CH','AT','BE','PL','GR','CZ','HU','RO','TR','RU','UA','JP','KR','CN','HK','TW','SG','MY','TH','VN','PH','ID','IN','PK','BD','NP','LK','AE','SA','IL','EG','ZA','NG','KE','MA','BR','MX','AR','CL','CO','PE','NZ','IR','CU','KP','SY'];

  const statusByIso = {};
  for (const iso of ALL_ISO) {
    statusByIso[iso] = supported.has(iso) ? 'yes' : 'no';
  }

  await applyUpdate('claude', SOURCE, statusByIso);
}

run().catch((e) => { console.error(e); process.exit(1); });
