// The day's page views and contact taps by kind of page, for Harper Studio's client reporting
// dashboard (clients.harperstudio.co), which reads it once a night. Read only, and only with the
// REPORT_KEY secret in the x-report-key header, so nobody else can read the figures. It returns
// counts only: traffic_daily holds nothing about a visitor (lib/stats.js).

import { json } from './util.js';

const DAY_RX = /^\d{4}-\d{2}-\d{2}$/;

// Compare the two keys in constant time, so the answer time says nothing about the key.
function sameKey(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

export async function reportDaily(request, env, url) {
  const key = env.REPORT_KEY || '';
  if (request.method !== 'GET' || !key || !sameKey(request.headers.get('x-report-key') || '', key)) {
    return new Response('Forbidden', { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  const from = url.searchParams.get('from');
  const since = from && DAY_RX.test(from) ? from : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { results } = await env.DB.prepare('SELECT day, kind, views, clicks FROM traffic_daily WHERE day >= ? ORDER BY day, kind').bind(since).all();
  const res = json({ from: since, rows: results });
  res.headers.set('cache-control', 'no-store');
  return res;
}

// New breeders and listed puppies by day, for the same dashboard (2026-11-27). These are the two counts that
// follow the site's income, because a breeder joins and then pays per listed puppy. Counts only, no names.
//   breeder_added   a breeder approved that day who did not come across from the old Wix site
//   listing_paid    a puppy listed that day after a paid checkout
//   listing_comped  a puppy listed that day without a charge (a package paid outside, or free)
//   revenue_cents   what paid checkouts took that day, in cents, leaving out any refunded in full or lost to a dispute
// A puppy counts on the day it was first published, and the day is the owners' day, America/Indiana/Indianapolis.
const OWNERS_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Indiana/Indianapolis' });
const dayOf = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : OWNERS_DAY.format(d); };

export function groupListings(breeders, puppies, since, checkouts = []) {
  const by = new Map();
  const add = (day, kind, n = 1) => { if (day && day >= since) by.set(`${day}|${kind}`, (by.get(`${day}|${kind}`) || 0) + n); };
  for (const b of breeders) add(dayOf(b.decided_at), 'breeder_added');
  for (const p of puppies) add(dayOf(p.published_at), p.payment_state === 'paid' ? 'listing_paid' : 'listing_comped');
  for (const c of checkouts) if (!['refunded', 'dispute_lost'].includes(c.pay_status) && c.amount_total_cents > 0) add(dayOf(c.paid_at), 'revenue_cents', c.amount_total_cents);
  return [...by.entries()].map(([k, n]) => { const [day, kind] = k.split('|'); return { day, kind, n }; })
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.kind < b.kind ? -1 : 1));
}

export async function reportListings(request, env, url) {
  const key = env.REPORT_KEY || '';
  if (request.method !== 'GET' || !key || !sameKey(request.headers.get('x-report-key') || '', key)) {
    return new Response('Forbidden', { status: 403, headers: { 'cache-control': 'no-store' } });
  }
  const from = url.searchParams.get('from');
  const since = from && DAY_RX.test(from) ? from : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  // Two days of slack on the database side, since the owners' day can sit a day either side of the UTC date.
  const slack = new Date(Date.parse(since) - 2 * 86400000).toISOString().slice(0, 10);
  const breeders = (await env.DB.prepare("SELECT decided_at FROM breeders WHERE status = 'approved' AND legacy = 0 AND decided_at >= ?").bind(slack).all()).results;
  const puppies = (await env.DB.prepare("SELECT published_at, payment_state FROM puppies WHERE payment_state IN ('paid','comped') AND published_at >= ?").bind(slack).all()).results;
  const checkouts = (await env.DB.prepare("SELECT c.paid_at, c.amount_total_cents, p.status AS pay_status FROM checkouts c LEFT JOIN payments p ON p.stripe_payment_intent_id = c.stripe_payment_intent_id WHERE c.status = 'paid' AND c.paid_at >= ?").bind(slack).all()).results;
  const res = json({ from: since, rows: groupListings(breeders, puppies, since, checkouts) });
  res.headers.set('cache-control', 'no-store');
  return res;
}
