CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  official_url TEXT NOT NULL,
  geo_page_url TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS countries (
  iso2 TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  flag TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS availability (
  service_id INTEGER NOT NULL,
  country_iso2 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('yes','no','partial','vpn_only','unknown')),
  source TEXT,
  notes TEXT,
  last_verified TEXT NOT NULL,
  payment_ok TEXT,          -- yes|no|workaround|unknown
  phone_verify_ok TEXT,     -- yes|no|workaround|unknown
  signup_friction TEXT,     -- easy|medium|hard|blocked|unknown
  workaround TEXT,          -- short description of workaround
  PRIMARY KEY (service_id, country_iso2),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
);

-- Pricing snapshot per service × country × tier (local + USD).
CREATE TABLE IF NOT EXISTS pricing (
  service_id INTEGER NOT NULL,
  country_iso2 TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'standard',
  price_local REAL,
  currency_local TEXT,
  price_usd REAL,
  period TEXT DEFAULT 'month',
  source TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (service_id, country_iso2, tier),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
);

CREATE TABLE IF NOT EXISTS change_log (
  id INTEGER PRIMARY KEY,
  service_id INTEGER NOT NULL,
  country_iso2 TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  source TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_reports (
  id INTEGER PRIMARY KEY,
  service_id INTEGER NOT NULL,
  country_iso2 TEXT NOT NULL,
  reported_status TEXT NOT NULL,
  notes TEXT,
  ip_hash TEXT,
  reviewed INTEGER NOT NULL DEFAULT 0,
  applied INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scrape_log (
  id INTEGER PRIMARY KEY,
  service_slug TEXT NOT NULL,
  source TEXT NOT NULL,
  ok INTEGER NOT NULL,
  changed INTEGER NOT NULL DEFAULT 0,
  unchanged INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  run_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_avail_country ON availability(country_iso2);
CREATE INDEX IF NOT EXISTS idx_avail_service ON availability(service_id);
CREATE INDEX IF NOT EXISTS idx_changelog_date ON change_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed ON user_reports(reviewed);
CREATE INDEX IF NOT EXISTS idx_scrapelog_date ON scrape_log(run_at);
CREATE INDEX IF NOT EXISTS idx_pricing_service ON pricing(service_id);
CREATE INDEX IF NOT EXISTS idx_pricing_country ON pricing(country_iso2);

-- User-submitted suggestions / contact / feedback / service-or-country requests.
CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('service','country','feedback','bug','other')),
  body TEXT NOT NULL,
  contact TEXT,           -- optional email or handle
  ip_hash TEXT,
  reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_suggestions_reviewed ON suggestions(reviewed);
