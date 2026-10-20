// Launch workplan B10 and C5, run on Node against a fresh copy of schema.sql (dev/node-env.mjs),
// so the code under test is the lib/ code that ships and no server is needed.
//
//   node app/dev/alerts-test.mjs
//
// Failure alerts. Each failure the brief names is forced and its alert looked for in the test
// mailbox, which is where EMAIL_MODE log puts every email: a failed job on the */15 trigger and on
// the daily 13:00 trigger, a failed nightly backup, a failed publish, a site build that did not
// finish, a refused and a failed Stripe webhook, and a dispute. Then the quiet window: a repeat
// within the hour is held and counted, and goes out as one summary once the hour is up. Alerts
// reach owners and OPS_EXTRA, never staff.
//
// A send to every contact. Test addresses in each state (subscribed, never subscribed,
// unsubscribed) and each audience, with the unsubscribe link on every email and honored for a
// contact as for a subscriber.

import { d1, r2, freshSchema } from './node-env.mjs';
import { scheduled, runJob } from '../lib/jobs.js';
import { alertOnce, flushHeldAlerts, ALERT_QUIET_MS } from '../lib/mail.js';
import { publishIfDue, checkBuild } from '../lib/publish.js';
import { handleEvent } from '../lib/payments.js';
import { startCampaign, runCampaigns, audienceCount } from '../lib/campaigns.js';
import { unsubscribeToken } from '../lib/subscribers.js';
import { now } from '../lib/util.js';

