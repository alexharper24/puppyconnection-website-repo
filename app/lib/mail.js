// Outgoing email (spec section 11).
//
// EMAIL_MODE=log   the local simulation. Nothing leaves the machine. The message is written
//                  to dev_mailbox so /dev/mail can show it, and printed to the console.
// EMAIL_MODE=resend  real delivery through Resend's API, bolted in later. It needs the
//                  RESEND_API_KEY secret and a verified sending domain, and on staging it
//                  sends only to addresses listed in EMAIL_ALLOWLIST.
// Anything else refuses to send, so a misconfigured Worker cannot mail anyone by accident.

import { now } from './util.js';

const SITE = 'Puppy Connection';

function signOff() {
  return `\n\n${SITE}\nThis is an automatic message from the breeder portal.`;
}

export const TEMPLATES = {
  // Plan P6.2. The code is for the browser that asked, typed into the page still open there,
  // and the link works anywhere. Either one signs in once, and both end after 15 minutes.
  signin_link: ({ link, code, purpose }) => ({
    subject: purpose === 'signup' ? 'Finish creating your Puppy Connection account' : 'Your Puppy Connection sign-in link',
    text: (purpose === 'signup' ? 'Thanks for signing up.' : 'Here is the sign-in you asked for.') +
      (code ? `\n\nYour sign-in code is\n\n    ${code}\n\nType it into the Puppy Connection page you have open, in the same browser where you asked for it.` : '') +
      `\n\n${code ? 'Or open this link' : 'Open this link'} and press Sign in.\n\n${link}\n\n` +
      `${code ? 'The code and the link each work once' : 'The link works once'} and stop working after 15 minutes. ` +
      `If you did not ask for this, you can ignore it and nothing will change.${code ? ' Never share the code with anyone.' : ''}` + signOff(),
    link,
  }),
  // A breeder added this person to their kennel. They sign in with this address the usual way.
  member_added: ({ business, by, portalUrl }) => ({
    subject: `You can now sign in to ${business} on Puppy Connection`,
    text: `${by} added you to ${business} on Puppy Connection, so you can manage its profile, litters and puppies.\n\n` +
      `To sign in, open the breeder portal and enter this email address. We will send you a sign-in code.\n\n${portalUrl}\n\n` +
      'If you were not expecting this, you can ignore it, or reply and let us know.' + signOff(),
    link: portalUrl,
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
  // Workplan A2, the inactivity schedule (lib/inactivity.js). The wording lives here, in code.
  inactive_reminder: ({ items, second, offlineInDays, portalUrl }) => ({
    subject: second ? 'Last reminder: are these puppies still available?' : 'Are these puppies still available?',
    text: `${second ? 'A last reminder: ' : ''}${items.length === 1 ? 'this listing has' : 'these listings have'} not been updated in a while, so Puppy Connection is checking ${items.length === 1 ? 'it is' : 'they are'} still current.\n\n` +
      items.map((i) => `${i.name}\nStill available: ${i.link}`).join('\n\n') +
      `\n\nPress Still available for each puppy that is, and nothing else changes. If a puppy has gone home, mark it placed in the breeder portal. ` +
      `A listing with no update in ${offlineInDays} more days comes off the site, and you can bring it back free from the portal.` +
      (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: items[0] && items[0].link,
  }),
  listing_offline: ({ names, freeUntil, portalUrl }) => ({
    subject: names.length === 1 ? `${names[0]} is off Puppy Connection for now` : `${names.length} listings are off Puppy Connection for now`,
    text: `These listings had no update for four weeks, so they have come off the site:\n\n${names.map((n) => `  ${n}`).join('\n')}\n\n` +
      `Nothing is lost. To put a puppy back, open it in the breeder portal and press Bring back. It is free until ${freeUntil}.` +
      (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: portalUrl || undefined,
  }),
  listing_removed: ({ names, portalUrl }) => ({
    subject: names.length === 1 ? `${names[0]} has been removed from the directory` : `${names.length} listings have been removed from the directory`,
    text: `These listings were off the site for two weeks with no update, so they have been removed from the Puppy Connection directory:\n\n${names.map((n) => `  ${n}`).join('\n')}\n\n` +
      'Their details are kept. You can still bring one back from the breeder portal.' + (portalUrl ? `\n\n${portalUrl}` : '') + signOff(),
    link: portalUrl || undefined,
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
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject: msg.subject, text: msg.text }),
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
 * Alerts go to every owner in people, and to OPS_EXTRA (Alex) when it is set. Staff get none,
 * until Amber chooses an inbox for each notice (launch workplan, the notice inboxes item).
 */
export async function alertOps(env, title, detail) {
  const { results } = await env.DB.prepare("SELECT email FROM people WHERE role = 'owner'").all();
  const to = new Set(results.map((r) => r.email));
  for (const e of (env.OPS_EXTRA || '').split(',').map((s) => s.trim()).filter(Boolean)) to.add(e);
  for (const addr of to) {
    try { await sendMail(env, addr, 'ops_alert', { title, detail }); } catch (e) { console.error('alert failed', e); }
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
