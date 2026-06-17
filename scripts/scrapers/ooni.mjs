// OONI scraper — REAL in-country censorship measurements. Free, no API key.
//
// OONI (ooni.org) runs block-detection tests from real volunteers' devices
// INSIDE each country. Its aggregation API returns, per country, how many
// measurements of a domain were confirmed-blocked / anomalous / ok. This is
// the one signal you can't get by scraping an official page: ground truth from
// inside Iran, China, Russia, etc.
//
// SAFE BY DESIGN — detection only, never a false "available":
//   - OONI measures whether the NETWORK reaches the domain, not whether the
//     service is officially usable. So we only ever DOWNGRADE to 'vpn_only'
//     when censorship is measured. We never UPGRADE to 'yes' (a reachable
//     domain can still be geo-blocked at the app layer). This keeps us from
//     re-introducing false-positive "it's available!" claims.
//   - A confirmed network block => status 'vpn_only' (censored, but a VPN to a
//     clear region bypasses it — which is exactly our unblock niche + the VPN
//     affiliate CTA). Community confirmations still override (real users win).

import { applyUpdate } from '../lib/update.mjs';

const API = 'https://api.ooni.org/api/v1/aggregation';

// service slug -> the domain OONI most reliably has measurements for.
// Focused on the commonly-censored services (where OONI has dense data).
const DOMAINS = {
  chatgpt: 'chatgpt.com',
  tiktok: 'tiktok.com',
  telegram: 'telegram.org',
  whatsapp: 'web.whatsapp.com',
  instagram: 'instagram.com',
  facebook: 'facebook.com',
  'x-twitter': 'twitter.com',
  youtube: 'youtube.com',
  netflix: 'netflix.com',
  spotify: 'spotify.com',
  discord: 'discord.com',
  reddit: 'reddit.com',
  twitch: 'twitch.tv',
  snapchat: 'snapchat.com',
  pinterest: 'pinterest.com',
  linkedin: 'linkedin.com',
  signal: 'signal.org',
  tinder: 'tinder.com',
  roblox: 'roblox.com',
  steam: 'store.steampowered.com',
  threads: 'threads.net',
  'x-twitter-x': 'x.com',
  quora: 'quora.com',
  bluesky: 'bsky.app',
};

const sinceDate = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

// Classify a country's measurement counts. Returns 'vpn_only' when censorship
// is measured, otherwise null (leave the existing status untouched).
function classify({ confirmed_count: cf = 0, anomaly_count: an = 0, measurement_count: n = 0 }) {
  if (!n || n < 8) return null;                 // too little data to trust
  const blockedRatio = (cf + an) / n;
  if (cf >= 3 && blockedRatio >= 0.35) return 'vpn_only';  // confirmed censorship
  if (blockedRatio >= 0.5) return 'vpn_only';              // heavy interference
  return null;                                             // reachable / unclear → don't touch
}

async function run() {
  const since = sinceDate(30);
  const until = sinceDate(0);
  let svcCount = 0, cells = 0;

  for (const [slug, domain] of Object.entries(DOMAINS)) {
    try {
      const url = `${API}?test_name=web_connectivity&domain=${encodeURIComponent(domain)}&since=${since}&until=${until}&axis_x=probe_cc`;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'IsItAvailableIn-Bot/1.0 (+https://isitavailablein.com)' },
      });
      if (!r.ok) { console.warn(`[ooni] ${slug}: HTTP ${r.status}`); continue; }
      const data = await r.json();
      const rows = Array.isArray(data.result) ? data.result : [];

      const statusByIso = {};
      for (const row of rows) {
        const iso = (row.probe_cc || '').toUpperCase();
        if (iso.length !== 2 || iso === 'ZZ') continue;
        const st = classify(row);
        if (st) statusByIso[iso] = st;
      }

      const found = Object.keys(statusByIso).length;
      if (found) {
        await applyUpdate(slug, 'ooni-measured', statusByIso);
        svcCount++;
        cells += found;
        console.log(`[ooni] ${slug} (${domain}): censorship in ${found} countries`);
      } else {
        console.log(`[ooni] ${slug} (${domain}): no censorship signal`);
      }
      await new Promise((res) => setTimeout(res, 600)); // be polite to the free API
    } catch (e) {
      console.warn(`[ooni] ${slug} failed: ${e.message}`);
    }
  }
  console.log(`[ooni] done — ${svcCount} services flagged, ${cells} censored cells measured`);
}

run().catch((e) => { console.error('[ooni] fatal:', e.message); process.exit(1); });
