// Fill from a document and Rotate (Alex, 2026-11-01), on Node with no server and no Workers AI.
//
//   node app/dev/doc-prefill-test.mjs
//
// Part 1 checks how lib/docextract.js cleans what the model returns: only the form's own fields,
// registries, breeds and tests, names tidied, nothing kept that does not fit. Part 2 turns the
// made-up sample PDFs in dev/fixtures with lib/pdfrotate.js and reads each result back with the
// portal's own copy of pdf.js, a reader that shares no code with the turning, page by page.
// The samples were made for this test and describe no real dog or breeder.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cleanParent, cleanPuppy, line, tidyName, matchRegistry, cleanRegistration, matchBreed, extractRefusal, PER_BURST } from '../lib/docextract.js';
import { rotatePdf } from '../lib/pdfrotate.js';
import { docVersion } from '../lib/parents.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let fails = 0, passes = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
  if (ok) passes += 1; else fails += 1;
}

// ---------------------------------------------------------------- part 1, cleaning the answer
const REG = ['AKC', 'AKC Canine Partners', 'APRI', 'ACA', 'CKC', 'UKC'];
const BREEDS = [{ slug: 'golden-retriever', name: 'Golden Retriever' }, { slug: 'labrador-retriever', name: 'Labrador Retriever' }];

const mom = cleanParent({
  doc_kind: 'registration', registered_name: "MAPLEWOOD'S SUNNY MEADOW", call_name: 'Sunny', registry: 'American Kennel Club (AKC)',
  registration_number: 'AKC SR98765401', breed: 'golden retriever', sex: 'female', sire: "GOLDCREST'S RIVER RUN SR91122334", dam: 'n/a',
  health_tests: [{ test: 'hips', name: 'OFA Hips', result: 'Good (GR-999001G24F-VPI)' }, { test: 'made_up', name: 'Ear check', result: 'Normal' }, { test: 'eyes', name: '', result: '' }],
}, { registries: REG, breeds: BREEDS });
check('a parent takes the call name, the registry abbreviation and the number without the registry',
  mom.fields.name === 'Sunny' && mom.fields.registry === 'AKC' && mom.fields.registration === 'SR98765401', JSON.stringify(mom.fields));
check('the breed is matched to the portal\'s own slug', mom.fields.breed === 'golden-retriever');
check('only tests in the catalog are ticked, and results go to Other health testing',
  mom.fields.health_tests.join() === 'hips,eyes' && /OFA Hips: Good/.test(mom.fields.health_other) && /Ear check: Normal/.test(mom.fields.health_other), JSON.stringify(mom.fields));
check('a registered name in capitals is tidied and a number after it keeps its capitals',
  /Registered name: Maplewood's Sunny Meadow/.test(mom.fields.pedigree) && /Sire: Goldcrest's River Run SR91122334/.test(mom.fields.pedigree) && !/Dam:/.test(mom.fields.pedigree));
check('a registration paper is kept as Other document', mom.kind === 'other' && mom.sex === 'female');

const junk = cleanParent({ registered_name: '', call_name: 'unknown', registry: 'Kennel Club of Mars', registration_number: 'none', breed: 'Martian Hound', health_tests: 'not a list', doc_kind: 'zzz' }, { registries: REG, breeds: BREEDS });
check('nothing that does not fit the form is kept', !Object.keys(junk.fields).length && junk.kind === 'other', JSON.stringify(junk));
check('an answer that is not an object gives nothing', !Object.keys(cleanParent(null).fields).length && !Object.keys(cleanPuppy('x').fields || {}).length);

const pup = cleanPuppy({
  doc_kind: 'health', name: 'BISCUIT', sex: 'male', color: 'Red, small white blaze on chest', markings: 'small white blaze on chest', coat: 'long', registry: 'AKC',
  registration_status: 'eligible', microchip: '985112009988776', vaccinations: ['10/17/2026 — DAPP 6 wk', 'DHPP at 2–4 weeks'], deworming: ['Pyrantel at 2, 4 and 6 weeks'], health_exam: 'Normal exam',
}, { registries: REG, colors: ['Red', 'Golden'], coats: ['Long', 'Short'] });
check('a puppy takes its name, sex, color and coat from the breed\'s own lists',
  pup.fields.name === 'Biscuit' && pup.fields.sex === 'male' && pup.fields.color === 'Red' && pup.fields.coat === 'Long', JSON.stringify(pup.fields));
check('markings given on the color line come off the color', pup.fields.markings === 'small white blaze on chest');
check('an em dash from the model becomes a comma, and a range keeps its en dash',
  pup.fields.vaccinations === '10/17/2026, DAPP 6 wk\nDHPP at 2–4 weeks', JSON.stringify(pup.fields.vaccinations));
