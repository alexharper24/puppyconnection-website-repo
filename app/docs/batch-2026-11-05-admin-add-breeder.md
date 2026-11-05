---
batch: 2026-11-05-admin-add-breeder
asked_by: "Alex 2026-11-05: operators such as Amber and Hope create a breeder in the admin, fill in all its information, already approved, with Puppy Connection access granted, so Manage as this breeder works at once"
read_first: [app/admin/worker.js, app/lib/accounts.js, app/lib/store.js, app/portal/worker.js]
decisions:
  - "Staff may add a breeder (STAFF_ALLOWED gets POST /api/breeders), because Hope is staff. Manage as this breeder and the drawer's Send invitation stay owner-only as before, so the invitation is offered as an unticked box on the add form, which staff can use"
  - "Alex, 2026-11-05 after the deploy: staff get Manage as this breeder too, so Hope can add litters and puppies to a kennel she adds. Turning access on or off and the people on a kennel stay owner-only"
  - "Access is recorded with the existing management arrangement path (ACCESS_HOW.existing, accessStmts), so the audit carries access.on beside breeder.create"
  - "The profile is checked by the portal's own rules: profileFields, the submit rule (business name, a public phone or email, city and state) and the extras rule (Facebook page, up to 20 breeds from the list), the last two moved into lib/store.js so both Workers share them"
  - "The breeder has not accepted the listing terms or confirmed they are the seller, so the portal asks them on first sign-in. No reference is asked, because the operator is the one vouching"
  - "A second kennel with the same business name is refused once with its name, and goes ahead when the operator confirms, so a double click does not make two"
tasks:
  - id: a1-route
    status: done
    evidence: "add-breeder-test.mjs 38 of 38 locally"
    item: "POST /api/breeders in admin/worker.js: check, create approved with access on, audit, optional invitation"
  - id: a2-shared-checks
    status: done
    evidence: "profileMissing and extrasFields in lib/store.js, used by portal submitProfile and saveExtras and by the admin; admin-features 132 of 132"
    item: "Move the submit rule and the extras rule into lib/store.js and use them in the portal and the admin"
  - id: a3-ui
    status: done
    evidence: "admin.js v59; the portal's terms banner gets a never-accepted wording and an operator-only note without the button it cannot use (portal.js v53)"
    item: "Add a breeder button and form on the Breeders screen; the new breeder's drawer opens after"
  - id: a4-tests
    status: done
    evidence: "add-breeder 38/38, admin-features 132/132, access-tests 71 pass and 2 fail. One fail is on main already (movePuppy, added in 4b7faf7, is missing from the attack list); the other, an expired listing in the export, is in code this change does not touch and was not rerun on main"
    item: "dev/add-breeder-test.mjs, plus admin-features-test.mjs and access-tests.mjs still pass"
  - id: a5-browser
    status: done
    evidence: "Browser pane on local 8788: the missing-state error, the same-name dialog, an add with Havanese ticked, the drawer shows Approved and access On; Manage as opened the portal as Amber on the new kennel and the portal screens added a Havanese litter and the puppy Waffles"
    item: "Browser pane against the local admin: add a breeder, then Manage as this breeder adds a litter and a puppy"
  - id: a6-ship
    status: done
    closed: 2026-11-05
    evidence: "PR 150 squashed to f0e924e and deployed from main with wrangler.production.jsonc after the history showed the PR 148 versions as the latest: portal c9fcbcf7, admin fa4b99e9. portal.puppy-connection.com serves portal.js?v=53 with both new banner lines; the admin is behind Access, so its read-back is the version id. No breeder was created in production"
    item: "PR, merge, deploy portal and admin from main with wrangler.production.jsonc, read back that the route answers"
  - id: a7-staff-manage
    status: done
    closed: 2026-11-05
    evidence: "PR 157 (4f541a8) deployed from main after the history showed the list email editor version cbf10864 as the latest: admin c53c0eea. add-breeder-test 42 of 42 and admin-features 148 of 148 locally"
    item: "Staff use Manage as this breeder (Alex approved 2026-11-05)"
---

# Add a breeder from the admin, 2026-11-05

No schema change, so no migration. A create through the new route is an app write.
