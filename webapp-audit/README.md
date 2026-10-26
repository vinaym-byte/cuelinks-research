# Cuelinks web app audit

Test signups on cuelinks.com using a disposable mail.tm inbox and made-up "QA Test" details, then walk the post-signup journey.

```bash
CUELINKS_TEST_PHONE=<10-digit test number> node signup.js            # desktop
CUELINKS_TEST_PHONE=<10-digit test number> node signup.js --mobile   # mobile viewport
node journey.js runs/<run dir>                                        # confirm email, log in, walk logged-in pages
```

Without `CUELINKS_TEST_PHONE` the script fills the form and stops before submitting. Set the number as an environment variable in the cloud environment settings and never paste it into chat.

Every account is named `QA Test<NNNN>`, with company "QA Test - please delete" and website `https://www.paritycube.com/qa-test`, so ops can find and remove them and exclude them from the signup bonus. (example.com is rejected by the signup form's website check.) A `+91` prefix or spaces in `CUELINKS_TEST_PHONE` are stripped.

Each run writes to `runs/<timestamp>-<device>/` (git-ignored): screenshots, `account.json` (throwaway credentials), any emails received, and `state.json` (the logged-in browser session, used to continue the journey).

`journey.js` stops if Cloudflare serves its "Verify you are human" page. As of 2026-10-26 it does that for every logged-in page in headless Chromium, so the dashboard needs a manual pass or an allowlist for the test runner. See `REPORT-2026-10-26.md`.
