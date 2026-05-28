# Sovrn escalation — ready to send

Status: drafted 2026-05-29. Review, edit if needed, then send via one of the channels below.

## Where to send (pick one)

| Channel | URL | Notes |
|---|---|---|
| **In-dashboard live chat** | https://platform.sovrn.com/ → bottom-right widget | **Fastest. Usually replies same day.** |
| Help portal ticket | https://help.sovrn.com/hc/en-us/requests/new | Visible to whole support queue |
| Direct email | support@sovrn.com | Slowest but on record |

Recommended order: try **live chat first**. If it's after hours or no one's there, fall back to the help portal ticket.

---

## Subject line

```
Site under review for 17+ days — past 3-day SLA, please advise
```

## Body — copy-paste exactly

```
Hi Sovrn support,

I submitted my site isitavailablein.com (publisher account, Sovrn site ID 6605513, API key 4139c3824c3211b7c02d4b3a981dd485) for Commerce approval roughly 17 days ago. Status is still "Under review" — well past your stated 1–3 business day window.

Quick summary of what's set up:

- JS install confirmed live on every page (curl https://isitavailablein.com/ returns the vglnk init with the correct key)
- Site is fully built: English content, 70+ services x 61 countries, 4,670+ pages
- Real organic traffic: ~65 weekly active users, ~35 organic search sessions, ~12 form submissions per week (Google Analytics verified)
- Outbound clicks ARE being generated — visible via my GA outbound_click events — but per your published policy, pre-approval clicks don't earn, so every day of delay represents attribution windows that can't be recovered

Could you either:
(a) confirm the review is on track and give an updated ETA, or
(b) let me know if anything is missing or blocking on my end so I can address it?

Happy to provide any additional info needed.

Thanks,
Avishek Chaulagain
Account email: chaulagainavishek14@gmail.com
Site: https://isitavailablein.com
```

---

## Why this template works (don't change the structure)

- **Cites their own SLA** ("past your stated 1–3 business day window") → triggers internal escalation rather than going to standard queue
- **Includes site ID + API key** → support agent doesn't have to dig to find your account
- **Lists what's verified working** (JS install, traffic, click events) → preempts "did you install the tag?" / "do you have traffic?" questions
- **References their own published policy** ("pre-approval clicks don't earn") → signals you understand the business, not just complaining
- **Two clear asks ((a) or (b))** → easy for them to pick one and respond fast
- **No threats, no urgency theater** → polite + specific = highest response rate

---

## If you don't hear back in 72 hours

Send a one-line follow-up reply on the same thread:

```
Hi — just bumping this. Any update on the review status for isitavailablein.com (site ID 6605513)?

Thanks,
Avishek
```

That's enough. Don't escalate further; ticket bumps are normal.

---

## If they reject (unlikely but possible)

Sovrn's reasons for rejection are usually:
- Site too thin (< ~50 pages) — **NOT YOUR CASE** (4,670 pages)
- Site too new (< 30 days) — **NOT YOUR CASE** (2+ months)
- Adult/illegal/policy violation — N/A

If they reject anyway, immediate Plan B: sign up at **https://skimlinks.com/publishers/apply** (similar auto-affiliate system, different merchant network, often approves where Sovrn doesn't). Paste the new key back here and I'll swap it in `app/layout.tsx` in 30 seconds — same architecture, different vendor.

---

## Approval timeline reality (after they say yes)

- Approval email arrives → effective immediately, but click attribution still needs to clear their fraud-detection lookback (usually ~24h)
- First commission earned: typically within 7 days of approval if real-world clicks happening
- First payout: 30 days after first $25 accrued (their minimum threshold)

So even after approval lands, expect 4-6 weeks before first PayPal deposit if traffic stays at current levels.
