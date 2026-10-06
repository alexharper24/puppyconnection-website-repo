// Draws the demo breeders' pictures (plan P5.1) and writes them into lib/demo-images.js as
// base64 PNGs, so the admin's Reset demo data can put them back without any upload. They are
// simple drawings of a puppy face, a logo and a barn. No real breeder's photo is used.
//
//   node app/dev/make-demo-images.mjs

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../lib/demo-images.js');

function canvas(w, h, bg) {
  const px = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i += 1) px.set(bg, i * 3);
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) px.set(c, (y * w + x) * 3); };
  return {
    w, h, px,
    ellipse(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y += 1) {
        for (let x = Math.floor(cx - rx); x <= cx + rx; x += 1) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) put(x, y, c);
        }
      }
    },
    rect(x0, y0, x1, y1, c) { for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) put(x, y, c); },
    // A triangle with a flat base, apex at (ax, ay), base from (x0, by) to (x1, by).
    roof(ax, ay, x0, x1, by, c) {
      for (let y = ay; y <= by; y += 1) {
        const t = (y - ay) / (by - ay);
        for (let x = Math.round(ax - (ax - x0) * t); x <= Math.round(ax + (x1 - ax) * t); x += 1) put(x, y, c);
      }
    },
  };
}

function png(cv) {
  const raw = Buffer.alloc((cv.w * 3 + 1) * cv.h);
  for (let y = 0; y < cv.h; y += 1) {
    raw[y * (cv.w * 3 + 1)] = 0;
    cv.px.copy(raw, y * (cv.w * 3 + 1) + 1, y * cv.w * 3, (y + 1) * cv.w * 3);
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0); ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

// A puppy face on a soft background, 640 by 480 (the 4:3 the portal's cards use).
function puppy(bg, fur, ear, muzzle) {
  const cv = canvas(640, 480, hex(bg));
  cv.ellipse(320, 470, 190, 90, hex(fur));
  cv.ellipse(205, 225, 58, 120, hex(ear));
  cv.ellipse(435, 225, 58, 120, hex(ear));
  cv.ellipse(320, 230, 140, 150, hex(fur));
  cv.ellipse(320, 300, 72, 58, hex(muzzle));
  cv.ellipse(268, 210, 16, 19, hex('#2b2118'));
  cv.ellipse(372, 210, 16, 19, hex('#2b2118'));
  cv.ellipse(273, 203, 5, 5, hex('#ffffff'));
  cv.ellipse(377, 203, 5, 5, hex('#ffffff'));
  cv.ellipse(320, 278, 26, 18, hex('#2b2118'));
  cv.ellipse(320, 330, 14, 9, hex('#d9827a'));
  return cv;
}

// A paw print in a ring, 400 by 400, for the approved breeder's logo.
function logo() {
  const cv = canvas(400, 400, hex('#fffaf3'));
  cv.ellipse(200, 200, 180, 180, hex('#2f5d50'));
  cv.ellipse(200, 200, 160, 160, hex('#fffaf3'));
  cv.ellipse(200, 240, 62, 52, hex('#c9932e'));
  cv.ellipse(132, 168, 24, 32, hex('#c9932e'));
  cv.ellipse(176, 128, 24, 32, hex('#c9932e'));
  cv.ellipse(224, 128, 24, 32, hex('#c9932e'));
  cv.ellipse(268, 168, 24, 32, hex('#c9932e'));
  return cv;
}

// A red barn on a green field under a blue sky, 800 by 500, for the kennel photo.
function kennel() {
  const cv = canvas(800, 500, hex('#bfe0f2'));
  cv.ellipse(660, 90, 46, 46, hex('#ffe08a'));
  cv.rect(0, 340, 800, 500, hex('#7fb069'));
  cv.rect(250, 200, 550, 380, hex('#b5403a'));
  cv.roof(400, 110, 230, 570, 200, hex('#6b2a26'));
  cv.rect(360, 270, 440, 380, hex('#f5efe6'));
  cv.rect(372, 282, 428, 380, hex('#8a3330'));
  cv.rect(285, 230, 335, 270, hex('#f5efe6'));
  cv.rect(465, 230, 515, 270, hex('#f5efe6'));
  cv.rect(40, 330, 220, 342, hex('#f5efe6'));
  cv.rect(580, 330, 780, 342, hex('#f5efe6'));
  return cv;
}

const IMAGES = {
  'puppy-cream': puppy('#f4e9da', '#f1d7a8', '#d9ad6c', '#fbf0dc'),
  'puppy-apricot': puppy('#e8f0e6', '#e3a764', '#b9773a', '#f6dcb6'),
  'puppy-chocolate': puppy('#efe6f2', '#7a5136', '#57362a', '#c9a27f'),
  'puppy-tricolor': puppy('#e6eef5', '#2e2a28', '#1d1a19', '#f3e7d8'),
  'puppy-merle': puppy('#f6eee4', '#a9a9b3', '#6f6f7c', '#efe9e4'),
  logo: logo(),
  kennel: kennel(),
};

const lines = ['// Made by app/dev/make-demo-images.mjs. Do not edit by hand. The demo breeders\' pictures',
  '// (plan P5.1), drawn rather than photographed, as base64 PNGs.', '', 'export const DEMO_IMAGES = {'];
let total = 0;
for (const [name, cv] of Object.entries(IMAGES)) {
  const b = png(cv);
  total += b.length;
  lines.push(`  '${name}': { w: ${cv.w}, h: ${cv.h}, b64: '${b.toString('base64')}' },`);
}
lines.push('};', '');
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`wrote lib/demo-images.js, ${Object.keys(IMAGES).length} images, ${total} bytes`);
