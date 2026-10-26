---
description: Full funnel audit — signup, click-out, earnings, referral in one run
---
Journey: **full-funnel** (run folder `runs/<date>-full-funnel/`).

Run these journeys in order, following the steps in each command file, and saving all screenshots in this one run folder with a stage prefix (`signup-01-…`, `clickout-01-…`):

1. `.claude/commands/signup-audit.md` (skip clearing app data unless the user says to)
2. `.claude/commands/clickout-audit.md`
3. `.claude/commands/earnings-audit.md`
4. `.claude/commands/referral-audit.md`

Then write a single `report.md` that maps the whole funnel (Install → Signup → First click-out → Tracked → Confirmed → Withdrawal → Repeat/Referral), puts the top 10 fixes across all stages first, and ranks them by impact and effort.

$ARGUMENTS
