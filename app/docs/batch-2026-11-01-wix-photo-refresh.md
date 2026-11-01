---
batch: wix-photo-refresh
asked_by: Alex
asked_on: 2026-11-01
ask: "refresh the 104 and raise the cap to 15. be sure when you bring the new photos over, we ensure that each of the photos is cropped correctly ... issues we've had in the past where photos are not cropped correctly or brought over cleanly"
source: app/docs/wix-photo-review-2026-11-01.html, scratchpad photocheck/classified.json (kind replaced, availability not placed, state published)
rules:
  - Keep every photo a breeder uploaded in the portal (external_url NULL).
  - Our Wix-sourced photos for each puppy are replaced by Wix's current photos, in Wix's order, up to 15.
  - Originals from Wix with the /v1/ rendition removed, never a Wix cropped copy; EXIF rotation honored; sRGB.
  - Served copies (1600 WebP, 640 card, 1200 og JPEG) and a focus point made the same way as copy-wix-photos.mjs and photo_copies.py.
  - Every new photo checked on a contact sheet at the site's card shapes before the database changes.
  - Production D1 write is a migration with backup and two rehearsals; Alex applies it unless his allow rule is in.
tasks:
  - {id: r1-plan, status: done, owner: "subagent worktree agent-ad940e71, branch feat/wix-photo-refresh", evidence: "app/ops/wix_photo_refresh.py plan on production-2026-11-01-plan0083.sql (Downloaded): 102 puppies, 724 new photos, 186 kept, 707 rows dropped, 59 media skipped (videos and account d5ac96). Alexa and Ash left out, an operator replaced their photos by hand 2026-11-01T01:30Z", item: "List the 104 puppies, current Wix photo ids (up to 15), and our photo rows to drop or keep"}
  - {id: r2-fetch, status: in_progress, evidence: "724 fetched, 0 failed, 672 originals, 52 Wix rotated copies (EXIF 6)", item: "Download originals and build served copies into app/.state, nothing in R2 yet"}
  - {id: r3-check, status: open, item: "Contact sheets at 3:2, 4:5 and 1:1 crops for every new photo, plus a table of orientation, size and method per photo; flag anything off"}
  - {id: r4-cap, status: in_progress, item: "Raise the 10-photo cap to 15 wherever the import or portal applies it"}
  - {id: r5-upload, status: open, item: "Put the files into R2 under new keys only"}
  - {id: r6-migration, status: open, item: "Migration that swaps the photo rows, rehearsed twice on a fresh backup"}
  - {id: r7-apply, status: open, blocked_on: alex, item: "Apply the migration, publish, and check a sample of live puppy pages"}
---
