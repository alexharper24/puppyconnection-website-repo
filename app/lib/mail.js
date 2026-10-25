// Outgoing email (spec section 11).
//
// EMAIL_MODE=log   the local simulation. Nothing leaves the machine. The message is written
//                  to dev_mailbox so /dev/mail can show it, and printed to the console.
// EMAIL_MODE=resend  real delivery through Resend's API, bolted in later. It needs the
//                  RESEND_API_KEY secret and a verified sending domain, and on staging it
//                  sends only to addresses listed in EMAIL_ALLOWLIST. EMAIL_REPLY_TO, when set,
//                  is where replies go (info@puppy-connection.com, Alex 2026-10-24).
// Anything else refuses to send, so a misconfigured Worker cannot mail anyone by accident.

import { now } from './util.js';

const SITE = 'Puppy Connection';

// 2026-11-16 as November 16, 2026.
function longDay(d) {
  const t = new Date(`${String(d).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(t.getTime()) ? String(d) : t.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function signOff() {
  return `\n\n${SITE}\nThis is an automatic message from the breeder portal.`;
}

export const TEMPLATES = {
  // Launch workplan A26. Email carries only invitations and password resets. Sign-in is a
  // password (with an authenticator app if the person set one up) or Google, never an emailed code.
  // A new breeder proves the address first, and the link opens the page that sets the password.
  signup_verify: ({ link }) => ({
    subject: 'Confirm your email to finish creating your Puppy Connection account',
    text: 'Thanks for signing up to list with Puppy Connection.\n\nOpen this link to confirm this is your email address and choose your password.\n\n' +
      `${link}\n\nThe link works once and stops working after 24 hours. If you did not sign up, you can ignore this email and nothing will change.` + signOff(),
    link,
  }),
  password_reset: ({ link }) => ({
    subject: 'Set your Puppy Connection password',
    text: 'Here is the link to set a new password for the breeder portal. If you have never had a password, this sets your first one.\n\n' +
      `${link}\n\nThe link works once and stops working after 1 hour. If you did not ask for this, you can ignore it and your password stays as it is.` + signOff(),
    link,
  }),
  // Workplan A25. Puppy Connection invites someone to a kennel from the admin.
  invitation: ({ business, link, days }) => ({
    subject: `You are invited to manage ${business} on Puppy Connection`,
    text: `Puppy Connection has invited you to manage ${business} in the breeder portal, where you can keep its profile, litters and puppies up to date.\n\n` +
      `Open this link to choose your password and sign in.\n\n${link}\n\nThe link works once and stops working after ${days} days. ` +
      'After that you sign in with this email address and your password, or with Continue with Google if this address is a Google account. ' +
      'If you were not expecting this, you can ignore it, or reply and let us know.' + signOff(),
    link,
  }),
  // A breeder added this person to their kennel. The link sets their password, as an invitation does.
  member_added: ({ business, by, link, days }) => ({
    subject: `You can now sign in to ${business} on Puppy Connection`,
    text: `${by} added you to ${business} on Puppy Connection, so you can manage its profile, litters and puppies.\n\n` +
      `Open this link to choose your password and sign in.\n\n${link}\n\nThe link works once and stops working after ${days} days. ` +
      'After that you sign in with this email address and your password, or with Continue with Google if this address is a Google account. ' +
      'If you were not expecting this, you can ignore it, or reply and let us know.' + signOff(),
    link,
  }),
  // Plan P6.6. Sent to the sign-in address, so the real owner hears about a change they did not make.
  contact_changed: ({ business, changes, by, portalUrl }) => ({
    subject: 'Your Puppy Connection contact details were changed',
    text: `The contact details buyers see for ${business || 'your kennel'} on Puppy Connection were just changed ` +
      `${by === 'operator' ? 'by the Puppy Connection team' : 'in the breeder portal'}.\n\n` +
      changes.map((c) => `  ${c.label}\n    was ${c.from || '(blank)'}\n    now ${c.to || '(blank)'}`).join('\n\n') +
      '\n\nIf you made this change, there is nothing to do. If you did not, please contact Puppy Connection right away ' +
      'by replying to this email, so we can put your details back and keep your account safe.' +
      (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: portalUrl || undefined,
  }),
  profile_submitted: ({ business, adminUrl }) => ({
    subject: `New breeder waiting for approval: ${business}`,
    text: `${business} has finished their profile and submitted it for approval.\n\nReview it here:\n${adminUrl}` + signOff(),
    link: adminUrl,
  }),
  approved: ({ business, portalUrl }) => ({
    subject: 'Your Puppy Connection account is approved',
    text: `Good news, ${business} is approved. You can now add litters and puppies and publish your listings.\n\n${portalUrl}` + signOff(),
    link: portalUrl,
  }),
  declined: ({ business, message }) => ({
    subject: 'About your Puppy Connection application',
    text: `Thank you for applying to list ${business} on Puppy Connection. We are not able to approve the account at this time.` +
      (message ? `\n\n${message}` : '') + signOff(),
  }),
  suspended: ({ business }) => ({
    subject: 'Your Puppy Connection account is paused',
    text: `The account for ${business} has been paused. You can still sign in and see your listings, but changes and payments are on hold. Reply to this email if you have questions.` + signOff(),
  }),
  reinstated: ({ business, portalUrl }) => ({
    subject: 'Your Puppy Connection account is active again',
    text: `The account for ${business} is active again.\n\n${portalUrl}` + signOff(),
    link: portalUrl,
  }),
  listings_live: ({ names, portalUrl }) => ({
    subject: names.length === 1 ? `${names[0]} is now listed` : `${names.length} puppies are now listed`,
    text: `Your payment went through and these listings are going live on the site within a few minutes:\n\n` +
      names.map((n) => `  ${n}`).join('\n') + `\n\n${portalUrl}` + signOff(),
    link: portalUrl,
  }),
  expiring_soon: ({ items, portalUrl }) => ({
    subject: items.length === 1 ? `${items[0].name}'s listing ends soon` : `${items.length} of your listings end soon`,
    text: 'These listings come off Puppy Connection on the date shown. Renew them from the portal to keep them up:\n\n' +
      items.map((i) => `  ${i.name}, until ${i.until}`).join('\n') + `\n\n${portalUrl}` + signOff(),
    link: portalUrl,
  }),
  expired: ({ names, portalUrl }) => ({
    subject: names.length === 1 ? `${names[0]}'s listing has ended` : `${names.length} of your listings have ended`,
    text: 'These listings have come off Puppy Connection. You can renew them from the portal and they go back up as soon as payment goes through:\n\n' +
      names.map((n) => `  ${n}`).join('\n') + `\n\n${portalUrl}` + signOff(),
    link: portalUrl,
  }),
  // Plan P3.8. A refunded listing payment takes its puppies off the site.
  listing_refunded: ({ names, amountCents, portalUrl }) => ({
    subject: 'Your Puppy Connection listing payment was refunded',
    text: `Your listing payment${amountCents ? ` of $${(amountCents / 100).toFixed(2)}` : ''} was refunded, so ` +
      `${names.length === 1 ? 'this puppy is' : 'these puppies are'} no longer listed on Puppy Connection:\n\n` +
      names.map((n) => `  ${n}`).join('\n') +
      `\n\n${names.length === 1 ? 'It is' : 'They are'} still in your breeder portal as ${names.length === 1 ? 'a draft' : 'drafts'}. ` +
      'If you have a question about this, reply to this email.' + (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: portalUrl || undefined,
  }),
  // Workplan A12, the photo-based listing schedule (lib/inactivity.js). Pre-written and automatic,
  // the wording lives here in code. Each email explains the rule, what happens next and why a
  // current listing helps, and links straight to each puppy's photos in the portal.
  photo_reminder: ({ items, first, offlineOn, portalUrl }) => ({
    subject: first
      ? (items.length === 1 ? `Add a new photo of ${items[0].name} to keep the listing up` : 'Add new photos to keep your listings up')
      : (items.length === 1 ? `${items[0].name} goes offline next week without a new photo` : 'Your listings go offline next week without new photos'),
    text: `${items.length === 1 ? 'This listing has' : 'These listings have'} had no new photo for ${first ? 'four' : 'five'} weeks:\n\n` +
      items.map((i) => `${i.name}\nAdd a photo: ${i.link}`).join('\n\n') +
      `\n\nPuppy Connection keeps a listing on the site for as long as it has a new photo at least every four weeks. ` +
      `Puppies change fast, and families are far more likely to get in touch about a puppy when the photos show how it looks today.\n\n` +
      `${first ? `If no new photo is added, ${items.length === 1 ? 'the listing goes' : 'the listings go'} offline in two weeks, on ${longDay(offlineOn)}.`
        : `This is the last reminder. Without a new photo, ${items.length === 1 ? 'the listing goes' : 'the listings go'} offline next week, on ${longDay(offlineOn)}.`} ` +
      'Adding one photo of a puppy keeps that listing up, and nothing else changes. Changing the price or marking a puppy still available does not count, because the photo is what families look at. ' +
      'If a puppy has gone home, mark it placed in the breeder portal and it stops getting reminders.' +
      (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: items[0] && items[0].link,
  }),
  listing_offline: ({ items, freeUntil, portalUrl }) => ({
    subject: items.length === 1 ? `${items[0].name} is off Puppy Connection until a new photo is added` : `${items.length} listings are off Puppy Connection until new photos are added`,
    text: `${items.length === 1 ? 'This listing has' : 'These listings have'} had no new photo for six weeks, so ${items.length === 1 ? 'it has' : 'they have'} come off the site for now:\n\n` +
      items.map((i) => `${i.name}\nAdd a photo: ${i.link}`).join('\n\n') +
      `\n\nNothing is lost. Add a new photo and the listing goes straight back on the site, free, until ${longDay(freeUntil)}. ` +
      'After that it stays in your breeder portal and can be listed again for the normal listing fee, without entering it again.' +
      (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: items[0] && items[0].link,
  }),
  listing_removed: ({ names, feeCents, portalUrl }) => ({
    subject: names.length === 1 ? `${names[0]} has been removed from Puppy Connection` : `${names.length} listings have been removed from Puppy Connection`,
    text: `${names.length === 1 ? 'This listing has' : 'These listings have'} had no new photo for twelve weeks, so ${names.length === 1 ? 'it has' : 'they have'} been removed from the site:\n\n${names.map((n) => `  ${n}`).join('\n')}\n\n` +
      `Every detail is kept in your breeder portal under Litters and puppies. To list one again, press Relist there and pay the listing fee${feeCents ? ` of $${(feeCents / 100).toFixed(2)}` : ''}, and it goes back up without entering it again. ` +
      'Adding a new photo first gives families the best picture of the puppy today.' + (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: portalUrl || undefined,
  }),
  // Workplan A14. To the breeder, when an operator takes a listing offline until new photos arrive.
  photo_hold: ({ puppy, reason, link }) => ({
    subject: `${puppy} is off Puppy Connection until new photos are added`,
    text: `Puppy Connection has taken the listing for ${puppy} off the site until new photos are uploaded.\n\nThe reason: ${reason}\n\n` +
      'Photos on Puppy Connection need to be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. ' +
      'Upload a photo that meets this and passes the photo check, and the listing goes back on the site by itself.' +
      (link ? `\n\nAdd a photo: ${link}` : '') + signOff(),
    link: link || undefined,
  }),
  // Workplan A9. To the breeder, when Puppy Connection sends a held photo back.
  photo_sent_back: ({ puppy, messages, portalUrl }) => ({
    subject: `Please replace a photo of ${puppy}`,
    text: `Puppy Connection looked at a photo you added for ${puppy} and it is not shown on the site.\n\n` +
      (messages.length ? `${messages.join('\n')}\n\n` : '') +
      'Remove it in the breeder portal and upload a clearer one where the puppy can be seen.' + (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: portalUrl || undefined,
  }),
  // Workplan A5. To each owner, for a report from the site's Report a listing form.
  listing_report: ({ business, puppy, reason, details, reporter, adminUrl }) => ({
    subject: `Listing reported: ${puppy ? `${puppy} from ` : ''}${business}`,
    text: `Someone reported ${puppy ? `the listing for ${puppy} from ${business}` : `the breeder ${business}`} on Puppy Connection.\n\n` +
      `Reason: ${reason}\n\n${details}\n\n` +
      (reporter ? `They would like a reply at ${reporter}.\n\n` : 'They did not leave an email address.\n\n') +
      `Open the report in the admin:\n${adminUrl}` + signOff(),
    link: adminUrl,
  }),
  ops_alert: ({ title, detail }) => ({
    subject: `Puppy Connection alert: ${title}`,
    text: `${detail}` + signOff(),
  }),
};

export async function sendMail(env, to, template, data) {
  const make = TEMPLATES[template];
  if (!make) throw new Error(`Unknown email template ${template}`);
  const msg = make(data);
  const mode = env.EMAIL_MODE;

  if (mode === 'log') {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO dev_mailbox (to_addr, subject, body, link, sent_at) VALUES (?, ?, ?, ?, ?)')
        .bind(to, msg.subject, msg.text, msg.link || null, now()),
      env.DB.prepare('INSERT INTO email_log (to_addr, template, sent_at, status) VALUES (?, ?, ?, ?)')
        .bind(to, template, now(), 'logged'),
    ]);
    console.log(`[mail:${template}] to ${to}: ${msg.subject}${msg.link ? `\n  ${msg.link}` : ''}`);
    return { ok: true, mode };
  }

  if (mode === 'resend') {
    const allow = (env.EMAIL_ALLOWLIST || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (allow.length && !allow.includes(String(to).toLowerCase())) {
      await logSend(env, to, template, null, 'skipped-allowlist');
      return { ok: true, skipped: true };
    }
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error('Email is set to resend but RESEND_API_KEY or EMAIL_FROM is missing.');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject: msg.subject, text: msg.text, ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {}) }),
    });
    const body = await res.json().catch(() => ({}));
    await logSend(env, to, template, body.id || null, res.ok ? 'sent' : `failed-${res.status}`);
    if (!res.ok) throw new Error(`Resend refused the message (${res.status}).`);
    return { ok: true, id: body.id };
  }

  throw new Error(`EMAIL_MODE "${mode || ''}" is not set up, so no email was sent.`);
}

