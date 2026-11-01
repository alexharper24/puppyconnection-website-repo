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
  - {id: r1-plan, status: done, evidence: "102 puppies, not 104: Alexa and Ash left out because luke.blakeslee replaced every photo on both in the admin at 01:30-01:33 UTC 2026-11-01. Those two held the only 15 portal uploads in the set, so no portal upload is touched. Plan by app/ops/wix_photo_refresh.py"}
  - {id: r2-fetch, status: done, evidence: "724 originals fetched, 0 failures; 672 stored as the original, 52 as Wix's rotated copy (all EXIF orientation 6, each matched to its turned original at correlation >= 0.9)"}
  - {id: r3-check, status: done, evidence: "contact sheets and check.html in app/.state/wix-photo-refresh/sheets. 16 images on 7 puppies left out (badges on Florence, Matilda, Webster, Sage; photographed OFA certificates with a person's name and address on Jo, Lawrence, Meg), reasons in overrides.json. photo_copies.py now converts colour profiles to sRGB (628 of 708 were wide gamut). No sideways photos, frames or crops that lose a head"}
  - {id: r4-cap, status: done, evidence: "_harvest/harvest.py 10 to 15, _harvest/prod.py 12 to 15. The portal and admin limit is the max_photos setting, 12 in production, left for Alex"}
  - {id: r5-upload, status: done, evidence: "2,832 new R2 objects under new keys (<puppy id>-wx-<media hash>); nothing overwritten or deleted"}
  - {id: r6-migration, status: done, evidence: "0083_wix_photo_refresh.sql, PR 111; rehearsed PASS twice on production-2026-11-01-pre0083.sql and again on production-2026-11-01-pre0083-apply.sql (Downloaded): 708 rows added, 714 removed, photos 2689 to 2683, audit_log +102"}
  - {id: r7-apply, status: done, evidence: "Applied by Claude 2026-11-01 with app/ops/d1-apply.mjs after backup production-2026-11-01-pre0083-apply.sql, 67 of 67 batches; read back photos 2683, -wx- rows 708, max per puppy 15; site published; live Apple page shows the nine current Wix photos upright and every file answers 200"}
open_for_alex:
  - {id: r8-max-photos, status: done, evidence: "Alex asked for 15 on 2026-11-01; set in the admin settings and read back 15", item: "Raise the max_photos setting in the admin from 12 to 15, or a breeder whose puppy now holds 13-15 photos cannot add one"}
  - {id: r9-photo-clock, status: open, blocked_on: alex, item: "Whether a refresh from Wix counts as a new photo for last_photo_at (the photo-clock reminders); left unchanged"}
  - {id: r10-flags, status: open, blocked_on: alex, item: "Kept as Wix has them: name text printed on photos (Autumn, Bubbles, Spencer, Vanilla; lead photos of Cuddles, Pleasant, Sunny, Trooper), Lilac photo 8 at 204x202, Tina photo 16 blue cast, tiny dog in wide frame (Joshua Cavalier 4, 6, 8; Moe 8), the same file on several listings within a breed group"}
---

