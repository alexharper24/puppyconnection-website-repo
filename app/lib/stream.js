// Puppy videos (launch workplan A3), stored and played by Cloudflare Stream.
//
// The portal asks Stream for a one-time upload address (a direct creator upload) and the
// breeder's browser sends the file straight there, so a video never passes through the Worker
// or counts against its limits. Stream caps each video at video_max_seconds and the basic upload
// at 200 MB. The puppy page plays it in Stream's own player, in an iframe.
//
// STREAM_MODE picks the provider, the same way EMAIL_MODE and PAYMENTS_MODE do:
//   stream   the real one. Needs STREAM_ACCOUNT_ID, STREAM_CUSTOMER_CODE (the <code> in
//            customer-<code>.cloudflarestream.com) and the STREAM_API_TOKEN secret, a token with
//            Stream Edit on the Puppy Connection account.
//   sim      a stand-in served by the portal itself at /dev/stream, which keeps the file in R2
//            under videos/ and reports it ready at once. Used locally and in the suites.
//   unset    videos are off, and the portal says so rather than offering the upload.

import { HttpError, randomToken, now } from './util.js';
import { dirtyStmt } from './store.js';

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

export function streamMode(env) {
  const m = String(env.STREAM_MODE || '').toLowerCase();
  return m === 'stream' || m === 'sim' ? m : null;
}

const api = (env, path) => `https://api.cloudflare.com/client/v4/accounts/${env.STREAM_ACCOUNT_ID}/stream${path}`;

async function call(env, method, path, body) {
  if (!env.STREAM_API_TOKEN || !env.STREAM_ACCOUNT_ID) throw new HttpError(503, 'Video uploads are not set up yet.');
  const res = await fetch(api(env, path), {
    method,
    headers: { authorization: `Bearer ${env.STREAM_API_TOKEN}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === 'DELETE' && res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg = data.errors && data.errors[0] ? data.errors[0].message : `HTTP ${res.status}`;
    throw new HttpError(502, `Cloudflare Stream answered: ${msg}`);
  }
  return data.result;
}

/**
 * A one-time upload address for one video. portalOrigin is where the sim provider takes the
 * file. Returns { uid, uploadURL }.
 */
export async function createUpload(env, { maxSeconds, breederId, puppyId, portalOrigin }) {
  if (streamMode(env) === 'sim') {
    const uid = `sim${randomToken().replace(/[^A-Za-z0-9]/g, '').slice(0, 29)}`;
    return { uid, uploadURL: `${portalOrigin}/dev/stream/upload/${uid}` };
  }
  const r = await call(env, 'POST', '/direct_upload', {
    maxDurationSeconds: maxSeconds,
    creator: breederId,
    meta: { puppy: puppyId },
    // An address not used within the hour expires.
    expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
  return { uid: r.uid, uploadURL: r.uploadURL };
}

/** Where Stream has got to with a video: uploading, processing, ready or error. */
export async function videoStatus(env, uid) {
  if (streamMode(env) === 'sim') {
    const obj = await env.FILES.head(`videos/${uid}`);
    return obj ? { status: 'ready', duration: Number(obj.customMetadata?.duration || 0) || null } : { status: 'uploading', duration: null };
  }
  const r = await call(env, 'GET', `/${uid}`);
  const state = r.status && r.status.state;
  if (r.readyToStream) return { status: 'ready', duration: r.duration > 0 ? r.duration : null };
  if (state === 'error') return { status: 'error', duration: null, reason: (r.status && r.status.errorReasonText) || 'Stream could not process this video.' };
  if (state === 'pendingupload' || !state) return { status: 'uploading', duration: null };
  return { status: 'processing', duration: null };
}

export async function removeVideo(env, uid) {
  if (streamMode(env) === 'sim') { await env.FILES.delete(`videos/${uid}`); return; }
  await call(env, 'DELETE', `/${uid}`);
}

/**
 * The player and poster addresses for a video. portalOrigin is where the sim provider serves
 * them; the real ones are on the account's Stream customer domain.
 */
export function videoUrls(env, uid, portalOrigin) {
  if (streamMode(env) === 'sim' || String(uid).startsWith('sim')) {
    return { iframe: `${portalOrigin}/dev/stream/${uid}/iframe`, poster: null };
  }
  const base = `https://customer-${env.STREAM_CUSTOMER_CODE}.cloudflarestream.com/${uid}`;
  return { iframe: `${base}/iframe`, poster: `${base}/thumbnails/thumbnail.jpg?height=480` };
}

/** The origins the portal, admin and site must allow to frame the player and send the upload. */
export function streamOrigins(env) {
  if (streamMode(env) !== 'stream' || !env.STREAM_CUSTOMER_CODE) return { frame: '', connect: '', img: '' };
  const c = `https://customer-${env.STREAM_CUSTOMER_CODE}.cloudflarestream.com`;
  return { frame: c, connect: 'https://upload.videodelivery.net', img: c };
}

// ------------------------------------------------------------------ the sim provider

/** POST /dev/stream/upload/<uid>, a multipart form with the file under "file", as Stream takes it. */
export async function simUpload(request, env, uid) {
  if (streamMode(env) !== 'sim') throw new HttpError(404, 'Not found.');
  const row = await env.DB.prepare("SELECT id FROM puppy_videos WHERE stream_uid = ? AND status = 'uploading'").bind(uid).first();
  if (!row) throw new HttpError(404, 'Not found.');
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'No file.');
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Too large.');
  await env.FILES.put(`videos/${uid}`, file.stream(), {
    httpMetadata: { contentType: file.type || 'video/mp4' },
    customMetadata: { duration: String(form.get('duration') || '') },
  });
  // As at Stream, a used address takes no second file, and the video is now processing.
  await env.DB.prepare("UPDATE puppy_videos SET status = 'processing' WHERE id = ?").bind(row.id).run();
  return new Response(null, { status: 200, headers: { 'access-control-allow-origin': '*' } });
}

/** GET /dev/stream/<uid>/iframe and /dev/stream/<uid>/video, the stand-in player. */
export async function simServe(env, uid, what) {
  if (streamMode(env) !== 'sim') throw new HttpError(404, 'Not found.');
  const obj = await env.FILES.get(`videos/${uid}`);
  if (!obj) throw new HttpError(404, 'Not found.');
  if (what === 'video') {
    return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'video/mp4', 'cache-control': 'no-store' } });
  }
  return new Response(`<!doctype html><meta charset="utf-8"><title>Video</title><style>html,body{margin:0;height:100%;background:#000}video{width:100%;height:100%}</style><video controls playsinline preload="metadata" src="video"></video>`, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; media-src 'self'; style-src 'unsafe-inline'" },
  });
}

