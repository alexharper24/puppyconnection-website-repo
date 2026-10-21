// Saved moms and dads, and documents (launch workplan A19 and A20, migrations/0050). Shared by the
// portal and the admin, so an operator is held to exactly what the breeder is held to.
//
// A breeder saves each parent once and picks them on a litter. Families see the parents of every
// public litter (the public_parents view). A document belongs to a puppy or to a parent and is either
// shown to families or kept for Puppy Connection staff. A public file lives in R2 under docs/ and a
// private one under private/, and a change of visibility moves the file, so nothing private ever
// sits where the site Worker reads (lib/media.js serveDocument reads only public_documents).

import { now, ulid, clean, bad, notFound } from './util.js';
import { sniff as sniffImage, cleanImage } from './images.js';
import { TESTS, breedList, testsFor } from './healthtests.js';

export const DOC_KINDS = { health: 'Health record', guarantee: 'Health guarantee', pedigree: 'Pedigree', other: 'Other document' };
// 10 MB covers a scanned multi-page health record or pedigree at a readable resolution, and stays
// well inside a Worker's request size.
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const MAX_DOCS = 10;
const MAX_TESTS = 40;

/** A parent edit, checked the same way whether the breeder or an operator makes it. */
export function parentFields(body, registries) {
  const name = clean(body.name, 80);
  if (!name) throw bad('Give the mom or dad a name.');
  const sex = String(body.sex || '');
  if (!['female', 'male'].includes(sex)) throw bad('Choose mom or dad.');
  const breed = clean(body.breed, 60);
  // Any breed slug, so a breed added in the admin after lib/healthtests.js was written still saves.
  if (breed && !/^[a-z0-9-]+$/.test(breed)) throw bad('Choose a breed from the list.');
  const registry = clean(body.registry, 40);
  if (registry && registries && !registries.includes(registry)) throw bad(`Registration is one of ${registries.join(', ')}.`);
  const tests = Array.isArray(body.health_tests) ? [...new Set(body.health_tests.map(String))] : [];
  if (tests.length > MAX_TESTS) throw bad('That is more health tests than the list has.');
  const unknown = tests.filter((k) => !TESTS[k]);
  if (unknown.length) throw bad('Pick health tests from the list, and put anything else in Other.');
  return {
    name, sex, breed, registry, registration: clean(body.registration, 80), health_tests_json: JSON.stringify(tests),
    health_other: clean(body.health_other, 1000), pedigree: clean(body.pedigree, 2000),
  };
}

export const PARENT_EDIT_COLS = ['name', 'sex', 'breed', 'registry', 'registration', 'health_tests_json', 'health_other', 'pedigree'];

/** A stored parent in the shape parentFields() reads, so an edit may send only what changes. */
export function parentInput(p) {
  return { name: p.name, sex: p.sex, breed: p.breed, registry: p.registry, registration: p.registration,
    health_tests: JSON.parse(p.health_tests_json || '[]'), health_other: p.health_other, pedigree: p.pedigree };
}

/** The tests a parent has, as labels, in the catalog's order. */
export function testLabels(json) {
  const keys = new Set(JSON.parse(json || '[]'));
  return Object.keys(TESTS).filter((k) => keys.has(k)).map((k) => TESTS[k]);
}

/** Where a parent photo is served. The v changes with the file, so a new photo is fetched fresh. */
export function parentPhotoUrl(base, p) {
  if (!p.photo_key) return null;
  const v = String(p.photo_key).split('/').pop().split('.')[0].slice(-10).toLowerCase();
  return `${base}/media/parent/${p.id}?v=${v}`;
}

/**
 * The mom and dad a litter names, checked: each one is this breeder's, the right sex, and not
 * removed unless the litter already had it. Another breeder's parent answers 404, like every
 * other record that is not yours (the ownership rule, lib/store.js owned()).
 */
export async function checkLitterParents(env, breederId, f, before = {}) {
  for (const [col, sex, word] of [['mom_id', 'female', 'mom'], ['dad_id', 'male', 'dad']]) {
    if (!f[col]) { f[col] = null; continue; }
    const p = await env.DB.prepare('SELECT id, breeder_id, sex, archived_at FROM parent_dogs WHERE id = ?').bind(f[col]).first();
    if (!p || p.breeder_id !== breederId) throw notFound();
    if (p.sex !== sex) throw bad(`The ${word} needs to be one of your saved ${word === 'mom' ? 'moms' : 'dads'}.`);
    if (p.archived_at && before[col] !== p.id) throw bad(`That ${word} was removed from your moms and dads.`);
  }
  return f;
}

