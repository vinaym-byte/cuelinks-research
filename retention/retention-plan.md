# Cuelinks Retention Marketing Plan (WebEngage)

_Prepared Oct 2026. Items marked **[verify]** are assumptions about product features or data that the team should confirm before build._

---

## 1. What "retention" means for Cuelinks

Cuelinks users are **publishers**: Telegram/WhatsApp deal-channel admins, bloggers and website owners, Instagram/YouTube creators, and individuals who share links with friends. Cuelinks earns only when they keep driving sales. A publisher who signs up and never converts a link costs acquisition money and earns nothing.

So retention here is not "did they log in". It is: **do they keep creating links that produce validated sales, and do they stay until (and after) their first payout?**

### Publisher lifecycle

```
Visit → Sign up → Approved → First link → First click → First sale (tentative)
      → Sale validated → Reaches payout threshold → First payout → Habitual earner
                                                                     ↓
                                                At-risk → Dormant → Won back / Churned
```

Each arrow is a drop-off point and gets its own WebEngage journey (Section 5).

### What Search Console says about who arrives (last 90 days, cuelinks.com)

| Signal | Data | What it means for retention |
|---|---|---|
| Acquisition is **merchant-led** | Top non-brand queries: "myntra affiliate program" (~5.1k clicks), "flipkart affiliate program/registration" (~3k+), "savana affiliate program" (~1.7k), "meesho affiliate" (~1.5k), Shopsy, Ajio, Blinkit | People sign up wanting **one specific merchant**. Onboarding should start with that merchant, not a generic tour. |
| **Off-intent traffic** is large | The "sell unused 4G/5G data" blog post is the #2 landing page (~10.8k clicks). | This group is unlikely to become publishers. Tag them and give them a lighter track so they don't drag down activation metrics or sender reputation. |
| **Flipkart/Amazon/Meesho sign-up failures** | "flipkart affiliate registration not working" and similar queries are ranking | These users have just been rejected elsewhere. Lead with "approved instantly, earn on Flipkart through Cuelinks." |
| **Mostly mobile** | Mobile ~70% of clicks, desktop ~29% | Plan for mobile first: app push, WhatsApp, and in-app messages before long emails. |
| **Many returning users** | "cuelinks login" + "cuelinks affiliate login" ≈ 2.5k clicks; "cuelinks app" ~400 | There is an active base to engage. Check whether logged-in users are being reached on-site and in-app. |
| Organic traffic is steady | ~800–900 clicks/day in mid-Oct | Daily volume is enough for statistically useful A/B tests on onboarding. |

---

## 2. Goals and metrics

### North-star metric
**Monthly Active Earning Publishers (MAEP):** publishers with ≥1 tracked (tentative or validated) sale in the calendar month.

### Supporting KPIs

| Stage | KPI | Definition | Starting target **[set from baseline]** |
|---|---|---|---|
| Activation | Link-in-24h rate | % of approved sign-ups who create ≥1 link within 24h | +30% relative vs baseline |
| Activation | Time to first sale | Median days from sign-up to first tentative sale | −25% |
| Activation | 30-day earning rate | % of a sign-up cohort with ≥1 sale within 30 days | +20% relative |
| Monetisation | First-payout rate | % of a cohort that reaches the payout threshold within 90 days | +15% relative |
| Engagement | Weekly link creators | Publishers creating ≥1 link per week | Growth month on month |
| Retention | Earning-publisher churn | Earned last month, nothing this month | −15% relative |
| Win-back | Reactivation rate | % of dormant (60d+) publishers who make a sale within 30 days of a win-back | 3–5% |
| Value | Earnings per active publisher | Mean/median monthly commission | Track by tier |
| Health | Push/WA opt-in, email deliverability, unsubscribe rate | Channel hygiene | Unsubscribes <0.3% per send |

Measure **incremental** lift with a control group (Section 8), not raw journey conversions.

---

## 3. WebEngage foundation (data first)

Journeys are only as good as the events they trigger on. Build this first.