// ------------------------------------------------------------------ keeping rows in step

/**
 * Ask Stream where one video has got to and record it. A video that becomes ready on a public
 * puppy marks the site for the next publish. Returns the row's status after the check.
 */
export async function refreshVideo(env, row) {
  if (row.status === 'ready' || row.status === 'error') return row.status;
  const s = await videoStatus(env, row.stream_uid);
  if (s.status === row.status) return row.status;
  const t = now();
  const stmts = [env.DB.prepare('UPDATE puppy_videos SET status = ?, duration_s = COALESCE(?, duration_s), ready_at = ? WHERE id = ?')
    .bind(s.status, s.duration, s.status === 'ready' ? t : null, row.id)];
  if (s.status === 'ready') {
    const pub = await env.DB.prepare('SELECT 1 FROM public_puppies WHERE id = ?').bind(row.puppy_id).first();
    if (pub) stmts.push(dirtyStmt(env));
  }
  await env.DB.batch(stmts);
  return s.status;
}

/**
 * The job that runs every 15 minutes. Videos still uploading or processing are checked, ten a run, so one a breeder
 * left before Stream finished still reaches the site. An upload address never used in a day is
 * dropped, because Stream has already expired it.
 */
export async function videoJob(env) {
  if (!streamMode(env)) return { off: true };
  const dayAgo = new Date(Date.now() - 86400000).toISOString().slice(0, 19) + 'Z';
  const minuteAgo = new Date(Date.now() - 60000).toISOString().slice(0, 19) + 'Z';
  const dropped = (await env.DB.prepare("DELETE FROM puppy_videos WHERE status = 'uploading' AND created_at < ?").bind(dayAgo).run()).meta.changes;
  const { results } = await env.DB.prepare(
    "SELECT * FROM puppy_videos WHERE status IN ('uploading','processing') AND created_at < ? ORDER BY created_at LIMIT 10",
  ).bind(minuteAgo).all();
  let ready = 0;
  for (const r of results) if (await refreshVideo(env, r) === 'ready') ready += 1;
  return { checked: results.length, ready, dropped };
}