/** A breeder's parents, newest first, with their tests, photo and documents, for the editors. */
export async function parentsFor(env, breederId, base = '') {
  const parents = (await env.DB.prepare('SELECT * FROM parent_dogs WHERE breeder_id = ? ORDER BY archived_at IS NOT NULL, created_at DESC').bind(breederId).all()).results;
  const docs = await documentsFor(env, breederId);
  const used = {};
  for (const r of (await env.DB.prepare(
    'SELECT mom_id, dad_id FROM litters WHERE breeder_id = ? AND archived_at IS NULL',
  ).bind(breederId).all()).results) for (const id of [r.mom_id, r.dad_id]) if (id) used[id] = (used[id] || 0) + 1;
  return parents.map((p) => ({
    ...p, health_tests: JSON.parse(p.health_tests_json || '[]'), test_labels: testLabels(p.health_tests_json),
    photo_url: parentPhotoUrl(base, p), documents: docs.filter((d) => d.parent_id === p.id), litters: used[p.id] || 0,
  }));
}

/** Every document a breeder has uploaded, for the editors. Staff see the files in the admin. */
export async function documentsFor(env, breederId) {
  const { results } = await env.DB.prepare(
    'SELECT id, puppy_id, parent_id, kind, title, visibility, content_type, bytes, created_at FROM documents WHERE breeder_id = ? ORDER BY created_at',
  ).bind(breederId).all();
  return results.map((d) => ({ ...d, kind_label: DOC_KINDS[d.kind] || d.kind, url: `/media/doc/${d.id}` }));
}

// ------------------------------------------------------------------ uploads

/** A document's metadata from the upload's query string. */
export function docFields(params, fallbackTitle) {
  const kind = String(params.get('kind') || '');
  if (!DOC_KINDS[kind]) throw bad('Choose what the document is: a health record, a health guarantee, a pedigree or other.');
  const visibility = String(params.get('visibility') || '');
  if (!['public', 'private'].includes(visibility)) throw bad('Choose whether families can see the document.');
  const title = clean(params.get('title'), 120) || clean(fallbackTitle, 120) || DOC_KINDS[kind];
  return { kind, visibility, title };
}

/**
 * The file, checked by its first bytes and never by its name or the header the browser sent. A
 * PDF is stored as it is. An image has its metadata stripped, as a puppy photo does, because a
 * phone photo of a paper record still carries where it was taken.
 */
export function cleanDocument(bytes) {
  if (!bytes.length) throw bad('That file is empty.');
  if (bytes.length > MAX_DOC_BYTES) throw bad('Documents can be up to 10 MB. A scan at a lower resolution, or one page per file, will fit.');
  const pdf = bytes.length > 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
  if (pdf) return { bytes, type: 'application/pdf', ext: 'pdf' };
  if (!sniffImage(bytes)) throw bad('Documents must be a PDF or a JPEG, PNG or WebP image.');
  const img = cleanImage(bytes);
  return { bytes: img.bytes, type: img.type, ext: { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[img.type] };
}

export const docKey = (visibility, breederId, id, ext) => `${visibility === 'public' ? 'docs' : 'private'}/${breederId}/${id}.${ext}`;

/** Move a document's file to match a new visibility. Returns the new key. */
export async function moveDocument(env, doc, visibility) {
  if (doc.visibility === visibility) return doc.r2_key;
  const ext = String(doc.r2_key).split('.').pop();
  const key = docKey(visibility, doc.breeder_id, doc.id, ext);
  const obj = await env.FILES.get(doc.r2_key);
  if (!obj) throw notFound();
  await env.FILES.put(key, await obj.arrayBuffer(), { httpMetadata: { contentType: doc.content_type } });
  return key;
}

/** Store a new document and return its row, for the caller to insert with its audit row. */
export async function storeDocument(env, { breederId, puppyId = null, parentId = null, raw, params, fileName }) {
  const f = docFields(params, fileName);
  const file = cleanDocument(raw);
  const id = ulid();
  const key = docKey(f.visibility, breederId, id, file.ext);
  await env.FILES.put(key, file.bytes, { httpMetadata: { contentType: file.type } });
  const t = now();
  return {
    row: { id, breeder_id: breederId, puppy_id: puppyId, parent_id: parentId, ...f, r2_key: key, content_type: file.type, bytes: file.bytes.length, created_at: t, updated_at: t },
    stmt: env.DB.prepare(
      `INSERT INTO documents (id, breeder_id, puppy_id, parent_id, kind, title, visibility, r2_key, content_type, bytes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, breederId, puppyId, parentId, f.kind, f.title, f.visibility, key, file.type, file.bytes.length, t, t),
  };
}

/**
 * The health test lists the editors offer, by breed (lib/healthtests.js), with any breed on the
 * site the file does not know yet, which gets the common screenings.
 */
export function healthCatalog(siteBreeds = []) {
  const list = breedList();
  for (const b of siteBreeds) if (!list.some((x) => x.slug === b.slug)) list.push({ slug: b.slug, name: b.name });
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list.map((b) => ({ slug: b.slug, name: b.name, ...testsFor(b.slug) }));
}
