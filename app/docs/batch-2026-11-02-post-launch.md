---
batch: 2026-11-02-post-launch
started: 2026-11-01
asked_by: Alex, 2026-11-01 (after the Wix photo refresh and launch)
read_first: [_claude-state.md, app/docs/batch-2026-10-31-launch-eve.md, app/docs/batch-2026-11-01-wix-photo-refresh.md, app/docs/legacy-search-check-2026-11-01.md]
tasks:
  - id: n1-photo-clock
    status: done
    closed: 2026-11-01
    evidence: "PR 114 merged (4fa579f), portal ca4cdcdb, admin 96ba1ff9. 0084 applied with d1-apply after production-2026-11-01-pre0084.sql, 7 of 7 batches. Read back: photo_clock_stop 1, 9 at reminded_1, 166 backfill audit rows, Emerald last_photo_at 2026-09-12, 0 offline or removed. Emerald's warning and email go with the daily run at 13:00 UTC on 2026-11-02"
    progress: "Code: setting photo_clock_stop (1 = stop at the first warning, no offline date, never offline or removed; a listing past six weeks by its own photo is warned at once despite the go-live hold). launch-features inactivity 40 of 40, email-html 277. Migration 0084 from production-2026-11-01-pre0084.sql (Downloaded on the second try after auth error 10000): 168 listed, 166 clocks move, 9 never-signed-in overdue listings warned in the migration, Emerald (Teapup, signed in) warned with the email by the next daily run. Rehearsed twice (rehearse_migration PASS, second run 0 changes) and through d1-apply --sqlite. Generator app/ops/photo_clock_backfill.py. Judgment call: the portal notice shows for the never-signed-in breeders on their first sign-in"
    item: "Backfill puppies.last_photo_at with the real newest photo date (Wix Last-Modified for Wix photos, created_at for portal uploads), keeping the photo_clock_start hold of 2026-11-01. Listings whose real date is past 6 weeks (5 listings) or past 12 weeks (5) must NOT go offline or be removed for now. They get the warning: a notice in the breeder portal and, where the breeder has signed in, the warning email. Amber decides each one by hand. Needs a setting or rule so the clock stops at the warning stage (stops short of offline and removed) until Alex lifts it."
    inputs: "app/.state/photoclock/newest.json (per listed puppy: newest date and its source), dates.py, lm.json (Last-Modified per Wix URL), rows.json (read 2026-11-01 from production)"
    measured: "168 listed puppies: 144 under 4 weeks, 14 at 4 to 6 weeks, 5 at 6 to 12 weeks, 5 over 12 weeks. Signed-in breeders only: 8, 2, 1, 0"
    rules: "d1-migration skill: backup, two rehearsals, apply with app/ops/d1-apply.mjs (Alex has allowed Claude to run it). lib/inactivity.js holds the clock; never-signed-in legacy breeders are skipped today, so decide with Alex whether the portal notice shows for them on first sign-in"
  - id: n2-crop-preview
    status: done
    closed: 2026-11-01
    evidence: "Migration 0086 (app/ops/crop_photos.py) applied with d1-apply after production-2026-11-01-pre0086.sql (Downloaded), rehearsed twice (PASS, second run 0 changes) and through d1-apply --sqlite. 147 cropped originals plus display, card and share copies put in R2 at <key>-crop32 (588 objects, originals kept). Read back: 147 rows on -crop32 keys, all aspect 1.5, 147 photo.crop_32 and 7 photo.remove audit rows, the seven non-photos gone, 266 public puppies. Live: 294 of 294 /media full and card files at the new size, the seven answer 404, publish generation 451 at 19:49 UTC with none of the seven on their pages. Browsers that already held a photo can show the old file for up to a day (max-age 86400, same address)"
    approved: "Alex 2026-11-01: the 4:3 and 5:4 to 3:2 crops look good. Leave out the seven non-photo images below, whatever he decides for them"
    not_photos: "Found 2026-11-01, both brought across from the old Wix listings. The Bentley stud poster (sire graphic, wixstatic 8d80ac_3e5dda73...) is photo 9 of Damon and photo 8 of Stephan, Premier Paw Pals Yorkies. AKC Bred with H.E.A.R.T. badges are photo 10 of Biscuit and Sage (Chain O' Lakes Companions, 8d80ac_a48f613b...) and photo 7 of Harriet, 11 of Saber and 9 of Sawyer (Perfect Match Poodles, 8d80ac_94e2b67b...). Alex 2026-11-01: take them off. Removed in 0086, files kept in R2 and whole rows in the audit log"
    progress: "Preview built 2026-11-01 by app/ops/crop_preview.py from production-2026-11-01-pre0085.sql, at app/.state/crop-preview/index.html (gitignored, images local). 154 photos of listed puppies (98 near 4:3 meaning 1.29 to 1.43, 56 near 5:4 meaning 1.17 to 1.29): 68 would cut the dog box the detector draws by more than 2% of the height, 9 have no dog found, 77 keep the whole box. Nothing cropped. Waiting on Alex's list"
    item: "Show Alex every photo a crop of 4:3 and 5:4 photos to 3:2 would change, before any crop is made. Build contact sheets or an HTML page with each photo as it is now beside the cropped version around its stored focus point (photos.focus_x/focus_y), flagging any crop that cuts a head or feet. Do not crop anything until Alex approves the list"
    measured: "Listed puppies 2026-11-01: 749 photos about 3:2, 102 at 4:3, 56 at 5:4, 207 square, 177 portrait, 102 with no size recorded"
  - id: n3-blur-fill
    status: done
    closed: 2026-11-01
    evidence: "PR 116 (2aa3b50), site repo bb50dc0. Live: puppy-adel-cavapoo.html serves slide is-on is-whole with style.css v91, its fill /media/seed-p-0274-img0/card answers 200, and all 14 card fills on puppies.html answer 200 (all 14 were 404 before)"
    progress: "Each photo in the puppy page frame is a .slide; a square or portrait one (aspect under 1.2, the card rule) is .is-whole with a blurred --fill, and a later photo's fill loads with it. Found and fixed with it: every card fill of a photo in R2 answered 404 live (a url() in a custom property resolves against css/style.css, so media/<id> was fetched as css/media/<id>); generate.mjs fillUrl() roots it and js/main.js makes it absolute. Local build from live data: 82 pages open on a whole photo, 548 later fills, card fills 200, crossfade and aria checked, 390 px no overflow, check_site 0 errors on the build. style.css v91, main.js v43"
    item: "Puppy page main photo (css .gallery-main, 3:2 with object-fit contain) shows plain side bands for square and portrait photos. Approved: leave them whole and put a blurred fill of the same photo behind, as the cards already do (.card-media.is-whole with --fill in generate.mjs). No crop for square or portrait"
  - id: n4-multi-main
    status: done
    closed: 2026-11-01
    evidence: "PR 115 (8233f66), portal 86d11fdc, admin 0fd48ee4. 0085 applied with d1-apply after production-2026-11-01-pre0085.sql (1 of 1 batch). Read back: 43 breeders, 15 with administrator@responsibledogbreeder.com as main contact, public_puppies 266 and public_breeders 41 as before, email no longer unique, breeders_copy gone, 0 orphaned puppies"
    follow_up: "Alex sends one invitation to the network address from any of the 15 kennels' Who signs in; its password then opens all 15. Replaces launch-eve t7"
    progress: "Migration 0085 rebuilds breeders without UNIQUE on email (copy, drop, recreate, refill, so deferred keys settle; the copy-then-rename pattern failed the rehearsal) and sets administrator@responsibledogbreeder.com as main contact of the 14 RDB kennels in place of their placeholder addresses. Rehearsed twice on pre0084 and pre0085 (PASS, second run 0 changes, 0 key violations) and via d1-apply --sqlite: 15 kennels on the address, public views 266 puppies and 41 breeders as before. Code: checkMakeMain and the admin email change no longer refuse a main contact of another kennel. multikennel 85 of 85, accounts 80, signin 26, admin-features 122; access-tests 9 of 10 with test 0 (static route list) failing on routes added by earlier PRs"
    item: "Let one address be the main contact of several kennels (approved by Alex 2026-11-01, for the RDB kennels, where one person is the main contact for all 14). breeders.email is UNIQUE (schema.sql line 9), so this is a table rebuild migration with foreign keys deferred. Also lift checkMakeMain's refusal (lib/accounts.js about line 386), recheck session revoke at accounts.js about line 370 (main sessions carry email NULL), the other-kennels count at about line 283, portal/worker.js line 493 and 572, and the admin's ability to set the main contact to an address already main elsewhere. kennelsFor already returns several main kennels"
    hazard: "WARNING: rebuilding breeders touches every table that references it. Rehearse on a fresh production export twice with foreign keys on"
  - id: n5-town-searches
    status: open
    blocked_on: alex
    progress: "Reported 2026-11-01 in app/docs/post-launch-reports-2026-11-01.html. Page per query not in the cache (Wix reports queries and pages apart; home page took 92% of page clicks Aug to Dec 2025). Saved Wix copy names no town, 273 saved listings carry no town, Business Profile service area is Ohio, Florida and 8 more areas (rest did not load). No live kennel is in Mishawaka, Elkhart or Lafayette. Proposal: breeder town on breeder and puppy pages, an Indiana page section naming real breeder towns near Elkhart and Mishawaka, Lafayette left out, ask Amber about the profile's service areas"
    item: "Find how the Wix site ranked for 'puppies for sale mishawaka' (43 clicks, position 3.1), 'lafayette indiana' (35, 3.4) and 'elkhart' (34, 5.2) over the last year: which Wix page got those clicks (Search Console page and query report for the old property, cached in hs-seo-data/puppyconnection), whether the copy named the towns, whether listings carried a breeder town, or whether the Business Profile did it. Then propose what the new site needs, such as breeder town on the breeder and puppy pages or state pages naming nearby towns, only where a breeder is really there. Report to Alex before building"
  - id: n6-breed-gaps
    status: open
    blocked_on: alex
    progress: "Reported 2026-11-01 in the same page. The cached figures are Aug to Dec 2025 (9,191 impressions, 15 clicks), not 365 days. Proposal: write the low-shedding guide and point the hypoallergenic address at it; set each breed's legacy-pages.tsv target to its own breed page now, since the generator falls back to breeds.html until that page is built"
    item: "Old breed pages for Pomsky, Miniature Pinscher, Basset Hound, Pug, Portuguese Water Dog and the hypoallergenic page now redirect to /breeds.html. About 9,000 impressions and about 15 clicks over the last 365 days in total (not per month). Propose: publish the low-shedding guide and point the hypoallergenic URL at it, and redirect each breed to its own breed page once a puppy of that breed lists. Ask Alex before building"
  - id: n7-https
    status: done
    closed: 2026-11-01
    evidence: "Always Use HTTPS turned on in Cloudflare for puppy-connection.com. curl: http apex, www and portal each 301 to https"
  - id: n9-designated-representative
    status: done
    closed: 2026-11-01
    asked: "Amber via Alex 2026-11-01: change speak to the breeder directly to connect with the breeder or their designated representative"
    evidence: "PR 121 merged (bc0f842), portal 21664f28, admin 32ab6cd0, site repo b49bd61. Live: home page 3 matches, how-it-works step 3 and breeder pages read Connect with this breeder. Meta descriptions add the sentence only when it fits 155 characters (withTail in generate.mjs), so cut descriptions 40 against 56 before. Left as they were: payments made directly to the breeder, transport arranged directly, the relationship statements on the about page, list-with-us (addressed to breeders) and the privacy page (legal text)"
  - id: n10-invite-kennel-list
    status: done
    closed: 2026-11-01
    asked: "Alex 2026-11-01: does one invitation to the RDB address tell them they have all the kennels"
    evidence: "It did already name every other kennel. PR 121 lists more than two one per line and drops the set-password page's 'once you open those invitations'. multikennel 85, accounts 80, signin 26, email-html 277"
  - id: n8-flagged-photos
    status: open
    blocked_on: alex
    item: "Alex is reviewing the flagged photos (app/.state/wix-photo-refresh/check.html and sheets/). Nothing in them is broken. Each is a photo kept exactly as Wix had it that a person may want to change: name text printed on the photo, a tiny or color-cast photo, a dog too small to see in a wide frame, or the same file on several listings. Act only on his list"
---

# Post-launch batch, 2026-11-02

Alex approved these on 2026-11-01. Do them in the order n1, n4, n2, n3, then n5 and n6 as reports. Update each task's status here as it lands. Merge and deploy Puppy Connection PRs without asking, but database writes follow the d1-migration skill.
