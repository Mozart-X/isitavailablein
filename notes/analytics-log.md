# Analytics log

Append a new entry every check. Newest at the top. Sources:
GA = analytics.google.com, Sovrn = platform.sovrn.com, Admin = /admin

Schema per entry:
- **Date** — when the check happened (not the data window)
- **GA 7d users / 7d pageviews / 30d users** — primary growth signals
- **Top geo** — first 3 countries by users (GA, last 7d)
- **Sources** — Direct / Organic / Referral
- **Top page** — single highest-views page (GA, last 7d)
- **Sovrn status** — pending/approved
- **Admin** — services/countries/rows/pending-reports/pending-suggestions
- **Notes** — anything notable (deploy, bug, milestone)

---

## 2026-05-21 (latest)

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **74** | +147% |
| 7d new users | 79 | +172% |
| 7d pageviews | 108 | +33% |
| 1-day users | 11 | +10% |
| 30-day cumulative users | **127** | +135% |
| Clicks tracked | 2 | flat |
| Engagement events | 53 | +17% |
| Scrolls | 24 | +17% |

**Top geo (7d):** US 33 · China 5 · Germany 4 · France 4 · Canada 2 · India 2 · Nigeria 2
**Sources:** Direct 48 · Organic 24 · Unassigned 6 · Referral 1
**Top page (views):** Homepage 25 · Facebook in Chile 8 · Reddit in Norway 8 · Claude in Ukraine 7

**Sovrn:** Under review — still no movement. Pre-approval clicks don't earn.
**Admin:** 70 services / 61 countries / 4,270 rows / 0 failed scrapes 7d / 2 pending reports / 2 pending suggestions

**Notes:**
- Weekly traffic **plateaued at 74** (same as last check). No growth this week.
- 30d cumulative still climbing (+135%). New content still pulling in users monthly.
- Two pending reports came in — first user-submitted reports. Worth reviewing.
- Latest deploy: `f3edee9` Add /hire page. All deploys live.

---

## 2026-05-19 (previous)

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **74** | +236% (was 43) |
| 7d new users | 78 | +271% |
| 7d pageviews | 104 | +49% |
| 1-day users | 16 | +300% |
| 30-day cumulative users | 117 | +166% |
| Clicks tracked | 2 | up from 1 |

**Top geo (7d):** US 36 · China 4 · Germany 4 · France 4 · Nigeria 3
**Sources:** Direct 49 · Organic 22 · Unassigned 6 · Referral 1
**Top page (views):** Homepage 21 · YouTube Premium in Peru 9 · Facebook in Chile 8 · Reddit in Norway 8 · Claude in Ukraine 7

**Sovrn:** Under review — confirmed JS key was wrong (`1ebva00` was referral slug). Fixed to correct 32-char hex key `4139c38…` in commit `84ba050`.
**Admin:** 70 / 61 / 4,270 / 0 failed / 2 pending suggestions

**Notes:**
- First **Referral** session ever — someone linked to us from elsewhere.
- Germany + France appeared in geo for the first time (VPN-buyer audience).
- Sovrn install snippet pulled from dashboard, real JS key wired and confirmed deployed.
- New page types ranking: YouTube Premium Peru, Reddit Norway, Claude Ukraine.

---

## 2026-05-15 (earlier)

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **43** | +378% |
| 7d new users | 42 | +367% |
| 7d pageviews | 96 | +967% |
| 30-day cumulative users | 69 | +156% |
| Clicks tracked | 1 | first ever |

**Top geo (7d):** US 17 · China 3 · Japan 2 · Nigeria 2 · Pakistan 2
**Sources:** Direct 25 · Organic 23 · Unassigned 1
**Top page (views):** Homepage 34 · Shein in China 8 · Recent changes 7 · Facebook in Chile 6 · YouTube Premium in Peru 6 · **Best VPN for Canva Pro 4** (first comparison page ranking)

**Sovrn:** Under review (first signup).
**Admin:** 70 / 61 / 4,270 / 0 failed scrapes

**Notes:**
- First weekly growth burst since launch (9 → 43 users WoW).
- First click event tracked.
- New comparison/listicle routes (`/best-vpn-for/`, `/apps-banned-in/`) starting to pull traffic within days of shipping.
- Organic Search reached ~50% of sessions for the first time.

---

## Baseline — 2026-05-08 (week 8 of launch)

- Weekly users: **9**
- Mostly direct + bot crawl
- 0 affiliate clicks
- ~3,050 pages live (before adding 20 new services)
- Site age: ~2 months
- GSC: 0 organic clicks → first impressions starting

---

## How to use this file

After each future analytics check, prepend a new entry above (newest first). Compare:
- Are weekly users climbing, plateauing, or dropping?
- Which page types are now ranking that weren't before?
- Did the geo mix shift toward higher-value markets (US, EU)?
- Did Sovrn status change?
- Did new admin counts (pending reports/suggestions) emerge?

When traffic plateaus 2+ weeks in a row, it's a signal that content/SEO needs a new lever (backlinks, social, new niches). Don't panic at single-week plateaus — they're normal.
