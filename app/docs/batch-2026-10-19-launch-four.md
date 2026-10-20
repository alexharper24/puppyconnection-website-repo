---
batch: 2026-10-19-launch-four
asked: "Build four launch tasks on staging, cleared by Alex 2026-10-19: failure alerts by email, the production database steps, the Let's Chat button, and a mailing list send to every contact"
branch: claude/relaxed-hopper-9265f6
status: done
tasks:
  - {id: alerts, workplan: B10, status: closed, commits: [801f72a, 3da831a], evidence: "launch-workplan.md B10"}
  - {id: prod-db, workplan: B12, status: closed, commits: [b402ad9], evidence: "launch-checklist.md L18 and its rehearsal table"}
  - {id: chat, workplan: A15, status: built, blocked_on: "amber (phone, email, social links)", commits: [efb925b], site_repo_commit: d1c4956}
  - {id: all-contacts, workplan: C5, status: closed, commits: [801f72a], evidence: "launch-workplan.md C5"}
staging_deploy:
  at: 2026-10-20T03:40Z
  branch: "deploy/staging-2026-10-20, local only, merging claude/relaxed-hopper-9265f6 with origin/claude/zealous-herschel-c8a3b1 (PR 6, which carries main, PR 5 and the earlier sessions) and origin/claude/quirky-dewdney-f1f059 (PR 7, the restyle). Recreate it with the same three merges"
  why: "Staging ran merge 8b6093b (main plus PRs 5, 6 and 7), and a portal deploy from main at 01:24Z had taken PR 5 and the restyle back off the portal (portal.css v=14). This deploy puts the combination back and adds this batch"
  migration: "0040_alerts_and_audience.sql after backup app/.state/staging-2026-10-20-pre0040-deploy.sql (Downloaded, 3,556,913 bytes, 8,062 rows)"
  portal: 6f47f0f7-21af-4bfb-90fd-eefbee36e359
  admin: 4e09c4f8-0b14-4f4f-8c84-780b6b81106e
  site_repo: "d1c4956, built by Workers Builds, /api/build answered generation 43"
  versions: {portal_css: 17, portal_js: 24, admin_js: 33, checklist_js: 5, site_css: 57}
left_on_staging:
  - "site_state.last_error holds the forced publish failure until the next good publish"
  - "job_runs shows the forced failures until each job next runs, the daily ones at 13:00 UTC"
  - "alert_state holds five held repeats, which the */15 run sends as summaries after 04:42Z, to the test mailbox"
decisions:
  - "Alerts go to owners in people plus OPS_EXTRA, not staff (Alex's brief, 2026-10-19). alertOps changed for every system alert, which matches what the workplan's inbox item already says"
  - "Quiet window is one alert per kind per hour, kept in a new alert_state table. Held alerts are counted and sent as one summary by the */15 run once the hour is up, so nothing is lost"
  - "A failed Workers Build is caught by its outcome through build.json at /api/build and a SITE service binding. It catches a failed build and a failed deploy with no extra secret"
  - "Forced failures on staging used FAIL_TEST, honored only when DEV_MODE is local or staging, through wrangler dev --remote with portal/.dev.vars moved aside, so the deployed Workers never failed"
  - "The production steps keep the same three Workers on the real hostnames, so only one set of Workers ever writes to the database. A decision for Alex, recorded in L18"
excluded:
  - "No send to all contacts on staging, because it would log every imported contact to the test mailbox. Proven locally with test addresses"
  - "No dispute forced on staging, because the Stripe sandbox needs a real test payment for one. Proven in alerts-test"
---

# Launch batch, 2026-10-19

Working notes for the four tasks. Each task's evidence is in `launch-workplan.md`, and the
production steps with their rehearsal are in `launch-checklist.md` L18.
