---
description: Run the same journey on a competitor app and compare with LetsEarn
argument-hint: <competitor app, e.g. CashKaro> [journey: signup|clickout|earnings|referral]
---
Competitor and journey: $ARGUMENTS (default journey: clickout).

1. Confirm that the competitor app is installed (`mobile_list_apps`). If it isn't, stop and ask the user to install it.
2. Run the chosen journey's steps on the competitor, saving screenshots to `runs/<date>-compare-<competitor>/competitor/`, and following every hard rule in CLAUDE.md.
3. Run the same journey on LetsEarn, saving to `runs/<date>-compare-<competitor>/letsearn/`.
4. Write `report.md` with a side-by-side table (taps to goal, clarity of the cashback offer, trust signals, friction points) and a list of the specific things the competitor does better that LetsEarn should copy.
