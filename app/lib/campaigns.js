// Sending to the mailing list (migrations/0012_campaigns.sql). The admin starts a send and runs
// the first batches at once; the portal's 15-minute cron (lib/jobs.js, the campaigns job) runs
// the rest. The free Workers plan allows 50 outside requests a run, and one request to the email
// service carries up to 100 emails, so a run sends at most BATCHES x 100.
//
// Every email carries the subscriber's own one-click unsubscribe link in its text and in the
// List-Unsubscribe and List-Unsubscribe-Post headers (RFC 8058), which Gmail and Yahoo require of
// bulk senders, and Puppy Connection's mailing address, which the CAN-SPAM Act requires of a
// commercial email. A send cannot start until the mailing address is set.

import { now } from './util.js';
import { unsubscribeUrl } from './subscribers.js';
import { campaignHtml, emailLogoUrl } from './email-html.js';

export const PER_REQUEST = 100;

// Whom a send goes to (launch workplan C5, Alex 2026-10-19). Subscribers only, or every contact who
// has not unsubscribed, because the list also works as a mailing service for announcements such as
// the new site. An unsubscribed address is in neither, and the unsubscribe link in every email
// works the same for a contact as for a subscriber.
export const AUDIENCES = { subscribers: ['subscribed'], all: ['subscribed', 'contact'] };
export function audienceOf(v) {
  if (v === undefined || v === null || v === '') return 'subscribers';
  if (!AUDIENCES[v]) throw new Error(`Unknown audience ${v}.`);
  return v;
}
const statusList = (audience) => AUDIENCES[audienceOf(audience)].map((x) => `'${x}'`).join(', ');

/** How many people a send to this audience would reach now. */
export async function audienceCount(env, audience) {
  const { n } = await env.DB.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE status IN (${statusList(audience)})`).first();
  return n;
}
export const BATCHES = 4;

/** D1 batches kept to 50 statements each. */
async function batchAll(env, stmts) { for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50)); }

export async function mailingAddress(env) {
  const r = await env.DB.prepare("SELECT value FROM settings WHERE key = 'mailing_address'").first();
  return r ? String(r.value).trim() : '';
}

// What a test copy says in its text part while no mailing address is set. The HTML part leaves the
// address out instead, because Alex took the postal-address placeholder out of the design (2026-10-25).
export const ADDRESS_NOT_SET = '(mailing address not set yet)';

/**
 * The email one person receives. status is theirs on the list, which sets the reason line. The
 * text part is unchanged and the html part is design B (lib/email-html.js), with the author's own
 * greeting shown as the opening line when the email starts with one.
 */
export function renderCampaign(c, { token, portalOrigin, address, status = 'subscribed', logoUrl }) {
  const unsub = unsubscribeUrl(portalOrigin, token);
  const body = String(c.body).replace(/\r\n/g, '\n').trim();
  const why = status === 'contact' ? "You're getting this because you have been in touch with Puppy Connection." : "You're getting this because you signed up for Puppy Connection emails.";
  const text = `${body}\n\n--\nPuppy Connection\n${address}\n\n${why} `
    + `To stop getting them, open this link:\n${unsub}\n`;
  const html = campaignHtml({ subject: c.subject, body, address: address === ADDRESS_NOT_SET ? '' : address, why, unsub, logoUrl });
  return {
    subject: c.subject,
    text,
    html,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

/** Queue one row per person in the audience and mark the campaign sending. Returns the count. */
export async function startCampaign(env, id, audience = 'subscribers') {
  const t = now();
  const a = audienceOf(audience);
  const r = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO campaign_sends (campaign_id, subscriber_id, status)
      SELECT ?, id, 'pending' FROM subscribers WHERE status IN (${statusList(a)})`).bind(id),
    env.DB.prepare("UPDATE campaigns SET status = 'sending', audience = ?, send_started_at = ?, updated_at = ? WHERE id = ? AND status = 'draft'").bind(a, t, t, id),
  ]);
  if (r[1].meta.changes !== 1) throw new Error('That email has already been sent or is sending.');
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM campaign_sends WHERE campaign_id = ?').bind(id).first();
  await env.DB.prepare('UPDATE campaigns SET total = ? WHERE id = ?').bind(n, id).run();
  return n;
}

