---
batch: 2026-11-10-parent-photos
asked_by: "Alex 2026-11-10: Can you apply the photo checker and the face tap option to the moms and dads as well?"
read_first: [app/docs/batch-2026-11-04-photo-focus.md, app/docs/batch-2026-11-01-breeder-journey-fixes.md, app/lib/photocheck.js, app/lib/focusedit.js, app/portal/public/facepick.js]
found:
  already_done: "2026-11-01 j4 (PR 125): the portal upload runs screen() (1,000 px floor, dark asks first) and checkParentPhoto (floor plus the Workers AI check) and never stores a failing photo. Staff reach the same route through Manage as this breeder"
  missing: "The admin has no parent photo upload or Face. parent_dogs has no size or focus columns, so the site crops every parent photo at the center. The portal has no Face for a parent"
  site_crop: "A parent photo shows only on the puppy page's parent card (generate.mjs parentCard), drawn from the card copy at aspect-ratio 4/3 with object-fit cover at every width (css/style.css .parent-card img). So the dialog previews one 4:3 card, not the puppy 4:5 and 3:2 pair"
  production_parents: "Read 2026-11-10: 8 parents, all 8 with a photo, all 8 on public litters (Sweet Puppy Paws, Mervin Fry and two other kennels)"
tasks:
  - id: p1-migration
    status: done
    closed: 2026-11-10
    progress: "migrations/0095_parent_photo_focus.sql, runs once (ALTER), and schema.sql. Not applied to production yet"
    item: "Migration adding photo_width, photo_height, focus_x, focus_y to parent_dogs, and carrying them in public_parents. schema.sql in step"
  - id: p2-upload-check
    status: done
    closed: 2026-11-10
    progress: "lib/parents.js storeParentPhoto and storeParentCard, called by both apps. The browser rules moved from portal.js screen() into portal/public/photoscreen.js, copied to the admin by dev/setup.mjs, so both apps run one copy. The admin gets the AI binding and PHOTO_CHECK_MODE ai in its hosted and production configs, because without the binding photoCheckMode() is off and every staff photo would pass unjudged"
    item: "One shared upload in lib/parents.js for the portal and the admin: checkParentPhoto, then store with the measured size and the detector point (lib/focus.js). Admin gets Add or Replace photo on each mom and dad, through the same check"
  - id: p3-face
    status: done
    closed: 2026-11-10
    progress: "facepick.js takes what and cards. lib/focusedit.js parentFocusStmt. PUT /api/parents/:id/photo/focus in the portal (owned() so another breeder gets 404) and the admin (STAFF_ALLOWED). Face is gold until a point is set, with an extra rule for the admin's text-link row buttons. Assets portal.css v46, portal.js v56, admin.js v64, facepick.js v2, photoscreen.js v1"
    item: "Tap the face on parent photos: facepick.js takes the card shapes to preview, PUT /api/parents/:id/photo/focus in the portal (owner only) and the admin (staff allowed) through lib/focusedit.js, Face in gold when no point, and the dialog opens by itself after an upload"
  - id: p4-site
    status: done
    closed: 2026-11-10
    progress: "shape.js carries w, h, fx, fy with the puppy framing fallback, generate.mjs parentPos() writes object-position for the 4:3 card. Needs the site repo sync after merge"
    item: "shape.js carries the parent photo's size and point, and generate.mjs places the 4:3 parent card crop with objectPosition()"
  - id: p5-tests
    status: done
    closed: 2026-11-10
    evidence: "Local Workers on 8787 and 8788 from a fresh setup.mjs. parents-docs-test 75 of 75, access-tests all 13 groups pass with setParentFocus attacked (404), admin-features-test 167 of 167 with the staff mom photo checks, focus-test 11 of 11. portal-features-test 117 passed and 10 failed, all from the site Worker on 8791 not running and the breed colors only migration 0009 loads, which the README says a fresh setup fails. Browser pane at 390 px: portal parent upload opened Face by itself with the one 4:3 card, the tap saved 0.788, 0.328 with size 1500 by 1000, Face left gold; admin Face gold before a point, dialog 354 px wide, an 800 px photo refused in the browser, a passing upload opened Face by itself"
    item: "access-tests.mjs: another breeder cannot set the focus of a parent photo. Portal and admin tests for upload check, focus set and refused point. Browser check of a parent upload and Face at 390 px"
  - id: p6-backfill
    status: done
    closed: 2026-11-10
    progress: "8 photos measured from the public site (no R2 writes) with the dev/photo-focus detector on each card copy. 7 have a dog found. Lake Sai's Rogue's Inferno Of The Maples (682 by 1024) has none, and the live card cuts his head off, so his point is set by hand at 0.5, 0.3, which keeps the head from about 14% of the height inside a window of 5% to 55%. Foxy Rose's ears touch the top of the live card and the detector point clears them. Crop sheets in the session scratchpad. app/ops/parent_photo_backfill.py wrote migrations/0096"
    item: "Size and detector point for the 8 existing parent photos (measure from R2, dev/photo-focus Worker), crops checked as images, faces set by hand where the detector misses, as one migration through the d1-migration skill"
  - id: p7-ship
    status: done
    closed: 2026-11-10
    evidence: "PR 170 merged (aab046b). Backup production-2026-11-10-pre0095.sql Downloaded (main checkout app/.state). Rehearsal: 0095 run 1 changed parent_dogs only, run 2 stopped on duplicate column as its header says (as 0094 did), 0 key violations; 0096 on the backup plus 0095 PASS, run 1 8 parents, 8 audit rows and the marker, run 2 no change. d1-apply 0095 1 of 1 and 0096 1 of 1. Read back: all 8 public_parents have size and point, Lake Sai's at 0.5, 0.3, 8 parent.photo.focus audit rows, public_documents 2 before and after, publish ran (dirty 0, generation 964). Portal 016ff580 and admin d45a73e1 deployed from main with wrangler.production.jsonc, the admin with env.AI. Site repo 9428ff2 (sync changed build/generate.mjs only). Live puppy pages: Macy 0% 50%, Chuckie 50% 9.6%, Foxy Rose 50% 36.1%, Lake Sai's 50% 10%"
    found: "A site repo clone made with the global core.autocrlf true shows 83 of 250 files changed on --check. Clone with -c core.autocrlf=false and only the real change shows"
    item: "PR merged to main, migrations applied with backup and two rehearsals, portal and admin deployed with wrangler.production.jsonc, site published, live check"
---

# Parent photos, 2026-11-10

Decisions are recorded here as they are made.
