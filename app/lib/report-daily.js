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
