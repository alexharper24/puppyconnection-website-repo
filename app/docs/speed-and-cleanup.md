---
batch: speed-and-cleanup
started: 2026-10-02
asked: "ensure all the efficiency pieces are in place to ensure pages, images, content loads quickly on arrival at the site and navigation through it. then proceed with cleanup of the old workers and config for both puppy connection and teapup / sweet puppy paws once confirmed everything in place on new accounts"
scope:
  speed: "The Puppy Connection site and the photos breeders upload through the portal. Teapup and Sweet Puppy Paws already run the site-image-pipeline build (WebP srcsets, focal points) and are not reworked here"
  cleanup: "Old copies in Alex's main account. Taking Workers off their URLs and disconnecting builds is Claude's. Deleting Workers, databases and buckets stays Alex's step (P-D4 and M-D5)"
measured_2026_10_02:
  data_js: "64 KB compressed, no-store, about 0.56 s, fetched again on every page"
  hero: "img/brand/hero-home.jpg 407 KB at 2400 px, eager, no srcset"
  logo: "img/brand/logo-white.png 275 KB, shown at 190 to 208 px in header and footer"
  uploads: "breeder photos stored and served at full size (up to 15 MB) in every card, because only Wix URLs get a resize transform"
  static_cache: "css, js and img served max-age=0 must-revalidate although css and js carry ?v="
tasks:
  - {id: s1, status: done 2026-10-02, evidence: "Browser pane, local portal. A 5.7 MB 4032x3024 JPEG stored as a 282 KB 1600x1200 WebP plus a 640x480 card copy, portal thumbnail loads /card", task: "Portal resizes each photo in the browser before upload, a full copy at 1600 px and a card copy at 640 px, WebP with a JPEG fallback"}
  - {id: s2, status: done 2026-10-02, evidence: "e2e 41 of 41 incl. four card checks; access tests 10 of 10 with uploadCard in the cross-breeder attack set", task: "Server stores and serves the card copy at /media/<id>/card, falling back to the full copy for photos uploaded before this"}
  - {id: s3, status: done 2026-10-02, evidence: "patched main.js pcMedia sends slots of 640 px or less to /card", task: "Site patch sends slots of 640 px or less to the card copy"}
  - {id: s4, status: done 2026-10-02, evidence: "live: max-age=60 swr=300, weak ETag revalidates 304, memo answer 51 ms against 336 ms cold", task: "data.js memoized per isolate for 30 s with an ETag, browser max-age 60 and stale-while-revalidate"}
  - {id: s5, status: done 2026-10-02, evidence: "live: css and js ?v= max-age=31536000 immutable, img max-age=604800; second page took css, js, logo and data.js from browser cache with 0 bytes", task: "Long cache on versioned css and js, a week on img and media"}
  - {id: s6, status: done before this batch, evidence: "hero and logo already ship WebP srcsets in picture (fix_2026_09_28.py); measured 45 KB hero-1400 and 22 KB logo-420", task: "Hero WebP srcset and a small logo, through the generator, originals kept"}
  - {id: s7, status: done 2026-10-02, evidence: "deployed portal d6db66ad and site f91f1585; HTML 270 ms to first byte", task: "Verify. Local e2e and access tests, live sizes and headers re-measured, site-checks clean"}
  - {id: c1, status: open, task: "Puppy Connection old Workers off their workers.dev URLs (account-move C7)"}
  - {id: c2, status: open, task: "Teapup and Sweet Puppy Paws. Confirm the new account serves and builds, then disconnect old builds and take the old editor and sites off their URLs (their account-move C7)"}
  - {id: c3, status: open, task: "Local config and docs pointing at the old hosts updated"}
---

# Speed pass and old-account cleanup

Working state for this batch. Each task's status changes as it lands.
