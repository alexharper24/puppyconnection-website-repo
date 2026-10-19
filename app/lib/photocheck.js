// The photo quality check (launch workplan A9).
//
// Every photo a breeder uploads is looked at by a vision model on Workers AI, against the rules
// Alex set from the 100-photo sample (hs-seo-data/puppyconnection/2026-10-17-photo-sample). A
// photo where the puppy cannot be seen, or that is mostly a person, a puppy from behind or face
// down, a small low-quality phone photo or one with a heavy watermark, does not go straight to
// the site. Whether the dog is grown is not checked, and the Puppy Connection logo is allowed.
//
// What happens to a photo that does not pass is the photo_check_route setting:
//   breeder  the default (Alex, 2026-10-17). The breeder is told what is wrong and uploads another.
//   review   the photo waits in the admin's Photo review queue for Amber to keep or send back.
//
// PHOTO_CHECK_MODE picks how photos are judged:
//   ai     Workers AI through the AI binding (the default when the binding is there).
//   sim    the local stand-in, which passes every photo unless a test asks otherwise.
//   off    every photo passes with no check.
// A photo waiting for the check counts toward a listing's minimum, so a check a few seconds
// behind never blocks a payment, but only checked photos reach the site or are served publicly.
// A photo the model cannot judge (an error or a timeout) passes, so an outage never holds a
// breeder up, and the check records that it was not judged.

import { findFocus } from './focus.js';
import { photoPassedStmts } from './inactivity.js';

export const PHOTO_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';

// What the breeder reads for each reason, in the order they are shown.
export const PHOTO_REASONS = {
  hidden: "The puppy's face or head is hidden.",
  too_small: 'The puppy is too small or too far away to see well.',
  turned_away: 'The puppy is turned away from the camera.',
  face_down: 'The puppy is lying face down, so its face cannot be seen.',
  blurry: 'The photo is blurred or out of focus.',
  person: 'A person takes up much of the photo.',
  dark: 'The photo is too dark to see the puppy.',
  low_quality: 'The photo is small or low quality.',
  watermark: 'A large watermark or text covers the photo.',
};

export const PHOTO_PROMPT = `You check photos for a website where breeders list puppies for sale. Families need to see each puppy clearly.

Look at the photo and decide if it can go on the site as it is.

Send it back if ANY of these is true:
- hidden: an object such as a plant, toy, blanket or person covers the puppy's head, so you cannot see its head at all.
- too_small: the puppy is so small or far away in the frame that a family cannot see what it looks like.
- turned_away: the puppy is small or partly hidden AND its back is to the camera, so a family cannot tell what it looks like.
- face_down: the photo is taken from above and the puppy's face points straight down into the ground, so only the top of its head shows.
- blurry: the puppy is blurred by motion or the photo is out of focus.
- person: a person's body or legs take up more of the photo than the puppy does.
- dark: the photo is so dark the puppy is hard to see.
- low_quality: the photo is grainy, pixelated or looks like a small screenshot.
- watermark: a large watermark or text covers part of the puppy. A small logo in a corner is fine, and the Puppy Connection logo is always fine.

Do NOT send a photo back because:
- the puppy is a little small in the frame but still clearly visible,
- the background is busy, a leash or collar shows, or there are toys around a visible puppy,
- the dog looks fully grown (that is not checked),
- the photo is a close-up of the face,
- the puppy is asleep or lying down with its body clearly in view,
- the puppy is seen from behind or from the side while it is clearly in view (Alex, 2026-10-17),
- an adult or a child is holding the puppy, or part of a person (a hand, an arm, a shoe) shows at the edge,
- the puppy is older or standing, or the setting is a garden or a little dark, as long as the puppy itself is clear.

Answer with JSON only: {"verdict": "pass" or "send_back", "reasons": [zero or more of the reason words above]}.`;

const SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['pass', 'send_back'] },
    reasons: { type: 'array', items: { type: 'string', enum: Object.keys(PHOTO_REASONS) } },
  },
  required: ['verdict', 'reasons'],
};

export function photoCheckMode(env) {
  const m = String(env.PHOTO_CHECK_MODE || '').toLowerCase();
  if (m === 'off' || m === 'sim' || m === 'ai') return m;
  return env.AI ? 'ai' : 'off';
}

function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Read the model's answer, which may be JSON text or an already-parsed object. */
export function readVerdict(response) {
  let o = response;
  if (typeof o === 'string') {
    const m = o.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { o = JSON.parse(m[0]); } catch { return null; }
  }
  if (!o || (o.verdict !== 'pass' && o.verdict !== 'send_back')) return null;
  const reasons = (Array.isArray(o.reasons) ? o.reasons : []).filter((r) => PHOTO_REASONS[r]);
  // A send-back with no reason the breeder can act on is treated as a pass.
  if (o.verdict === 'send_back' && !reasons.length) return { verdict: 'pass', reasons: [] };
  return { verdict: o.verdict, reasons: o.verdict === 'pass' ? [] : [...new Set(reasons)] };
}

/**
 * Judge one photo. bytes is the image (the 640 px card copy where there is one, which costs
 * fewer tokens). Returns { verdict, reasons, judged, usage, ms }.
 */
