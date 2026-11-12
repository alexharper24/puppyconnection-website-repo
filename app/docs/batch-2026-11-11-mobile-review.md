---
batch: mobile-review
date: 2026-11-11
asked_by: Alex
scope: "Breeder portal (app/portal) and admin (app/admin) on phones. Public site out of scope"
widths: [360, 390, 430, 1440]
branch: claude/vigilant-shtern-f3b25e
local: "portal 8787, admin 8788, from this worktree (.claude/launch.json mr-portal, mr-admin), seed plus --demo. Portal seen through Manage as this breeder on Maple Brook Doodles (demo-maplebrook)"
tools: "app/dev/mobile-review/cdp.mjs (headless Chrome), measure.js (checks), run.mjs (walks the inventory)"
stage: ship
tasks:
  - {id: inv, status: done, item: "Inventory every screen, drawer, dialog and state of both apps"}
  - {id: measure-before, status: done, item: "Measure every inventory item at 360, 390, 430 and 1440, with screenshots"}
  - {id: references, status: done, item: "Shopify, Stripe and Square phone patterns, each move with its source"}
  - {id: previews, status: done, item: "Menu preview and one or two form and button-row options for Alex"}
  - {id: alex-choice, status: done, closed: 2026-11-11, evidence: "Alex chose the recommended options: menu A, button rows 1, drawer actions 1", item: "Alex picks the menu and layout option"}
  - {id: fix, status: done, item: "Fix every finding with one set of phone rules in portal.css"}
  - {id: measure-after, status: done, evidence: "Phones: 1,636 problems before (main, measured with the final checks) to 22 after, 185 of 195 screen and width combinations clean. Desktop 1440: 53 of 62 screens unchanged beside the menu; the 9 others are Remove moved to the end of the puppy and litter drawers, the Upload label fix, and activity entries added between runs", item: "Re-measure every item at all widths and 1440"}
  - {id: report, status: done, evidence: "Sent to Alex 2026-11-11 (built by app/dev/mobile-review/report.py, kept out of the repo for its size)", item: "HTML report with before and after screenshots and measurements"}
  - {id: ship, status: pending, item: "PR merged from main, portal and admin deployed with the production config, ?v= bumped"}
  - {id: stop, status: pending, item: "Local Workers stopped"}
screens:
  portal:
    signed_out: [signin, signin-code, forgot, signup, sent, /auth/set-password, /choose, /privacy, /terms, /report, /unsubscribe, /checkout/success, /checkout/cancel, handoff-expired]
    menu: {groups: ["Your listings: Overview, Litters and puppies, Moms and dads, Pay to list, Views and clicks", "Account: Profile, Payments, Account, Help"], phone_now: "two-column grid of links, every group open (portal.css 435)"}
    routes: ["#/", "#/profile", "#/add-kennel", "#/litters", "#/parents", "#/pay", "#/payments", "#/stats", "#/account", "#/help"]
    drawers: [terms, litter-add, litter-edit, add-several, puppy-drawer (form, quality, move, prefill, photos, videos, documents), face-pick dialog, parent-drawer (photo, face, documents), authenticator, make-main, walkthrough tour, pcConfirm dialog]
    banners: [notice-sim, terms-banner, operator-banner, totp-nudge, photo-banner, notice-alert pending/paused/declined]
    empties: ["No litters yet", "No moms or dads yet", "No payments yet", "No views yet"]
  admin:
    menu: {groups: ["Today: Overview, Launch checklist, Approvals, Reported listings, Photo review", "Directory: Breeders, Listings, Breeds", "Money: Payments, Reports", "People: Mailing list, Sign-ins", "Site: Publish, Terms, Email log, Settings, Activity, Mailbox"], phone_now: "the same two-column grid"}
    routes: ["#/", "#/checklist", "#/approvals", "#/reported", "#/photo-review", "#/breeders", "#/listings", "#/breeds", "#/payments", "#/reports (8 tabs)", "#/list (and Emails to the list)", "#/people", "#/publish", "#/terms", "#/email", "#/settings", "#/activity", "#/search?q="]
    drawers: [breeder-drawer (profile, decide form, notes, email, litters, parents, puppies, payments, access, who signs in), photos, edit-profile, edit-litter, edit-puppy, add-breeder, breed, checklist-add, checklist-item, list-free choose dialog, face-pick dialog]
    empties: [".empty and 'Nothing matches' in every list", "Nothing needs you right now"]
