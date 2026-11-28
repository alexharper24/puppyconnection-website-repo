---
batch: 2026-11-28-report-fixes
asked_by: Alex, 2026-11-27 evening
branch: claude/report-measures-fixes
tasks:
  - id: R0
    item: Put the 23 photos the old check held back on their listings (Alex approved)
    status: done
    evidence: migration 0104, backup production-2026-11-28-pre0104.sql Downloaded, rehearsed twice (PASS, second run no change), applied; read back 0 still held, 23 released, 23 audit rows, site marked to publish
  - id: R1
    item: A breeder's own visits to the site no longer count as views or clicks
    status: built
    note: the portal now sets the same no-count cookie the admin sets, on puppy-connection.com, so a browser that opens the portal is left out
  - id: R2
    item: Staff phones that never open the admin are left out of the counts
    status: built for staff who open the admin or Manage as (both set the cookie). A phone that only ever browses the site needs ?internal=1 opened once
  - id: R3
    item: The portal says families, and names Facebook and the deposit button as clicks
    status: built
  - id: R4
    item: Off puppy pages, a click counts only when it heads to a breeder
    status: built
    note: off puppy pages, only the contact list and the profile buttons on a breeder page count
  - id: R5
    item: Breeders see views and clicks of their breeder profile page in the portal
    status: built
  - id: R6
    item: The same 30 days in the portal and the admin, and the same puppies on both portal screens
    status: built
    note: admin last 30 days is now today and the 29 before; the portal Overview card now includes archived puppies, as Views and clicks does
  - id: R7
    item: Personal email addresses removed from the public docs in this repo
    status: built
    note: notes in app/docs and migration 0071 rewritten by role. Left in place because they are working config, the staging email allowlist (wrangler.hosted.jsonc) and the checklist signers (migration 0034, ops/checklist-seed.mjs, dev/checklist-test.mjs). Breeder business addresses are published on the site and stay. Git history still holds the old text
---

# Report fixes, November 28, 2026

From the What the numbers mean page (claude.ai artifact 2UfEAXFNvCecmkKBJLCXfr), where Alex asked
for all six fixes, plus the release of the held photos and the public-docs cleanup.
