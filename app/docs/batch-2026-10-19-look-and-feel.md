---
batch: look-and-feel review of the admin and the breeder portal
asked_by: Alex, 2026-10-19
branch: claude/quirky-dewdney-f1f059, fast-forwarded onto 1431b01 (PR 5 and PR 6), so a staging deploy from it keeps both
shared_files: [app/portal/public/portal.css, app/admin/public/portal.css (copy), app/admin/public/admin.js, app/portal/public/portal.js]
not_ours: [app/admin/public/checklist.css, app/admin/public/checklist.js, the .reference .photo-standard .photo-banner .banner-list rules from PR 5]
tasks:
  - {id: review, status: done, out: "sent to Alex 2026-10-19, not kept in the repo"}
  - {id: options, status: done, out: "sent to Alex 2026-10-19 and deleted after he chose", built_by: "scratchpad build_options.py, which inlines portal.css and checklist.css", measured: "menu today 1295px, A 818px (fits 3:2 and 1080), B 649px (fits all four, 768 by 9px); phone title at 453px today, 309px strip A, 139px Menu button B; drawer row 167px today, 121px after"}
  - {id: choose, status: done, date: 2026-10-19, chosen: "desktop menu A (tighter, every item showing, 817px measured, so it still scrolls on 768 and 900 screens), phone menu B (Menu button), panels A (share a height), contrast A (#ece6d8 ground, #ddd5c3 line), typefaces unchanged, side-panel fix as previewed"}
  - {id: build, status: done, note: "portal.css restyle, Menu button in admin.js and portal.js, two mailing-list columns hidden below 700px. Untouched controls measured equal before and after (top bar 60, search 40, table row 62, buttons 36); stat tiles 84 to 87 from the padding change"}
  - {id: delete-previews, status: done}
  - {id: deploy, status: pending, note: "portal and admin only, from this branch"}
  - {id: proof, status: pending}
measured_2026-10-19:
  admin_menu_1440: "rail head 133px, menu content 1091px, foot 69px, so 1293px in all. 18 links at 44px and 5 group headings at 41px"
  admin_menu_375: "the menu strip is 327px (6 rows) and the top bar 101px, so the page title starts at 428px of an 812px screen"
  portal_menu_375: "195px strip, page title at 290px"
  overview_panels_1440: "Needs attention 116px beside Sign-ups and checkouts 231px"
  reports_panels_1440: "1390px beside 2160px, and 158px beside 236px"
  mailing_list_panels_1440: "279px beside 319px"
  terms_panels_1440: "615px beside 276px"
  drawer_puppy_row: "drawer 580px; buttons take 372px, so the name column is 64px and each row is 168px tall"
  mailing_list_375: "table 413px wide in a 326px box, scrolls sideways"
  contrast: "page ground #f5f2ea against white panels is 1.12 to 1, and the #e4dfd3 panel border is 1.33 to 1 against white and 1.19 against the ground. Muted text #6b665c reads 5.1 on the current ground, 4.59 on #ece6d8 and 4.46 on #e9e3d4 (under 4.5)"
left_out:
  - "Sticky table headings, proposed in the review. The tables sit in sideways-scrolling boxes, so a sticky heading would need those boxes to stop scrolling, which can clip columns between 1100 and 1300px"
incidents:
  - "2026-10-19: a Stop-Process matching --port 8787 also stopped another session's local portal on 8787 (two node processes). Its admin on 8788 kept running. My local portal moved to 8797."
---

# Look-and-feel batch, 2026-10-19

The portal was walked on a local copy with the made-up demo breeder (Maple Brook Doodles), because signing up a breeder on staging would put a test account on the shared database. The admin was walked on staging in Alex's Chrome. Phone widths were measured in an iframe sized to 375 by 812, written from the page's own HTML into an about:blank frame, because both Workers send `frame-ancestors 'none'`.
