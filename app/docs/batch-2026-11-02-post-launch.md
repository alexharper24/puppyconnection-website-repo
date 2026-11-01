---
batch: 2026-11-02-post-launch
started: 2026-11-01
asked_by: Alex, 2026-11-01 (after the Wix photo refresh and launch)
read_first: [_claude-state.md, app/docs/batch-2026-10-31-launch-eve.md, app/docs/batch-2026-11-01-wix-photo-refresh.md, app/docs/legacy-search-check-2026-11-01.md]
tasks:
  - id: n1-photo-clock
    status: open
    item: "Backfill puppies.last_photo_at with the real newest photo date (Wix Last-Modified for Wix photos, created_at for portal uploads), keeping the photo_clock_start hold of 2026-11-01. Listings whose real date is past 6 weeks (5 listings) or past 12 weeks (5) must NOT go offline or be removed for now. They get the warning: a notice in the breeder portal and, where the breeder has signed in, the warning email. Amber decides each one by hand. Needs a setting or rule so the clock stops at the warning stage (stops short of offline and removed) until Alex lifts it."
    inputs: "app/.state/photoclock/newest.json (per listed puppy: newest date and its source), dates.py, lm.json (Last-Modified per Wix URL), rows.json (read 2026-11-01 from production)"
    measured: "168 listed puppies: 144 under 4 weeks, 14 at 4 to 6 weeks, 5 at 6 to 12 weeks, 5 over 12 weeks. Signed-in breeders only: 8, 2, 1, 0"
    rules: "d1-migration skill: backup, two rehearsals, apply with app/ops/d1-apply.mjs (Alex has allowed Claude to run it). lib/inactivity.js holds the clock; never-signed-in legacy breeders are skipped today, so decide with Alex whether the portal notice shows for them on first sign-in"
  - id: n2-crop-preview
    status: open
    item: "Show Alex every photo a crop of 4:3 and 5:4 photos to 3:2 would change, before any crop is made. Build contact sheets or an HTML page with each photo as it is now beside the cropped version around its stored focus point (photos.focus_x/focus_y), flagging any crop that cuts a head or feet. Do not crop anything until Alex approves the list"
    measured: "Listed puppies 2026-11-01: 749 photos about 3:2, 102 at 4:3, 56 at 5:4, 207 square, 177 portrait, 102 with no size recorded"
  - id: n3-blur-fill
    status: open
    item: "Puppy page main photo (css .gallery-main, 3:2 with object-fit contain) shows plain side bands for square and portrait photos. Approved: leave them whole and put a blurred fill of the same photo behind, as the cards already do (.card-media.is-whole with --fill in generate.mjs). No crop for square or portrait"
  - id: n4-multi-main
    status: open
    item: "Let one address be the main contact of several kennels (approved by Alex 2026-11-01, for the RDB kennels, where one person is the main contact for all 14). breeders.email is UNIQUE (schema.sql line 9), so this is a table rebuild migration with foreign keys deferred. Also lift checkMakeMain's refusal (lib/accounts.js about line 386), recheck session revoke at accounts.js about line 370 (main sessions carry email NULL), the other-kennels count at about line 283, portal/worker.js line 493 and 572, and the admin's ability to set the main contact to an address already main elsewhere. kennelsFor already returns several main kennels"
    hazard: "WARNING: rebuilding breeders touches every table that references it. Rehearse on a fresh production export twice with foreign keys on"
  - id: n5-town-searches
    status: open
    item: "Find how the Wix site ranked for 'puppies for sale mishawaka' (43 clicks, position 3.1), 'lafayette indiana' (35, 3.4) and 'elkhart' (34, 5.2) over the last year: which Wix page got those clicks (Search Console page and query report for the old property, cached in hs-seo-data/puppyconnection), whether the copy named the towns, whether listings carried a breeder town, or whether the Business Profile did it. Then propose what the new site needs, such as breeder town on the breeder and puppy pages or state pages naming nearby towns, only where a breeder is really there. Report to Alex before building"
  - id: n6-breed-gaps
    status: open
    item: "Old breed pages for Pomsky, Miniature Pinscher, Basset Hound, Pug, Portuguese Water Dog and the hypoallergenic page now redirect to /breeds.html. About 9,000 impressions and about 15 clicks over the last 365 days in total (not per month). Propose: publish the low-shedding guide and point the hypoallergenic URL at it, and redirect each breed to its own breed page once a puppy of that breed lists. Ask Alex before building"
  - id: n7-https
    status: done
    closed: 2026-11-01
    evidence: "Always Use HTTPS turned on in Cloudflare for puppy-connection.com. curl: http apex, www and portal each 301 to https"
  - id: n8-flagged-photos
    status: open
    blocked_on: alex
    item: "Alex is reviewing the flagged photos (app/.state/wix-photo-refresh/check.html and sheets/). Nothing in them is broken. Each is a photo kept exactly as Wix had it that a person may want to change: name text printed on the photo, a tiny or color-cast photo, a dog too small to see in a wide frame, or the same file on several listings. Act only on his list"
---

# Post-launch batch, 2026-11-02

Alex approved these on 2026-11-01. Do them in the order n1, n4, n2, n3, then n5 and n6 as reports. Update each task's status here as it lands. Merge and deploy Puppy Connection PRs without asking, but database writes follow the d1-migration skill.
