// Tap the face (Alex, 2026-11-04). A focus point set by a person in facepick.js, for the portal
// and the admin. The point is 0..1 of the photo across and down. A photo stored without a size
// (imported photos were) takes the size the browser measured, because the site places a crop
// only where it knows the photo's shape (generate.mjs objectPosition).

import { bad } from './util.js';

const unit = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const size = (v) => Number.isInteger(v) && v > 0 && v < 20000;

/** The checked body: { fx, fy } rounded to three places, with w and h when they are usable. */
export function focusBody(body, what = 'puppy') {
  if (!body || !unit(body.fx) || !unit(body.fy)) throw bad(`Tap the ${what}’s face on the photo.`);
  const r = (v) => Math.round(v * 1000) / 1000;
  return { fx: r(body.fx), fy: r(body.fy), w: size(body.w) ? body.w : null, h: size(body.h) ? body.h : null };
}

/** The UPDATE for one photo, still to be bound with focusBinds() and the photo id. */
export function focusStmt(env, photo, f) {
  const sized = !photo.width && f.w && f.h;
  return env.DB.prepare(sized
    ? 'UPDATE photos SET focus_x = ?, focus_y = ?, width = ?, height = ?, aspect = COALESCE(aspect, ?) WHERE id = ?'
    : 'UPDATE photos SET focus_x = ?, focus_y = ? WHERE id = ?');
}

export function focusBinds(photo, f) {
  return !photo.width && f.w && f.h ? [f.fx, f.fy, f.w, f.h, Math.round((f.w / f.h) * 10000) / 10000] : [f.fx, f.fy];
}

/**
 * A mom or dad's photo (Alex, 2026-11-10, migrations/0095). One photo per parent, so the point and
 * size sit on parent_dogs. A size the browser measured fills in only where none is stored.
 */
export function parentFocusStmt(env, parent, f) {
  return env.DB.prepare(
    `UPDATE parent_dogs SET focus_x = ?, focus_y = ?, photo_width = COALESCE(photo_width, ?), photo_height = COALESCE(photo_height, ?),
       updated_at = ?, version = version + 1 WHERE id = ? AND photo_key = ?`,
  ).bind(f.fx, f.fy, f.w, f.h, new Date().toISOString().slice(0, 19) + 'Z', parent.id, parent.photo_key);
}
