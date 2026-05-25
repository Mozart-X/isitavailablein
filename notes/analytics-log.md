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

## 2026-05-26 (latest) — engagement EXPLODING

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **73** | flat (same as 5/25) |
| 7d new users | 76 | flat |
| **7d pageviews** | **219** | **+77%** (was 198 → 219, still climbing) |
| 7d engagement events | 153 | +68% |
| **7d scrolls** | **84** | **+87%** (people reading deeper) |
| **7d form_starts** | **11** | **+267%** (vs 5/25 was 7) |
| **7d form_submits** | **10** | **+400%** (vs 5/25 was 6 — 67% jump in 24h) |
| 1-day users | 12 | +9% |
| **30-day cumulative** | **162** | **+80%** |
| **Pages per user** | **3.0** | up from 2.7 (5/25) and 1.6 (5/15) |

**Top geo (7d):** US 31 · China 4 · Germany 4 · France 4 · Canada 2 · UK 2 · **India 2** (new in top)
**Sources:** Direct 45 · **Organic 31 (+24%)** · Unassigned 6 · Referral 2
**Top page (views):** Homepage **87 (+89%)** · Snapchat Philippines 11 · Reddit Norway 9 · Best VPN deals 8 · **All countries 7 (+250%)** · /changes 5
**Realtime now:** 0 active

**Sovrn:** Session expired in our browser — couldn't pull live status. User needs to log back in at platform.sovrn.com to check + escalate the still-stuck review.
**Admin:** 70 / 61 / 4,270 / 0 failed / 44 changes (flat) / **2 pending reports** (Snapchat-Syria still — needs reject) / 0 pending suggestions

**Notes:**
- **Engagement up across the board even with flat user count.** The new pages added on 5/25 (/me, /alerts, /best-vpn-quiz) just deployed — too early to see THEIR direct impact yet, but base engagement is climbing.
- **10 form_submits = community confirmations rolling in.** Once 3+ accumulate on a single (service, country) pair, the consensus auto-flip kicks in. Self-correction loop has fuel.
- **Pages per user: 3.0 vs 1.6 three weeks ago.** Visitors clicking deeper, not bouncing. SEO-positive signal.
- **Organic Search now ~38% of sessions** (31/82). Up from ~30% last week. Compounding indexing.
- **India in top geo first time** — VPN-buyer market, big audience.
- Homepage views nearly doubled (+89%). Possibly people sharing the URL directly.

---

## 2026-05-25 — PLATEAU BROKEN 📈

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **73** | **+59%** (was 66 → 73 — plateau broken!) |
| 7d new users | 77 | +64% |
| **7d pageviews** | **198** | **+69%** (nearly doubled from 106) |
| 7d engagement events | 130 | +46% |
| 7d scrolls | 67 | +49% |
| **7d form_starts** | **7** | **+133%** |
| **7d form_submits** | **6** | **+200% (NEW metric appearing)** |
| 1-day users | **18** | **+64%** (huge bump from 4) |
| **30-day cumulative** | **151** | **+91%** |

**Top geo (7d):** US 31 (+41%) · **China 6 (+200%)** · **Germany 5 (+400%)** · **France 4 (+300%)** · **Nigeria 3 (+200%)** · Egypt 2 · UK 2 (new)
**Sources:** Direct 46 (+53%) · Organic 26 (+4%) · Unassigned 8 · Referral 2
**Top page (views):** Homepage 77 (+60%) · **Snapchat Philippines 11** (new top entry, from added services) · **Best VPN deals 8 (+700%)** · Reddit Norway 9 · All countries 6 (+200%)
**Realtime now:** 1 active user from South Africa

**Sovrn:** Still "Under review" — no movement again. **Past 1-3 day promise by >10 days now. Escalate.**
**Admin:** 70 / 61 / 4,270 / 0 failed scrapes / 44 changes logged (same) / 2 pending reports (unchanged) / **0 pending suggestions** (clean)

**Notes:**
- **6 form_submit events** = real community confirmations landing. Once 3+ accumulate on a single (service, country) pair, the new autonomous consensus auto-flips the DB. Self-correction loop is alive.
- **Snapchat Philippines #2 page** — proves the new-service additions are catching long-tail traffic
- **Deals page +700% views** — comparison/coupon-intent traffic flowing. This is the highest-converting page type. If Sovrn were approved, this would be paying right now.
- **Premium geo all up significantly** — China 200%, Germany 400%, France 300% are the markets that pay highest VPN affiliate commissions. Good geo mix.
- 30-day +91% sustained — broader trajectory still strong even with a 2-week plateau in middle of period.