### 3.1 Identity
- `user_id` = Cuelinks publisher ID. Call `webengage.user.login(id)` on web and in the app right after sign-up/login, so anonymous pre-sign-up sessions (landing page, merchant viewed) merge into the profile.
- Do not use email or phone as the ID. Send them only as standard contact attributes, and only with consent.

### 3.2 Data sources

| Source | How it reaches WebEngage | What it carries |
|---|---|---|
| Website (cuelinks.com + dashboard) | Web SDK | Page and merchant views, sign-up, link creation, tool usage |
| Android/iOS app **[verify]** | Mobile SDK | Same events plus push token |
| Backend / tracking system | **Server-side REST API** (Events + Users) | Clicks, tentative/validated/cancelled sales, payouts, KYC status. This data never touches the browser, so it **must** come from the server. |
| Nightly batch job | Users API (bulk) | Rolling aggregates: earnings in the last 7/30 days, link counts, tier, top merchant |

### 3.3 Event taxonomy (minimum set)

| Event | Key attributes | Source |
|---|---|---|
| `Signed Up` | `signup_source`, `landing_page`, `intent_merchant` (from the campaign page they came from), `publisher_type` (self-declared) | Web/App |
| `Account Approved` / `Account Rejected` | `reason` | Server |
| `Campaign Viewed` | `merchant`, `category`, `commission_rate` | Web/App |
| `Link Created` | `merchant`, `category`, `tool` (link converter / Chrome extension / Telegram bot / WP plugin / API / app) **[verify tools]**, `is_first_link` | Web/App/Server |
| `Tool Connected` | `tool` (Telegram bot, WhatsApp, WP plugin, extension) | Server |
| `Clicks Milestone` | `total_clicks` (1, 10, 100, 1k) | Server (daily) |
| `Sale Tracked` | `merchant`, `order_value_bucket`, `commission`, `status=tentative`, `is_first_sale` | Server |
| `Sale Validated` / `Sale Cancelled` | `merchant`, `commission`, `cancel_reason` | Server |
| `Payout Threshold Reached` | `balance` | Server |
| `Payout Requested` / `Payout Processed` / `Payout Failed` | `amount`, `method`, `failure_reason` | Server |
| `KYC Updated` | `pan_status`, `bank_status` | Server |
| `Referral Sent` / `Referral Joined` **[verify program]** | | Server |

### 3.4 User attributes (refresh nightly)
`lifecycle_stage`, `publisher_type`, `intent_merchant`, `top_categories` (list), `top_merchant_30d`, `links_7d`, `links_30d`, `clicks_30d`, `sales_30d`, `earnings_30d`, `lifetime_earnings`, `available_balance`, `distance_to_payout`, `last_link_at`, `last_sale_at`, `last_login_at`, `kyc_complete` (bool), `value_tier` (see 4.3), `is_off_intent` (bool), `preferred_language` **[if collected]**.

Keeping `lifecycle_stage` and `value_tier` as attributes lets WebEngage segments stay simple and live.

### 3.5 Business data for Relays
Load merchant/campaign data (name, category, commission rate, status, offer end date, festive sale dates) as WebEngage **business data / catalog** **[verify which feature is on the plan]**. Merchant-level changes can then fan out to every relevant publisher through **Relays**. Example: Myntra raises its rate → everyone with `top_merchant_30d = Myntra` or `intent_merchant = Myntra` is notified.

---

## 4. Segmentation

### 4.1 Lifecycle stage (primary axis, maintained as an attribute)

| Stage | Rule |
|---|---|
| `new_unactivated` | Signed up < 14d, 0 links |
| `linked_no_click` | ≥1 link, 0 clicks |
| `clicks_no_sale` | Clicks > 0, 0 sales |
| `first_sale` | 1st sale in the last 30d |
| `active_earner` | Sale in the last 30d, not new |
| `at_risk` | Was `active_earner`; no sale for 21–45d **or** links_7d down >60% vs their 8-week average |
| `dormant` | No sale 45–120d |
| `lapsed` | No sale or login 120d+ |
| `never_activated` | Signed up > 14d, 0 links |

