// The focus point of a photo: the part of the frame that holds the puppy, so every card,
// thumbnail and breed photo is cropped around the puppy rather than from the top edge (Alex,
// 2026-10-18). ops/measure_photos.py applies the same rule to the photos on Wix.
//
// The point comes from the dog detector on Workers AI (@cf/facebook/detr-resnet-50). It says only
// where a dog sits in the frame, never which puppy or breed it is. On a 100-photo sample it kept
// more of the dog in frame than the older border-color guess on 40 of 98 phone crops and less on
// none, at about 0.68 neurons (under $0.00001) and 400 ms a photo.

import { sniff, dimensions } from './images.js';

export const FOCUS_MODEL = '@cf/facebook/detr-resnet-50';

/**
 * (fx, fy) in 0..1 from the detector's boxes on an image iw x ih, for a photo W x H, or null
 * when no dog was found. The point is the middle of the dog across, and in the upper part of the
 * dog down, because the face sits there: furthest up for a tall box (sitting or standing) and
 * less for a wide one (lying down).
 */
export function dogFocus(boxes, iw, ih, W = iw, H = ih) {
  const dogs = (boxes || []).filter((b) => b && b.label === 'dog' && b.score >= 0.7 && b.box);
  if (!dogs.length || !iw || !ih) return null;
  const area = (b) => (b.box.xmax - b.box.xmin) * (b.box.ymax - b.box.ymin);
  const big = Math.max(...dogs.map(area));
  // Every dog at least 30% the size of the biggest, so two puppies side by side stay in frame.
  const keep = dogs.filter((b) => area(b) >= 0.3 * big);
  const x0 = Math.max(0, Math.min(...keep.map((b) => b.box.xmin))) / iw;
  const y0 = Math.max(0, Math.min(...keep.map((b) => b.box.ymin))) / ih;
  const x1 = Math.min(iw, Math.max(...keep.map((b) => b.box.xmax))) / iw;
  const y1 = Math.min(ih, Math.max(...keep.map((b) => b.box.ymax))) / ih;
  const r = ((y1 - y0) * H) / Math.max((x1 - x0) * W, 1);
  const lean = 0.45 - 0.13 * Math.min(Math.max((r - 0.9) / 0.5, 0), 1);
  const round = (v) => Math.round(v * 1000) / 1000;
  return { fx: round((x0 + x1) / 2), fy: round(y0 + lean * (y1 - y0)) };
}

/**
 * Find the focus of one image (the card copy where there is one). Returns { fx, fy } or null when
 * no dog was found, the image cannot be read, or Workers AI fails, so a photo never waits on it.
 */
export async function findFocus(env, bytes) {
  if (!env.AI || !bytes) return null;
  const size = dimensions(bytes, sniff(bytes));
  if (!size) return null;
  try {
    const boxes = await env.AI.run(FOCUS_MODEL, { image: [...bytes] });
    return dogFocus(boxes, size.w, size.h);
  } catch {
    return null;
  }
}
