# Cuelinks web app audit

Test signups on cuelinks.com using a disposable mail.tm inbox and made-up "QA Test" details, then walk the post-signup journey.

```bash
CUELINKS_TEST_PHONE=<10-digit test number> node signup.js            # desktop
CUELINKS_TEST_PHONE=<10-digit test number> node signup.js --mobile   # mobile viewport
```

Without `CUELINKS_TEST_PHONE` the script fills the form and stops before submitting. Set the number as an environment variable in the cloud environment settings and never paste it into chat.

Every account is named `QA Test<NNNN>`, with company "QA Test - please delete" and website `https://www.example.com/qa-test`, so ops can find and remove them and exclude them from the signup bonus.

Each run writes to `runs/<timestamp>-<device>/` (git-ignored): screenshots, `account.json` (throwaway credentials), any emails received, and `state.json` (the logged-in browser session, used to continue the journey).
