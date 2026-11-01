// Turn every page of a PDF by a quarter turn (Alex, 2026-11-01).
//
// A breeder who uploads a sideways or upside-down scan turns it with Rotate left or Rotate right,
// and families then see it upright. The file keeps its id and its pages. Nothing is redrawn: each
// page gets a new /Rotate value in an incremental update appended to the end of the file, which
// is how a PDF editor saves a change without rewriting the original. Every reader applies /Rotate,
// so no rotation needs to be stored in the database.
//
// The reader here knows only what that needs: the cross-reference table or stream (with the PNG
// predictors a compressed one uses), object streams, and the page tree with its inherited /Rotate.
// A file it cannot follow, such as a damaged one, is refused rather than guessed at, and the
// caller says so to the breeder.

const latin1 = (bytes, a = 0, b = bytes.length) => {
  let s = '';
  for (let i = a; i < b; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(b, i + 0x8000)));
  return s;
};

export class PdfError extends Error {}

const WS = /[\0\t\n\f\r ]/;
const DELIM = /[()<>[\]{}/%]/;

/** A minimal PDF object parser over a latin1 string. Returns values as plain JS. */
function parser(src, pos = 0) {
  const p = { src, pos };
  function skip() {
    for (;;) {
      while (p.pos < src.length && WS.test(src[p.pos])) p.pos += 1;
      if (src[p.pos] === '%') { while (p.pos < src.length && src[p.pos] !== '\n' && src[p.pos] !== '\r') p.pos += 1; continue; }
      return;
    }
  }
  function token() {
    let s = '';
    while (p.pos < src.length && !WS.test(src[p.pos]) && !DELIM.test(src[p.pos])) s += src[p.pos++];
    return s;
  }
  function value() {
    skip();
    const c = src[p.pos];
    if (c === '<' && src[p.pos + 1] === '<') {
      p.pos += 2;
      const d = { __dict: true, keys: [] };
      for (;;) {
        skip();
        if (src[p.pos] === '>' && src[p.pos + 1] === '>') { p.pos += 2; return d; }
        if (src[p.pos] !== '/') throw new PdfError('bad dictionary');
        const k = value().name;
        d[k] = value(); d.keys.push(k);
      }
    }
    if (c === '[') {
      p.pos += 1;
      const a = [];
      for (;;) { skip(); if (src[p.pos] === ']') { p.pos += 1; return a; } a.push(value()); }
    }
    if (c === '/') { p.pos += 1; return { name: token() }; }
    if (c === '(') {
      let depth = 0; const start = p.pos;
      for (; p.pos < src.length; p.pos += 1) {
        const ch = src[p.pos];
        if (ch === '\\') { p.pos += 1; continue; }
        if (ch === '(') depth += 1;
        else if (ch === ')') { depth -= 1; if (!depth) { p.pos += 1; return { str: src.slice(start, p.pos) }; } }
      }
      throw new PdfError('unterminated string');
    }
    if (c === '<') { const end = src.indexOf('>', p.pos); if (end < 0) throw new PdfError('bad hex string'); const s = src.slice(p.pos, end + 1); p.pos = end + 1; return { str: s }; }
    const t = token();
    if (!t) throw new PdfError(`unexpected ${JSON.stringify(c)}`);
    if (t === 'true' || t === 'false') return t === 'true';
    if (t === 'null') return null;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) {
      // An indirect reference is "num gen R".
      const save = p.pos;
      if (/^\d+$/.test(t)) {
        skip(); const g = token();
        if (/^\d+$/.test(g)) { skip(); if (src[p.pos] === 'R' && (p.pos + 1 >= src.length || WS.test(src[p.pos + 1]) || DELIM.test(src[p.pos + 1]))) { p.pos += 1; return { ref: Number(t), gen: Number(g) }; } }
        p.pos = save;
      }
      return Number(t);
    }
    return { op: t };
  }
  p.value = value; p.skip = skip; p.token = token;
  return p;
}

