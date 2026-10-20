---
batch: "2026-10-20 group the launch checklist into areas, with By area as the default view and Asks for Amber"
asked_by: "Alex, 2026-10-20"
branch: claude/sleepy-robinson-b8bf50
migration: "0044_checklist_areas.sql, then 0045_checklist_search_console_wait.sql after backup staging-2026-10-20-pre0045.sql (Downloaded, 3,649,742 bytes). 0044 first failed on staging with D1's 'too many terms in compound SELECT' and applied nothing, so it was rewritten one row per statement. 0044 ran after backup app/.state/staging-2026-10-20-pre0044.sql in the main checkout (Downloaded, 3,622,842 bytes, 8,247 inserts, 80 checklist items, loads into a fresh SQLite file with 43 tables). Rehearsed on that copy first: 66 items take an area with one audit row each, no launch item is left without one"
areas: [domain-email, access, content, payments, listings, search, readiness, build]
placed_beyond_the_brief:
  - "More reports and Report a listing go under Content and wording from Amber, as each waits on Amber's privacy policy line"
  - "Done launch items take the area they fit: real addresses under Domain and email, breed guides and Furry Freight under Content, the contact import, the send to all contacts, the description cleanup and the production database plan under Listings and data, failure alerts, the build plan notes and the checklist itself under Readiness and training"
  - "The 24 done build items (listing rules, approval, photo standard, the site design fixes) sit in an eighth area, Site and portal build, shown last"
  - "Of the Gate items only Stripe Connect fits a launch area (Payments). The rest group under Gate 1, 2 and 3 additions"
  - "Search Console access is a new item under Access to grant, split from the Search Console item so the three grants sit together. Amber's old part is archived, never deleted"
tasks:
  - {id: a1, task: "Migration 0044: areas table, area column, seeded areas, grant parts, Search Console access item", status: done, evidence: "checklist-test 82 of 82, including the migration on a database from before areas"}
  - {id: a2, task: "Routes accept and validate an area on add and edit, and return the areas", status: done, evidence: "lib/checklist.js; route checks in checklist-test"}
  - {id: a3, task: "By area default view, area summary line, Asks for Amber with Copy as text, area in the editor", status: done, evidence: "admin/public/checklist.js v=6, checklist-areas.js v=1, checklist.css v=6"}
  - {id: a4, task: "Drift check compares areas; every workplan item carries an area except A16", status: done, evidence: "ops/checklist.mjs; workplan rules line and E6"}
  - {id: a5, task: "Full local test run after a reset", status: done, evidence: "checklist 83, launch-features 156, admin-features 113, signin 48, focus 11, alerts, jobs (after the daily schedule), e2e, access, restore, demo, google, wix-import all pass; legal-staging 19 of 19 then a Node exit crash. Two failures outside this work: portal-features 121 of 122 (breed colors come only from migration 0009, which a reset does not apply) and publish 130 of 131 (the breed heading price range, in the site generator, which this branch does not touch)"}
  - {id: a6, task: "Back up staging D1, apply 0044 and 0045 on staging, deploy admin and portal", status: done, evidence: "portal 04bfd070, admin redeployed with each style change; staging areas match the rehearsal: 66 items, 67 edit audit rows, no launch item without an area"}
  - {id: a7, task: "Check at 1440 and a true 375, screenshots to Alex", status: done, evidence: "Claude in Chrome was signed in to staging, but this session was not in view, so Chrome and the built-in pane froze the page as a background page. Measured instead in headless Chrome over CDP against the local admin on the same code and the same checklist rows: area rows 44px and item rows 42px at 1440, page width 375 with nothing past the edge at 375, text contrast 5.71 to 15.13 on the white headings"}
  - {id: a7b, task: "Panel treatment and design-pass match, asked by the Website session for Alex", status: done, evidence: "board and strip use the panel corner and white headings, shared page heading with lede, shared 40px controls, table-style column headings, pill font matched; before and after beside the Overview"}
  - {id: a8, task: "Merge into main, redeploy from main", status: done, evidence: "main fast-forwarded to 949221a, then 2d6d94f (README); portal 77127107 and admin 1d73e001 deployed from main 949221a"}
---

The open launch work was about 40 separate rows. Grouping by area shows which items are handled
together, so the domain move, the email account and its records go as one piece of work, and the
three grants Amber gives go to her as one request.
