// Puppy Connection's own mailing list (migrations/0011_mailing_list.sql). The portal takes
// sign-ups from the site's footer box and serves the unsubscribe page; the admin lists, imports,
// exports and unsubscribes. Nothing here sends mail, because sending waits on real email (L4).

import { now, ulid, clean, randomToken } from './util.js';

export const EMAIL_OK = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

/** Every email sent to the list carries this link, and the List-Unsubscribe header points at it. */
export const unsubscribeUrl = (portalOrigin, token) => `${String(portalOrigin).replace(/\/+$/, '')}/unsubscribe?t=${encodeURIComponent(token)}`;

/**
 * Add one address. Someone already on the list stays as they are, so a second sign-up changes
 * nothing, and someone who unsubscribed is left unsubscribed unless they signed up again
 * themselves from the site, which is a new request from them.
 */
export async function addSubscriber(env, { email, name, source, batch = null, actor = null }) {
  const e = String(email || '').trim().toLowerCase();
  if (!EMAIL_OK.test(e) || e.length > 200) return { ok: false, reason: 'invalid' };
  const had = await env.DB.prepare('SELECT id, status FROM subscribers WHERE email = ?').bind(e).first();
  const t = now();
  if (had) {
    if (had.status === 'unsubscribed' && source === 'site') {
      await env.DB.prepare("UPDATE subscribers SET status = 'subscribed', unsubscribed_at = NULL, source = 'site', created_at = ? WHERE id = ?").bind(t, had.id).run();
      return { ok: true, result: 'resubscribed', id: had.id };
    }
    return { ok: true, result: had.status === 'unsubscribed' ? 'kept_unsubscribed' : 'already', id: had.id };
  }
  const id = ulid();
  await env.DB.prepare('INSERT INTO subscribers (id, email, name, source, unsub_token, created_at, import_batch) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, e, clean(name, 120), source, randomToken(), t, batch).run();
  return { ok: true, result: 'added', id, actor };
}

/** Unsubscribe by the token in an email link. Answers whether a row matched. */
export async function unsubscribeToken(env, token) {
  const row = await env.DB.prepare('SELECT id, email, status FROM subscribers WHERE unsub_token = ?').bind(String(token || '')).first();
  if (!row) return null;
  if (row.status !== 'unsubscribed') {
    await env.DB.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?").bind(now(), row.id).run();
  }
  return row;
}

/**
 * Read a CSV of addresses, such as the Wix contacts export. The email column is the first one
 * whose header mentions email, or failing that the first column holding an address. A name comes
 * from a "name" column, or from first and last name columns.
 */
export function parseSubscriberCsv(text) {
  const rows = csvRows(String(text || '').replace(/^﻿/, ''));
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = head.some((h) => /e-?mail|name/.test(h)) && !head.some((h) => EMAIL_OK.test(h));
  const body = hasHeader ? rows.slice(1) : rows;
  let ei = hasHeader ? head.findIndex((h) => /e-?mail/.test(h)) : -1;
  if (ei < 0) ei = (body.find((r) => r.some((c) => EMAIL_OK.test(c.trim()))) || []).findIndex((c) => EMAIL_OK.test(c.trim()));
  if (ei < 0) return [];
  const ni = hasHeader ? head.findIndex((h) => h === 'name' || h === 'full name') : -1;
  const fi = hasHeader ? head.findIndex((h) => /^first/.test(h)) : -1;
  const li = hasHeader ? head.findIndex((h) => /^last/.test(h)) : -1;
  return body.map((r) => ({
    email: (r[ei] || '').trim(),
    name: ni >= 0 ? (r[ni] || '').trim() : [fi >= 0 ? r[fi] : '', li >= 0 ? r[li] : ''].map((x) => (x || '').trim()).filter(Boolean).join(' '),
  })).filter((r) => r.email);
}

function csvRows(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}
