# IsItAvailableIn.com

A Next.js site that answers *"Is [service] available in [country]?"* for 50+ services × 60+ countries (~3,000 programmatic SEO pages). Data auto-updates daily via GitHub Actions scrapers.

## Stack

- **Next.js 14** (app router, static generation)
- **SQLite** locally (`better-sqlite3`), **Turso** (libsql) in production
- **Cloudflare Pages** for hosting (free)
- **GitHub Actions** for daily scrape cron (free)

## Quick start (local)

```bash
npm install
npm run seed          # creates data.db, seeds services + countries + baseline status
npm run dev           # http://localhost:3000
```

Visit `http://localhost:3000/is-chatgpt-available-in-nepal` to see a sample page.

## Run scrapers locally

```bash
npm run scrape:openai       # fetches OpenAI supported-countries page, updates DB, logs changes
npm run scrape:anthropic
npm run scrape:netflix
npm run scrape              # runs all scrapers
```

## Project layout

```
app/
  layout.tsx, page.tsx           # homepage
  [slug]/page.tsx                # /is-[service]-available-in-[country] (the money pages)
  service/[slug]/page.tsx        # /service/chatgpt
  country/[slug]/page.tsx        # /country/nepal
  changes/page.tsx               # recent change feed
  services/, countries/, about/, contact/
  api/report/route.ts            # user-reported availability
  sitemap.ts, robots.ts
data/
  services.json                  # 50 services
  countries.json                 # 60 countries
  known-restrictions.json        # baseline restriction map per service
lib/
  db.ts                          # dual driver (SQLite local / Turso prod)
  schema.sql
  url.ts                         # slug parsing / status helpers
scripts/
  seed.mjs                       # seeds DB from JSON files
  scrape-all.mjs                 # runs every scraper
  scrapers/
    openai.mjs, anthropic.mjs, netflix.mjs
  lib/
    update.mjs                   # shared DB helpers, logs changes
    country-map.mjs              # country name → ISO2
.github/workflows/
  scrape.yml                     # daily 3am UTC cron
  deploy.yml                     # auto-deploy on push to main
```

## Deploy — step by step

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial"
gh repo create isitavailablein --public --source=. --push
```

### 2. Create Turso DB (free, no card)

```bash
# Install Turso CLI
irm https://get.tur.so/install.ps1 | iex      # Windows PowerShell
# OR: curl -sSfL https://get.tur.so/install.sh | bash  # Mac/Linux

turso auth signup
turso db create isitavailablein
turso db show isitavailablein --url           # copy the libsql:// URL
turso db tokens create isitavailablein         # copy the token

# Import local data to Turso
turso db shell isitavailablein < lib/schema.sql
# Then use the dashboard or a custom script to import seed rows (or run seed.mjs with TURSO_* env vars set)
```

### 3. Deploy to Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick your repo
2. Build settings:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Build output: `.next`
3. Environment variables (Settings → Environment variables):
   - `TURSO_DATABASE_URL` = your libsql:// URL
   - `TURSO_AUTH_TOKEN` = your token
   - `NEXT_PUBLIC_SITE_URL` = `https://isitavailablein.com`
4. Deploy.

### 4. Point domain

In Cloudflare Pages → Custom domains → Add `isitavailablein.com`. Follow the DNS instructions (if domain is registered elsewhere, copy the CNAME records to your registrar).

### 5. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CLOUDFLARE_API_TOKEN` (create at dash.cloudflare.com/profile/api-tokens with Pages:Edit perms)
- `CLOUDFLARE_ACCOUNT_ID` (in Cloudflare dashboard URL)
- `CF_DEPLOY_HOOK` (optional — Cloudflare Pages → Settings → Builds → Deploy hooks → Create)

### 6. Submit to Google

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property `isitavailablein.com`
3. Verify via DNS TXT record
4. Submit sitemap: `https://isitavailablein.com/sitemap.xml`

### 7. Monetization (after ~20 pages indexed)

- **AdSense**: apply at google.com/adsense. Paste the publisher ID into `NEXT_PUBLIC_ADSENSE_CLIENT` env var and add the script tag to `app/layout.tsx`.
- **NordVPN affiliate**: sign up at go.nordvpn.net/aff_c, get your link, set `NEXT_PUBLIC_NORDVPN_AFF`.
- **Surfshark affiliate**: similarly.

## Adding a new scraper

1. Add the service to `data/services.json`
2. Run `npm run seed` to insert it
3. Create `scripts/scrapers/[service].mjs` — copy pattern from `openai.mjs`
4. Add `npm run scrape:[service]` to `package.json`
5. Commit — next cron run picks it up

## Auto-resume helper (Windows AHK)

If you want to pick up work on this project automatically after a Claude token reset, see `tools/resume.ahk`. It wakes the PC (if Task Scheduler is configured) and opens Claude with the checkpoint prompt.

## License

MIT
