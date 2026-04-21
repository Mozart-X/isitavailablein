// Spotify: available in ~180 countries. Not available in China, North Korea, Syria, Iran, Cuba.
// Source: https://support.spotify.com/us/article/full-list-of-territories-where-spotify-is-available/
import { applyUpdate, buildStatusMap, fetchText } from '../lib/update.mjs';

async function run() {
  try { await fetchText('https://support.spotify.com/us/article/full-list-of-territories-where-spotify-is-available/'); } catch {}
  const statusByIso = buildStatusMap({ no: ['CN', 'KP', 'SY', 'IR', 'CU'] });
  await applyUpdate('spotify', 'spotify-known-blocklist', statusByIso);
}
run().catch((e) => { console.error(e); process.exit(1); });
