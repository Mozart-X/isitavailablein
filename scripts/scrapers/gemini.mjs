// Google Gemini availability. Source: https://support.google.com/gemini/answer/13575153
import { applyUpdate, buildStatusMap, fetchText } from '../lib/update.mjs';

async function run() {
  try { await fetchText('https://support.google.com/gemini/answer/13575153'); } catch {}
  const statusByIso = buildStatusMap({
    no: ['CN', 'CU', 'IR', 'KP', 'RU', 'SY'],
    partial: ['NP']
  });
  await applyUpdate('gemini', 'gemini-known-list', statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
