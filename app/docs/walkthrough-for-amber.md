# A walk-through of Puppy Connection, for Amber

This is a tour of the new Puppy Connection from start to finish. It follows one breeder from the
day they sign up to the day their puppy goes home, and shows what you see and do along the way.
You can follow it on the staging copy, which is a full working copy of the new directory that
nobody else can find on Google.

| What it is | Address |
| --- | --- |
| The breeder portal, where breeders sign up and list puppies | https://portal.puppyconnection.workers.dev |
| Your admin, where you approve breeders and look after the directory | https://admin.puppyconnection.workers.dev |
| The public site, what buyers see | https://site.puppyconnection.workers.dev |

The staging copy already holds the 273 listings from your current Wix site and three made-up
breeders, so there is something to look at on every screen. The made-up breeders are Buttercup
Lane Puppies, Thistledown Pups and Maple Brook Doodles. Their names, phone numbers and pictures
are invented for this tour, and none of them is a real kennel.

A few things are still waiting on a decision or an account, and they are marked **Waiting** where
they come up. The full list is at the end.

## 1. What the directory does

For a buyer, Puppy Connection is one place to look at puppies from small family breeders in the
area. They can browse by breed, open a puppy to see its photos, price, birth date and what comes
with it, and then contact the breeder directly by phone, email or the breeder's own website.
Buyers never pay Puppy Connection anything, and their conversations happen with the breeder.

For a breeder, it is a simple way to get their puppies in front of those buyers. They sign up
once, you approve them, and from then on they add their own litters and puppies with photos.
Each puppy costs $14.99 to list, paid once. The listing stays up until they take it down or mark
the puppy as placed, so there is nothing to renew.

For you, the admin is where you decide who gets to list, keep an eye on what is going up, and
handle anything that needs a person, such as a refund or a question about a listing.

## 2. A breeder signs up

Open the portal at https://portal.puppyconnection.workers.dev. You see the **Breeder portal**
sign-in page with the Puppy Connection logo.

There are two ways in, and neither needs a password.

- **Continue with Google.** The breeder picks their Google account and they are in.
  **Waiting** on Alex to finish the Google setup, so on staging today this button may not let
  every account through yet.
- **Use your email.** The breeder types their email and, the first time, their business name,
  then presses **Email me a sign-in link**. The page changes to **Check your email**. The email
  holds a six-digit code and a link. They type the code into the box on that page, or open the
  link, and they are signed in. Each code works once and only for 15 minutes.

On staging, real email is not switched on yet (**Waiting** on Alex). Instead the **Check your
email** page has a link to the **portal mailbox**, and the code is waiting there. Each browser
only sees the mail it asked for. There is also a short "I am not a robot" check on the sign-in
page, which is normal.

Once they are in, a new breeder lands on the **Overview** with a box called **Getting listed**.
It shows four steps, with the first one, **Email confirmed**, already ticked.

## 3. The breeder fills in their profile

From the overview the breeder opens **Profile** in the menu. The page is headed **Your profile**
and explains that this is what buyers see on their breeder page.

They fill in their business name, a phone number or email for buyers, their town and state, a
website if they have one, and a few lines about their kennel. There is also a contact name, which
only Puppy Connection sees. Their street address is never asked for or shown. Further down, a box called **Extras for your page** lets them add a logo and one photo
of their kennel, pick the breeds they raise and add a Facebook page. All of the extras are
optional. Photos are shrunk on their own phone or computer before they upload, so even a large
phone photo goes up quickly, and any location hidden inside the photo is removed.

To see a breeder at this stage, look at **Buttercup Lane Puppies**. They have confirmed their
email and filled in part of their profile, but they have not submitted it yet.

## 4. The breeder submits and waits for approval

At the bottom of the profile is a box called **Submit for approval**. The breeder reads the
listing terms, ticks that they accept them, and presses submit. The overview now says they are
on step 4, **Puppy Connection approves your account**.

While they wait, the menu only shows **Overview**, **Profile**, **Account** and **Help**, and the
overview explains that litters and puppies open once they are approved. That way nobody is
confused by screens that do not work yet.

You get an email saying a new breeder is waiting. **Thistledown Pups** is at this stage in the
staging copy.

The listing terms on staging are a placeholder marked REPLACE THIS. **Waiting** on your own
wording for the terms, which you can type into the admin's **Terms** screen yourself.

## 5. You approve the breeder in the admin

Open the admin at https://admin.puppyconnection.workers.dev. You sign in with your Google account
or with a code sent to your email, and then confirm a second step on your phone, such as an
authenticator app. Only people you have added as operators get past that point. **Waiting** on
Alex to finish the Google sign-in and on each operator setting up the second step the first time.

The admin opens on the **Overview**. At the top, **Needs attention** lists anything waiting for
you, and the first line says a breeder is waiting for your approval.

Open **Approvals** in the menu. Thistledown Pups is in the list. Click the row and a panel opens
on the right with everything they entered, their contact details, their kennel photo and logo if
they added them, and the version of the terms they accepted. Press **Approve**, then **Approve**
again to confirm.
They get an email saying they are approved, and they move into **Breeders** with a green
**Approved** label. If something is not right you can press **Decline** instead, with a private
reason that only operators see.

## 6. The breeder adds a litter and puppies

Back in the portal, an approved breeder sees the full menu. They open **Litters and puppies**.

They add a litter by choosing the breed, the birth date and the date the puppies can go home, and
the mom's and dad's weights if they know them. Then they add puppies to it, either one at a time
or several at once with **Add several**, which asks how many girls and boys there are and names
them Girl 1, Boy 1 and so on until the breeder renames them.

Each puppy has its own editor with its name, sex, color, price, deposit, a description, what
comes with the puppy, and its photos. Every puppy row says in one line where it stands, for
example "Before it can be paid for, it needs a photo" or "Ready to list for $14.99".

