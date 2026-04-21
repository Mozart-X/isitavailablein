// Uber: not available in Japan (as ride-hail), Denmark, Hungary, Bulgaria, Nepal, etc.
// Source: https://www.uber.com/global/en/cities/
import { applyUpdate, buildStatusMap, fetchText } from '../lib/update.mjs';

async function run() {
  try { await fetchText('https://www.uber.com/global/en/cities/'); } catch {}
  const statusByIso = buildStatusMap({
    no: ['CN', 'CU', 'IR', 'KP', 'SY', 'JP', 'DK', 'HU', 'NP', 'LK', 'BD', 'VN', 'MA', 'KE']
  });
  await applyUpdate('uber', 'uber-known-blocklist', statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
