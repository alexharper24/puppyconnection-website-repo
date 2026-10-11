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

export const PER_REQUEST = 100;
export const BATCHES = 4;

/** D1 batches kept to 50 statements each. */
async function batchAll(env, stmts) { for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50)); }

export async function mailingAddress(env) {
  const r = await env.DB.prepare("SELECT value FROM settings WHERE key = 'mailing_address'").first();
  return r ? String(r.value).trim() : '';
}

/** The email one subscriber receives. */
export function renderCampaign(c, { token, portalOrigin, address }) {
  const unsub = unsubscribeUrl(portalOrigin, token);
  const body = String(c.body).replace(/\r\n/g, '\n').trim();
  const text = `${body}\n\n--\nPuppy Connection\n${address}\n\nYou're getting this because you signed up for Puppy Connection emails. `
    + `To stop getting them, open this link:\n${unsub}\n`;
  return {
    subject: c.subject,
    text,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

/** Queue one row per subscribed person and mark the campaign sending. Returns the count. */
export async function startCampaign(env, id) {
  const t = now();
  const r = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO campaign_sends (campaign_id, subscriber_id, status)
      SELECT ?, id, 'pending' FROM subscribers WHERE status = 'subscribed'`).bind(id),
    env.DB.prepare("UPDATE campaigns SET status = 'sending', send_started_at = ?, updated_at = ? WHERE id = ? AND status = 'draft'").bind(t, t, id),
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
      body: JSON.stringify(messages.map((m) => ({ from: env.EMAIL_FROM, to: [m.to], subject: m.subject, text: m.text, headers: m.headers }))),
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
      const go = rows.filter((r) => r.status === 'subscribed' && (!allow.length || allow.includes(r.email.toLowerCase())));
      const skip = rows.filter((r) => !go.includes(r));
      const results = go.length ? await deliver(env, go.map((r) => ({ to: r.email, ...renderCampaign(c, { token: r.unsub_token, portalOrigin, address }) }))) : [];
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
  const msg = renderCampaign(c, { token: 'test-copy', portalOrigin: env.PORTAL_ORIGIN || '', address: address || '(mailing address not set yet)' });
  const [r] = await deliver(env, [{ to, ...msg, subject: `[Test] ${msg.subject}` }]);
  if (!r.ok) throw new Error('The email service refused the test copy.');
  return r;
}
