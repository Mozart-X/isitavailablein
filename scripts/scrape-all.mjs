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
process.exit(failed > 0 ? 1 : 0);
