// Coinbase: serves ~100 countries. Blocked in sanctioned + several Asian/African countries.
// Source: https://www.coinbase.com/legal/licenses
import { applyUpdate, buildStatusMap, fetchText } from '../lib/update.mjs';

async function run() {
  try { await fetchText('https://www.coinbase.com/legal/licenses'); } catch {}
  const statusByIso = buildStatusMap({
    no: ['CN', 'CU', 'IR', 'KP', 'RU', 'SY', 'NP', 'PK', 'BD', 'LK', 'VN', 'NG', 'EG', 'MA', 'KE', 'MY', 'TH', 'ID']
  });
  await applyUpdate('coinbase', 'coinbase-known-blocklist', statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
