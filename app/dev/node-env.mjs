// The Worker's DB and FILES bindings, rebuilt on Node for scripts and tests that run the real
// lib/ code outside wrangler: the publish test and its CPU measurement, the Wix import and the
// restore rehearsal. d1() wraps node:sqlite in the D1 methods lib/ uses (prepare, bind, first,
// all, run, batch, exec), so the code under test is the code that ships. r2() keeps objects in a
// Map, or in a folder when given one.

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const APP = path.resolve(HERE, '..');

const conv = (v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);
const plain = (r) => (r ? { ...r } : r);

/** A D1-shaped database over node:sqlite. file is a path, or ':memory:'. */
export function d1(file = ':memory:') {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  // Time spent inside SQLite, so a CPU measurement can leave it out (D1 runs it elsewhere).
  const timing = { cpuUs: 0 };
  const timed = (fn) => { const a = process.cpuUsage(); try { return fn(); } finally { const b = process.cpuUsage(a); timing.cpuUs += b.user + b.system; } };
  class Stmt {
    constructor(sql, args = []) { this.sql = sql; this.args = args; }
    bind(...a) { return new Stmt(this.sql, a); }
    rows() { return timed(() => db.prepare(this.sql).all(...this.args.map(conv)).map(plain)); }
    async first(col) { const r = timed(() => plain(db.prepare(this.sql).get(...this.args.map(conv)))); return r ? (col ? r[col] : r) : null; }
    async all() { return { results: this.rows(), meta: {} }; }
    async run() { return this.runSync(); }
    runSync() {
      if (/^\s*(SELECT|WITH|PRAGMA)\b/i.test(this.sql) || /\bRETURNING\b/i.test(this.sql)) return { results: this.rows(), meta: { changes: 0 } };
      const r = timed(() => db.prepare(this.sql).run(...this.args.map(conv)));
      return { results: [], meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    }
  }
  return {
    raw: db, timing,
    prepare: (sql) => new Stmt(sql),
    async batch(stmts) {
      db.exec('BEGIN');
      try { const out = stmts.map((s) => s.runSync()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    async exec(sql) { timed(() => db.exec(sql)); return { count: 1 }; },
    close() { db.close(); },
  };
}

/** An R2-shaped bucket. With dir, objects are files under it (the key is the relative path). */
export function r2(dir = null) {
  const map = new Map();
  const file = (k) => path.join(dir, ...k.split('/'));
  const obj = (k, bytes, type) => ({
    key: k, size: bytes.length, httpMetadata: { contentType: type },
    body: bytes, async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); },
  });
  return {
    map,
    async get(k) {
      if (dir) return fs.existsSync(file(k)) ? obj(k, new Uint8Array(fs.readFileSync(file(k))), map.get(k)?.type) : null;
      const v = map.get(k); return v ? obj(k, v.bytes, v.type) : null;
    },
    async head(k) { return (await this.get(k)) ? { key: k } : null; },
    async put(k, bytes, opts = {}) {
      const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      const type = opts.httpMetadata?.contentType;
      if (dir) { fs.mkdirSync(path.dirname(file(k)), { recursive: true }); fs.writeFileSync(file(k), u); map.set(k, { type }); } else map.set(k, { bytes: u, type });
    },
    async list({ prefix = '' } = {}) { return { objects: [...map.keys()].filter((k) => k.startsWith(prefix)).sort().map((key) => ({ key })) }; },
    async delete(keys) { for (const k of [].concat(keys)) { map.delete(k); if (dir && fs.existsSync(file(k))) fs.rmSync(file(k)); } },
  };
}

/** schema.sql with its migrations already folded in, applied to a fresh database. */
export async function freshSchema(db) {
  await db.exec(fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8'));
}

/** The local D1 file wrangler keeps for the puppyconnection database under app/.state. */
export function localD1File() {
  const dir = path.join(APP, '.state/v3/d1/miniflare-D1DatabaseObject');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite') : [];
  if (!files.length) throw new Error('No local database under app/.state. Run node app/dev/setup.mjs first.');
  // One database is bound, so one file holds data. Pick the largest, in case an empty one exists.
  return files.map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
}