export async function judgePhoto(env, bytes, contentType = 'image/jpeg', { sim } = {}) {
  const mode = photoCheckMode(env);
  if (mode === 'off') return { verdict: 'pass', reasons: [], judged: false };
  if (mode === 'sim') {
    const reasons = String(sim || '').split(',').map((r) => r.trim()).filter((r) => PHOTO_REASONS[r]);
    return { verdict: reasons.length ? 'send_back' : 'pass', reasons, judged: true, model: 'sim' };
  }
  const started = Date.now();
  try {
    const model = env.PHOTO_MODEL || PHOTO_MODEL;
    const out = await env.AI.run(model, {
      messages: [{ role: 'user', content: [
        { type: 'text', text: PHOTO_PROMPT },
        { type: 'image_url', image_url: { url: `data:${contentType};base64,${base64(bytes)}` } },
      ] }],
      response_format: { type: 'json_schema', json_schema: SCHEMA },
      max_tokens: 60,
      temperature: 0,
    });
    const v = readVerdict(out && out.response);
    if (!v) return { verdict: 'pass', reasons: [], judged: false, error: 'unreadable answer', usage: out && out.usage, ms: Date.now() - started };
    return { ...v, judged: true, model, usage: out.usage, ms: Date.now() - started };
  } catch (e) {
    return { verdict: 'pass', reasons: [], judged: false, error: String(e.message || e).slice(0, 200), ms: Date.now() - started };
  }
}

// ------------------------------------------------------------------ applying a verdict

const now = () => new Date().toISOString().slice(0, 19) + 'Z';

/** The breeder-facing sentences for stored reasons. */
export const reasonText = (reasons) => (Array.isArray(reasons) ? reasons : String(reasons || '').split(',')).filter((r) => PHOTO_REASONS[r]).map((r) => PHOTO_REASONS[r]);

/**
 * Judge one pending photo and record the result. The card copy is judged where there is one,
 * because it costs about a quarter of the tokens of the full photo and is what families see
 * first. route is the photo_check_route setting. Returns { quality, reasons, messages, judged }.
 */
export async function checkPhoto(env, photo, route, { sim } = {}) {
  if (photo.quality !== 'pending' || !photo.r2_key) return { quality: photo.quality, reasons: [], messages: [], judged: false };
  const obj = (await env.FILES.get(`${photo.r2_key}.card`)) || (await env.FILES.get(photo.r2_key));
  const bytes = obj ? new Uint8Array(await obj.arrayBuffer()) : null;
  const v = bytes ? await judgePhoto(env, bytes, obj.httpMetadata?.contentType || photo.content_type || 'image/jpeg', { sim })
    : { verdict: 'pass', reasons: [], judged: false, error: 'no file' };
  const quality = v.verdict === 'pass' ? 'pass' : route === 'review' ? 'review' : 'sent_back';
  const note = v.judged ? null : `not judged: ${v.error || 'check off'}`;
  // Where the puppy sits, from the same card copy, so the site crops around it (lib/focus.js).
  // No dog found or a failed call leaves the point empty and the site falls back to the middle.
  const focus = photoCheckMode(env) === 'ai' && bytes ? await findFocus(env, bytes) : null;
  const stmts = [env.DB.prepare(
    `UPDATE photos SET quality = ?, quality_reasons = ?, quality_checked_at = ?, quality_note = ?,
       focus_x = COALESCE(?, focus_x), focus_y = COALESCE(?, focus_y) WHERE id = ? AND quality = 'pending'`,
  ).bind(quality, v.reasons.join(',') || null, now(), note, focus ? focus.fx : null, focus ? focus.fy : null, photo.id)];
  if (quality === 'pass') {
    const pub = await env.DB.prepare('SELECT 1 FROM public_puppies WHERE id = ?').bind(photo.puppy_id).first();
    if (pub) {
      stmts.push(env.DB.prepare('UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, ?), generation = generation + 1 WHERE id = 1').bind(now()));
    }
    // Workplan A12 and A14. A passed photo restarts the listing's clock, brings an offline listing
    // back and lifts a take-offline-for-photos hold.
    stmts.push(...await photoPassedStmts(env, photo.puppy_id, photo.created_at));
  }
  await env.DB.batch(stmts);
  return { quality, reasons: v.reasons, messages: reasonText(v.reasons), judged: !!v.judged, usage: v.usage };
}

/** The job that runs every 15 minutes: photos still pending ten minutes after upload, ten a run. */
export async function photoJob(env, routeOf) {
  if (photoCheckMode(env) === 'off') {
    // With the check off nothing should wait, so anything pending passes.
    const { results } = await env.DB.prepare("SELECT id, puppy_id, created_at FROM photos WHERE quality = 'pending'").all();
    for (const ph of results) {
      await env.DB.batch([
        env.DB.prepare("UPDATE photos SET quality = 'pass', quality_note = 'check off' WHERE id = ? AND quality = 'pending'").bind(ph.id),
        ...await photoPassedStmts(env, ph.puppy_id, ph.created_at),
      ]);
    }
    return { off: true, passed: results.length };
  }
  const tenAgo = new Date(Date.now() - 600000).toISOString().slice(0, 19) + 'Z';
  const { results } = await env.DB.prepare("SELECT * FROM photos WHERE quality = 'pending' AND created_at < ? ORDER BY created_at LIMIT 10").bind(tenAgo).all();
  const route = await routeOf(env);
  const tally = { checked: 0, pass: 0, sent_back: 0, review: 0 };
  for (const p of results) { const r = await checkPhoto(env, p, route); tally.checked += 1; tally[r.quality] = (tally[r.quality] || 0) + 1; }
  return tally;
}
