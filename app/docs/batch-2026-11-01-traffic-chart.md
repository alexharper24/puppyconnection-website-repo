---
batch: 2026-11-01-traffic-chart
started: 2026-11-01
asked_by: Alex, 2026-11-01
branch: claude/loving-khayyam-100c96
read_first: [_claude-state.md, app/docs/batch-2026-10-31-launch-eve.md]
rules:
  - "d1-migration skill: backup confirmed Downloaded, two rehearsals with foreign keys on, apply with app/ops/d1-apply.mjs"
  - "Test in app/dev and a local admin, never the live admin"
  - "Reports is owner-only in the admin's STAFF_ALLOWED list, so the chart stays owner-only"
glossary:
  puppy pages: "puppy-<slug>.html, counted in puppy_stats since plan P2.5"
  other pages: "every other public page (home, puppies list, breeds, breed, breeder, guide and the rest), counted in page_stats from this deploy"
  view: "one page load, once per address per page a minute, staff browsers (pc_staff) and bots left out"
  click: "on a puppy page, a breeder contact or website link; on another page, a phone, email or off-site link"
tasks:
  - {id: c1-schema, status: done, item: "page_stats (page, day, views, clicks) and traffic_daily (day, kind, views, clicks), plus a day index on puppy_stats, in schema.sql and migration 0088"}
  - {id: c2-beacon, status: done, evidence: "traffic-test 23 of 23; local static site Worker: index, about, breed, guides counted, no-such-page, puppy- as a page, ../etc, a repeat and Googlebot refused", item: "lib/stats.js counts page views and clicks for every page that is not a puppy page, the page checked against the site's assets, and writes traffic_daily with each puppy and page count"}
  - {id: c3-site-js, status: done, evidence: "local build of 348 pages: breeds.html sent a view and a tel: click; with pc_staff=1 breeders.html sent nothing; a puppy page sent one beacon, its own", item: "generate.mjs appends the page counter to js/main.js, which every page loads; puppy pages keep their own beacon"}
  - {id: c4-admin-api, status: done, evidence: "local admin on 8852: totals by kind, top pages mixed and by kind, bad date and kind answer 400; not in STAFF_ALLOWED", item: "GET /api/reports/traffic (daily totals by kind) and /api/reports/traffic/top (top pages for a date range), owner-only"}
  - {id: c5-chart, status: done, evidence: "local admin at 1100 and 390 px with five months of stubbed totals in the tab: day 30 bars, week 21, month 5, bar click selects, no sideways scroll at 390", note: "Series colors #4e7a3a and #b8862b pass the dataviz validator on white. Admin is light only, so there is no dark variant", item: "Inline SVG chart on Reports: per day, week or month; views or clicks; stacked puppy and other pages with the total on each bar; click a bar for its top pages; note that other-page counts start at the deploy"}
  - {id: c6-prelaunch, status: done, closed: 2026-11-01, applied: "d1-apply --remote at 20:51 UTC before the site deploy, and again at 20:58 after a second backup (production-2026-11-01-pre0088-second.sql, Downloaded, rehearsal PASS) to take in the puppy counts between. Read back: 0 rows before 2026-11-01 in puppy_stats and breed_searches, 2 audit rows, 2026-11-01 puppy rows 53 with 103 views and 3 clicks, traffic_daily puppy 103 and 3", evidence: "Backup production-2026-11-01-pre0088.sql Downloaded. rehearse_migration PASS (puppy_stats 71 to 49, breed_searches 8 to 6, audit 2 rows, second run 0 changes, 0 FK violations); d1-apply --sqlite twice: traffic_daily 2026-11-01 puppy 98 views 3 clicks; removed 22 rows 44 views 1 click 2026-10-30 to 31, and 2 breed rows (3 picks) on 2026-10-31", item: "Migration 0088 removes puppy_stats and breed_searches rows dated before 2026-11-01 and fills traffic_daily from the rows kept"}
  - {id: c7-test, status: done, note: "launch-features and portal-features suites not run, because they need 8787 and 8788, which other sessions hold", item: "Tests in app/dev, local site beacon and local admin at desktop and 390 px"}
  - {id: c8-ship, status: done, deployed: "PR 128 (34db802), admin 11472c73 with wrangler.production.jsonc, site repo 93ea854; live about.html loads js/main.js?v=f952eeb1 with the page counter at 20:57 UTC", open: "No page_stats row yet at 20:59 UTC; the site had no visits in those two minutes (puppy views unchanged). Check page_stats on the next session", item: "PR, merge, admin deploy, site repo sync, migration applied and read back"}
  - {id: c9-report, status: done, evidence: "https://claude.ai/artifact/5W5SA7uw8CfDfBMu9dAuFm", item: "Screenshot and short description of the chart for Alex"}
excluded: []
---

# Traffic chart and pre-launch count removal

Judgment calls, 2026-11-01:

- The chart reads traffic_daily, a row a day for each kind of page, rather than summing page_stats, so a year per month reads about 2,200 rows rather than every page row.
- Puppies for sale (the list page) is under other pages, because it is not a puppy page and the chart splits puppy pages from the rest.
- The beacon checks a page name against the site's assets with a HEAD request, which costs no database read, so a forged name never becomes a row.
- The admin is light only, so the chart has no dark colors.
