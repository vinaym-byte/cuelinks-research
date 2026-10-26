# LetsEarn mobile audit kit

Claude Code drives the LetsEarn app on a real phone or emulator. It walks through each user journey screen by screen, saves screenshots, and writes a funnel report with ranked fixes.

This kit has to run on a laptop: the phone needs to be connected to the machine running Claude.

## 1. One-time setup (about 15 minutes)

```bash
git clone <this repo> && cd cuelinks-research/letsearn-mobile-audit
./setup.sh                                            # macOS / Linux
powershell -ExecutionPolicy Bypass -File .\setup.ps1  # Windows
```

The script installs Node.js 20+, `adb` and Claude Code if they're missing, then checks for a connected device.

**Phone (recommended):** go to Settings → About phone and tap *Build number* 7 times. Then go to Developer options, turn on **USB debugging**, plug the phone in and tap **Allow** on the prompt.
**Emulator:** in Android Studio's Device Manager, create a Pixel device with a *Google Play* image, install LetsEarn from the Play Store, and start the emulator.

## 2. Run an audit

1. Open LetsEarn on the phone and log in with a **test account**.
2. In this folder, run `claude`. The first time, approve the `mobile` MCP server and log in to Claude.
3. Type one of these commands:

| Command | Journey |
|---|---|
| `/signup-audit` | First launch → signup → home → first store click-out |
| `/clickout-audit [store]` | Find a store → store page → "Shop now" |
| `/earnings-audit` | Wallet: pending vs confirmed → withdrawal (stops before confirming) |
| `/referral-audit` | Refer & Earn → share message (never sends it) |
| `/full-funnel` | All four journeys plus one combined report with the top 10 fixes |
| `/compare CashKaro clickout` | The same journey on a competitor, compared side by side |

You can also just type what you want, e.g. *"Check the Myntra store page and tell me how to make the cashback offer clearer."*

Claude asks before each tap at first. Once you trust a flow, choose "don't ask again" for the tap/swipe tools in the prompt.

## 3. Output

Each run writes to `runs/<date>-<journey>/`: the screenshots, plus `report.md`, which follows `audit-template.md` (journey map, ranked findings, bugs, and the steps deliberately skipped). `runs/` is git-ignored because screenshots can contain personal data. Share the reports, not the raw screenshots.

## Safety rules (enforced in `CLAUDE.md`)

- Never completes purchases or withdrawals, never edits bank or UPI details, never sends referral invites.
- Opens at most one merchant redirect per journey, so it doesn't create fake affiliate clicks.
- Pauses for OTP, captcha and login. You complete them on the phone.
- Redacts names, phone numbers, balances and payout details in reports.

## iOS

iOS needs a Mac with Xcode. Use the iOS Simulator (this needs a simulator build from the dev team) or a real iPhone, following the [mobile-mcp iOS guide](https://github.com/mobile-next/mobile-mcp). The commands and reports work the same way.

## Troubleshooting

- **`adb devices` shows nothing:** try a different cable or USB port and set the USB mode to *File transfer*. Revoke USB debugging authorisations and plug the phone in again.
- **`/mcp` shows mobile as failed:** check `node -v` is 20 or later, then restart `claude`.
- **Claude taps the wrong place:** tell it which element you mean. It reads the on-screen element list but falls back to screen coordinates.
- **The app blocks the emulator:** use a real phone.
