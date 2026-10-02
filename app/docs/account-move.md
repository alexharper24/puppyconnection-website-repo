---
doc: account-move
written: 2026-10-02
objective: "Move the Puppy Connection test deployment (portal, admin, site, database, photo bucket) out of Alex's main Cloudflare account into the Puppy Connection account"
why: "Alex, 2026-10-02: each project gets its own account, as Teapup and Sweet Puppy Paws did on 2026-10-01 (teapup-website-repo/docs/account-move.md)"
status: "MOVED, waiting on A5. New copy deployed and refusing strangers; Alex signs in once, then the old Workers come off their URLs (C7)"
from_account: "Alex's main account (the Teapup one before its move)"
to_account: "Puppy Connection, created by Alex 2026-10-02, visible to wrangler. Zero Trust team dry-snowflake-0e9c (Cloudflare's default name, the suggested puppyconnection was not chosen)"
inventory_checked: 2026-10-02
inventory:
  workers:
    - {name: puppyconnection-portal, url: "https://puppyconnection-portal.alexharper.workers.dev", deploys: "wrangler deploy --config wrangler.hosted.jsonc, by hand"}
    - {name: puppyconnection-admin, url: "https://puppyconnection-admin.alexharper.workers.dev", deploys: "by hand. Waiting on Access, refuses everyone today"}
    - {name: puppyconnection-site, url: "https://puppyconnection-site.alexharper.workers.dev", deploys: "by hand, after node dev/build-site.mjs"}
  d1: {name: puppyconnection, rows: "seed of 204 listings, one breeder signed up through the portal, two operators (Alex and the test Amber)"}
  r2: {name: puppyconnection-files, uploaded_objects_2026_10_02: 0}
  secrets: "none in use. TEST_GATE was deleted from all three on 2026-09-30 and 2026-10-02"
  access: "none yet. The admin was waiting on a workers.dev Access application in the main account, which now goes in the new account instead"
  not_needed: "No GitHub token and no Workers Builds, because nothing here publishes to a repo yet"
decisions:
  - {id: P-D1, status: "closed 2026-10-02, the suggestion (Alex)", item: "workers.dev subdomain for the new account. Suggested puppyconnection"}
  - {id: P-D2, status: "closed 2026-10-02, the suggestion (Alex)", item: "Worker names. Suggested portal, admin and site, giving portal.<subdomain>.workers.dev and so on"}
  - {id: P-D3, status: "closed 2026-10-02, the suggestion (Alex)", item: "Admin sign-in methods. Email code (one-time PIN) as the new Teapup account uses, with Google optional and needing a Google OAuth client"}
  - {id: P-D4, status: "closed 2026-10-02, the suggestion (Alex)", item: "Who does the dashboard work. Suggested the Teapup arrangement, Alex signs Chrome in to Cloudflare and Claude works there, except card entry and deletions"}
alex_steps:
  - {id: A1, status: "done 2026-10-02", evidence: "Puppy Connection listed by wrangler whoami", item: "Create the account"}
  - {id: A2, status: "done 2026-10-02", evidence: "Alex: zero trust and r2 are both activated; Access redirect answers from dry-snowflake-0e9c.cloudflareaccess.com", item: "Turn on Zero Trust (Free) in the new account and choose a team name, suggested puppyconnection, entering a payment method if Cloudflare asks"}
  - {id: A3, status: "done 2026-10-02", evidence: "Alex: zero trust and r2 are both activated; bucket puppyconnection-files created", item: "Turn on R2 in the new account, or approve Claude doing it. It is free at this size but asks for terms acceptance"}
  - {id: A4, status: "done 2026-10-02", evidence: "Alex: yes on recommendations", item: "Answer P-D1 to P-D4"}
  - {id: A5, status: open, item: "Sign in to the new admin once to prove it"}
  - {id: A6, status: open, item: "After the new copy passes, delete the three old Workers, the old database and the old bucket from the main account"}
claude_steps:
  - {id: C1, status: "done 2026-10-02", evidence: "old D1 exported to app/.state/move/old-export.sql, 2,075 inserts", item: "Export the old D1 to a gitignored file"}
  - {id: C2, status: "done 2026-10-02", evidence: "new D1 4556bf68 and R2 puppyconnection-files; 22 of 22 table and view counts identical (app/.state/move/compare.mjs); bucket had 0 uploads to copy", item: "Create the D1 and R2 in the new account, import, and compare row counts table by table"}
  - {id: C3, status: "done 2026-10-02", evidence: "account_id pinned in all three wrangler.hosted.jsonc, database 4556bf68, origins on puppyconnection.workers.dev, PORTAL_URL in _harvest/pages.py", item: "Pin account_id in the three wrangler.hosted.jsonc, update the database id, origins and Worker names, and the PORTAL_URL on the list-with-us page"}
  - {id: C4, status: "done 2026-10-02", evidence: "portal and site 200, admin deployed (version c07bc6b0)", item: "Deploy the three Workers to the new account"}
  - {id: C5, status: "done 2026-10-02", evidence: "reusable policy Puppy Connection admin operators (Emails include Alex), One-time PIN login method added, self-hosted application Puppy Connection admin on admin.puppyconnection.workers.dev, ACCESS_TEAM_DOMAIN dry-snowflake-0e9c and ACCESS_AUD from the redirect kid, admin redeployed", item: "Create the admin Access application with Alex's address, set the sign-in methods, and put the team domain and audience in the admin config"}
  - {id: C6, status: "partly done 2026-10-02", evidence: "portal 200, site 200 with live data.js, admin / and /api/stats both 302 to Access, a forged Cf-Access-Jwt-Assertion also 302. Waiting on A5 for the sign-in. e2e.mjs not run against the new copy because Access fronts the admin; it passed locally and against the old hosted copy with the same code, and the data matched table by table", item: "Verify. Portal and site open, the admin refuses strangers and lets Alex in, the journey test passes against the new copy, and its test data is removed afterwards"}
  - {id: C7, status: open, item: "Take the old Workers off their URLs so nobody tests the old copy by mistake"}
  - {id: C8, status: open, item: "Update the READMEs, state file and memory with the new addresses"}
---

# Moving Puppy Connection to its own Cloudflare account

This is smaller than the Teapup move. Nothing publishes to GitHub yet, so there is no token
or build to move, and the photo bucket holds no uploads. The old copy stays running until the
new one passes, and nothing is deleted on the day.
