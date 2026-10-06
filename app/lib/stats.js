// Plan P2.5. Views of a puppy page and clicks through to its breeder.
//
// The public site sends a small beacon when a puppy page opens and when a visitor follows the
// breeder's website, phone or email link. Each one adds 1 to that puppy's count for the UTC
// day. Nothing about the visitor is stored, no cookie is set, and the request's address is
// used only as a rate-limit key that the limiter forgets within a minute.

import { now } from './util.js';

// Automated visitors that announce themselves. A beacon from one of these is dropped.
const BOT_RX = /bot\b|bot\/|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview|headless|phantom|lighthouse|pagespeed|python|curl|wget|httpclient|okhttp|go-http|java\/|node-fetch|axios|monitor|uptime/i;

export function isBot(request) {
  const ua = request.headers.get('user-agent') || '';
  if (ua.length < 10 || BOT_RX.test(ua)) return true;
  // Cloudflare marks verified crawlers where bot management data is present.
  if (request.cf && request.cf.botManagement && request.cf.botManagement.verifiedBot) return true;
  return false;
}

const KINDS = { view: 'views', click: 'clicks' };
const SLUG_RX = /^[a-z0-9-]{1,120}$/;

/**
 * Count one beacon. Always answers 204 with no body, so a caller learns nothing about which
 * slugs exist or whether it was counted. Returns the response and, for tests and logs, why.
 */
export async function recordBeacon(request, env) {
  const done = (why) => ({ why, response: new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }) });
  if (request.method !== 'POST') return done('method');
  // Only the site's own pages may count. A browser always sends Origin on a POST beacon.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return done('origin');
  if (isBot(request)) return done('bot');
  let body;
  try {
    const text = await request.text();
    if (text.length > 400) return done('size');
    body = JSON.parse(text);
  } catch { return done('shape'); }
  const col = KINDS[body && body.k];
  const slug = String((body && body.s) || '');
  if (!col || !SLUG_RX.test(slug)) return done('shape');

  const ip = request.headers.get('cf-connecting-ip') || 'local';
  // At most BEACON_LIMITER's allowance per address a minute across every puppy, and one view
  // and one click per address per puppy a minute, so a reload or a double click counts once.
  if (env.BEACON_LIMITER) {
    const { success } = await env.BEACON_LIMITER.limit({ key: ip });
    if (!success) return done('rate');
  }
  if (env.BEACON_ONCE) {
    const { success } = await env.BEACON_ONCE.limit({ key: `${ip}|${body.k}|${slug}` });
    if (!success) return done('repeat');
  }
  const pup = await env.DB.prepare('SELECT id FROM public_puppies WHERE slug = ?').bind(slug).first();
  if (!pup) return done('unknown');
  const day = now().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO puppy_stats (puppy_id, day, ${col}) VALUES (?, ?, 1)
     ON CONFLICT (puppy_id, day) DO UPDATE SET ${col} = ${col} + 1`,
  ).bind(pup.id, day).run();
  return done('counted');
}

/** One breeder's counts per puppy, for the last `days` days and for all time. */
export async function breederStats(env, breederId, days = 30) {
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.slug, br.name AS breed, p.publication_state,
            COALESCE(SUM(CASE WHEN s.day >= ? THEN s.views END), 0) AS views,
            COALESCE(SUM(CASE WHEN s.day >= ? THEN s.clicks END), 0) AS clicks,
            COALESCE(SUM(s.views), 0) AS views_all, COALESCE(SUM(s.clicks), 0) AS clicks_all
       FROM puppies p JOIN litters l ON l.id = p.litter_id JOIN breeds br ON br.id = l.breed_id
       LEFT JOIN puppy_stats s ON s.puppy_id = p.id
      WHERE p.breeder_id = ? AND (p.publication_state != 'draft' OR s.puppy_id IS NOT NULL)
      GROUP BY p.id ORDER BY views_all DESC, p.name`,
  ).bind(since, since, breederId).all();
  const total = { views: 0, clicks: 0, views_all: 0, clicks_all: 0 };
  for (const r of results) for (const k of Object.keys(total)) total[k] += r[k];
  return { days, since, total, puppies: results };
}
