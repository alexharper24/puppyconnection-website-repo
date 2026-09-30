// Uploaded photos (spec section 7, Uploads).
//
// The type is decided from the file's first bytes, never from its name or the header the
// browser sent. Then metadata is stripped before anything is stored, because phone photos
// carry GPS coordinates, the publish commits photos into the public site repository, and an
// unstripped file can publish a home-based breeder's location.

import { bad } from './util.js';

export const MAX_BYTES = 15 * 1024 * 1024;

export function sniff(bytes) {
  const b = bytes;
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
      && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

/** JPEG: drop APP1 (EXIF, XMP), APP13 (IPTC) and comments; keep everything else. */
function stripJpeg(b) {
  const out = [b.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) throw bad('That JPEG is damaged.');
    const marker = b[i + 1];
    if (marker === 0xda) { out.push(b.subarray(i)); return concat(out); }   // start of scan: the rest is image data
    if (marker >= 0xd0 && marker <= 0xd9) { out.push(b.subarray(i, i + 2)); i += 2; continue; }
    const len = (b[i + 2] << 8) | b[i + 3];
    const seg = b.subarray(i, i + 2 + len);
    const drop = marker === 0xe1 || marker === 0xed || marker === 0xfe;
    if (!drop) out.push(seg);
    i += 2 + len;
  }
  throw bad('That JPEG is incomplete.');
}

/** PNG: drop eXIf and the text chunks. */
function stripPng(b) {
  const out = [b.subarray(0, 8)];
  let i = 8;
  const drop = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const end = i + 12 + len;
    if (!drop.has(type)) out.push(b.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return concat(out);
}

/** WebP: drop the EXIF and XMP chunks and clear their flags in VP8X. */
function stripWebp(b) {
  const chunks = [];
  let i = 12;
  while (i + 8 <= b.length) {
    const type = String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
    const len = b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24);
    const end = i + 8 + len + (len & 1);
    if (type !== 'EXIF' && type !== 'XMP ') {
      const c = b.slice(i, end);
      if (type === 'VP8X') c[8] &= ~(0x08 | 0x04);   // EXIF and XMP present flags
      chunks.push(c);
    }
    i = end;
  }
  const body = concat(chunks);
  const header = new Uint8Array(12);
  header.set(b.subarray(0, 12));
  const size = body.length + 4;
  header[4] = size & 0xff; header[5] = (size >> 8) & 0xff; header[6] = (size >> 16) & 0xff; header[7] = (size >> 24) & 0xff;
  return concat([header, body]);
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** Read dimensions so the site can reserve the right box before the image loads. */
export function dimensions(bytes, type) {
  const b = bytes;
  try {
    if (type === 'image/png') return { w: (b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0, h: (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0 };
    if (type === 'image/jpeg') {
      let i = 2;
      while (i < b.length) {
        const m = b[i + 1];
        const len = (b[i + 2] << 8) | b[i + 3];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
        }
        i += 2 + len;
      }
    }
    if (type === 'image/webp') {
      const kind = String.fromCharCode(b[12], b[13], b[14], b[15]);
      if (kind === 'VP8X') return { w: 1 + (b[24] | b[25] << 8 | b[26] << 16), h: 1 + (b[27] | b[28] << 8 | b[29] << 16) };
      if (kind === 'VP8 ') return { w: (b[26] | b[27] << 8) & 0x3fff, h: (b[28] | b[29] << 8) & 0x3fff };
      if (kind === 'VP8L') {
        const n = b[21] | b[22] << 8 | b[23] << 16 | b[24] << 24;
        return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
      }
    }
  } catch { /* fall through */ }
  return null;
}

export function cleanImage(bytes) {
  if (bytes.length > MAX_BYTES) throw bad('Photos can be up to 15 MB.');
  const type = sniff(bytes);
  if (!type) throw bad('Photos must be JPEG, PNG or WebP.');
  const clean = type === 'image/jpeg' ? stripJpeg(bytes) : type === 'image/png' ? stripPng(bytes) : stripWebp(bytes);
  return { bytes: clean, type, size: dimensions(clean, type) };
}
