// Report a listing (launch workplan A5).
//
// Every puppy and breeder page on the site links to /report on the portal with the page's slug.
// The form lives on the portal rather than on the static site, so the Turnstile check, the rate
// limiter and the same-origin post all stay where they already work for sign-up. A report is
// stored in listing_reports and emailed to the owners in people. Only public puppies and
// breeders can be reported, so the form never confirms that a draft exists.

import { now, ulid, clean, esc } from './util.js';
import { auditStmt } from './store.js';
import { sendMail, noticeTo } from './mail.js';

export const REPORT_REASONS = [
  ['misleading', 'The details are wrong or misleading'],
  ['not_available', 'The puppy is no longer available'],
  ['scam', 'I think this may be a scam'],
  ['welfare', 'I am worried about the care of the animals'],
  ['photos', 'The photos are not of this puppy'],
  ['other', 'Something else'],
];
const REASON_LABEL = Object.fromEntries(REPORT_REASONS);
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The public puppy or breeder a report names, from the site's slugs. null if neither is public. */
export async function reportTarget(env, { puppy, breeder }) {
  if (puppy) {
    const p = await env.DB.prepare(
      `SELECT pp.id AS puppy_id, pp.name AS puppy_name, pp.slug AS puppy_slug, pb.breeder_id, pb.business_name, pb.slug AS breeder_slug
         FROM public_puppies pp JOIN public_breeders pb ON pb.breeder_id = pp.breeder_id WHERE pp.slug = ?`,
    ).bind(String(puppy)).first();
    if (p) return p;
  }
  if (breeder) {
    const b = await env.DB.prepare('SELECT breeder_id, business_name, slug AS breeder_slug FROM public_breeders WHERE slug = ?').bind(String(breeder)).first();
    if (b) return { ...b, puppy_id: null, puppy_name: null, puppy_slug: null };
  }
  return null;
}

/** The form itself, inside the portal's plain page. */
export function reportForm(target, { siteKey, error, values = {} } = {}) {
  const what = target.puppy_name ? `${target.puppy_name} from ${target.business_name}` : target.business_name;
  return `<h1>Report a listing</h1>
<p>Tell Puppy Connection what is wrong with the listing for <b>${esc(what)}</b>. We read every report.</p>
${error ? `<p class="error">${esc(error)}</p>` : ''}
<form method="post" action="/report" class="report-form">
<input type="hidden" name="puppy" value="${esc(target.puppy_slug || '')}"><input type="hidden" name="breeder" value="${esc(target.breeder_slug || '')}">
<fieldset class="field"><legend>What is the problem?</legend>
${REPORT_REASONS.map(([k, label]) => `<label style="display:block;margin:.3rem 0"><input type="radio" name="reason" value="${k}"${values.reason === k ? ' checked' : ''} required> ${esc(label)}</label>`).join('\n')}
</fieldset>
<div class="field"><label for="r-details">What happened?</label><textarea id="r-details" name="details" required maxlength="2000" style="min-height:120px">${esc(values.details || '')}</textarea></div>
<div class="field"><label for="r-email">Your email, if you would like a reply</label><input id="r-email" name="email" type="email" value="${esc(values.email || '')}"></div>
<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Leave this empty <input name="website" tabindex="-1" autocomplete="off"></label></div>
${siteKey ? `<div class="cf-turnstile" data-sitekey="${esc(siteKey)}" data-action="report"></div><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>` : ''}
<p><button class="btn btn-primary" type="submit">Send the report</button></p>
</form>
<p class="hint">Puppy Connection does not sell puppies. If you paid a breeder and something went wrong, contact the breeder and your bank as well.</p>`;
}

/** Checks and stores one report, and emails NOTICE_TO, or the owners when it is unset (B9). Returns { ok, error }. */
export async function saveReport(env, ctx, target, form) {
  const reason = String(form.get('reason') || '');
  if (!REASON_LABEL[reason]) return { error: 'Choose what the problem is.' };
  const details = clean(form.get('details'), 2000);
  if (!details) return { error: 'Tell us what happened.' };
  const email = clean(form.get('email'), 200);
  if (email && !EMAIL_RX.test(email)) return { error: 'That email address does not look right. Leave it empty if you do not need a reply.' };
  const id = ulid();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO listing_reports (id, breeder_id, puppy_id, reason, details, reporter_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, target.breeder_id, target.puppy_id, reason, details, email, now()),
    auditStmt(env, 'system', 'report form', 'listing.report', target.puppy_id ? 'puppy' : 'breeder', target.puppy_id || target.breeder_id, null, { report: id, reason }),
  ]);
  const owners = await noticeTo(env, "SELECT email FROM people WHERE role = 'owner'");
  const send = Promise.all(owners.map((to) => sendMail(env, to, 'listing_report', {
    business: target.business_name, puppy: target.puppy_name, reason: REASON_LABEL[reason], details, reporter: email,
    adminUrl: `${env.ADMIN_ORIGIN || ''}/#/reports-listings`,
  }).catch((e) => console.error('report mail failed', e))));
  if (ctx && ctx.waitUntil) ctx.waitUntil(send); else await send;
  return { ok: true, id };
}

// ------------------------------------------------------------------ the admin side

export async function listReports(env, status) {
  const where = status === 'closed' ? "r.status != 'open'" : "r.status = 'open'";
  const { results } = await env.DB.prepare(
    `SELECT r.*, bp.business_name, b.status AS breeder_status, p.name AS puppy_name, p.operator_hold
       FROM listing_reports r JOIN breeders b ON b.id = r.breeder_id LEFT JOIN breeder_profiles bp ON bp.breeder_id = r.breeder_id
       LEFT JOIN puppies p ON p.id = r.puppy_id WHERE ${where} ORDER BY r.created_at DESC LIMIT 200`,
  ).all();
  return results.map((r) => ({ ...r, reason_label: REASON_LABEL[r.reason] || r.reason }));
}

export async function closeReport(env, id, outcome, note, who) {
  const r = await env.DB.prepare(
    "UPDATE listing_reports SET status = ?, note = ?, closed_by = ?, closed_at = ? WHERE id = ? AND status = 'open'",
  ).bind(outcome, clean(note, 1000), who.email, now(), id).run();
  if (r.meta.changes !== 1) return false;
  await auditStmt(env, 'operator', who.email, `listing.report_${outcome}`, 'report', id, null, null).run();
  return true;
}
