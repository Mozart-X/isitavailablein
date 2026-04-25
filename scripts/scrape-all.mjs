// Run every scraper sequentially. Used by GitHub Actions cron.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'scrapers');

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs'));
console.log(`Found ${files.length} scrapers: ${files.join(', ')}`);

let failed = 0;
for (const f of files) {
  console.log(`\n=== Running ${f} ===`);
  const ok = await new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(dir, f)], { stdio: 'inherit' });
    p.on('close', (code) => resolve(code === 0));
  });
  if (!ok) failed++;
}

console.log(`\nDone. ${files.length - failed}/${files.length} succeeded.`);
// Don't fail the GH Actions workflow on individual scraper errors —
// transient site changes are expected. The scrape_log table + admin
// dashboard surface failures. Only fail if EVERY scraper failed
// (likely a global problem like DB outage).
if (files.length > 0 && failed === files.length) process.exit(1);
process.exit(0);
