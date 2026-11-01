---
title: "Breeder journey storyboard, from first sign-in to a live listing"
date: 2026-11-01
purpose: "Factual basis for a short animated walkthrough for breeders. Every label below is copied from the code as it stood on 2026-11-01."
portal_address: "https://portal.puppy-connection.com (app/portal/wrangler.production.jsonc routes)"
sources_read:
  - app/portal/public/portal.js (whole file, the portal screens)
  - app/portal/worker.js (sign-up, password, set-password and invitation pages, Google sign-in, Choose a kennel, add several, duplicate, photo upload, listings, checkout success and cancel)
  - app/lib/store.js (settings defaults, litter and puppy field rules, reference roles)
  - app/lib/parents.js (parent field rules, document kinds and limits)
  - app/lib/docextract.js (fill from a document)
  - app/lib/payments.js (what can be paid for, checkout hold, Stripe session)
  - app/lib/photocheck.js (photo check reasons)
  - app/lib/inactivity.js and app/lib/jobs.js (photo every four weeks, publish timing)
  - app/lib/mail.js (email subjects)
  - app/lib/images.js (15 MB photo limit)
  - app/schema.sql (settings seeds)
  - app/portal/wrangler.production.jsonc (production modes)
  - app/docs/walkthrough-for-amber.md, app/docs/launch-workplan.md, app/docs/batch-2026-11-01-wix-photo-refresh.md
not_verified_live: "Nothing was run against the live portal. Settings values are the code defaults unless a dated repo record says the live value was changed."
---

# Breeder journey storyboard

The portal is one page with a menu on the left (it folds behind a **Menu** button under 860px wide).
Every add or edit opens in a panel that slides in from the right, called the drawer below. A drawer
for a puppy or a parent opens wide on a laptop, with the fields on the left and the photos and
documents on the right.

The order the portal itself nudges a new breeder through is this.

1. Sign in or create an account.
2. The **Overview** shows a **Getting listed** card with four steps (Email confirmed, Complete your
   profile, Name a reference and accept the terms and submit, Puppy Connection approves your account).
3. While pending, the menu shows only **Overview**, **Profile**, **Account** and **Help**, with the
   note "Litters, puppies and payments open once Puppy Connection approves your account."
4. Once approved, the menu has two groups. **Your listings** holds **Overview**, **Litters and
   puppies**, **Moms and dads**, **Pay to list** and **Views and clicks**. **Account** holds
   **Profile**, **Payments**, **Account** and **Help**.
5. The approved **Overview** card with no puppies is headed **Add your first litter** and says "Add a
   litter, add each puppy with photos, then pay $14.99 per puppy to list it once, and it stays up for
   as long as you add a new photo at least every four weeks." It does not mention Moms and dads.

Alex's outline adds the parents before the litter, which matches how the litter form works (a mom
or dad can only be picked once saved), but the portal's own nudges put the litter first and the
parents only as a link under the litter's Mom and Dad pickers.

---

## Step 1. Sign in to the breeder portal

**What the breeder does.** Opens the portal, signs in with Google or with an email and password, or
creates an account. Emailed sign-in codes and magic links are switched off, and an old one shows
"Sign-in links are no longer used".

**Screen.** The sign-in card headed **Breeder portal**, with "List your litters and puppies on
Puppy Connection." A **Visit site** link sits top left and **Privacy** and **Listing terms** sit in
the footer.

### The ways in

