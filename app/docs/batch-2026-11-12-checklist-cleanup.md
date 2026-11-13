---
batch: 2026-11-12-checklist-cleanup
asked_by: "Alex 2026-11-12: clean up the launch list. Every launch area is complete, Stripe Connect and puppy video move to Gate 1, walkthrough videos and live training are done, the 30-day check-in, weekly Ahrefs reviews and Search Console come off as part of monthly care, and the gates are cleared for Amber to choose from the menu"
decisions:
  - {date: 2026-11-12, by: Alex, item: "Stripe Connect and puppy video", answer: "Keep both in Gate 1 while the other gate items are archived"}
  - {date: 2026-11-12, by: Alex, item: "Real email and the nightly backup restore", answer: "Mark both done"}
migration: app/migrations/0097_checklist_cleanup.sql
generator: app/dev/checklist-cleanup/gen_0097.py
tasks:
  - {id: c1-read, status: done, evidence: "Live checklist read from hosted D1 puppyconnection (4556bf68), account 4f6e9dc2, before writing"}
  - {id: c2-backup, status: done, evidence: "d1 export printed Downloaded, app/.state/production-2026-11-12-pre0097.sql in the main checkout"}
  - {id: c3-rehearse, status: done, evidence: "rehearse_migration.py PASS: run 1 audit_log 2847 to 2903 (56 rows = 11 items done, 23 parts ticked, 6 moves, 16 archives), run 2 changed nothing, 0 foreign key violations"}
  - {id: c4-apply, status: done, evidence: "d1-apply.mjs --remote, 20 statements in 1 batch, applied"}
  - {id: c5-readback, status: done, evidence: "Hosted: launch 75 done, gate1 2 not started (Stripe Connect, Puppy video), 16 archived, 0 open parts on done items, 56 audit rows at 2026-11-13T00:50:41Z"}
  - {id: c6-workplan, status: done, evidence: "launch-workplan.md closed 11 items and moved 3 to monthly care (dev/checklist-cleanup/workplan_0097.py); checklist.mjs drift: agree; export: 77 items, 16 archived, 0 drift"}
---

# Checklist cleanup, 2026-11-12

Nothing was deleted. Archived items keep their history and can be restored from the admin by Alex.
The admin reads the checklist live from D1, so no deploy or publish was needed.