**Maple Brook Doodles** shows this well. They have a Cavapoo litter and a Mini Bernedoodle
litter. Pepper has a photo and is ready to list, while Juniper is still a draft that needs a
photo.

## 7. The breeder pays $14.99 per puppy, once

The breeder opens **Pay to list**. Puppies that are ready are under **Ready to list**, with a box
to tick for each one, and the total updates as they tick. Puppies that still need something are
under **Not ready yet**, with the reason beside each one.

They press **Continue to payment** and go to the checkout. **Tonight this is a practice payment.
No card is charged, and the page says so at the top.** The breeder presses **Pay $14.99 (practice
card)** and comes back to **Litters and puppies**, where the puppy now says **Listed**.

Real card payment through Stripe switches on later, and the screens stay the same when it does.
**Waiting** on Alex to set up the Stripe test account, and then your own Stripe account before
launch.

Each payment shows on the breeder's **Payments** screen and on your **Payments** screen in the
admin. Maple Brook paid for three Cavapoos this way.

## 8. The puppy appears on the public site

Open the public site at https://site.puppyconnection.workers.dev. The listed puppies appear with
everything else, and each one has its own page with its photos and the breeder's details. The
breeder's own page shows their logo, their town and all of their puppies. From the portal, the
breeder can press **View on the site** to jump straight to their page or to any puppy.

On staging a listing shows up within about a minute and a half. When the finished site is
switched on, it updates through **Publish** in the admin instead. **Waiting** on Alex to connect
the finished site's automatic build in Cloudflare, which is free.

Try Maple, Biscuit and Clover from Maple Brook Doodles.

## 9. The breeder marks a puppy placed

When a puppy goes home, the breeder presses **Mark placed** on its row in **Litters and
puppies**. The puppy stays on the site marked as adopted, so buyers can see the breeder has
happy families, and it no longer shows as available. If they change their mind, **Mark
available** puts it back. Biscuit from Maple Brook is placed.

## 10. Views and clicks

The breeder's **Views and clicks** screen shows how many times buyers opened each puppy and how
many times they clicked through to call, email or visit the breeder's website, for the last 30
days and all time. The overview shows the totals too. This is the breeder's proof that the
listing is working, and it counts nothing about who the buyer is.

Maple Brook has a week of made-up views and clicks so the screen has something in it.

## 11. Your tools in the admin

Everything below is in the admin menu on the left.

- **Overview** shows the numbers at a glance and the **Needs attention** list. That list covers
  breeders waiting for approval, payments to review, disputed payments, a failed publish or
  job, breeders asking to close their account, and contact details that changed this week.
- **Approvals** lists breeders waiting for you, oldest first.
- **Breeders** lists everyone, with search, filters and sorting. Opening a breeder shows their
  profile, litters, puppies, payments and history. From there you can approve, decline, pause
  (**Suspend**) or reinstate them, change their sign-in email, and edit their profile, a litter
  or a puppy on their behalf. Every change you make is recorded as made by you.
- **Notes** sit inside each breeder's panel. They are private to operators and never shown to
  the breeder or the public. Maple Brook has one.
- **Listings** shows every puppy. **Hold** takes a listing off the site straight away without
  deleting it, and **Release** puts it back. **List free** lists a puppy without a payment.
- **Breeds** lets you add a breed or edit the guide text for a breed page.
- **Payments** shows every payment. On staging you can press **Refund** on a practice payment,
  which takes those listings down and emails the breeder, and you can record a practice
  dispute. These buttons work with real Stripe once it is switched on.
- **Reports** shows listings and income by month, listings by breed and the most viewed
  puppies, and each report downloads as a spreadsheet file.
- **Terms** is where you write the listing terms and publish a new version. Breeders are asked
  to accept the new version the next time they sign in.
- **Publish** shows when the public site last updated, anything waiting, and a **Publish now**
  button. The scheduled jobs, such as the nightly backup, are listed there with **Run now**.
- **Email log** shows every email the directory sent, to whom, and whether it went.
- **Settings** holds a few listing rules, such as how many photos a puppy needs.
- **Reset demo data** is at the bottom of **Settings**, on the staging copy only. It puts staging
  back to the three made-up breeders, removes anyone who signed up while you were trying things
  out, and leaves the 273 Wix listings alone. It takes a backup first, and you have to type
  RESET DEMO before the button works. Use it before showing the directory to someone, so they
  see a clean copy.
- **Activity** is the full history of who did what and when.
- **Mailbox** opens every email the staging copy would have sent. It goes away once real email
  is switched on.

## To see a made-up breeder's portal

On staging you can sign in to the portal as any of the three made-up breeders. Use
buttercup@breeders.test, thistledown@breeders.test or maplebrook@breeders.test, press **Email me a
sign-in link**, and open the **portal mailbox** link on the next page to find the code. Pressing
**Reset demo data** afterwards puts them back as they were.

## Still waiting on a decision or an account

| What | Waiting on |
| --- | --- |
| Real email, so codes and notices arrive in real inboxes | Alex, choosing where staging sends email from |
| Real card payments through Stripe, first in test mode and then your own account | Alex for the test account, then you for your Stripe account |
| Continue with Google for breeders, and Google sign-in for the admin | Alex, finishing the Google setup |
| The second step on your phone when you sign in to the admin | Each operator, the first time they sign in |
| The listing terms in your own words | Amber |
| The privacy page, written as a draft for your review | Amber |
| Which breeder each Wix listing belongs to, before the real import | Amber |
| The finished public site, generated and published from the directory | Alex, connecting the site's automatic build in Cloudflare (free) |
| What staff can do compared with the owner | Amber |
| Whether a kennel can have more than one person signing in | Amber |
