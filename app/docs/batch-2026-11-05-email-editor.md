---
batch: 2026-11-05-email-editor
asked_by: "Alex 2026-11-05: let Amber add pictures to a list email, greet each person by first name, and see a live preview at phone and desktop width as she types"
read_first: [app/lib/campaigns.js, app/lib/email-html.js, app/admin/public/admin.js (emailsPanel, wireEmails)]
decisions:
  - "No migration. A picture is stored in R2 under email/<id> and named in the email's own text, so no table records it. A picture is never deleted, because a sent email keeps pointing at it"
  - "The portal serves a picture at /email-image/<id>, cached for a year, because the portal is the public address an email client can load"
  - "Pictures are JPEG, drawn in the browser at 1200 px wide on a cream background, because Outlook for Windows shows no WebP"
  - "The preview is drawn by the admin calling the same renderCampaign the send uses, so it cannot drift from the send"
  - "The admin page's img-src allows the portal origin and the email logo's origin, so the preview loads each picture and the logo from the same public addresses the email uses"
  - "A missing name, an email address in the name field, a title such as Mrs. or a lone initial gets the fallback word, there by default. A name in all lower or all upper case is shown as Mary"
  - "A test or a send is refused while the email holds a field in braces it cannot fill in, or names a picture whose file is not in R2"
tasks:
  - id: e1-pictures
    status: done
    closed: 2026-11-05
    evidence: "admin-features: upload gives the portal address, the portal serves image/jpeg with a one-year cache and no GPS, 404 for an unknown id, WebP and a non-image refused. Browser pane: a transparent WebP chosen through Add a picture came back as a JPEG on cream, the empty description was refused, and the picture showed in the preview from the portal"
    item: "Add a picture to a list email: upload in the admin, store in puppyconnection-files, serve from the portal at a full https address, with alt text, inside the 600 px design"
  - id: e2-first-name
    status: done
    closed: 2026-11-05
    evidence: "email-html-test: nine stored-name cases, the fallback, subject and greeting filled, no field left in either part. admin-features: the test copy greets the owner by their own first name; an unknown field refuses the test and the send"
    item: "Personalize with {first name}, taking the first word of the stored name, and a fallback word when no name is stored"
  - id: e3-preview
    status: done
    closed: 2026-11-05
    evidence: "Browser pane at 1440 px: editor and preview side by side, 522 px each. At 390 px the preview stacks under the editor, desktop scales to 0.46 and phone to 0.86, and the page does not scroll sideways. With a name shows Jordan, No name stored shows there"
    item: "A live preview beside the editor, phone and desktop width, with a sample name or no name"
  - id: e4-tests
    status: done
    closed: 2026-11-05
    evidence: "admin-features 148 passed 0 failed, email-html 298 passed 0 failed, run against this worktree on 8767 and 8768 because 8787 and 8788 were serving another worktree. jobs-test failed 5 for the environment only, as its link check reached Teapup on 8791 and the fresh database had never run four of the jobs"
    item: "Checks in dev/admin-features-test.mjs and dev/email-html-test.mjs, and a look in the Browser pane against the local admin on 8788"
  - id: e5-ship
    status: done
    closed: 2026-11-05
    evidence: "PR 152 (dd65f93) from main, after merging main's add-a-breeder change and moving admin.js to v=60. Portal 469ae01f, admin cbf10864, both with wrangler.production.jsonc. Read back: portal.puppy-connection.com/email-image/<unknown id> answers 404 from the new route. The admin sits behind Access, so the editor itself was not opened on production. No migration, so no database change"
    item: "Merge to main, deploy the portal and the admin with wrangler.production.jsonc, read back the image address and the preview on production"
---

# List email editor, 2026-11-05

Amber writes the email as before. Add a picture asks for the file, draws it in the browser and stores it, then asks
what the picture shows, and puts a line such as {picture 01M6...: Two puppies on a blanket} where the cursor was. Add
first name puts {first name} at the cursor. The preview beside the editor redraws a moment after each change, at phone
or desktop width, for a sample person or for someone with no name stored, and warns about any field it cannot fill in.

The text part of each email says [Picture: what it shows] where a picture is, and keeps the address and the
unsubscribe link. The HTML part shows the picture at 504 px, the width of the body column, and scales it down on a
phone. Pictures are never removed from R2, because an email already sent keeps pointing at them.