check('a microchip number and an eligible registration tick Comes with', pup.includes.join() === 'Microchipped,Registrable');
check('a coat that is not on the breed\'s list is left out', !cleanPuppy({ coat: 'Feathery' }, { coats: ['Long'] }).fields.coat);
check('a sex other than female or male is left out', !cleanPuppy({ sex: 'unknown' }, {}).fields.sex);

check('line() drops blanks and placeholders and caps the length', line('  N/A ', 10) === null && line({ a: 1 }, 10) === null && line('abcdefghijkl', 5) === 'abcde');
check('tidyName leaves mixed case alone and keeps titles', tidyName('Duke') === 'Duke' && tidyName('GCH BRAMBLE OF ASHBY') === 'GCH Bramble Of Ashby');
check('the longest registry wins', matchRegistry('AKC Canine Partners', REG) === 'AKC Canine Partners' && matchRegistry('United Kennel Club', REG) === 'UKC');
check('a registration number needs a digit', cleanRegistration('Reg. No. SR123456', REG) === 'SR123456' && cleanRegistration('pending', REG) === null);
check('a breed name in another case or plural matches', matchBreed('LABRADOR RETRIEVERS', BREEDS) === 'labrador-retriever' && matchBreed('Goldendoodle', BREEDS) === null);

// The limit counts audit rows, so a stand-in D1 that answers the count is enough here.
const fakeDb = (n) => ({ DB: { prepare: () => ({ bind: () => ({ first: async () => ({ n }) }) }) } });
check('a breeder under the limits may read a document', (await extractRefusal(fakeDb(0), 'b1')) === null);
check('a breeder at the ten-minute limit is told to wait', /wait ten minutes/.test(await extractRefusal(fakeDb(PER_BURST), 'b1')));

// ---------------------------------------------------------------- part 2, turning PDFs
// The browser build wants DOMMatrix and Path2D when it loads. Reading rotations and text draws
// nothing, so empty stand-ins are enough on Node.
globalThis.DOMMatrix ||= class DOMMatrix {};
globalThis.Path2D ||= class Path2D {};
const pdfjs = await import(pathToFileURL(path.resolve(HERE, '../portal/public/vendor/pdfjs/pdf.min.mjs')).href);
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(path.resolve(HERE, '../portal/public/vendor/pdfjs/pdf.worker.min.mjs')).href;
async function rotations(bytes) {
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useWorkerFetch: false, verbosity: 0 });
  const doc = await task.promise;
  const out = [];
  for (let i = 1; i <= doc.numPages; i += 1) out.push((await doc.getPage(i)).rotate);
  const text = (await (await doc.getPage(1)).getTextContent()).items.map((x) => x.str).join(' ');
  await task.destroy();
  return { out, text };
}
for (const [file, label] of [['doc-sample-registration.pdf', 'a classic cross-reference table'], ['doc-sample-xrefstream.pdf', 'object streams and a compressed xref stream'], ['doc-sample-rotated.pdf', 'a page already turned']]) {
  const src = new Uint8Array(fs.readFileSync(path.join(HERE, 'fixtures', file)));
  const before = await rotations(src);
  const right = await rotatePdf(src, 90);
  const after = await rotations(right);
  check(`Rotate right turns every page of a PDF with ${label} (${before.out.join(',')} to ${after.out.join(',')})`,
    after.out.every((r, i) => r === (before.out[i] + 90) % 360) && after.text === before.text);
  const back = await rotatePdf(await rotatePdf(right, 270), 270);
  const b2 = await rotations(back);
  check(`and two Rotate lefts after it leave it a quarter turn left (${b2.out.join(',')})`, b2.out.every((r, i) => r === (before.out[i] + 270) % 360));
  check(`and the original bytes are untouched at the start of the file (${file})`, Buffer.from(right.subarray(0, src.length)).equals(Buffer.from(src)));
}
let refused = false;
try { await rotatePdf(new TextEncoder().encode('%PDF-1.4\nnot really a pdf\n%%EOF\n'), 90); } catch { refused = true; }
check('a file that is not a readable PDF is refused rather than guessed at', refused);

check('a turned file gets a new v= and a visibility change keeps it',
  docVersion('docs/b1/01ABCDEFGHJKMNPQRSTVWXYZ12.pdf') !== docVersion('docs/b1/01ABCDEFGHJKMNPQRSTVWXYZ12-k3m9qx.pdf')
  && docVersion('docs/b1/01ABC-k3m9qx.pdf') === docVersion('private/b1/01ABC-k3m9qx.pdf'));

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