async function logSend(env, to, template, id, status) {
  await env.DB.prepare('INSERT INTO email_log (to_addr, template, sent_at, provider_id, status) VALUES (?, ?, ?, ?, ?)')
    .bind(to, template, now(), id, status).run();
}

/**
 * Who gets a business notice, meaning a new breeder waiting for approval or a listing report
 * (launch workplan B9, Amber 2026-10-25). NOTICE_TO, a comma-separated list such as
 * info@puppy-connection.com, replaces the people table for these notices. Unset, each notice keeps
 * its earlier recipients, which `fallback` selects from people. System alerts (alertOps) never
 * use it and stay with the owners.
 */
export async function noticeTo(env, fallback) {
  const set = String(env.NOTICE_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (set.length) return [...new Set(set)];
  return (await env.DB.prepare(fallback).all()).results.map((r) => r.email);
}

/**
 * Alerts go to every owner in people, and to OPS_EXTRA (Alex) when it is set. Staff get none.
 * NOTICE_TO does not change them, because a failed payment or job is for the owners (B9).
 */
export async function alertOps(env, title, detail) {
  const { results } = await env.DB.prepare("SELECT email FROM people WHERE role = 'owner'").all();
  const to = new Set(results.map((r) => r.email));
  for (const e of (env.OPS_EXTRA || '').split(',').map((s) => s.trim()).filter(Boolean)) to.add(e);
  for (const addr of to) {
    try { await sendMail(env, addr, 'ops_alert', { title, detail }); } catch (e) { console.error('alert failed', e); }
  }
}

/**
 * A notice about one breeder that someone should act on, such as a request to close an account.
 * It goes to NOTICE_TO (info@, Alex 2026-10-25) and to the owners when that is unset, in the
 * alert's plain layout.
 */
export async function noticeOps(env, title, detail) {
  for (const addr of await noticeTo(env, "SELECT email FROM people WHERE role = 'owner'")) {
    try { await sendMail(env, addr, 'ops_alert', { title, detail }); } catch (e) { console.error('notice failed', e); }
  }
}

// Failure alerts (launch workplan B10). A failure that repeats, such as a job that fails every
// fifteen minutes, sends at most one alert of its kind an hour. The ones held back are counted in
// alert_state (migrations/0040) and sent as one summary by flushHeldAlerts once the hour is up,
// from the portal's */15 run, so a held alert is late but never lost.
export const ALERT_QUIET_MS = 3600000;

const hourAgo = () => now(new Date(Date.now() - ALERT_QUIET_MS));

/** Send an alert of this kind unless one went out in the last hour, in which case hold it. */
export async function alertOnce(env, kind, title, detail) {
  const t = now();
  await env.DB.prepare('INSERT OR IGNORE INTO alert_state (kind, last_sent_at, held) VALUES (?, NULL, 0)').bind(kind).run();
  const before = await env.DB.prepare('SELECT held, held_since FROM alert_state WHERE kind = ?').bind(kind).first();
  // The claim is one conditional update, so two runs at once cannot both send.
  const claim = await env.DB.prepare(
    'UPDATE alert_state SET last_sent_at = ?, held = 0, held_since = NULL, last_title = ?, last_detail = ? WHERE kind = ? AND (last_sent_at IS NULL OR last_sent_at <= ?)',
  ).bind(t, title, String(detail).slice(0, 2000), kind, hourAgo()).run();
  if (claim.meta.changes >= 1) {
    const extra = before && before.held ? `\n\n${before.held} more alert${before.held === 1 ? '' : 's'} of this kind were held back since ${before.held_since}.` : '';
    await alertOps(env, title, `${detail}${extra}`);
    return { sent: true };
  }
  await env.DB.prepare('UPDATE alert_state SET held = held + 1, held_since = COALESCE(held_since, ?), last_title = ?, last_detail = ? WHERE kind = ?')
    .bind(t, title, String(detail).slice(0, 2000), kind).run();
  return { sent: false, held: true };
}

/** One summary for each kind whose held alerts have waited out the hour. */
export async function flushHeldAlerts(env) {
  const { results } = await env.DB.prepare('SELECT * FROM alert_state WHERE held > 0 AND last_sent_at <= ?').bind(hourAgo()).all();
  let sent = 0;
  for (const r of results) {
    const claim = await env.DB.prepare('UPDATE alert_state SET last_sent_at = ?, held = 0, held_since = NULL WHERE kind = ? AND held = ? AND last_sent_at <= ?')
      .bind(now(), r.kind, r.held, hourAgo()).run();
    if (claim.meta.changes < 1) continue;
    await alertOps(env, `${r.last_title} (${r.held} more since ${r.held_since})`,
      `This failure happened ${r.held} more time${r.held === 1 ? '' : 's'} after the last alert, which were held back so the inbox is not flooded. The latest one:\n\n${r.last_detail}`);
    sent += 1;
  }
  return { sent };
}

/**
 * Forced failures for testing (FAIL_TEST, a comma list), honored only on local and staging. A job
 * name (reconcile, backup, ...) fails that job before it runs. publish_hook fails the publish where
 * the deploy hook would be called, build_late makes the build check find a build that did not
 * finish, and stripe fails the webhook handler after the signature passes.
 */
export function failTest(env, kind) {
  if (env.DEV_MODE !== 'local' && env.DEV_MODE !== 'staging') return false;
  return String(env.FAIL_TEST || '').split(',').map((s) => s.trim()).includes(kind);
}