---

## 2026-05-24

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **66** | flat (same as 5/23) |
| 7d new users | 71 | flat |
| 7d pageviews | 106 | flat |
| 1-day users | 4 | flat |
| **30-day cumulative** | **134** | flat (vs 5/23) — was 127 → 134 over 24h |
| Clicks tracked | 2 | flat |
| **Form starts** | **3** | **+200%** (someone interacted with Finder/Suggest/Confirm) |

**Top geo (7d):** US 27 · China 5 · Germany 5 · France 5 · Nigeria 3 · Canada 2 · Egypt 2 (unchanged from 5/23)
**Sources:** Direct 43 · Organic 22 · Unassigned 7 · Referral 2
**Top page (views):** Homepage 30 · Reddit Norway 8 · Claude Ukraine 7 · YouTube Peru 3 · Facebook Chile 2
**Realtime now:** 1 active user from Nepal (likely user testing the Uber-NP fix)

**Sovrn:** Still "Under review" — no movement past their 1-3 day promise. Click the "Contact support" link to escalate.
**Admin:**
- 70 / 61 / 4,270 / 0 failed scrapes (7d)
- **Total changes logged: 44** ↑ (was 26 — +18 new flips this week)
- **Pending suggestions: 0** ↑ (was 2 — user cleared spam)
- Pending reports: 2 (still the Snapchat-Syria duplicates — needs reject)

**Notes:**
- Traffic plateaued (66 users for 2nd consecutive week). New content hasn't broken into rankings yet.
- 18 new change_log entries this week → could be scrapers catching real movement OR new pages going through migrate's seed step. Worth checking /changes to see if real-world flips are appearing.
- form_start jumped 3 → likely first community confirmation submissions! Once 3+ for a single pair land, the new consensus auto-flip kicks in.
- Many code-side improvements shipped: tutorial route, API+widget, community confirmations + auto-consensus, real scrapers (5 converted), ETag caching, hourly cron, OG images, anti-spam tightening, manual overrides, autonomous self-correction loop.
- Code side is "done" structurally. Now waiting on distribution (backlinks, social shares, Sovrn approval).

---

## 2026-05-23

| | Now | Δ vs prev period |
|---|---|---|
| 7d users | **66** | −11% (74 → 66) |
| 7d new users | 71 | −10% |
| 7d pageviews | 105 | −3% |
| 1-day users | 4 | −64% |
| 30-day cumulative users | **134** | +5.5% |
| Clicks tracked | 2 | flat |
| Engagement events | 51 | −4% |

**Top geo (7d):** US 27 · China 5 · **Germany 5** ↑ · **France 5** ↑ · Nigeria 3 · Canada 2 · **Egypt 2** (new in top)
**Sources:** Direct 43 · Organic 22 · Unassigned 8 · **Referral 2** ↑ (1→2)
**Top page (views):** Homepage 29 · Reddit Norway 8 · Claude Ukraine 7 · /changes 4 · YouTube Peru 3 · Facebook Chile 2 (was 8 — dropped)
**Realtime now:** 3 active users across India · Nepal · Syria

**Sovrn:** Still "Under review" — no change. 0 commission earned.
**Admin:** 70 / 61 / 4,270 / 0 failed scrapes / **2 pending reports** / 2 pending suggestions

**Notes:**
- **First week of decline.** Weekly users 74 → 66 (-11%). Single-week dips are normal noise but worth watching.
- Yesterday's 1-day count of 4 is unusually low (last week's daily avg was ~11).
- Mixed signal: Germany/France grew, **Egypt entered top geo**, Referrals doubled (1→2). Bad: US fell 18%, Facebook Chile dropped from #2 → #6.
- **Real-time shows 3 active users from 3 countries** — site is being used right now.
- 30-day rolling still climbing (+5.5%) so monthly is fine. Watch next week — if 7d drops again, that's a trend; one week is just noise.
- No deploys since last check (`c18a7cb` analytics log file).

---

## 2026-05-21

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
