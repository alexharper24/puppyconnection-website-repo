---
batch: 2026-11-07-ahrefs-fixes
asked_by: "Alex 2026-11-07: do fixes 1, 2 and 4, and then fix the small items (Ahrefs crawl 2026-11-07)"
tasks:
  - id: a1-brittany-link
    status: done
    closed: 2026-11-07
    evidence: "0093 after production-2026-11-07-pre0093.sql (Downloaded), rehearse PASS (puppies 1 changed via 1 audit row, second run 0). Read back: Brittany breeder_url NULL, one audit row. All 128 live puppy links checked 2026-11-07; Brittany's was the only one not answering 200"
    item: "Brittany (Great Dane, Responsible Dog Breeder) links to https://responsibledogbreeder.com/puppies/brittany/, which answers 404"
  - id: a2-big-photos
    status: done
    closed: 2026-11-07
    evidence: "R2 <key>.display (1600 px WebP q82, 420,266 to 538,300 bytes) and <key>.share (1200 px JPEG) beside each original; live /media/<id> serves image/webp at those sizes, /share the JPEG. No database change, lib/media.js already prefers .display"
    incident: "The first upload loop read keys from Python output with a trailing CR, and the copies landed on the original keys, the share copy last. Found on read-back about 15 minutes later. The originals had been downloaded first and matched photos.bytes exactly, so restore_and_copy.py (scratchpad big4/) put each original back and added the copies, every object read back at its expected size. Browsers that fetched /media/<id> in that window may keep the 1200 px share copy for up to a day. R2 may hold four junk keys ending in CR plus .display or .share from the first loop"
    item: "Four main photos are stored as full-size JPEGs of 1.08 to 1.23 MB (Charlie 01M6M43V57HP4WNCHHAXDG4SCW, Jillian 01M6M45PVEFQ25E5Y6JRK7APSS, Jules 01M6M4730DXSGRNSGG0CCR8FRH, Sabrina Jane 01M6MB726ZFGME51K11GJ2X02F). Store a 1600 px WebP beside each original and point the photo at it"
  - id: a3-media-5xx
    status: done
    closed: 2026-11-07
    evidence: "Root cause not confirmed: the dashboard log page timed out and the wrangler token has no observability scope. The 503 came back as text/html, which the Worker never sends (its errors are text/plain 500), so it reads as Cloudflare's own error page, likely exceeded resources under the crawl burst. Fix: site/static-worker.js serves puppy and parent photos from the edge cache for an hour and tries a failed lookup once more; a stand-in test showed a D1 failure recovered on retry, a second request served from cache with no database read, and a 404 not cached"
    item: "A photo answered 503 to the Ahrefs crawl on 2026-11-07 (media/seed-p-0120-wx-bc65aa702f29/card) and one answered 500 on 2026-11-02, and both load now. Find why the site Worker's media route fails under a crawl"
  - id: a4-titles
    status: done
    closed: 2026-11-07
    evidence: "generate.mjs puppyTitle drops 'for Sale' only past 70 characters. Local build from live data: 0 sitemap titles over 70 (6 before, all Cavalier King Charles Spaniels)"
    item: "Six page titles too long for Google's results"
  - id: a5-descriptions
    status: done
    closed: 2026-11-07
    evidence: "generate.mjs withTail falls back to shorter closing lines (the designated representative line, then 'or their representative', then 'Connect with the breeder.'); breeds and reviews descriptions lengthened. Local build: 0 of 303 sitemap descriptions under 110 or over 160 (94 under 110 before by local count, 42 by Ahrefs)"
    item: "42 meta descriptions too short"
---

# Ahrefs fixes, 2026-11-07
