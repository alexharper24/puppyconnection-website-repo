---
batch: puppyconnection-hosted-test
started: 2026-09-30
asked: "use my account, same as teapup ... set up any separate workers that are needed ... proceed with the permissions that you need"
account: "Alex's Cloudflare account (the Teapup one), wrangler OAuth, workers.dev subdomain alexharper. Superseded 2026-10-02, when the copy moved to the Puppy Connection account (docs/account-move.md)"
design:
  - "Three Workers: puppyconnection-portal, puppyconnection-admin, puppyconnection-site (the public site reading live from D1)"
  - "One D1 puppyconnection and one R2 bucket puppyconnection-files, both new, nothing shared with Teapup"
  - "DEV_MODE=hosted-test turns on the mailbox, practice checkout and operator stand-in on workers.dev, and only when the TEST_GATE secret is set. Every request then needs HTTP Basic auth with that password. Without the secret the mode is off, so it fails closed"
  - "The password is generated locally, set with wrangler secret put, and written to app/.state/test-access.txt (gitignored). Never printed in chat or committed"
tasks:
  - {id: h1, status: done, task: "Gate + hosted-test mode in lib, portal, admin"}
  - {id: h2, status: done, task: "Shared export in lib/export.js; site Worker serving concept pages with live data/data.js and public media"}
  - {id: h3, status: done, task: "Local regression: e2e + access tests still pass"}
  - {id: h4, status: done, task: "Create D1 + R2, apply schema and seed remotely"}
  - {id: h5, status: done, task: "Deploy three Workers with vars and secrets"}
  - {id: h6, status: done, task: "Run e2e against the deployed Workers, check the gate refuses strangers"}
  - {id: h7, status: done, task: "README, state file, commit, push"}
---
