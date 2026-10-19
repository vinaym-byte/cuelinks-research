"""Minimal Google Search Console client using an OAuth refresh token.

Reads credentials from environment variables (never hard-code them):
  GSC_CLIENT_ID, GSC_CLIENT_SECRET, GSC_REFRESH_TOKEN, GSC_SITE_URL (optional default property)

Usage:
  python gsc/gsc.py sites
  python gsc/gsc.py query --days 28 --dims query --limit 50
  python gsc/gsc.py query --start 2026-09-01 --end 2026-09-30 --dims page,device --out data/pages.csv
"""
import argparse
import csv
import datetime as dt
import os
import sys
import urllib.parse

import requests

TOKEN_URL = "https://oauth2.googleapis.com/token"
API = "https://searchconsole.googleapis.com/webmasters/v3"
ROW_LIMIT = 25000  # API max per request


def access_token():
    missing = [v for v in ("GSC_CLIENT_ID", "GSC_CLIENT_SECRET", "GSC_REFRESH_TOKEN") if not os.environ.get(v)]
    if missing:
        sys.exit(f"Missing environment variables: {', '.join(missing)}")
    r = requests.post(TOKEN_URL, data={
        "client_id": os.environ["GSC_CLIENT_ID"],
        "client_secret": os.environ["GSC_CLIENT_SECRET"],
        "refresh_token": os.environ["GSC_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }, timeout=30)
    if r.status_code != 200:
        # Error body contains only an error code/description, no secrets.
        sys.exit(f"Token refresh failed ({r.status_code}): {r.json().get('error_description') or r.json().get('error')}")
    return r.json()["access_token"]


def check(r):
    if r.status_code >= 400:
        try:
            msg = r.json()["error"]["message"]
        except (ValueError, KeyError):
            msg = r.text[:300]
        sys.exit(f"Search Console API error {r.status_code}: {msg}")
    return r


def list_sites(token):
    r = check(requests.get(f"{API}/sites", headers={"Authorization": f"Bearer {token}"}, timeout=30))
    return r.json().get("siteEntry", [])


def query(token, site, start, end, dims, limit=None, search_type="web", filters=None):
    """Return all rows for the date range, paging past the 25k-per-request cap."""
    url = f"{API}/sites/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
    rows, start_row = [], 0
    while True:
        body = {
            "startDate": start, "endDate": end, "dimensions": dims, "type": search_type,
            "rowLimit": min(ROW_LIMIT, limit - len(rows)) if limit else ROW_LIMIT,
            "startRow": start_row, "dataState": "final",
        }
        if filters:
            body["dimensionFilterGroups"] = [{"filters": filters}]
        r = check(requests.post(url, json=body, headers={"Authorization": f"Bearer {token}"}, timeout=120))
        batch = r.json().get("rows", [])
        rows.extend(batch)
        start_row += len(batch)
        if len(batch) < body["rowLimit"] or (limit and len(rows) >= limit):
            return rows


def flatten(rows, dims):
    for row in rows:
        out = dict(zip(dims, row.get("keys", [])))
        out.update(clicks=row["clicks"], impressions=row["impressions"],
                   ctr=round(row["ctr"], 4), position=round(row["position"], 2))
        yield out


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("sites")
    q = sub.add_parser("query")
    q.add_argument("--site", default=os.environ.get("GSC_SITE_URL"))
    q.add_argument("--days", type=int, default=28, help="used when --start/--end are omitted")
    q.add_argument("--start")
    q.add_argument("--end")
    q.add_argument("--dims", default="query", help="comma list: query,page,country,device,date,searchAppearance")
    q.add_argument("--type", default="web", help="web, image, video, news, discover, googleNews")
    q.add_argument("--limit", type=int)
    q.add_argument("--out", help="CSV path; prints a table if omitted")
    a = p.parse_args()

    token = access_token()
    if a.cmd == "sites":
        for s in list_sites(token):
            print(f"{s['permissionLevel']:<22} {s['siteUrl']}")
        return

    if not a.site:
        sys.exit("No property given: pass --site or set GSC_SITE_URL")
    # GSC data lags ~2-3 days; end 3 days ago by default.
    end = a.end or (dt.date.today() - dt.timedelta(days=3)).isoformat()
    start = a.start or (dt.date.fromisoformat(end) - dt.timedelta(days=a.days - 1)).isoformat()
    dims = [d.strip() for d in a.dims.split(",") if d.strip()]
    rows = list(flatten(query(token, a.site, start, end, dims, a.limit, a.type), dims))

    if a.out:
        os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
        with open(a.out, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=dims + ["clicks", "impressions", "ctr", "position"])
            w.writeheader()
            w.writerows(rows)
        print(f"{len(rows)} rows ({start} to {end}) -> {a.out}")
    else:
        print(f"{a.site}  {start} to {end}  ({len(rows)} rows)")
        for r in rows:
            keys = " | ".join(str(r[d]) for d in dims)
            print(f"{r['clicks']:>8} clk {r['impressions']:>10} imp {r['ctr']*100:6.2f}% pos {r['position']:6.2f}  {keys}")


if __name__ == "__main__":
    main()
