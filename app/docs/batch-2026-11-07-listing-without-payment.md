---
batch: 2026-11-07-listing-without-payment
asked_by: Alex, 2026-11-07
ask: "hope and amber as admin's of the breeders they manage need to be able to bypass the listing payment if necessary. some of their agreements are monthly. so can we offer that as an option for them in the breeder / admin portals?"
stage: done
branch: claude/awesome-hofstadter-40a6bc
answers:
  - {date: 2026-11-07, by: alex, answer: "Not monthly. It is a $100 per puppy package Hope sells, covering listing on Puppy Connection and other sites and the first round of photos for the puppy"}
  - {date: 2026-11-07, by: alex, answer: "The $100 is taken outside Puppy Connection, so the site only records the listing as covered by the package"}
  - {date: 2026-11-07, by: alex, answer: "The package is chosen puppy by puppy, not set on the kennel"}
  - {date: 2026-11-07, by: alex, answer: "Hope lists package puppies herself through Manage as, so the breeder gets no button"}
  - {date: 2026-11-07, by: alex, answer: "Owners and staff may list without payment"}
decisions:
  - {id: d1, date: 2026-11-07, by: claude, decision: "A listing without payment keeps payment_state 'comped' and a new puppies.comp_basis column says 'package' or 'free', because the CHECK on payment_state would need a rebuild of the puppies table, and public_puppies and every visibility query already treat comped as listed. Existing comped rows read as free"}
  - {id: d2, date: 2026-11-07, by: claude, decision: "One shared function in lib/ does what compPuppy does today, for one puppy or several, and the admin and the portal operator route both call it"}
  - {id: d3, date: 2026-11-07, by: claude, decision: "The operator chooses 'Covered by the listing package' or 'Free' when listing without payment, and Reports shows package and free listings as separate columns. No dollar amount is stored, since the $100 is not taken here"}
tasks:
  - {id: t1, status: done, item: "Shared function in lib/, moved out of compPuppy with the same rules, taking a list of puppy ids, the actor and the basis"}
  - {id: t2, status: done, item: "Migration adding puppies.comp_basis, through the d1-migration skill", evidence: "0094 on production after production-2026-11-07-pre0094.sql (Downloaded). Rehearsal run 1 added the column, puppies 320 to 320, no key violations, public_puppies 253 before and after. Run 2 stopped on duplicate column as the header says, so a rerun changes nothing. Read back: column present, 320 puppies, 317 comped, 0 with a basis"}
  - {id: t3, status: done, item: "Admin: compPuppy calls the shared function with a basis, new litter route, both in STAFF_ALLOWED, List free for a puppy and a whole litter with the package or free choice"}
  - {id: t4, status: done, item: "Portal: POST route refused unless the session is an operator's, List without payment for a puppy and a litter shown only in an operator session, audited as the operator"}
  - {id: t5, status: done, item: "Reports: paid, package and free as separate columns, CSV too"}
  - {id: t6, status: done, item: "Tests: access-tests.mjs and admin-features-test.mjs for each new route, a breeder session refused on the operator route, staff allowed on the admin routes"}
  - {id: t7, status: done, item: "Browser pane check on 8787 and 8788 through Manage as this breeder"}
  - {id: t8, status: done, item: "PR, merge, migration applied remotely and read back, deploy portal and admin from main with wrangler.production.jsonc, ?v= bumped", evidence: "PR 163 merged as 0900a6a. Portal and admin deployed 2026-11-07 from a detached worktree at origin/main. Live portal serves portal.js?v=54 and dialog.js?v=2 with the new code, and POST /api/listings/comp answers 401 with no session"}
excluded:
  - "Nothing in Stripe changes"
  - "No breeder setting and no breeder-side button, per Alex's answers"
verification:
  - "access-tests.mjs all 12 groups pass, including the new group 11 (breeder refused on the comp route for own puppy, own litter and another kennel's puppy, and a puppy edit cannot set comp_basis, payment_state or publish)"
  - "admin-features-test.mjs 163 passed, 0 failed, including 16 new checks for the admin routes, staff, Reports, the CSV and the portal operator route"
  - "Browser pane 2026-11-07 on 8787 and 8788 through Manage as: List 3 without payment under the package, then List 2 puppies free in the admin drawer, chips read Package and Comped. The pane was hidden, so each dialog's close event was dispatched by hand after the real button click"
  - "accounts-test.mjs 80 passed, 0 failed"
  - "portal-features-test.mjs 12 failures, 11 needing the site Worker on 8791 (not runnable here, site/public not built) and 1 the known fresh-reset colors check"
commits: ["0900a6a (PR 163)"]
followups:
  - "dev/setup.mjs copies portal/public/portal.css over admin/public/portal.css, which dropped the list email editor rules that only the admin copy held. Fixed in PR 165 (15774cf, deployed 2026-11-07): the rules moved into the portal copy and setup now stops on drift. Also restored LF on the eight files PR 163 turned CRLF"
  - "ops/d1-apply.mjs finds wrangler relative to the checkout, so from a worktree it needs WRANGLER_JS set"
---

# Listing without payment

Plan approved by Alex's answers on 2026-11-07. The first draft had a monthly-agreement breeder setting, which his answers replaced with an operator choice per puppy.
