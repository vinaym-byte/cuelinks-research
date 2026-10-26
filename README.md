# cuelinks-research

## Google Search Console

`gsc/gsc.py` pulls Search Console data with a read-only OAuth refresh token.

Credentials come from environment variables set in the cloud environment settings (never commit them):
`GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REFRESH_TOKEN`, and optionally `GSC_SITE_URL` (default property).

Accessible properties: `https://www.cuelinks.com/`, `https://www.desidime.com/`, `https://www.zingoy.com/`.

```bash
python gsc/gsc.py sites
python gsc/gsc.py query --site https://www.cuelinks.com/ --dims query --limit 50
python gsc/gsc.py query --dims page,device --start 2026-09-01 --end 2026-09-30 --out data/pages.csv
```

Dimensions: `query, page, country, device, date, searchAppearance`. Data lags ~3 days and goes back 16 months.
Exported CSVs go in `data/`, which is git-ignored.

## LetsEarn mobile audit

`webapp-audit/` runs test signups and the post-signup journey on cuelinks.com; see its README.

`letsearn-mobile-audit/` is a kit that lets Claude Code drive the LetsEarn app on a connected phone, walk the user journeys and write funnel reports. See its README.
