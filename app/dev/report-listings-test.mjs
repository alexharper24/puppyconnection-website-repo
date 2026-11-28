// Checks how the client reporting dashboard's listing counts group breeders and puppies by day.
//
//   node app/dev/report-listings-test.mjs
//
// No database is needed. The day is the owners' day (America/Indiana/Indianapolis), so a time late
// on the evening of November 7 in UTC belongs to November 7 there and one just after midnight UTC
// still belongs to the day before.

import { groupListings, reportListings } from '../lib/report-daily.js';

let fails = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; };

const rows = groupListings(
  [{ decided_at: '2026-11-08T03:30:00Z' }, { decided_at: '2026-11-08T15:00:00Z' }, { decided_at: '2026-11-01T16:00:00Z' }],
  [{ published_at: '2026-11-08T14:00:00Z', payment_state: 'paid' }, { published_at: '2026-11-08T15:00:00Z', payment_state: 'paid' },
   { published_at: '2026-11-08T16:00:00Z', payment_state: 'comped' }, { published_at: '2026-10-30T16:00:00Z', payment_state: 'paid' }],
  '2026-11-01');
const get = (day, kind) => rows.find((r) => r.day === day && r.kind === kind)?.n || 0;
check('a breeder approved just after midnight UTC counts on the owners\' evening before', get('2026-11-07', 'breeder_added') === 1, JSON.stringify(rows));
check('a breeder approved in the day counts on that day', get('2026-11-08', 'breeder_added') === 1);
check('paid listings are counted together by day', get('2026-11-08', 'listing_paid') === 2);
check('comped listings are kept apart from paid ones', get('2026-11-08', 'listing_comped') === 1);
check('anything before the start day is left out', rows.every((r) => r.day >= '2026-11-01') && get('2026-10-30', 'listing_paid') === 0);
check('rows come back in date order', rows.map((r) => r.day).join() === [...rows.map((r) => r.day)].sort().join());

const env = { REPORT_KEY: 'k', DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: [] }) }) }) } };
const refused = await reportListings(new Request('https://x/api/report/listings'), env, new URL('https://x/api/report/listings'));
check('a read without the key is refused', refused.status === 403);
const wrong = await reportListings(new Request('https://x/api/report/listings', { headers: { 'x-report-key': 'nope' } }), env, new URL('https://x/api/report/listings'));
check('a read with the wrong key is refused', wrong.status === 403);
const ok = await reportListings(new Request('https://x/api/report/listings?from=2026-11-01', { headers: { 'x-report-key': 'k' } }), env, new URL('https://x/api/report/listings?from=2026-11-01'));
const body = await ok.json();
check('a read with the key answers a list', ok.status === 200 && body.from === '2026-11-01' && Array.isArray(body.rows));
check('the answer is never cached', ok.headers.get('cache-control') === 'no-store');

console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