async function deliver(env, messages) {
  const mode = env.EMAIL_MODE;
  if (mode === 'log') {
    const t = now();
    await batchAll(env, messages.flatMap((m) => [
      env.DB.prepare('INSERT INTO dev_mailbox (to_addr, subject, body, link, sent_at) VALUES (?, ?, ?, ?, ?)').bind(m.to, m.subject, m.text, null, t),
      env.DB.prepare("INSERT INTO email_log (to_addr, template, sent_at, status) VALUES (?, 'campaign', ?, 'logged')").bind(m.to, t),
    ]));
    return messages.map(() => ({ ok: true, id: null }));
  }
  if (mode === 'resend') {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error('Email is set to resend but RESEND_API_KEY or EMAIL_FROM is missing.');
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(messages.map((m) => ({ from: env.EMAIL_FROM, to: [m.to], subject: m.subject, text: m.text, html: m.html, headers: m.headers, ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {}) }))),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return messages.map(() => ({ ok: false, error: `refused ${res.status}` }));
    const ids = (out.data || []).map((d) => d.id);
    const t = now();
    await batchAll(env, messages.map((m, i) => env.DB.prepare("INSERT INTO email_log (to_addr, template, sent_at, provider_id, status) VALUES (?, 'campaign', ?, ?, 'sent')").bind(m.to, t, ids[i] || null)));
    return messages.map((m, i) => ({ ok: true, id: ids[i] || null }));
  }
  throw new Error(`EMAIL_MODE "${mode || ''}" is not set up, so nothing was sent.`);
}

/** Send the next batches of every campaign that is sending. Safe to run again at any time. */
export async function runCampaigns(env, { batches = BATCHES } = {}) {
  const { results: sending } = await env.DB.prepare("SELECT * FROM campaigns WHERE status = 'sending' ORDER BY send_started_at").all();
  const address = await mailingAddress(env);
  const portalOrigin = env.PORTAL_ORIGIN || '';
  const logoUrl = emailLogoUrl(env);
  const allow = (env.EMAIL_ALLOWLIST || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const out = [];
  let left = batches;
  for (const c of sending) {
    let sent = 0, failed = 0, skipped = 0;
    while (left > 0) {
      const { results: rows } = await env.DB.prepare(
        `SELECT cs.subscriber_id, s.email, s.status, s.unsub_token FROM campaign_sends cs JOIN subscribers s ON s.id = cs.subscriber_id
          WHERE cs.campaign_id = ? AND cs.status = 'pending' LIMIT ?`,
      ).bind(c.id, PER_REQUEST).all();
      if (!rows.length) break;
      left -= 1;
      const t = now();
      // Someone who unsubscribed after the send started, or who is outside a test allowlist, is skipped.
      const may = AUDIENCES[audienceOf(c.audience)];
      const go = rows.filter((r) => may.includes(r.status) && (!allow.length || allow.includes(r.email.toLowerCase())));
      const skip = rows.filter((r) => !go.includes(r));
      const results = go.length ? await deliver(env, go.map((r) => ({ to: r.email, ...renderCampaign(c, { token: r.unsub_token, portalOrigin, address, status: r.status, logoUrl }) }))) : [];
      const stmts = [
        ...go.map((r, i) => env.DB.prepare('UPDATE campaign_sends SET status = ?, provider_id = ?, error = ?, sent_at = ? WHERE campaign_id = ? AND subscriber_id = ?')
          .bind(results[i].ok ? 'sent' : 'failed', results[i].id || null, results[i].error || null, t, c.id, r.subscriber_id)),
        ...skip.map((r) => env.DB.prepare("UPDATE campaign_sends SET status = 'skipped', sent_at = ? WHERE campaign_id = ? AND subscriber_id = ?").bind(t, c.id, r.subscriber_id)),
      ];
      await batchAll(env, stmts);
      sent += results.filter((x) => x.ok).length; failed += results.filter((x) => !x.ok).length; skipped += skip.length;
    }
    const { n } = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_sends WHERE campaign_id = ? AND status = 'pending'").bind(c.id).first();
    const counts = await env.DB.prepare(
      "SELECT SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed FROM campaign_sends WHERE campaign_id = ?",
    ).bind(c.id).first();
    await env.DB.prepare(`UPDATE campaigns SET sent_count = ?, failed_count = ?, updated_at = ?${n ? '' : ", status = 'sent', sent_at = ?"} WHERE id = ?`)
      .bind(...[counts.sent || 0, counts.failed || 0, now(), ...(n ? [] : [now()]), c.id]).run();
    out.push({ id: c.id, sent, failed, skipped, pending: n });
    if (left <= 0) break;
  }
  return out;
}

/** A test copy to one address, the operator's own, marked as a test in the subject. */
export async function sendCampaignTest(env, c, to) {
  const address = await mailingAddress(env);
  const msg = renderCampaign(c, { token: 'test-copy', portalOrigin: env.PORTAL_ORIGIN || '', address: address || ADDRESS_NOT_SET, logoUrl: emailLogoUrl(env) });
  const [r] = await deliver(env, [{ to, ...msg, subject: `[Test] ${msg.subject}` }]);
  if (!r.ok) throw new Error('The email service refused the test copy.');
  return r;
}