findings:   # phone widths 360/390/430 unless noted; measured by app/dev/mobile-review before the fix
  - {id: f-menu, status: fixed, found: "Menu opens as two columns with every group open (9 portal, 18 admin links)", fix: "navmenu.js folding groups, one column, 56px group buttons, 48px links, current group open, current link filled"}
  - {id: f-topbar, status: fixed, found: "Portal top bar wraps, Sign out alone on a second row (125+78px then 78px) on 11 screens at 360 and 390", fix: "Kennel, status and the top bar's links move into the phone menu; the portal top bar is hidden below 860px"}
  - {id: f-menu-label, status: fixed, found: "Menu button cut off the current screen's name by up to 59px", fix: "Menu button shows an icon and Menu only"}
  - {id: f-tap-36, status: fixed, found: "btn-sm controls 36px tall on 37 screens", fix: ".btn-sm 44px below 860px"}
  - {id: f-tap-40, status: fixed, found: "Menu button, admin search, list search, filters, sort headings, report tabs, segment tabs 40 to 41px", fix: "44px below 860px"}
  - {id: f-tap-photo, status: fixed, found: "Photo tools 32px, photo select box 22px, arrows 26px wide", fix: "44px tools and arrows, 44px tap area round the 22px box"}
  - {id: f-tap-checks, status: fixed, found: "Checkbox rows 25 to 40px (34px in Comes with)", fix: "44px rows"}
  - {id: f-tap-links, status: fixed, found: "Footer, sign-in and table-cell links 17 to 34px", fix: "44px targets"}
  - {id: f-litter-row, status: fixed, found: "Litter buttons wrap 108+83+98px then 106px, Add a puppy alone", fix: "Add a puppy across, Edit litter and Add several as halves, Remove litter at the end of the litter (option 1)"}
  - {id: f-puppy-row, status: fixed, found: "Puppy links wrap 76+59+75px then 50px, Remove alone", fix: "Equal thirds of one ruled row, Remove in the puppy drawer (option 1)"}
  - {id: f-drawer-save, status: fixed, found: "Puppy drawer 4,455px tall at 390, Save puppy about 2,770px down beside Remove puppy", fix: "Save bar sticky at the bottom while the form is on screen (bar bottom 844 of 844 at 360 and 430); Remove puppy and Remove litter at the end of their drawers (option 1)"}
  - {id: f-rtabs, status: fixed, found: "Eight report tabs wrap into five ragged rows at 360", fix: "Two equal columns, four rows, 44px"}
  - {id: f-seg, status: fixed, found: "Segment tabs run off the edge (Breeders status 7 tabs; Mailing list Who to show cut 44px at 360)", fix: "Segments wrap into full rows of equal parts"}
  - {id: f-member-form, status: fixed, found: "Add and invite overlapped Add them to more kennels by 105x36px at 360", fix: "Stacked full width in a narrow section"}
  - {id: f-listings-hold, status: fixed, found: "Hold and List free hidden on phones with the actions column (not cut off, as the preview first said; the 116px clip was the hidden breed select)", fix: "Hold and List free under each listing's name on phones"}
  - {id: f-label-btn, status: fixed, found: "Replace 5px taller than Remove on the profile", fix: "label.btn takes button line height"}
  - {id: f-google, status: kept, found: "Continue with Google button 40px", note: "Google draws it in its own frame; left as Google renders it"}
  - {id: f-pw-show, status: kept, found: "Show password 40px", note: "Sits inside the 44px password field; 40px keeps it inside the field"}
  - {id: f-none-sideways, status: ok, found: "No screen scrolls sideways at any width, before or after"}
---

# Mobile review of the breeder portal and admin, 2026-11-11

Alex asked for a full formatting review of both apps on phones, with a collapsed single-column
menu and a premium feel. The inventory above came from reading portal.js, admin.js, checklist.js,
traffic.js and portal.css, and every item in it is measured before and after.

The checks are scripted in `app/dev/mobile-review/measure.js`, so each finding carries a number:
sideways overflow, anything outside its card or section, controls overlapping, controls under 44px,
button rows whose heights or tops differ, clipped text, and fixed bars.
