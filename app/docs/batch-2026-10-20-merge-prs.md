---
batch: "2026-10-20 merge the five open pull requests and redeploy staging from main"
asked_by: "Alex, 2026-10-20"
order_reason: "The checklist branch contains the listing schedule branch's commits and part of the alerts branch, so it merges first and the others then carry only their own changes."
tasks:
  - {id: m1, pr: 6, branch: claude/zealous-herschel-c8a3b1, task: "Launch checklist", status: done, evidence: "merge commit bf72c8f"}
  - {id: m2, pr: 5, branch: claude/eloquent-davinci-299722, task: "Listing schedule, breeder references, photo standard", status: done, evidence: "already contained in the checklist branch, nothing left to merge"}
  - {id: m3, pr: 9, branch: claude/relaxed-hopper-9265f6, task: "Failure alerts, production steps, Let's Chat, all-contacts send", status: done, evidence: "already contained in the checklist branch, nothing left to merge"}
  - {id: m4, pr: 7, branch: claude/quirky-dewdney-f1f059, task: "Admin and portal design", status: done, evidence: "merge commit 22ca054. One conflict, the admin.js cache number, resolved to v=35 above both sides"}
  - {id: m5, pr: 10, branch: claude/gallant-wing-0e5e2e, task: "Puppy description cleanup", status: done, evidence: "merged cleanly"}
  - {id: m6, task: "Renumber the duplicate 0030 migration. Migrations are applied by hand, with no tracking table, so a rename re-runs nothing", status: done, evidence: "0030_breed_photos renamed to 0043_breed_photos with a note that it already ran on staging; references in lib/shape.js and schema.sql updated"}
  - {id: m7, task: "Tests pass on merged main", status: done, evidence: "after a local reset: checklist 57, alerts all, focus 11, signin 48, admin-features 113, restore all, e2e all, access all ten, launch-features 156 of 156, jobs all. The first failures were local only: the gitignored .dev.vars files lacked STREAM_MODE and PHOTO_CHECK_MODE from the examples, the local site on 8791 was not running, and the jobs check needs the 15-minute schedule fired once on a fresh database"}
  - {id: m8, task: "Deploy portal, admin and site from main, and sync the site repo", status: done, evidence: "portal version 5e66f727 and admin version eff36de3 deployed from main 716376c; site repo 7b42e13 records the sync, as every site change was already there"}
  - {id: m9, task: "Recheck each closed item on staging", status: partly done, evidence: "public site serves the Let's Chat button with its placeholders; portal serves portal.css v=17 and portal.js v=24. The admin is behind Access and Chrome was signed out, so the checklist and menu screens wait on Alex signing in. Locally the same code passed every test"}
---