let fails = 0;
function check(name, ok, detail) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `\n      ${detail}` : ''}`); if (!ok) fails += 1; }

const OWNER = 'owner@puppyconnection.test', OWNER2 = 'owner2@puppyconnection.test', STAFF = 'staff@puppyconnection.test', EXTRA = 'alex@ops.test';
const ago = (min) => now(new Date(Date.now() - min * 60000));

async function freshEnv(extra = {}) {
  const DB = d1(':memory:');
  await freshSchema(DB);
  await DB.batch([
    DB.prepare("INSERT INTO people (email, name, role, added_at) VALUES (?, 'Owner', 'owner', ?)").bind(OWNER, now()),
    DB.prepare("INSERT INTO people (email, name, role, added_at) VALUES (?, 'Owner Two', 'owner', ?)").bind(OWNER2, now()),
    DB.prepare("INSERT INTO people (email, name, role, added_at) VALUES (?, 'Staff', 'staff', ?)").bind(STAFF, now()),
  ]);
  return { DB, FILES: r2(), EMAIL_MODE: 'log', DEV_MODE: 'local', OPS_EXTRA: EXTRA, PHOTO_CHECK_MODE: 'sim', STREAM_MODE: 'sim', ...extra };
}
async function alerts(env, like = '%') {
  const { results } = await env.DB.prepare("SELECT to_addr, subject, body FROM dev_mailbox WHERE subject LIKE 'Puppy Connection alert:%' AND subject LIKE ? ORDER BY id").bind(like).all();
  return results;
}
const to = (rows) => [...new Set(rows.map((r) => r.to_addr))].sort().join(',');
const WANT = [EXTRA, OWNER, OWNER2].sort().join(',');

async function signed(secret, body) {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)))].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `t=${t},v1=${mac}`;
}
function ctx() { const p = []; return { waitUntil: (x) => p.push(x), done: () => Promise.all(p) }; }

async function failureAlerts() {
  console.log('-- failure alerts');

  // A job on the */15 trigger.
  let env = await freshEnv({ FAIL_TEST: 'reconcile' });
  let out = await scheduled({ cron: '*/15 * * * *' }, env);
  check('the */15 run reports the forced reconcile failure', out.find((r) => r.job === 'reconcile')?.ok === false, JSON.stringify(out));
  let a = await alerts(env, '%checkout check job failed%');
  check('a failed */15 job emails each owner and OPS_EXTRA once', a.length === 3 && to(a) === WANT, JSON.stringify(a.map((x) => x.to_addr)));
  check('staff get no alert', !(await alerts(env)).some((x) => x.to_addr === STAFF));
  check('the alert names the job and where to look', /Forced test failure of the reconcile job/.test(a[0]?.body) && /Jobs screen/.test(a[0]?.body), a[0]?.body);

  // The quiet window: the same failure again within the hour is held, not sent.
  await scheduled({ cron: '*/15 * * * *' }, env);
  await scheduled({ cron: '*/15 * * * *' }, env);
  a = await alerts(env, '%checkout check job failed%');
  const held = await env.DB.prepare("SELECT held FROM alert_state WHERE kind = 'job:reconcile'").first();
  check('two more failures in the hour send nothing and are counted', a.length === 3 && held?.held === 2, `${a.length} alerts, held ${held?.held}`);
  let f = await flushHeldAlerts(env);
  check('the held ones wait while the hour is not up', f.sent === 0);
  await env.DB.prepare("UPDATE alert_state SET last_sent_at = ? WHERE kind = 'job:reconcile'").bind(ago(61)).run();
  f = await flushHeldAlerts(env);
  a = await alerts(env, '%checkout check job failed (2 more since%');
  check('after the hour the two held failures go out as one summary', f.sent === 1 && a.length === 3, JSON.stringify(f));
  f = await flushHeldAlerts(env);
  check('a summary is sent once', f.sent === 0 && (await alerts(env, '%2 more since%')).length === 3);
  // A new failure after the hour is sent at once again.
  await env.DB.prepare("UPDATE alert_state SET last_sent_at = ? WHERE kind = 'job:reconcile'").bind(ago(61)).run();
  await scheduled({ cron: '*/15 * * * *' }, env);
  check('a failure after a quiet hour is sent straight away', (await alerts(env, '%checkout check job failed')).length === 6);

  // A job on the daily 13:00 trigger, and the nightly backup failing for real (the file store refuses).
  env = await freshEnv({ FAIL_TEST: 'expiry' });
  env.FILES.put = async () => { throw new Error('R2 refused the write'); };
  out = await scheduled({ cron: '0 13 * * *' }, env);
  check('the daily run reports the expiry and backup failures', out.find((r) => r.job === 'expiry')?.ok === false && out.find((r) => r.job === 'backup')?.ok === false, JSON.stringify(out));
  a = await alerts(env, '%listing expiry job failed%');
  check('a failed daily job emails the owners', a.length === 3 && to(a) === WANT);
  a = await alerts(env, '%nightly backup job failed%');
  check('a failed nightly backup emails the owners with the cause', a.length === 3 && /R2 refused the write/.test(a[0].body), a[0]?.body);
  check('the other daily jobs still ran', out.filter((r) => r.ok).map((r) => r.job).join(',') === 'inactivity,housekeeping,links', JSON.stringify(out.map((r) => [r.job, r.ok])));

  // A failed publish: the deploy hook cannot be reached.
  env = await freshEnv({ PUBLISH_MODE: 'hook', PUBLISH_HOOK_URL: 'http://localhost:9/hook' });
  await env.DB.prepare("UPDATE site_state SET generation = 4, published_generation = 3, dirty = 1, dirty_since = ? WHERE id = 1").bind(ago(5)).run();
  const p = await publishIfDue(env);
  a = await alerts(env, '%could not be published%');
  check('a failed publish emails the owners', !!p.failed && a.length === 3 && to(a) === WANT, JSON.stringify(p));
  await env.DB.prepare('UPDATE site_state SET last_error = NULL WHERE id = 1').run();
  await publishIfDue(env);
  check('a second publish failure in the hour is held', (await alerts(env, '%could not be published%')).length === 3);

  // A site build that did not finish. The hook was accepted 30 minutes ago for generation 5, and the
  // site still serves the build of generation 3.
  let siteGen = 3;
  env = await freshEnv({ PUBLISH_MODE: 'hook', SITE: { fetch: async () => new Response(JSON.stringify({ generation: siteGen, fetched_at: ago(90) })) } });
  await env.DB.prepare("UPDATE site_state SET generation = 5, published_generation = 5, last_publish_at = ?, last_publish_sha = 'hook:abc' WHERE id = 1").bind(ago(30)).run();
  let b = await checkBuild(env);
  a = await alerts(env, '%site build for publish 5 did not finish%');
  check('a build that did not finish emails the owners', b.late && a.length === 3 && /generation 3/.test(a[0].body), JSON.stringify(b));
  await env.DB.prepare("UPDATE alert_state SET last_sent_at = ? WHERE kind = 'build'").bind(ago(61)).run();
  b = await checkBuild(env);
  check('the same failed build is not alerted again after the hour', b.alerted === 'already' && (await alerts(env, '%did not finish%')).length === 3, JSON.stringify(b));
  siteGen = 5;
  b = await checkBuild(env);
  check('a build that finished sends nothing', b.ok === true, JSON.stringify(b));
  await env.DB.prepare('UPDATE site_state SET last_publish_at = ? WHERE id = 1').bind(ago(5)).run();
  siteGen = 3;
  b = await checkBuild(env);
  check('a build still inside its 20 minutes is left alone', b.waiting === true, JSON.stringify(b));
  env.SITE = { fetch: async () => new Response('Not found.', { status: 404 }) };
  await env.DB.prepare('UPDATE site_state SET last_publish_at = ? WHERE id = 1').bind(ago(30)).run();
  b = await checkBuild(env);
  check('a site with no build record yet is not an alert', b.unknown === true, JSON.stringify(b));

  // Stripe. A refused webhook (bad signature), a webhook whose handling fails, and a dispute.
  const { default: portal } = await import('../portal/worker.js');
  env = await freshEnv({ PAYMENTS_MODE: 'stripe', STRIPE_MODE: 'test', STRIPE_WEBHOOK_SECRET: 'whsec_test', STRIPE_SECRET_KEY: 'sk_test_x' });
  const hook = (body, sig) => new Request('https://portal.test/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': sig, 'content-type': 'application/json' }, body });
  let c = ctx();
  let res = await portal.fetch(hook('{}', 't=1,v1=00'), env, c); await c.done();
  a = await alerts(env, '%Stripe webhook was refused%');
  check('a refused Stripe webhook answers 400 and emails the owners', res.status === 400 && a.length === 3 && to(a) === WANT, `${res.status} ${a.length}`);
  c = ctx(); await portal.fetch(hook('{}', 't=1,v1=00'), env, c); await c.done();
  check('a stranger posting again in the hour sends nothing more', (await alerts(env, '%Stripe webhook was refused%')).length === 3);

  env.FAIL_TEST = 'stripe';
  const evt = JSON.stringify({ id: 'evt_test_fail', type: 'checkout.session.completed', livemode: false, data: { object: { id: 'cs_test_x' } } });
  c = ctx(); res = await portal.fetch(hook(evt, await signed('whsec_test', evt)), env, c); await c.done();
  a = await alerts(env, '%Stripe webhook failed%');
  check('a webhook that cannot be handled answers 500, so Stripe retries, and emails the owners', res.status === 500 && a.length === 3 && /evt_test_fail/.test(a[0].body), `${res.status} ${a.length}`);
  env.FAIL_TEST = '';

  const dispute = (id) => ({ id, type: 'charge.dispute.created', livemode: false, data: { object: { id: `dp_${id}`, payment_intent: `pi_${id}`, amount: 1499, reason: 'fraudulent', status: 'needs_response' } } });
  await handleEvent(env, dispute('one'), ctx());
  await handleEvent(env, dispute('two'), ctx());
  a = await alerts(env, '%payment is disputed%');
  const dh = await env.DB.prepare("SELECT held FROM alert_state WHERE kind = 'stripe_dispute'").first();
  check('a dispute emails the owners, and a second in the hour is held for the summary', a.length === 3 && /pi_one/.test(a[0].body) && dh.held === 1, `${a.length} held ${dh?.held}`);
  await env.DB.prepare("UPDATE alert_state SET last_sent_at = ? WHERE kind = 'stripe_dispute'").bind(ago(61)).run();
  await flushHeldAlerts(env);
  a = await alerts(env, '%payment is disputed (1 more since%');
  check('the held dispute arrives in the summary with its payment', a.length === 3 && /pi_two/.test(a[0].body), a[0]?.body);

  // The kinds are separate, so one failure being quiet never hides another.
  env = await freshEnv();
  await alertOnce(env, 'job:backup', 'x', 'y');
  const other = await alertOnce(env, 'job:links', 'z', 'w');
  check('a different kind of failure in the same hour is still sent', other.sent === true);

  // The switches a staging run uses to reach the publish and build alerts on their own paths.
  env = await freshEnv({ PUBLISH_MODE: 'hook', PUBLISH_HOOK_URL: 'https://api.cloudflare.com/client/v4/x', FAIL_TEST: 'publish_hook,build_late' });
  let fp = await publishIfDue(env);
  check('FAIL_TEST publish_hook fails the publish where the hook would be called, and alerts', /publish_hook/.test(fp.failed || '') && (await alerts(env, '%could not be published%')).length === 3, JSON.stringify(fp));
  fp = await checkBuild(env);
  check('FAIL_TEST build_late makes the build check alert that the build did not finish', fp.late === true && (await alerts(env, '%did not finish%')).length === 3, JSON.stringify(fp));

  // FAIL_TEST does nothing on production.
  env = await freshEnv({ DEV_MODE: undefined, FAIL_TEST: 'reconcile' });
  const r = await runJob(env, 'reconcile');
  check('FAIL_TEST is ignored outside local and staging', r.ok === true, JSON.stringify(r));
  console.log(`   quiet window ${ALERT_QUIET_MS / 60000} minutes`);
}

async function allContacts() {
  console.log('-- a send to every contact');
  const env = await freshEnv({ PORTAL_ORIGIN: 'https://portal.test' });
  const people = [['sub', 'subscribed'], ['contact', 'contact'], ['gone', 'unsubscribed'], ['later', 'contact']];
  await env.DB.batch(people.map(([n, s]) => env.DB.prepare(
    "INSERT INTO subscribers (id, email, source, status, unsub_token, created_at, unsubscribed_at) VALUES (?, ?, 'import', ?, ?, ?, ?)",
  ).bind(`s-${n}`, `${n}@list.test`, s, `tok-${n}`, now(), s === 'unsubscribed' ? now() : null)));
  await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('mailing_address', 'PO Box 1, Goshen, IN 46526') ON CONFLICT (key) DO UPDATE SET value = excluded.value").run();
  const mk = async (id) => env.DB.prepare("INSERT INTO campaigns (id, subject, body, created_by, created_at, updated_at) VALUES (?, ?, 'Hello.', ?, ?, ?)").bind(id, `Subject ${id}`, OWNER, now(), now()).run();
  const got = async (id) => (await env.DB.prepare('SELECT to_addr, body FROM dev_mailbox WHERE subject = ? ORDER BY to_addr').bind(`Subject ${id}`).all()).results;

  check('the counts shown before sending are 1 subscriber and 3 contacts', await audienceCount(env, 'subscribers') === 1 && await audienceCount(env, 'all') === 3);

  await mk('subs');
  check('subscribers only queues the one subscriber', await startCampaign(env, 'subs', 'subscribers') === 1);
  await runCampaigns(env);
  check('subscribers only reaches the subscriber alone', (await got('subs')).map((m) => m.to_addr).join(',') === 'sub@list.test');

  await mk('all');
  check('all contacts queues subscribed and never-subscribed, and not unsubscribed', await startCampaign(env, 'all', 'all') === 3);
  // Someone who unsubscribes after the send started is skipped.
  await unsubscribeToken(env, 'tok-later');
  await runCampaigns(env);
  const m = await got('all');
  check('all contacts reaches the subscriber and the contact', m.map((x) => x.to_addr).join(',') === 'contact@list.test,sub@list.test', m.map((x) => x.to_addr).join(','));
  check('the unsubscribed address and the one who left mid-send get nothing', !m.some((x) => /^(gone|later)@/.test(x.to_addr)));
  const skipped = await env.DB.prepare("SELECT status FROM campaign_sends WHERE campaign_id = 'all' AND subscriber_id = 's-later'").first();
  check('the mid-send unsubscribe is recorded as skipped', skipped?.status === 'skipped');
  const cm = m.find((x) => x.to_addr === 'contact@list.test');
  check('the contact email carries their own unsubscribe link', /https:\/\/portal\.test\/unsubscribe\?t=tok-contact/.test(cm.body), cm.body);
  check('the contact email does not say they signed up', /in touch with Puppy Connection/.test(cm.body) && !/signed up/.test(cm.body));
  check('the subscriber email keeps the signed-up line and its link', /signed up/.test(m.find((x) => x.to_addr === 'sub@list.test').body) && /t=tok-sub/.test(m.find((x) => x.to_addr === 'sub@list.test').body));
  check('the campaign records its audience', (await env.DB.prepare("SELECT audience FROM campaigns WHERE id = 'all'").first()).audience === 'all');

  // The unsubscribe link is honored for a contact the same as for a subscriber.
  await unsubscribeToken(env, 'tok-contact');
  await mk('again');
  check('a contact who unsubscribed is left out of the next all-contacts send', await startCampaign(env, 'again', 'all') === 1);
  await runCampaigns(env);
  check('the next send reaches the subscriber only', (await got('again')).map((x) => x.to_addr).join(',') === 'sub@list.test');

  await mk('bad');
  let refused = false;
  try { await startCampaign(env, 'bad', 'everyone'); } catch { refused = true; }
  check('an unknown audience is refused', refused);
}

await failureAlerts();
await allContacts();
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exit(fails ? 1 : 0);