### 4.2 Publisher type (drives channel, content and tools)
1. **Deal channel admins** (Telegram/WhatsApp): high volume and frequency. They need speed, auto-conversion, and deal feeds.
2. **Bloggers/website owners**: SEO-led and slower. They need WP plugin/auto-linking and evergreen high-commission merchants.
3. **Social creators** (Instagram/YouTube): campaign-led. They need product links, brand campaigns, and festive calendars.
4. **Casual sharers**: low volume, a big share of sign-ups. They need simple "share & earn" steps and app-first nudges.

Ask for this in a one-question sign-up survey. Infer it from the first tool used if they skip.

### 4.3 Value tier (RFM on earnings, recomputed monthly)
- **Platinum**: top 2% by 90-day earnings. Gets a human account manager, early access, bonus rates **[verify commercial room]**.
- **Gold**: next 8%.
- **Silver**: the rest of the active earners.
- **Bronze**: earned once, inconsistent.

Treat the tiers differently. Platinum churn is worth far more than Bronze churn, so the at-risk triggers for Platinum should be more sensitive and should alert the account manager as well as sending automated messages.

### 4.4 Intent and affinity
- `intent_merchant` (Myntra, Flipkart, Meesho, Savana, Shopsy, Ajio, Blinkit…) from the landing page.
- `top_categories` (fashion, beauty, electronics, grocery/quick commerce, finance/credit cards).
- `is_off_intent` = landed on the data-selling or other non-affiliate blog posts and never viewed a campaign.

---

## 5. Lifecycle programs (WebEngage Journeys)

Each program lists the trigger, flow, channels and success metric. Day counts are from the trigger.

