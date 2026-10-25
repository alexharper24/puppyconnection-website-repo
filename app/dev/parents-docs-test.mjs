// Launch workplan A19, A20 and A21: saved moms and dads, document uploads, and the listing quality
// prompts, against the running local portal (8787) and admin (8788).
//
//   node app/dev/parents-docs-test.mjs
//
// Part 1 is the health test lists in this process. Part 2 drives the portal and the admin: a breeder
// saves a mom and a dad with tests from the breed list and an Other test, picks them on a litter,
// uploads a public and a private document, and only the public one reaches the export, the generated
// puppy page and an anonymous visitor, while an operator can open both. Part 3 runs the generated
// site's Worker (site/static-worker.js) in this process over a stand-in D1, and part 4 runs the
// portal's quality prompts on made-up listings.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { Client, signUp } from './e2e.mjs';
import { TESTS, PROGRAMS, GENERAL, breedList, testsFor } from '../lib/healthtests.js';
import { build } from '../build/generate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, '..');
const PORTAL = process.env.PORTAL || 'http://localhost:8787';
const WRANGLER = process.env.WRANGLER_JS || path.resolve(APP, '../../teapup-website-repo/admin/node_modules/wrangler/bin/wrangler.js');
const JPG = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures/gps-test.jpg')));
const PDF = new TextEncoder().encode('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}

function sql(command) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', 'puppyconnection', '--local', '--persist-to',
    path.join(APP, '.state'), '--config', path.join(APP, 'portal/wrangler.jsonc'), '--json', '--command', command],
  { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

// ---------------------------------------------------------------- part 1, the health test lists
function listChecks() {
  // The other suites add made-up breeds named test-..., which take the common screenings like any new breed.
  const site = sql('SELECT slug FROM breeds').map((r) => r.slug).filter((x) => !x.startsWith('test-'));
  const known = new Set(breedList().map((b) => b.slug));
  check(`every breed on the site has a list or the common screenings (${site.length} breeds)`, site.every((s) => known.has(s)), site.filter((s) => !known.has(s)).join(', '));
  check('every program names only tests in the catalog, and every one has an ofa.org source',
    Object.values(PROGRAMS).every((p) => [...p.required, ...p.optional].every((k) => TESTS[k]) && /^https:\/\/ofa\.org\//.test(p.url)));
  const hav = testsFor('havanese');
  check('a purebred takes its own CHIC list, required tests first', !hav.general && hav.tests.map((t) => t.key).join() === 'hips,eyes,patellas' && hav.tests.every((t) => t.required));
  const cava = testsFor('cavapoo');
  check('a cross takes both parent breeds\' tests, each once, from both sources',
    cava.sources.length === 2 && ['heart', 'pra_prcd', 'hips', 'patellas', 'eyes'].every((k) => cava.tests.some((t) => t.key === k)) && new Set(cava.tests.map((t) => t.key)).size === cava.tests.length);
  const shichon = testsFor('teddy-bear-shihchon');
  check('the Shichon takes the Shih Tzu and Bichon Frise lists', shichon.sources.map((s) => s.name).join('|') === 'OFA CHIC program, Shih Tzu|OFA CHIC program, Bichon Frise');
  const vb = testsFor('victorian-bulldog');
  check('a breed with no published list gets the common screenings and says so', vb.general && vb.tests.map((t) => t.key).join() === GENERAL.join() && !vb.sources.length);
  check('a breed added after the file was written gets the common screenings too', testsFor('some-new-breed').general);
  check('no test the research found to be something other than a health test is offered',
    !Object.values(TESTS).some((l) => /aptitude|DNA bank|repository/i.test(l)));
  const doc = fs.readFileSync(path.join(APP, 'docs/health-test-sources.md'), 'utf8');
  check('the source file quotes a source for every breed with a list, and names the one without',
    breedList().every((b) => doc.includes(`### ${b.name}`)) && Object.values(PROGRAMS).every((p) => doc.includes(p.url)) && /Victorian Bulldog has no published list/.test(doc));
}

// ---------------------------------------------------------------- part 2, the portal and the admin
const admin = new Client(process.env.ADMIN || 'http://localhost:8788');
const form = (o) => new URLSearchParams(o);
const raw = (c, url, bytes, type) => c.req('POST', url, bytes, { headers: { 'content-type': type } });

async function makeBreeder(tag) {
  const stamp = `${tag}-${Date.now().toString(36)}`;
  const email = `${stamp}@breeders.test`;
  const { c } = await signUp(email, `Kennel ${stamp}`);
  const me = (await c.get('/api/me')).data;
  await c.put('/api/profile', { version: me.profile.version, business_name: `Kennel ${stamp}`, public_phone: '555-0101', city: 'Elkhart', state: 'IN' });
  await c.post('/api/profile/submit', { accept_terms: true, confirm_seller: true, reference: { name: 'Dr. Sam Example', role: 'vet', contact: '(260) 555-0199' } });
  await admin.post(`/api/breeders/${me.id}/approve`, {});
  return { c, id: me.id, email };
}

async function list(c, id) {
  const co = (await c.post('/api/checkouts', { puppy_ids: [id] })).data;
  const sp = new URL(co.url).pathname;
  const pay = await c.req('POST', `${sp}/pay`, form({ webhook: '1' }), { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  await c.get(new URL(pay.location).pathname + new URL(pay.location).search);
}

async function portalChecks() {
  const A = await makeBreeder('pd-a');
  const B = await makeBreeder('pd-b');
  const anon = new Client(PORTAL);

  const P = (await A.c.get('/api/parents')).data;
  check('the parents screen sends the breed lists, with the source of each', P.breeds.some((b) => b.slug === 'havanese' && b.sources[0].url.includes('breed=HAV')) && Array.isArray(P.parents));

  // A mom with tests from the Havanese list and an Other test, and a dad.
  const bad1 = await A.c.post('/api/parents', { name: 'Daisy', sex: 'female', breed: 'havanese', health_tests: ['hips', 'made-up'] });
  check('a test that is not on the list is refused, and points to Other', bad1.status === 400 && /Other/.test(bad1.data.error));
  const mom = (await A.c.post('/api/parents', { name: 'Daisy', sex: 'female', breed: 'havanese', registry: 'AKC', registration: 'SS12345678',
    health_tests: ['hips', 'eyes', 'patellas'], health_other: 'BAER hearing test, normal', pedigree: 'Sire: Champion Rio. Dam: Lulu.' })).data.id;
  const dad = (await A.c.post('/api/parents', { name: 'Duke', sex: 'male', breed: 'havanese', health_tests: ['eyes'] })).data.id;
  const saved = (await A.c.get('/api/parents')).data.parents.find((p) => p.id === mom);
  check('the mom is saved with her tests as labels, her Other test and her pedigree',
    saved && saved.test_labels.length === 3 && saved.health_other === 'BAER hearing test, normal' && /Champion Rio/.test(saved.pedigree) && saved.registry === 'AKC');
  const photo = await raw(A.c, `/api/parents/${mom}/photo`, JPG, 'image/jpeg');
  check('the mom takes a photo', photo.status === 201);
  const momPhotoUrl = (await A.c.get('/api/parents')).data.parents.find((p) => p.id === mom).photo_url;
  check('her photo is the breeder\'s to see, and nobody else\'s before she is on a public litter',
    (await A.c.get(momPhotoUrl)).status === 200 && (await anon.get(momPhotoUrl)).status === 404 && (await B.c.get(momPhotoUrl)).status === 404);
  const stored = sql(`SELECT photo_key FROM parent_dogs WHERE id = '${mom}'`)[0].photo_key;
  check('the photo is stored under parents/ with its metadata stripped', /^parents\//.test(stored) && (await A.c.get(momPhotoUrl)).data.length < JPG.length);

  // A litter that names them, and the rules around it.
  const litter = (await A.c.post('/api/litters', { breed_id: 'breed-havanese', born_on: '2026-09-01', mom_id: mom, dad_id: dad, mom_weight_lb: '12', dad_weight_lb: '14' })).data.id;
  const lrow = sql(`SELECT mom_id, dad_id, mom_weight_lb FROM litters WHERE id = '${litter}'`)[0];
  check('a breeder picks the mom and dad on a litter, and the weights stay', lrow.mom_id === mom && lrow.dad_id === dad && lrow.mom_weight_lb === 12);
  const swapped = await A.c.post('/api/litters', { breed_id: 'breed-havanese', mom_id: dad });
  check('a dad cannot be picked as the mom', swapped.status === 400);
  const bMom = (await B.c.post('/api/parents', { name: 'Bella', sex: 'female', breed: 'havanese' })).data.id;
  const stolen = await A.c.put(`/api/litters/${litter}`, { breed_id: 'breed-havanese', mom_id: bMom, dad_id: dad, version: 1 });
  check('another breeder\'s mom answers 404, as any record that is not yours does', stolen.status === 404);
  for (const [name, method, url, body] of [
    ['edit', 'PUT', `/api/parents/${bMom}`, { name: 'x', sex: 'female', version: 1 }],
    ['remove', 'POST', `/api/parents/${bMom}/archive`, {}],
    ['photo', 'POST', `/api/parents/${bMom}/photo`, JPG],
    ['document', 'POST', `/api/parents/${bMom}/documents?kind=health&visibility=public`, PDF],
  ]) {
    const r = await A.c.req(method, url, body, { headers: body instanceof Uint8Array ? { 'content-type': 'application/pdf' } : undefined });
    check(`A cannot ${name} B's mom (404)`, r.status === 404, `${r.status}`);
  }
  check('B\'s mom is unchanged', sql(`SELECT name, archived_at FROM parent_dogs WHERE id = '${bMom}'`)[0].name === 'Bella');

  // A puppy, listed, with a public and a private document, and a public document on the mom.
  const pup = (await A.c.post('/api/puppies', { litter_id: litter, name: 'Pip', price: '1800', description: 'Pip is playful.' })).data.id;
  await raw(A.c, `/api/puppies/${pup}/photos`, JPG, 'image/jpeg');
  const pubDoc = await raw(A.c, `/api/puppies/${pup}/documents?kind=health&visibility=public&title=${encodeURIComponent('Vet check, week 8')}`, PDF, 'application/pdf');
  const privDoc = await raw(A.c, `/api/puppies/${pup}/documents?kind=guarantee&visibility=private&title=${encodeURIComponent('Signed guarantee')}`, PDF, 'application/pdf');
  const momDoc = await raw(A.c, `/api/parents/${mom}/documents?kind=health&visibility=public&title=${encodeURIComponent('OFA hips certificate')}`, JPG, 'image/jpeg');
  check('a breeder uploads a public and a private PDF for a puppy, and an image for the mom', pubDoc.status === 201 && privDoc.status === 201 && momDoc.status === 201,
    JSON.stringify([pubDoc.data, privDoc.data, momDoc.data]));
  const keys = Object.fromEntries(sql(`SELECT id, r2_key FROM documents WHERE breeder_id = '${A.id}'`).map((r) => [r.id, r.r2_key]));
  check('the public files are under docs/ and the private one under private/ in R2',
    /^docs\//.test(keys[pubDoc.data.id]) && /^docs\//.test(keys[momDoc.data.id]) && /^private\//.test(keys[privDoc.data.id]));
  const text = await raw(A.c, `/api/puppies/${pup}/documents?kind=health&visibility=public`, new TextEncoder().encode('<html>not a pdf</html>'), 'application/pdf');
  check('a file that is not a PDF or an image is refused, whatever its header says', text.status === 400 && /PDF/.test(text.data.error));
  const big = new Uint8Array(10 * 1024 * 1024 + 10); big.set(PDF);
  const tooBig = await raw(A.c, `/api/puppies/${pup}/documents?kind=health&visibility=public`, big, 'application/pdf');
  check('a document over 10 MB is refused', tooBig.status === 400 && /10 MB/.test(tooBig.data.error));
  const noVis = await raw(A.c, `/api/puppies/${pup}/documents?kind=health`, PDF, 'application/pdf');
  check('a document must say who can see it', noVis.status === 400);
  const otherDoc = await A.c.req('PUT', `/api/documents/${privDoc.data.id}`, { visibility: 'public' });
  check('B cannot change or remove A\'s document (404)',
    (await B.c.req('PUT', `/api/documents/${privDoc.data.id}`, { visibility: 'public' })).status === 404 && (await B.c.req('DELETE', `/api/documents/${privDoc.data.id}`)).status === 404 &&
    (await B.c.req('POST', `/api/puppies/${pup}/documents?kind=health&visibility=public`, PDF, { headers: { 'content-type': 'application/pdf' } })).status === 404);
  check('making a document public moves its file to docs/, and private moves it back', otherDoc.status === 200 && /^docs\//.test(sql(`SELECT r2_key FROM documents WHERE id = '${privDoc.data.id}'`)[0].r2_key));
  await A.c.req('PUT', `/api/documents/${privDoc.data.id}`, { visibility: 'private' });
  check('the private document is back under private/', /^private\//.test(sql(`SELECT r2_key FROM documents WHERE id = '${privDoc.data.id}'`)[0].r2_key));

  check('before the puppy is listed, nobody else can open even its public document',
    (await anon.get(`/media/doc/${pubDoc.data.id}`)).status === 404 && (await A.c.get(`/media/doc/${pubDoc.data.id}`)).status === 200);
  await list(A.c, pup);
  check('once listed, a family opens the public document and the mom\'s photo', (await anon.get(`/media/doc/${pubDoc.data.id}`)).status === 200 &&
    (await anon.get(`/media/doc/${momDoc.data.id}`)).status === 200 && (await anon.get(momPhotoUrl)).status === 200);
  const privAnon = await anon.get(`/media/doc/${privDoc.data.id}`);
  const privOwner = await A.c.get(`/media/doc/${privDoc.data.id}`);
  check('the private document answers 404 to a family and to the portal, even for its breeder', privAnon.status === 404 && privOwner.status === 404);
  const privStaff = await admin.get(`/media/doc/${privDoc.data.id}`);
  check('a signed-in operator opens the private document in the admin', privStaff.status === 200 && /PDF/.test(String(privStaff.data)));
  const head = await fetch(`${PORTAL}/media/doc/${pubDoc.data.id}`);
  check('a document is served as its checked type, with nosniff', head.headers.get('content-type') === 'application/pdf' && head.headers.get('x-content-type-options') === 'nosniff');
  const detail = (await admin.get(`/api/breeders/${A.id}`)).data;
  check('the admin breeder screen lists the parents with their tests and every document, private included',
    detail.parents.length === 2 && detail.parents.find((p) => p.id === mom).test_labels.length === 3 &&
    detail.litters.flatMap((l) => l.puppies).find((p) => p.id === pup).documents.some((d) => d.visibility === 'private'));

  // The export and the generated page.
  const exp = (await anon.get('/data/export.json')).data;
  const litters = JSON.parse(exp.files['data/litters.json']);
  const puppies = JSON.parse(exp.files['data/puppies.json']);
  const L = litters.find((l) => l.id === litter);
  const pp = puppies.find((x) => x.name === 'Pip' && x.litter === litter);
  check('the export carries both parents with tests, Other, pedigree, photo and the mom\'s public document',
    L && L.mom.name === 'Daisy' && L.dad.name === 'Duke' && L.mom.tests.length === 3 && L.mom.other_tests[0] === 'BAER hearing test, normal' &&
    /^media\/parent\//.test(L.mom.photo.src) && L.mom.documents.length === 1 && L.mom.breed === 'Havanese');
  check('the export carries only the puppy\'s public document', pp && pp.documents.length === 1 && pp.documents[0].title === 'Vet check, week 8' &&
    !exp.files['data/puppies.json'].includes('Signed guarantee') && !JSON.stringify(exp).includes('private/'));
  check('the export never names an R2 key or a private document', !/"r2_key"|docs\/|private\//.test(JSON.stringify(exp.files)));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-parents-'));
  fs.mkdirSync(path.join(tmp, 'data'));
  for (const [f, body] of Object.entries(exp.files)) fs.writeFileSync(path.join(tmp, f), body);
  build({ dataDir: tmp, out: path.join(tmp, 'out'), guides: path.join(APP, 'dev/fixtures/guides') });
  const page = fs.readFileSync(path.join(tmp, 'out', `puppy-${pp.slug}.html`), 'utf8');
  check('the puppy page shows both parents, their tests and the mom\'s photo',
    /puppy-parents/.test(page) && page.includes('>Daisy</h3>') && page.includes('>Duke</h3>') && page.includes('Patellas (knees)') && page.includes('media/parent/'));
  check('the puppy page links the public documents and never the private one',
    page.includes(`media/doc/${pubDoc.data.id}`) && page.includes(`media/doc/${momDoc.data.id}`) && !page.includes(privDoc.data.id) && !page.includes('Signed guarantee'));
  check('the facts still give the parents\' weights, now with their names', page.includes('Daisy, 12 lbs adult weight') && page.includes('Duke, 14 lbs adult weight'));
  fs.rmSync(tmp, { recursive: true, force: true });

  // Removing a parent from the picker keeps it on the litter that has it.
  await A.c.post(`/api/parents/${dad}/archive`, {});
  const keep = await A.c.put(`/api/litters/${litter}`, { breed_id: 'breed-havanese', mom_id: mom, dad_id: dad, version: sql(`SELECT version FROM litters WHERE id = '${litter}'`)[0].version });
  const reuse = await A.c.post('/api/litters', { breed_id: 'breed-havanese', dad_id: dad });
  check('a removed dad stays on his litter but cannot be picked for a new one', keep.status === 200 && reuse.status === 400);
  const sexChange = await A.c.put(`/api/parents/${mom}`, { name: 'Daisy', sex: 'male', version: sql(`SELECT version FROM parent_dogs WHERE id = '${mom}'`)[0].version });
  check('a mom on a litter cannot be changed to a dad', sexChange.status === 400);
  const del = await A.c.req('DELETE', `/api/documents/${pubDoc.data.id}`);
  check('a breeder removes a document, and it stops being served', del.status === 200 && (await anon.get(`/media/doc/${pubDoc.data.id}`)).status === 404);
  check('every change is in the activity log', sql(`SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'parent.%' OR action LIKE 'document.%'`)[0].n >= 9);
  return { A, B };
}

// ---------------------------------------------------------------- part 3, the site Worker
// A D1 stand-in over node:sqlite: prepare, bind, first, all and run.
function d1(db) {
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a),
    first: async () => db.prepare(q).get(...args) ?? null,
    all: async () => ({ results: db.prepare(q).all(...args) }),
    run: async () => ({ meta: { changes: Number(db.prepare(q).run(...args).changes) } }),
  });
  return { prepare: (q) => stmt(q) };
}

async function siteWorkerChecks() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(APP, 'schema.sql'), 'utf8'));
  const t = '2026-10-21T00:00:00Z';
  db.exec(`INSERT INTO breeds (id, slug, name) VALUES ('br', 'havanese', 'Havanese');
    INSERT INTO breeders (id, email, status, created_at, updated_at) VALUES ('b1', 'b1@breeders.test', 'approved', '${t}', '${t}');
    INSERT INTO breeder_profiles (breeder_id, business_name, slug, updated_at) VALUES ('b1', 'B One', 'b-one', '${t}');
    INSERT INTO parent_dogs (id, breeder_id, sex, name, photo_key, created_at, updated_at) VALUES ('m1', 'b1', 'female', 'Mom', 'parents/b1/m1-x.jpg', '${t}', '${t}');
    INSERT INTO parent_dogs (id, breeder_id, sex, name, photo_key, created_at, updated_at) VALUES ('m2', 'b1', 'female', 'Unused', 'parents/b1/m2-x.jpg', '${t}', '${t}');
    INSERT INTO litters (id, breeder_id, breed_id, mom_id, created_at, updated_at) VALUES ('l1', 'b1', 'br', 'm1', '${t}', '${t}');
    INSERT INTO puppies (id, breeder_id, litter_id, slug, name, payment_state, publication_state, created_at, updated_at) VALUES ('p1', 'b1', 'l1', 'p1', 'Pup', 'paid', 'published', '${t}', '${t}');
    INSERT INTO documents (id, breeder_id, puppy_id, kind, title, visibility, r2_key, content_type, bytes, created_at, updated_at) VALUES
      ('d1', 'b1', 'p1', 'health', 'Public', 'public', 'docs/b1/d1.pdf', 'application/pdf', 10, '${t}', '${t}'),
      ('d2', 'b1', 'p1', 'guarantee', 'Private', 'private', 'private/b1/d2.pdf', 'application/pdf', 10, '${t}', '${t}'),
      ('d3', 'b1', 'p1', 'health', 'Mismarked', 'public', 'private/b1/d3.pdf', 'application/pdf', 10, '${t}', '${t}');`);
  const files = new Map([['docs/b1/d1.pdf', PDF], ['private/b1/d2.pdf', PDF], ['private/b1/d3.pdf', PDF], ['parents/b1/m1-x.jpg', JPG], ['parents/b1/m2-x.jpg', JPG]]);
  const env = {
    DB: d1(db),
    FILES: { get: async (k) => (files.has(k) ? { body: files.get(k), httpMetadata: {} } : null) },
    ASSETS: { fetch: async () => new Response('asset') },
  };
  const { default: worker } = await import(new URL('../site/static-worker.js', import.meta.url));
  const get = async (p) => (await worker.fetch(new Request(`https://site.test${p}`), env)).status;
  check('the site Worker serves a public document of a public puppy', await get('/media/doc/d1') === 200);
  check('the site Worker answers 404 for a private document, and for a public row whose file sits under private/',
    await get('/media/doc/d2') === 404 && await get('/media/doc/d3') === 404);
  check('the site Worker serves the photo of a parent on a public litter, and not one on no litter',
    await get('/media/parent/m1') === 200 && await get('/media/parent/m2') === 404);
  db.exec("UPDATE puppies SET operator_hold = 1 WHERE id = 'p1'");
  check('a held puppy\'s documents and its parents\' photos stop being served', await get('/media/doc/d1') === 404 && await get('/media/parent/m1') === 404);
}

// ---------------------------------------------------------------- part 4, the quality prompts
function promptChecks() {
  const js = fs.readFileSync(path.join(APP, 'portal/public/portal.js'), 'utf8');
  const start = js.indexOf('  var GOOD_PHOTOS');
  const end = js.indexOf('  // ------------------------------------------------------------ pay');
  const sandbox = { plural: (n, one, many) => `${n} ${n === 1 ? one : (many || `${one}s`)}`, esc: (s) => String(s), $: () => null };
  vm.createContext(sandbox);
  vm.runInContext(`${js.slice(start, end)}\nthis.qualityGaps = qualityGaps; this.qualityBox = qualityBox;`, sandbox);
  const kinds = (x, l) => sandbox.qualityGaps(x, l, null).map((g) => g[0]).join(',');
  const bare = { description: 'Cute', photos: [{}], documents: [] };
  check('a one-line description, no health details, no parents, one photo and no birth date are each flagged',
    kinds(bare, { born_on: null }) === 'desc,health,parents,photos,born');
  const full = { description: 'Pip is a playful little girl who loves people. She is crate trained and used to children and other dogs.', health_notes: 'Vet checked',
    photos: [{}, {}, {}], documents: [] };
  check('a full listing has nothing to flag, and the box says so', kinds(full, { mom_id: 'm', dad_id: 'd', born_on: '2026-09-01' }) === '' &&
    /has what families look for/.test(sandbox.qualityBox(full, { mom_id: 'm', dad_id: 'd', born_on: '2026-09-01' }, null)));
  check('a health record upload counts as health details, and one parent asks for the other',
    kinds({ ...full, health_notes: '', documents: [{ kind: 'health' }] }, { mom_id: 'm', born_on: '2026-09-01' }) === 'parents' &&
    /Pick the dad too/.test(sandbox.qualityGaps(full, { mom_id: 'm', born_on: '2026-09-01' }, null)[0][1]));
  check('a photo sent back by the check does not count toward the photos', kinds({ ...full, photos: [{}, {}, { quality: 'sent_back' }] }, { mom_id: 'm', dad_id: 'd', born_on: 'x' }) === 'photos');
  check('the prompts say the breeder can still save and list', /You can still save and list it as it is/.test(sandbox.qualityBox(bare, null, null)));
  check('the form redraws the prompts as the breeder types, and the pay screen shows them before payment',
    /form\.addEventListener\('input', function \(\) \{ qbox\.innerHTML = qualityBox\(x, qlit, form\); \}\)/.test(js) && /Could be stronger: /.test(js));
}

listChecks();
await portalChecks();
await siteWorkerChecks();
promptChecks();
console.log(`\n${passes} passed, ${fails} failed`);
process.exitCode = fails ? 1 : 0;
