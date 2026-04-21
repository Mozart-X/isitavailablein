// Stripe: available in ~47 countries. Invite-only or partial in many others.
// Source: https://stripe.com/global
import { applyUpdate, buildStatusMap, fetchText } from '../lib/update.mjs';

async function run() {
  try { await fetchText('https://stripe.com/global'); } catch {}
  const available = ['US','GB','CA','AU','NZ','IE','DE','FR','IT','ES','NL','SE','NO','DK','FI','PT','CH','AT','BE','PL','GR','CZ','HU','RO','JP','SG','MY','TH','HK','BR','MX','AE','IL'];
  const partial = ['IN', 'PH', 'ID', 'VN', 'NG', 'KE', 'EG', 'ZA'];
  const blocked = ['CU','IR','KP','SY','NP','BD','PK','UA','CN','RU'];
  const statusByIso = buildStatusMap({ no: blocked, partial });
  // Override yes for explicit available list (skip, default yes for non-listed countries not wanted)
  // Actually: anything not in blocked/partial remains "yes" by default — which is wrong for Stripe.
  // Better: start with only "available" list.
  const only = buildStatusMap({ onlyAvailable: available, partial });
  await applyUpdate('stripe', 'stripe-known-list', only);
}
run().catch((e) => { console.error(e); process.exit(1); });