| Way in | What the breeder sees and presses | Notes |
| --- | --- | --- |
| Google | **Continue with Google** button (Google's own button, or a plain fallback button). Google may also show a "Continue as" One Tap box on its own | A Google address with no account becomes a new pending account straight away, with no business name asked and no robot check |
| Email and password | **Email** and **Password** fields, then **Sign in** | Wrong password says "That email and password do not match. If you have never set a password, use Forgot password and we will email you a link to set one." Too many wrong tries locks for 15 minutes |
| Authenticator step | Only if the breeder turned it on. Page **Enter your code**, field **Authenticator code**, button **Sign in** | A recovery code works in the same box. Asked after a password, not after Google (see open questions) |
| New account | Link **Create an account**. Page **List with Puppy Connection**, fields **Email** and **Business name**, a Cloudflare robot check, button **Create my account** | Then **Check your email**. The link works once and lasts 24 hours. It opens **Choose your password** ("Your email address is confirmed...") with **New password**, **Confirm password** (at least 10 characters) and **Save password and sign in** |
| Existing breeder with no password (imported from Wix) | **Forgot password?** link, or the notice "Already list with us but never set a password? Use Forgot password..." Page **Set a password**, field **Email**, button **Email me a link** | The link works once and lasts 1 hour, and opens **Choose a new password** |
| Invited by a kennel (a helper) | Email "You are invited to manage [kennel] on Puppy Connection". The link opens **Manage [kennel] on Puppy Connection** with the same two password fields and **Save password and sign in** | The invitation lasts 7 days. Someone who already has a password gets **Add [kennel] to your sign-in** and types their current password instead |
| More than one kennel | After sign-in, page **Choose a kennel**, one button per kennel | **Switch kennel** at the top of the portal comes back here |

After the first sign-in, a notice may offer **Add an authenticator app to your sign-in** with **Set
it up** and **Not now**. It is recommended and never required. Set-up is on **Account**, under
**Authenticator app (recommended)**, with **Set up an authenticator app**, a QR code, the field
**The six numbers the app shows now**, **Turn on**, ten recovery codes and **I have saved these**.

Before approval the breeder also completes **Profile** (business name required, plus a phone or email
for buyers and town and state to tick step 2), and the **Submit for approval** card asks **Who they
are** (AKC representative, Board member of a local animal welfare council such as ICAW, Respected
breeder, Veterinarian), **Their name**, **Their phone or email**, a tick for the listing terms and a
tick that they are the seller. Approval comes by email, "Your Puppy Connection account is approved".
The animation can skip this or show it as one card, because Alex's outline starts after sign-in.

**Captions.**
- Sign in with Google, or with your email and password.
- New here? Create an account and we email you a link to choose your password.
- Listed with us before? Use Forgot password to set your first one.

---

## Step 2. Add the mom and the dad

**What the breeder does.** Opens **Moms and dads** in the menu, presses **Add a mom** or **Add a
dad**, fills the drawer, and saves. Each parent is saved once and reused on every litter.

**Screen.** Page **Moms and dads**, lede "Save each mom and dad once, with their health testing,
then pick them on each litter. Families see both parents on every puppy page." Empty state **No moms
or dads yet**. The drawer is headed **Add a mom** or **Add a dad**, then the parent's name once saved.

### Fields

| On-screen label | Required? | Notes |
| --- | --- | --- |
| Name | Required ("Give the mom or dad a name.") | Hint "The mom's call name or registered name." |
| Breed | Optional | Typed search over the list. Choosing it loads that breed's health tests |
| Registration | Optional | Choices from the setting, by default AKC, AKC Canine Partners, APRI, ACA, CKC, UKC, or **Not registered or not set** |
| Registration number | Optional | |
| Health testing done | Optional | Tick boxes from the breed's published list (OFA, breed club), with required tests marked **required** and listed first. A breed with no published list shows common screenings |
| Other health testing | Optional | "Any test not on the list, and results if you want families to see them." |
| Pedigree | Optional | "The mom's parents and lines, as you would tell a family." |
| Photo | Optional | One photo per parent. **Add a photo**, then **Replace photo** and **Remove photo**. Empty text "No photo yet. Families like to see the parents." |
| Documents | Optional | Up to 10, each up to 10 MB, PDF, JPEG, PNG or WebP. **What it is** (Health record, Health guarantee, Pedigree, Other document), **Name** (optional), **Who can see it** (**Families, on the site** or **Puppy Connection staff only**, which is the default), then **Choose a file and upload** |

Mom or dad is fixed by which button was pressed, and the form has no way to change it afterwards.
Buttons at the foot are **Add mom** or **Add dad**, then **Save mom** or **Save dad**, and **Remove
from the litter picker** (which hides the parent from new litters but keeps it on litters that have it).

### Time-savers

- **Fill from a document.** At the top of the drawer, **Choose a document** reads a health record,
  pedigree or registration paper (PDF or a photo of the page) and fills the empty fields, including
  name, breed, registration, registration number, health tests, other testing and the sire and dam
  in Pedigree. Each filled field is marked "From your document, please check". The tick **Replace
  what is already filled in** lets it overwrite. Nothing saves until the breeder presses Add or Save,
  and then the document is kept with the parent as a private document. If the document is about a
  male and this is a mom, it says so. Limits are 20 reads a day and 6 in ten minutes per breeder.
- **Photo or document before saving.** Choosing a photo or document on a new parent saves what is
  entered first ("Choosing a photo or document saves what you have entered first.").
- **Rotate left** and **Rotate right** on each document fix a sideways scan, and each document shows
  a preview of its first page.
- **Show to families** and **Make private** switch a document's visibility in one press.

**Captions.**
- Save each mom and dad once, with their photo and health testing.
- Upload a health record or pedigree and the form fills itself in. Check it, then save.
- Families see both parents on every puppy page.

---

## Step 3. Start a litter

**What the breeder does.** Opens **Litters and puppies**, presses **Add a litter** (top right, or in
the empty state **No litters yet**), fills the drawer and presses **Add litter**.

**Screen.** Page **Litters and puppies**, lede "Each litter holds its puppies. Add photos to a puppy,
then pay to list it." Drawer **Add a litter**, later **Edit litter**.

### Fields

| On-screen label | Required? | Notes |
| --- | --- | --- |
| Breed | Required ("Choose a breed.") | Typed search, as the list runs to about 330 breeds |
| Born | Optional | Date. Without it the puppy prompts say "The litter has no birth date, so families cannot see the puppy's age." |
| Ready to go home | Optional | Date |
| Mom's weight (lb) | Optional | |
| Dad's weight (lb) | Optional | |
| Mom | Optional | Picks from saved moms, or **Not chosen**. A link **Moms and dads** sits under the pickers |
| Dad | Optional | Picks from saved dads, or **Not chosen** |
| About this litter | Optional | |

Each litter shows as a card headed with the breed, with "Born ..., ready ...", the weights and the
parent names, and the buttons **Edit litter**, **Add several** and **Add a puppy**. **Remove litter**
is in the edit drawer.

**Captions.**
- Add a litter with its breed and birth date.
- Pick the mom and dad you saved.

---

## Step 4. Add the puppies

**What the breeder does.** Presses **Add a puppy** on the litter card, or **Add several** for the
whole litter at once, then opens each puppy to finish it and add photos.

**Screen.** Drawer **Add a puppy**, then the puppy's name once saved. Each puppy card on the list
shows a thumbnail, price, sex, color, photo count, status pills and a one-line standing such as
"Before it can be paid for, it needs a photo." or "Ready to list for $14.99. Pay to list".

### Fields

| On-screen label | Required? | Notes |
| --- | --- | --- |
| Name | Required to save ("Give the puppy a name.") | |
| Sex | Optional | Not set, Female, Male |
| Color | Optional | Suggestions for the breed, or type any color |
| Coat type | Optional | Shows only for breeds with more than one coat |
| Price ($) | Not needed to save, needed to pay | The field is marked required on screen, but the server saves a puppy with no price. The pay check says "Needs a name and a price." |
| Deposit ($) | Optional | |
| Status | Defaults to Available | **Available**, **Pending**, **Placed**. "Placed puppies stay visible in their litter, marked placed." |
| Description | Optional | |
| Comes with | Optional | Tick boxes in four groups, Health, Registration and lines, Goes home with, Pickup and delivery, plus **Anything else**, one per line |
| Link to this puppy on your site | Optional | Must start with https:// |
| Registration, health and deposit link (optional) | Optional, folded | Registration, Markings, Health notes, Vaccinations, Deworming, Disclosures, Deposit link ("Families pay you there, never Puppy Connection.") |
| Photos | At least 1 to pay (the min_photos setting, default 1) | See photo rules |
| Videos | Optional | Up to 2, each up to 2 minutes and 200 MB, only once the puppy is saved |
| Documents | Optional | Same as parents, shown on the puppy page if made public |

The buttons at the foot are **Add puppy** or **Save puppy**, and **Remove puppy**. A box **Make this
listing stronger** lists what would help (a fuller description, health details, both parents, at
least 3 photos, a birth date) and ends "You can still save and list it as it is." It never blocks.
When a saved puppy can be paid for, the foot shows "[Name] is ready to list. Pay now, or add the rest
of the litter first and pay for them together." with **Pay to list [Name], $14.99**.

### Photo rules

- **Add photos** takes several files at once. JPEG, PNG or WebP, at least 1,000 pixels across and up
  to 15 MB each. A smaller one is refused in the browser with "use the original from your phone or
  camera rather than a screenshot or a saved copy". A dark photo asks "Upload it anyway?".
- Photos are shrunk on the breeder's own device before upload, and the location and camera details
  are removed.
- **The photo check.** Each photo is checked by AI that the puppy can be seen clearly. The upload
  button reads "Checking photo 1 of 3…". A photo that fails shows **Sent back** with the reason
  (for example "The puppy is turned away from the camera.", "The photo is blurred or out of focus.",
  "A person takes up much of the photo.") and does not count or show on the site. **Checking** and
  **Being looked at** are the other flags.
- **The cap.** "A puppy can have up to 15 photos." The cap is the max_photos setting, set to 15 in
  the admin on 2026-11-01 (batch-2026-11-01-wix-photo-refresh.md). The code default is 12.
- **The cover.** The first photo is the cover, marked **Cover**. New photos go to the top, so a new
  upload becomes the cover. **Make cover**, the arrow buttons, a position menu ("1, cover", 2, 3...)
  and drag and drop all reorder.
- The panel states the **Photo standard** in full and adds "A new photo at least every four weeks
  keeps the listing on the site."

### Time-savers

- **Add several** (drawer **Add several puppies**) asks **Girls**, **Boys** and **Not sure yet**,
  with a shared **Price for each ($)**, **Deposit for each ($)** and **Color**, and adds up to 15 at
  a time named Girl 1, Boy 1, Puppy 1. Toast "6 puppies added. Add photos to each one next."
- **Duplicate** on a puppy card copies it into the same litter as "[Name] copy", with its price,
  deposit, color, coat, description, Comes with, health details and links, and opens it. It does not
  copy photos, videos, documents or markings. Toast "Copied [Name]. Add its photos next."
- **Fill from a document** works on the puppy drawer too. It can fill name, sex, color, coat,
  markings, registration, vaccinations, deworming and health notes, and ticks Microchipped,
  Registered or Registrable under Comes with.
- **Photo or document on a new puppy** saves the puppy first, then uploads, so there is no second
  step.
- **Batch photo removal.** With two or more photos, **Select all** and **Remove selected** (which
  becomes "Remove 3 photos") remove several in one go.
- **Rotate left** and **Rotate right** on documents.
- **Not in the right litter?** moves a puppy to another litter of the same breed, or to a new one,
  with its photos and documents.
- **Find a puppy** searches by name, breed, color or sex, with a **Show** filter, once a kennel has
  more than one puppy.

**Captions.**
- Add each puppy, or add the whole litter at once with Add several.
- Add up to 15 clear photos. The first one is the cover.
- Each photo is checked so families can see the puppy clearly.

---

## Step 5. Pay to list

**What the breeder does.** Opens **Pay to list**, ticks the puppies (or **Select all**), presses
the pay button, pays on Stripe's page, and comes back to **Litters and puppies**.

**Screen.** Page **Pay to list**, lede "Each puppy costs $14.99 to list once, and it stays up for as
long as you add a new photo at least every four weeks. Pay for a whole litter at once." Card **Ready
to list** with a row per puppy (photo, name, breed, "Draft", and a "Could be stronger" note with
**Open it**). **Total** updates as boxes are ticked. Card **Not ready yet** lists the rest with the
reason. The button reads **Continue to payment** until a box is ticked, then "Pay $29.98 for 2
listings".

### Price and where it comes from

| What | Value | Source |
| --- | --- | --- |
| Price the portal shows | $14.99 per puppy | Setting fee_cents, seeded 1499 in app/schema.sql, code default 1499 in lib/store.js |
| Price Stripe charges | $14.99 one time | Stripe price STRIPE_PRICE_ID (Amber's live price, launch-workplan B2). The portal alerts the team if Stripe's total disagrees with fee_cents |
| How long it lasts | Paid once, no end date | Setting listing_days 0 in app/schema.sql |
| Most per checkout | 50 puppies | lib/payments.js |

### What can be paid for

A puppy appears under **Ready to list** when it has a name, a price and at least one photo that has
not been sent back, and is not removed, paused or already in a checkout. A photo still **Checking**
counts, so a slow check never blocks payment.

### Checkout and after

1. The portal holds the chosen puppies for 60 minutes and opens Stripe Checkout, which shows card
   payment with the note "Listing on Puppy Connection: [names]..." and a **Pay** button.
2. **Cancel** on Stripe returns to Pay to list with "Payment canceled. Nothing was charged, and the
   puppies are free to pay for again."
3. On success the breeder lands on **Litters and puppies** with the toast "Payment received. Your
   puppies appear on the site within a few minutes." The puppy's pill changes to **Listed**.
4. Stripe emails the receipt. Puppy Connection emails "[Name] is now listed". The payment shows on
   **Payments** as **Paid**.
5. **How soon.** The publish job runs every minute, waits until the first change is 45 seconds old,
   and starts no build within two minutes of the last (lib/jobs.js). A photo still being checked
   shows on the site once it passes. **View on the site** then appears on the puppy and at the top.

### Keeping it live, the photo every four weeks

| When, with no new photo that passes the check | What happens |
| --- | --- |
| 4 weeks | Email: it goes offline in two weeks unless a new photo is added |
| 5 weeks | Email: it goes offline next week |
| 6 weeks | Off the site. A new photo brings it straight back, free |
| 12 weeks | Removed from the site but kept in the portal. **Relist for $14.99** without entering it again |

The weeks are the inactivity_days setting (28, 35, 42 and 84 days). No clock runs before
photo_clock_start, 2026-11-01. Only a new photo resets it, not a price change or a status change. A
banner at the top of every screen lists each listing that needs a photo and by when, with **Add a
photo**, and each email links straight to the puppy's photos. Placed puppies are left out.

**Captions.**
- Tick the puppies you want to list and pay $14.99 each, once.
- Your puppies appear on the site within a few minutes.
- Add a new photo at least every four weeks and the listing stays up.

---

## Things a first-time breeder may trip on

- **The order.** The portal says to add a litter first, but a mom or dad can only be picked once saved
  on Moms and dads. A breeder who starts with the litter has to leave and come back to Edit litter.
- **A new photo becomes the cover.** New photos go to the top. A breeder who adds a fresh photo for
  the four-week rule changes the cover unless they move it.
- **Price looks required but is not.** A puppy saves without a price and then sits in **Not ready
  yet** with "Needs a name and a price."
- **Sent back photos do not count.** A puppy whose only photo was sent back cannot be paid for.
- **Screenshots and saved copies are refused** under 1,000 pixels. Phone originals work.
- **Videos** only appear once the puppy is saved, and only if video is switched on.
- **Mom or dad cannot be switched** after Add a mom or Add a dad.
- **Pending accounts see no Litters, Moms and dads or Pay to list** until approved.
- **Links expire.** A new account link lasts 24 hours, a password link 1 hour, an invitation 7 days.
- **Fill from a document** cannot read a scanned PDF with no text ("A clear photo of the page works
  instead") and is limited to 20 a day.
- **Paying for one puppy at a time.** The ready-to-list note and the lede suggest finishing the litter
  and paying together.

## Open questions where the code was unclear

1. Google sign-in does not ask for the authenticator code, even when the breeder turned it on
   (googleCallback and oneTapSignIn in worker.js go straight to signInPerson). Confirm this is meant,
   because the walkthrough should not say every sign-in asks for the code.
2. A Google address with no account becomes a pending breeder at once, skipping the business name and
   the robot check that **Create my account** has. Confirm whether the animation should show Google as
   a way to create an account.
3. The live values of fee_cents, max_photos and min_photos were not read from the production database.
   The storyboard uses $14.99 (seed and Stripe price), 15 photos (batch record of 2026-11-01) and 1
   photo to pay (seed). Confirm before the captions name a number.
4. The note on Stripe's checkout page says each puppy "stays listed until you remove it or mark it
   placed" (lib/payments.js listingNote). That leaves out the photo every four weeks rule, and marking
   placed does not take a puppy off the site. Decide whether to change the note before filming.
5. Whether **Fill from a document** is on in production depends on the AI binding (config prefill
   from env.AI). The production config sets PHOTO_CHECK_MODE ai, so the binding is likely there, but
   this was not confirmed on the live portal.
6. The parent's breed list comes from the health test catalog (P.breeds) and the litter's from the
   breeds table (state.breeds). It is not clear whether every litter breed appears for a parent.
7. Parent photos skip the 1,000 pixel floor and the AI photo check that puppy photos get. Confirm this
   is meant before the animation implies the same rules for both.
8. The "Add your first litter" card on the Overview does not mention Moms and dads. If the animation
   leads with parents, the card may want a line for them.
