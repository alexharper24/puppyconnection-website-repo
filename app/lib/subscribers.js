// Puppy Connection's own mailing list (migrations/0011_mailing_list.sql). The portal takes
// sign-ups from the site's footer box and serves the unsubscribe page; the admin lists, imports,
// exports and unsubscribes. Nothing here sends mail, because sending waits on real email (L4).
//
// A row is in one of three states (migrations/0027_contact_state.sql). 'subscribed' is on the
// list. 'unsubscribed' asked to stop and is never put back by an import. 'contact' is someone
// from the Wix contacts export who never subscribed, kept so Amber can decide later whether to
// invite them, and every send, count and export leaves them out because each one selects
// status = 'subscribed'.

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
    // A contact who never subscribed joins when they sign up themselves, or when they ask an
    // operator to add them.
    if (had.status === 'contact' && (source === 'site' || source === 'admin')) {
      await env.DB.prepare("UPDATE subscribers SET status = 'subscribed', source = ?, created_at = ? WHERE id = ?").bind(source, t, had.id).run();
      return { ok: true, result: 'joined', id: had.id };
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
 * Wix's "Email subscriber status" column, as the contacts export of 2026-10-19 writes it:
 * "Subscribed", "Unsubscribed" or "Never subscribed". Anything else, including a blank, is kept as
 * a contact, so nobody joins the list without having subscribed.
 */
export function wixEmailState(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.startsWith('unsub')) return 'unsubscribed';
  if (v === 'subscribed') return 'subscribed';
  return 'contact';
}

/**
 * Read a CSV of addresses, such as the Wix contacts export. Answers { rows, statusColumn }, each
 * row { email, name, state }. The email column is the first one whose header mentions email
 * (Wix calls it "Email 1"), or failing that the first column holding an address. A name comes from
 * a "name" column, or from first and last name columns. The state comes from a subscriber status
 * column when the file has one; a plain list of addresses has none, and each row is taken as
 * subscribed, because an operator imports such a list only of people who asked to be on it.
 * Rows with no address are dropped and counted in `blank`. A later part of a file split by the
 * admin repeats the file's first row as `cells[0]`; pass `repeatedHead` so that row is not read
 * again when it is an address rather than a header.
 */
export function readSubscriberRows(cells, { repeatedHead = false } = {}) {
  if (!cells.length) return { rows: [], statusColumn: null, blank: 0 };
  const head = cells[0].map((h) => String(h || '').trim().toLowerCase());
  const hasHeader = head.some((h) => /e-?mail|name/.test(h)) && !head.some((h) => EMAIL_OK.test(h));
  const body = hasHeader || repeatedHead ? cells.slice(1) : cells;
  const statusCol = (h) => /subscri|status/.test(h);
  let ei = hasHeader ? head.findIndex((h) => /e-?mail/.test(h) && !statusCol(h)) : -1;
  if (ei < 0) ei = (body.find((r) => r.some((c) => EMAIL_OK.test(String(c).trim()))) || []).findIndex((c) => EMAIL_OK.test(String(c).trim()));
  if (ei < 0) return { rows: [], statusColumn: null, blank: 0 };
  const ni = hasHeader ? head.findIndex((h) => h === 'name' || h === 'full name') : -1;
  const fi = hasHeader ? head.findIndex((h) => /^first/.test(h)) : -1;
  const li = hasHeader ? head.findIndex((h) => /^last/.test(h) && !/activity/.test(h)) : -1;
  const si = hasHeader ? head.findIndex((h) => /e-?mail/.test(h) && /subscri/.test(h)) : -1;
  const at = (r, i) => String(r[i] ?? '').trim();
  let blank = 0;
  const rows = [];
  for (const r of body) {
    const email = at(r, ei);
    if (!email) { blank += 1; continue; }
    rows.push({
      email,
      name: ni >= 0 ? at(r, ni) : [fi >= 0 ? at(r, fi) : '', li >= 0 ? at(r, li) : ''].filter(Boolean).join(' '),
      state: si >= 0 ? wixEmailState(r[si]) : 'subscribed',
    });
  }
  return { rows, statusColumn: si >= 0 ? cells[0][si].trim() : null, blank };
}

/** The rows of a whole CSV file, as readSubscriberRows answers them. */
export function parseSubscriberCsv(text) {
  return readSubscriberRows(csvRows(String(text || '').replace(/^﻿/, '')));
}

export function csvRows(text) {
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
