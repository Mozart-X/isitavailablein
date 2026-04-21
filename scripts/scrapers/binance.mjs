// Binance: blocked in US (use Binance.US separately), Canada (new restrictions 2023),
// plus sanctioned countries. Partial restrictions in some EU countries.
import { applyUpdate, buildStatusMap } from '../lib/update.mjs';

async function run() {
  const statusByIso = buildStatusMap({
    no: ['US', 'CU', 'IR', 'KP', 'SY', 'CA'],
    partial: ['GB', 'NL', 'DE', 'IT', 'FR']
  });
  await applyUpdate('binance', 'binance-known-blocklist', statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
