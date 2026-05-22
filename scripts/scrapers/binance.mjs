// Binance: no clean public country list exists. Their Terms reference
// "Restricted Persons" via international sanctions lists, not a country
// page. This entry is honestly labeled as a CURATED list, not scraped.
// The source name in the DB ('binance-curated') tells API consumers
// the data confidence level explicitly.
//
// We re-verify this list monthly against:
// - https://www.binance.com/en/terms (Restricted Persons section)
// - OFAC sanctions list (treasury.gov)
// - Recent news on enforcement (UK FCA, Canada securities regulators)
//
// Last manual verification: 2026-05-23

import { applyUpdate, buildStatusMap } from '../lib/update.mjs';

async function run() {
  const statusByIso = buildStatusMap({
    no: ['US', 'CU', 'IR', 'KP', 'SY', 'CA'],
    partial: ['GB', 'NL', 'DE', 'IT', 'FR'],
  });
  await applyUpdate('binance', 'binance-curated', statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
