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
  signin_link: ({ link, purpose }) => ({
    subject: purpose === 'signup' ? 'Finish creating your Puppy Connection account' : 'Your Puppy Connection sign-in link',
    text: `${purpose === 'signup' ? 'Thanks for signing up.' : 'Here is the sign-in link you asked for.'} ` +
      `Open this link and press Sign in to continue. It works once and expires in 15 minutes.\n\n${link}\n\n` +
      'If you did not ask for this, you can ignore it and nothing will change.' + signOff(),
    link,
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

/** Alerts go to every operator in people, and to OPS_EXTRA (Alex) when it is set. */
export async function alertOps(env, title, detail) {
  const { results } = await env.DB.prepare('SELECT email FROM people').all();
  const to = new Set(results.map((r) => r.email));
  for (const e of (env.OPS_EXTRA || '').split(',').map((s) => s.trim()).filter(Boolean)) to.add(e);
  for (const addr of to) {
    try { await sendMail(env, addr, 'ops_alert', { title, detail }); } catch (e) { console.error('alert failed', e); }
  }
}