async function inflate(bytes) {
  const ds = new DecompressionStream('deflate');
  const out = new Response(new Blob([bytes]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

/** Undo the PNG predictors (10 to 15) a compressed xref stream or object stream may use. */
function unpredict(data, parms) {
  const pred = parms && parms.Predictor;
  if (!pred || pred < 10) return data;
  const cols = (parms.Columns || 1) * (parms.Colors || 1) * ((parms.BitsPerComponent || 8) / 8);
  const bpp = Math.max(1, (parms.Colors || 1) * ((parms.BitsPerComponent || 8) / 8));
  const rows = Math.floor(data.length / (cols + 1));
  const out = new Uint8Array(rows * cols);
  for (let r = 0; r < rows; r += 1) {
    const type = data[r * (cols + 1)];
    for (let i = 0; i < cols; i += 1) {
      const x = data[r * (cols + 1) + 1 + i];
      const a = i >= bpp ? out[r * cols + i - bpp] : 0;
      const b = r ? out[(r - 1) * cols + i] : 0;
      const c = r && i >= bpp ? out[(r - 1) * cols + i - bpp] : 0;
      let v;
      if (type === 0) v = x;
      else if (type === 1) v = x + a;
      else if (type === 2) v = x + b;
      else if (type === 3) v = x + ((a + b) >> 1);
      else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[r * cols + i] = v & 0xff;
    }
  }
  return out;
}

async function streamData(bytes, src, dict, dataStart) {
  let len = dict.Length;
  if (typeof len !== 'number') {
    const end = src.indexOf('endstream', dataStart);
    if (end < 0) throw new PdfError('stream without an end');
    len = end - dataStart;
    while (len > 0 && (src[dataStart + len - 1] === '\n' || src[dataStart + len - 1] === '\r')) len -= 1;
  }
  let data = bytes.subarray(dataStart, dataStart + len);
  const filters = dict.Filter ? (Array.isArray(dict.Filter) ? dict.Filter : [dict.Filter]).map((f) => f.name) : [];
  const parms = Array.isArray(dict.DecodeParms) ? dict.DecodeParms[0] : dict.DecodeParms;
  for (const f of filters) {
    if (f !== 'FlateDecode') throw new PdfError(`stream filter ${f} is not supported`);
    data = await inflate(data);
  }
  return filters.length ? unpredict(data, parms) : data;
}

/** Read the object that starts at offset: "n g obj <value> [stream ...]". */
function readAt(src, offset) {
  const p = parser(src, offset);
  p.skip();
  const num = Number(p.token()); p.skip(); const gen = Number(p.token()); p.skip();
  if (p.token() !== 'obj' || !Number.isFinite(num)) throw new PdfError(`no object at ${offset}`);
  const valueStart = p.pos;
  const v = p.value();
  const valueEnd = p.pos;
  p.skip();
  let dataStart = null;
  if (src.startsWith('stream', p.pos)) {
    dataStart = p.pos + 6;
    if (src[dataStart] === '\r') dataStart += 1;
    if (src[dataStart] === '\n') dataStart += 1;
  }
  return { num, gen, value: v, text: src.slice(valueStart, valueEnd).trim(), dataStart };
}

/** The cross-reference entries of the whole file, newest section first wins. */
async function readXref(bytes, src) {
  const sx = src.lastIndexOf('startxref');
  if (sx < 0) throw new PdfError('no startxref');
  let offset = Number(/startxref\s+(\d+)/.exec(src.slice(sx))?.[1]);
  const entries = new Map();
  let trailer = null, xrefStream = false;
  const seen = new Set();
  while (Number.isFinite(offset) && !seen.has(offset)) {
    seen.add(offset);
    let p = parser(src, offset); p.skip();
    let sectionTrailer;
    if (src.startsWith('xref', p.pos)) {
      p.pos += 4;
      for (;;) {
        p.skip();
        if (src.startsWith('trailer', p.pos)) { p.pos += 7; sectionTrailer = p.value(); break; }
        const start = Number(p.token()); p.skip(); const count = Number(p.token());
        if (!Number.isFinite(start) || !Number.isFinite(count)) throw new PdfError('bad xref table');
        for (let i = 0; i < count; i += 1) {
          p.skip();
          const off = Number(p.token()); p.skip(); const gen = Number(p.token()); p.skip(); const kind = p.token();
          if (!entries.has(start + i)) entries.set(start + i, kind === 'n' ? { offset: off, gen } : { free: true });
        }
      }
      // A hybrid file also points at an xref stream for the newer objects.
      if (typeof sectionTrailer.XRefStm === 'number') await readXrefStream(bytes, src, sectionTrailer.XRefStm, entries);
    } else {
      sectionTrailer = await readXrefStream(bytes, src, offset, entries);
      xrefStream = true;
    }
    if (!trailer) trailer = sectionTrailer;
    offset = sectionTrailer.Prev;
  }
  if (!trailer || !trailer.Root) throw new PdfError('no document root');
  return { entries, trailer, xrefStream };
}

async function readXrefStream(bytes, src, offset, entries) {
  const o = readAt(src, offset);
  const d = o.value;
  if (!d || !d.__dict || !d.Type || d.Type.name !== 'XRef' || o.dataStart == null) throw new PdfError('bad xref stream');
  const data = await streamData(bytes, src, d, o.dataStart);
  const W = d.W, index = d.Index || [0, d.Size];
  const rowLen = W[0] + W[1] + W[2];
  let at = 0;
  const field = (n) => { let v = 0; for (let i = 0; i < n; i += 1) v = v * 256 + data[at++]; return v; };
  for (let s = 0; s < index.length; s += 2) {
    for (let i = 0; i < index[s + 1]; i += 1) {
      if (at + rowLen > data.length) break;
      const type = W[0] ? field(W[0]) : 1, f2 = field(W[1]), f3 = field(W[2]);
      const num = index[s] + i;
      if (entries.has(num)) continue;
      if (type === 1) entries.set(num, { offset: f2, gen: f3 });
      else if (type === 2) entries.set(num, { stm: f2, idx: f3, gen: 0 });
      else entries.set(num, { free: true });
    }
  }
  return d;
}

/** Turn every page by turn degrees (90, 180 or 270, clockwise). Returns the new file's bytes. */
export async function rotatePdf(bytes, turn) {
  if (![90, 180, 270].includes(turn)) throw new PdfError('turn must be 90, 180 or 270');
  const src = latin1(bytes);
  if (!src.startsWith('%PDF-')) throw new PdfError('not a PDF');
  const { entries, trailer, xrefStream } = await readXref(bytes, src);
  // An encrypted file needs nothing special: strings inside a page dictionary are encrypted with the
  // page's own object number, which stays the same, and an xref stream is never encrypted.
  const stmCache = new Map();
  async function objStm(n) {
    if (stmCache.has(n)) return stmCache.get(n);
    const e = entries.get(n);
    if (!e || e.offset == null) throw new PdfError('object stream missing');
    const o = readAt(src, e.offset);
    const data = latin1(await streamData(bytes, src, o.value, o.dataStart));
    const first = o.value.First, count = o.value.N;
    const head = parser(data, 0);
    const offs = [];
    for (let i = 0; i < count; i += 1) { const num = head.value(); const off = head.value(); offs.push([num, off]); }
    const r = { data, first, offs };
    stmCache.set(n, r);
    return r;
  }
  async function get(ref) {
    const e = entries.get(ref.ref);
    if (!e || e.free) return null;
    if (e.offset != null) {
      const o = readAt(src, e.offset);
      return { value: o.value, text: o.text, gen: o.gen, num: ref.ref };
    }
    const s = await objStm(e.stm);
    const pair = s.offs[e.idx] && s.offs[e.idx][0] === ref.ref ? s.offs[e.idx] : s.offs.find((x) => x[0] === ref.ref);
    if (!pair) throw new PdfError('object not in its stream');
    const p = parser(s.data, s.first + pair[1]);
    const start = p.pos; const v = p.value();
    return { value: v, text: s.data.slice(start, p.pos).trim(), gen: 0, num: ref.ref };
  }
  const resolve = async (v) => (v && v.ref != null ? (await get(v))?.value : v);

  const root = await resolve(trailer.Root);
  if (!root || !root.Pages) throw new PdfError('no page tree');
  const pages = [];
  const visited = new Set();
  async function walk(ref, inherited) {
    if (!ref || ref.ref == null || visited.has(ref.ref)) return;
    visited.add(ref.ref);
    const o = await get(ref);
    if (!o || !o.value || !o.value.__dict) return;
    const rot = typeof o.value.Rotate === 'number' ? o.value.Rotate : (await resolve(o.value.Rotate)) ?? inherited;
    const type = o.value.Type && o.value.Type.name;
    if (type === 'Pages' || (!type && o.value.Kids)) {
      const kids = await resolve(o.value.Kids) || [];
      for (const k of kids) await walk(k, rot);
    } else {
      pages.push({ ...o, rotate: Number(rot) || 0 });
    }
  }
  await walk(root.Pages, 0);
  if (!pages.length) throw new PdfError('no pages');
  if (pages.length > 2000) throw new PdfError('too many pages');

  // The new body: each page dictionary as it was, with its /Rotate set to the sum.
  const parts = [];
  let pos = bytes.length;
  const tail = bytes[bytes.length - 1] === 0x0a || bytes[bytes.length - 1] === 0x0d ? '' : '\n';
  parts.push(tail); pos += tail.length;
  const written = [];
  for (const pg of pages) {
    const next = (((pg.rotate + turn) % 360) + 360) % 360;
    let t = pg.text.replace(/\/Rotate\s+(-?\d+|\d+\s+\d+\s+R)(?=[\s/>\]])/g, '');
    const open = t.indexOf('<<');
    t = `${t.slice(0, open + 2)} /Rotate ${next}${t.slice(open + 2)}`;
    const body = `${pg.num} ${pg.gen} obj\n${t}\nendobj\n`;
    written.push({ num: pg.num, gen: pg.gen, offset: pos });
    parts.push(body); pos += body.length;
  }
  const size = Math.max(Number(trailer.Size) || 0, ...written.map((w) => w.num + 1));
  const prev = Number(/startxref\s+(\d+)/.exec(src.slice(src.lastIndexOf('startxref')))[1]);
  const keep = (k) => (trailer[k] == null ? '' : ` /${k} ${pdfText(trailer[k])}`);
  written.sort((a, b) => a.num - b.num);
  if (xrefStream) {
    // A file that uses xref streams gets one too: uncompressed, one row per changed object and one
    // for itself, so a reader that expects streams after a stream is satisfied.
    const selfNum = size;
    const rows = [...written.map((w) => [w.num, 1, w.offset, w.gen]), [selfNum, 1, pos, 0]].sort((a, b) => a[0] - b[0]);
    const data = new Uint8Array(rows.length * 7);
    rows.forEach((r, i) => {
      data[i * 7] = 1;
      for (let b = 0; b < 4; b += 1) data[i * 7 + 1 + b] = (r[2] >>> (8 * (3 - b))) & 0xff;
      data[i * 7 + 5] = (r[3] >> 8) & 0xff; data[i * 7 + 6] = r[3] & 0xff;
    });
    const index = rows.map((r) => `${r[0]} 1`).join(' ');
    const head = `${selfNum} 0 obj\n<< /Type /XRef /Size ${selfNum + 1} /W [1 4 2] /Index [${index}] /Length ${data.length} /Prev ${prev}${keep('Root')}${keep('Info')}${keep('ID')}${keep('Encrypt')} >>\nstream\n`;
    const foot = `\nendstream\nendobj\nstartxref\n${pos}\n%%EOF\n`;
    return join([bytes, latinBytes(parts.join('')), latinBytes(head), data, latinBytes(foot)]);
  }
  let x = 'xref\n';
  for (const w of written) x += `${w.num} 1\n${String(w.offset).padStart(10, '0')} ${String(w.gen).padStart(5, '0')} n \n`;
  x += `trailer\n<< /Size ${size} /Prev ${prev}${keep('Root')}${keep('Info')}${keep('ID')}${keep('Encrypt')} >>\nstartxref\n${pos}\n%%EOF\n`;
  return join([bytes, latinBytes(parts.join('') + x)]);
}

const latinBytes = (s) => { const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i += 1) b[i] = s.charCodeAt(i) & 0xff; return b; };
function join(list) {
  const out = new Uint8Array(list.reduce((n, b) => n + b.length, 0));
  let at = 0; for (const b of list) { out.set(b, at); at += b.length; }
  return out;
}

/** Write a parsed value back as PDF text, for the few trailer keys carried forward. */
function pdfText(v) {
  if (v == null) return 'null';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v.ref != null) return `${v.ref} ${v.gen} R`;
  if (v.name != null) return `/${v.name}`;
  if (v.str != null) return v.str;
  if (Array.isArray(v)) return `[${v.map(pdfText).join(' ')}]`;
  if (v.__dict) return `<< ${v.keys.map((k) => `/${k} ${pdfText(v[k])}`).join(' ')} >>`;
  return String(v.op || '');
}
