---
batch: "Launch changes from Amber's answers of 2026-10-19"
started: 2026-10-19
asked: "Build three launch changes from Amber's answers on the Puppy Connection staging site (Alex, 2026-10-19): the photo-based listing schedule, breeder approval by reference, and the photo standard."
worktree: ".claude/worktrees/eloquent-davinci-299722, branch claude/eloquent-davinci-299722"
workplan_items: [A12, A13, A14]
migrations: [0030_photo_schedule.sql, 0031_breeder_reference.sql, 0032_photo_hold.sql]
local_servers: "portal on 8887 and admin on 8888 from this worktree's app/.state, because 8787 and 8788 belong to another session"
decisions:
  - {id: d1, item: "How listings already on staging start their clock", choice: "Every one starts at migration 0030, so the first email comes four weeks after it ships and nothing goes offline before six weeks. Imported breeders who never signed in stay out until their first sign-in"}
  - {id: d2, item: "What existing approved and imported breeders need", choice: "Nothing. Approval is once per breeder. A breeder still pending who submitted before references is asked for one in the portal, and the admin can approve them without one"}
  - {id: d3, item: "What restarts the clock", choice: "A new photo that passes the photo check, a photo Amber keeps in Photo review, a payment, or List free. Price, status and other edits do not"}
  - {id: d4, item: "Relisting after week 12", choice: "The Relist button sends that one puppy straight to the existing checkout. A new photo alone does not relist a removed listing, and an offline listing cannot be paid for because a photo brings it back free"}
tasks:
  - {id: t1, status: done, task: "Photo-based schedule: lib/inactivity.js, photo check hook, payments, admin, portal banner and photo step link, emails, migration 0030"}
  - {id: t2, status: done, task: "Approval by reference: breeder_references, submit requires it, portal form, admin card beside Approve, migration 0031"}
  - {id: t3, status: done, task: "Photo standard: portal photo step and help, terms draft, take offline until new photos with a reason that lifts on a passing photo, migration 0032"}
  - {id: t4, status: done, task: "Tests: launch-features-test parts inactivity (31), reference (12) and photohold (16) pass locally"}
  - {id: t5, status: in_progress, task: "Every existing suite passing locally"}
  - {id: t6, status: pending, task: "D1 backup confirmed, then migrations 0030 to 0032 on staging"}
  - {id: t7, status: pending, task: "Deploy portal, admin and site to staging, check each change at desktop and 375px"}
  - {id: t8, status: pending, task: "Close A12, A13 and A14 in the launch workplan with commits and evidence"}
commits: []
---

Working file for this batch. The launch workplan holds the specification and closes the items.