### P1. Welcome & activation: "first link in the first session"
**Trigger:** `Signed Up` (and `Account Approved` if approval isn't instant)
**Goal:** `Link Created` within 24h

| When | Channel | Message |
|---|---|---|
| Immediately | On-site/in-app | Merchant-specific welcome: "Start earning on **{{intent_merchant}}**: paste any {{intent_merchant}} product link here." Embed the link converter so they can act without leaving. |
| +5 min, no link | Email | "Your {{intent_merchant}} affiliate link in 3 steps" (GIF), plus the top 3 converting products/offers on that merchant today |
| +2h, no link | App/web push | "{{intent_merchant}} is paying {{rate}} today, create your first link" |
| +24h, no link | WhatsApp (if opted in) | Short how-to video in Hindi or English, chosen by publisher type |
| +3d, no link | Email | Social proof: "How a Telegram channel with 2k members earns ₹X/month" plus the tool best suited to their publisher type |
| +7d, no link | Push + email | Last nudge, then move to `never_activated` (low-frequency monthly digest only) |

**Branch by publisher type:** deal admins → connect the Telegram bot/auto-converter; bloggers → WP plugin; creators → product-link builder & app; casual → app download + "share on WhatsApp".
**Off-intent branch:** one email explaining what Cuelinks is, then low-frequency only. Exclude them from paid SMS/WhatsApp.
**Exit:** `Link Created` → P2.

### P2. First click → first sale
**Trigger:** `Link Created` (`is_first_link = true`)

- **+0:** In-app celebration + "Where to share it" checklist for their publisher type.
- **+48h, 0 clicks** (`linked_no_click`): "Your link hasn't been clicked yet. 3 places to share it." Deep-link to share sheets.
- **First click** (`Clicks Milestone = 1`): push "Your first click just came in 🎉". This moment builds the habit.
- **+5d, clicks but no sale** (`clicks_no_sale`): educational content ("Why clicks don't convert: pick deals, not homepages") plus today's **top converting offers** in their category from business data.
- **+14d still no sale:** Suggest switching to a higher-converting merchant in their category. Offer a live webinar / YouTube session invite.
**Exit:** `Sale Tracked` (`is_first_sale`) → P3.

### P3. Earnings moments (trust & excitement)
Small, mostly transactional messages. These have the highest open rates and build the most trust in the platform.

| Event | Channel | Message |
|---|---|---|
| First `Sale Tracked` | Push + email + in-app | "You just earned ₹{{commission}} from {{merchant}}!" Explain tentative → validated and the typical validation time. |
| `Sale Validated` (batched daily) | Push / app inbox | "₹X confirmed today." |
| `Sale Cancelled` | Email / app inbox | Plain explanation of why (returns/cancellations) and the merchant's typical cancellation rate. **Prevents "Cuelinks is cheating me" churn.** |
| `distance_to_payout` ≤ 20% | Push + WhatsApp | "You're only ₹{{distance}} away from your payout." Include 2 offers to close the gap. |
| `Payout Threshold Reached` | Email + push | "Withdraw now." If `kyc_complete = false` → go to P8. |
| `Payout Processed` | WhatsApp/email | Receipt plus "Here's what top earners do next month." |
| `Payout Failed` | Email + SMS | Fix-your-bank-details link. High priority, overrides frequency caps. |

### P4. Habit loop: personalised deal digests
**Segment:** `active_earner`, `first_sale`, `clicks_no_sale`
- **Deal admins:** daily (morning) WhatsApp/Telegram-style digest of the top 5 deals in their categories, with **ready-to-post affiliate links** pre-generated for them. This is the strongest habit driver because it saves them work.
- **Creators/bloggers:** weekly email with trending products, new merchants, and content ideas.
- **Everyone:** **Weekly performance report** (Monday email + app inbox): clicks, sales, earnings vs the previous week, best link, one specific suggestion ("Your Myntra links convert 2× better than Ajio, post more Myntra").
- Personalise with Liquid on user attributes plus catalog/business data recommendations.

### P5. Merchant & rate alerts (Relays)
Triggered by business-data changes, not by user behaviour:
- **Commission increase / flash rate** on a merchant → publishers with that merchant in `top_merchant_30d` / `intent_merchant` / `top_categories`.
- **New merchant launched** in their category.
- **Campaign paused/ended** → **must** notify everyone who linked it in the last 30 days, with alternatives. Silent link breakage is a major cause of trust churn.
- **Offer ending in 24h** for merchants they promote.

### P6. Sale-event calendar (seasonal spikes)
Build a reusable journey template per event: **T-7** (prep: "make your link list"), **T-1** (early-access deals), **Day 0** (live deals, hourly for deal admins), **mid-sale** (top sellers so far), **T+3** ("your sale results" recap).
Key Indian events: Flipkart Big Billion Days, Amazon Great Indian Festival, Myntra EORS & Big Fashion Festival, Diwali (**8 Nov 2026**), Black Friday/Cyber Monday, New Year, Republic Day sales, Holi, Independence Day sales, IPL season (credit cards/fintech).
Use **at-risk and dormant segments** too. Sale events are the best win-back hook ("Diwali is when publishers earn the most, come back").

### P7. At-risk early warning
**Trigger:** nightly attribute change to `at_risk`, or a live segment on a decline in `links_7d`.
- **Day 0:** "We noticed your links dropped this week." Personalised performance + one specific idea (new merchant, higher rate).
- **Day 3:** Show what they're missing: "Publishers in {{category}} earned ₹X more this week" plus a top deals digest.
- **Day 7:** Survey: "What's stopping you?" (1 tap: tracking issues / low commissions / no time / found another network / payouts slow). Route the answer: tracking → support ticket; commissions → rate alerts/bonus; payouts → payout FAQ.
- **Platinum/Gold:** create a task for the account manager (webhook to CRM/Slack) on Day 0.

### P8. KYC & payout friction
**Trigger:** `kyc_complete = false` AND (`available_balance` > 0 OR `Payout Threshold Reached`)
Sequence: in-app banner → email → push → WhatsApp at +1/+3/+7 days: "₹{{available_balance}} is waiting, add PAN & bank to withdraw." Do not repeat the balance in SMS (keep sensitive data out of SMS bodies).

### P9. Win-back for dormant & lapsed publishers
| Segment | Hook | Channel/cadence |
|---|---|---|
| Dormant with **unwithdrawn balance** | "₹{{available_balance}} is still in your account" | Email + push + WhatsApp. This is the strongest hook. |
| Dormant 45–90d | "What's new": new merchants, higher rates, new tools (e.g. Telegram auto-converter) | Email biweekly + push; spike during sale events |
| Lapsed 120d+ | One sale-event campaign per quarter | Email only. Suppress after 2 quarters of no engagement to protect deliverability. |
| `never_activated` | Monthly "start with {{intent_merchant}}" + success story | Email only |

Optional, if the business case holds: a **reactivation bonus** (e.g. extra % on first sale within 14 days) for Gold+ dormant users only, tested against a control.

### P10. Advocacy & referral **[verify program]**
**Trigger:** `Payout Processed` (they are happiest here) or `value_tier` upgrade.
"Refer a fellow channel admin and earn X." Also ask for app store ratings and testimonials. Ask Platinum publishers for case studies to use in P1/P2.

### P11. Tier progression (loyalty)
Monthly tier recompute → "You're now Gold: here's what that unlocks." Show the gap to the next tier in the weekly report. This is a cheap motivator even if perks are minimal (badges, early access, priority support).

---

## 6. Channel strategy

| Channel | Use for | Notes |
|---|---|---|
| **App push** | Real-time money moments, deal alerts, nudges | Highest reach on mobile-first users; ask for permission after first link, not at install |
| **Web push** | Desktop bloggers, dashboard users | Soft prompt after a meaningful action |
| **WhatsApp** | Earnings, payout, daily deal digest (deal admins), win-back | Opt-in required; pre-approved Meta templates; utility vs marketing template categories affect cost |
| **Email** | Weekly reports, education, onboarding, win-back | Warm up sending domain; SPF/DKIM/DMARC; suppress hard bounces and 6-month non-openers |
| **SMS** | Only critical: payout failed, OTP-adjacent account alerts | TRAI DLT templates & header registration needed; costly and low engagement |
| **In-app / on-site** | Onboarding prompts, tool discovery, NPS, banners for balance/KYC | No consent cost; best for logged-in returning users (the ~2.5k "login" searchers) |
| **App inbox** | Persistent copy of earnings and alerts | Gives users a record to refer back to |
| **Webhook → Slack/CRM** | Account-manager tasks for Platinum/Gold at-risk | |

### Guardrails
- **Global frequency cap:** e.g. max 1 push/day, 3 marketing messages/day across channels, 2 WhatsApp marketing/week (transactional excluded) **[tune with data]**.
- **Quiet hours:** no push/WhatsApp 10pm–8am IST. Exception: deal admins who opt in to "live sale alerts".
- **Channel priority** in journeys: in-app → push → WhatsApp → email → SMS, falling through if unreachable.
- **Consent & compliance:** record opt-in source and timestamp per channel. One-click unsubscribe. Align with India's DPDP Act consent requirements and TRAI DLT. Avoid gambling/fantasy promotions to segments where it isn't appropriate or permitted.

---

## 7. Content & personalisation

- **Language:** Hindi + English variants for push/WhatsApp, chosen by `preferred_language`, or by test.
- **Merchant-led creative:** lead with the merchant they came for, not "Cuelinks".
- **Proof:** anonymised earnings stories by publisher type ("Telegram admin, 5k members, ₹X/month").
- **Specific beats generic:** "Your Myntra links got 120 clicks but 1 sale; try these 5 high-converting Myntra products" beats "Check out today's deals".
- **Content library to build:** 60-sec tool videos (Telegram bot, extension, WP plugin, app), "best merchants by category" pages, sale-event playbooks, FAQ on tentative vs validated and cancellations.
- Store reusable blocks (header, earnings card, deal grid) as WebEngage templates. Use Liquid fallbacks (e.g. `{{ user.first_name | default: "there" }}`).

---

## 8. Experimentation & measurement

- **Universal Control Group (UCG):** hold out ~5% of publishers from all marketing journeys to measure overall program lift on MAEP and earnings.
- **Journey-level control:** 10% holdout on each new journey for its first 4–6 weeks.
- **Test backlog (in priority order):**
  1. Merchant-specific vs generic welcome (P1)
  2. In-session link converter vs email-only onboarding
  3. Push permission timing (install vs after first link)
  4. Daily vs alternate-day deal digest for deal admins
  5. "₹X from payout" framing vs "earn more today"
  6. Hindi vs English push copy
  7. WhatsApp vs email for weekly report
- **Dashboards (WebEngage Analytics: funnels, cohorts, journey reports + BI for earnings):**
  - Activation funnel by `intent_merchant` and `signup_source`
  - Weekly sign-up cohort → % earning by week 1/2/4/8/12
  - Stage transition matrix month over month (how many moved active → at risk → dormant, and back)
  - Channel health: reach, opt-in, CTR, unsubscribes, cost per reactivated publisher
- **Review cadence:** weekly journey review; monthly retention review with cohorts; quarterly segment/tier re-cut.

---

## 9. Roadmap

### Phase 0: this week (festive window is live; Diwali is 8 Nov)
1. Build a **Diwali sale-event campaign** (P6 template) for all active + at-risk + dormant segments, using existing data, even before the full event taxonomy is ready.
2. **Unwithdrawn-balance win-back** (P9) from a one-time backend export uploaded as a static segment.
3. **Campaign-paused alert** process (P5), even if manual at first.

### Phase 1: days 0–30 (foundation + activation)
- Implement identity, server-side sale/payout events, nightly attribute sync (Section 3).
- Define lifecycle stages and live segments; set up UCG.
- Launch P1 (welcome/activation) and P3 (earnings moments).
- Set up frequency caps, quiet hours, WhatsApp templates, DLT templates, email authentication.
- Baseline all KPIs from the last 6 months of cohorts.

### Phase 2: days 31–60 (habit + risk)
- Launch P2 (first sale), P4 (weekly report + deal digest), P7 (at-risk), P8 (KYC/payout).
- Load merchant business data; launch P5 Relays (rate up, new merchant, paused).
- Publisher-type survey at sign-up; begin first 3 A/B tests.

### Phase 3: days 61–90 (win-back, loyalty, optimisation)
- Launch P9 (win-back tiers), P10 (referral), P11 (tier progression).
- Account-manager webhooks for Platinum/Gold.
- First 90-day readout: MAEP lift vs UCG, cohort curves, channel ROI. Kill or iterate underperforming journeys.

### Beyond 90 days
- Predictive churn score (from link/click velocity) feeding P7 earlier.
- Next-best-merchant recommendation model per publisher.
- Cross-property programs with **DesiDime** and **Zingoy**: active deal posters and cashback power users are natural Cuelinks publishers (consent-respecting cross-promo only).

---

## 10. Ownership (suggested)

| Area | Owner |
|---|---|
| Event tracking & server API integration | Engineering (backend + app) |
| Segments, journeys, templates, testing | Retention/CRM marketer |
| Merchant/business data feed, rate changes | Partnerships/campaign ops |
| Content (videos, playbooks, copy in Hindi/English) | Content team |
| Platinum/Gold relationships | Publisher account managers |
| Dashboards & cohort analysis | Analytics |

---

## 11. Inputs needed from the team before build

1. Current baselines: monthly sign-ups, % approved, % with first link, % with first sale in 30 days, MAEP, monthly churn.
2. Which tools exist today (Telegram bot, Chrome extension, WP plugin, app, API, referral program) and their usage share.
3. Payout threshold, validation timelines per merchant, KYC requirements.
4. WebEngage plan entitlements: WhatsApp, Relays/business data, UCG, app inbox, and event/MAU limits.
5. Current consent state per channel (how many publishers are opted in to WhatsApp/push).
6. Commercial room for bonuses (reactivation bonus, tier perks).
7. Sale-event calendar and merchant rate changes planned for the next 3 months.
