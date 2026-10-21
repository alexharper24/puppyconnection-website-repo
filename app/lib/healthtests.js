// The health tests a breeder picks for a saved mom or dad (launch workplan A19, Amber 2026-10-19:
// "a complete list as far as possible, with an Other field"). Each breed's list is its OFA CHIC
// program as published on ofa.org on 2026-10-21, and app/docs/health-test-sources.md quotes the
// source of every breed for Alex to review. Nothing here is invented: a breed with no published
// list gets the common OFA screenings, and the portal says so.
//
// A test is stored on the parent by its key, so keys never change or go away. Add a new key for a
// new test, and change a label only to say the same test more plainly. One key covers the variants
// one program words differently (an eye exam at 12 or 24 months is still the eye exam), so a cross
// such as a doodle lists each test once.

export const TESTS = {
  dna_profile: 'AKC DNA profile',
  hips: 'Hips (x-ray evaluation)',
  elbows: 'Elbows (OFA)',
  eyes: 'Eyes (exam by a board-certified ophthalmologist)',
  heart: 'Heart (cardiac exam)',
  heart_advanced: 'Heart (advanced exam with echocardiogram)',
  patellas: 'Patellas (knees)',
  thyroid: 'Thyroid (autoimmune thyroiditis)',
  hearing: 'Hearing (BAER)',
  trachea: 'Trachea (OFA radiograph)',
  breathing: 'Breathing (BOAS grading)',
  legg_perthes: 'Legg-Calve-Perthes (OFA)',
  dentition: 'Dentition (OFA)',
  bile_acids: 'Bile acids (liver shunt)',
  dm: 'Degenerative myelopathy (DNA)',
  vwd: 'von Willebrand disease (DNA)',
  pra_prcd: 'PRA-prcd (DNA)',
  pra1: 'PRA1 (DNA)',
  pra_b: 'PRA type B, HIVEP3 (DNA)',
  eic: 'Exercise-induced collapse (DNA)',
  d_locus: 'D locus, dilute (DNA)',
  cnm: 'Centronuclear myopathy (DNA)',
  mdr1: 'MDR1 drug sensitivity (DNA)',
  cea: 'Collie eye anomaly (DNA)',
  hsf4: 'Hereditary cataracts, HSF4 (DNA)',
  nad: 'Neuroaxonal dystrophy (DNA)',
  cmr1: 'Canine multifocal retinopathy, CMR1 (DNA)',
  cddy: 'CDDY and CDPA (DNA)',
  myotonia: 'Myotonia congenita (DNA)',
  mac: 'Mycobacterium avium complex (DNA)',
  cystinuria: 'Cystinuria type III (DNA)',
  huu: 'Hyperuricosuria (DNA)',
  histiocytic_sarcoma: 'Histiocytic sarcoma (DNA)',
};

// The common OFA screenings, offered for a breed with no published list. OFA publishes no general
// list, so this is the six OFA databases most of the CHIC lists below are built from.
export const GENERAL = ['hips', 'elbows', 'eyes', 'heart', 'patellas', 'thyroid'];

const OFA = (code) => `https://ofa.org/chic-programs/browse-by-breed/?breed=${code}`;

// Each published program: what CHIC requires, then what it lists as optional or elective. The
// Doberman working aptitude evaluation and the Yorkshire Terrier DNA banks are on their CHIC pages
// but are not health tests, so they are left out (health-test-sources.md says so).
export const PROGRAMS = {
  'bernese-mountain-dog': { name: 'Bernese Mountain Dog', url: OFA('BMD'), required: ['dna_profile', 'hips', 'elbows', 'eyes', 'heart', 'dm'], optional: ['vwd', 'thyroid', 'histiocytic_sarcoma'] },
  'boston-terrier': { name: 'Boston Terrier', url: OFA('BTR'), required: ['eyes', 'patellas', 'hearing'], optional: [] },
  'cavalier-king-charles-spaniel': { name: 'Cavalier King Charles Spaniel', url: OFA('KCS'), required: ['hips', 'eyes', 'patellas', 'heart'], optional: [] },
  'cocker-spaniel': { name: 'Cocker Spaniel', url: OFA('CS'), required: ['eyes', 'hips'], optional: [] },
  'doberman-pinscher': { name: 'Doberman Pinscher', url: OFA('DP'), required: ['hips', 'heart_advanced', 'thyroid', 'vwd', 'eyes'], optional: [] },
  bulldog: { name: 'Bulldog', url: OFA('BU'), required: ['patellas', 'heart', 'trachea'], optional: ['breathing', 'eyes', 'hips', 'elbows', 'thyroid', 'hearing', 'huu'] },
  'french-bulldog': { name: 'French Bulldog', url: OFA('FBU'), required: ['hips', 'eyes', 'patellas', 'heart'], optional: ['trachea', 'elbows', 'hsf4', 'breathing', 'cystinuria'] },
  'golden-retriever': { name: 'Golden Retriever', url: OFA('GR'), required: ['hips', 'elbows', 'eyes', 'heart'], optional: [] },
  'great-dane': { name: 'Great Dane', url: OFA('GD'), required: ['hips', 'eyes', 'thyroid', 'heart_advanced'], optional: [] },
  havanese: { name: 'Havanese', url: OFA('HAV'), required: ['hips', 'eyes', 'patellas'], optional: [] },
  'labrador-retriever': { name: 'Labrador Retriever', url: OFA('LR'), required: ['hips', 'elbows', 'eyes', 'eic', 'd_locus'], optional: ['cnm', 'heart', 'pra_prcd'] },
  maltese: { name: 'Maltese', url: OFA('ML'), required: ['heart', 'patellas'], optional: ['bile_acids'] },
  dachshund: { name: 'Dachshund', url: OFA('DH'), required: ['eyes', 'patellas'], optional: ['heart'] },
  'poodle-miniature': { name: 'Poodle (Miniature)', url: OFA('PO/MIN'), required: ['pra_prcd', 'eyes', 'patellas', 'hips'], optional: [] },
  'poodle-toy': { name: 'Poodle (Toy)', url: OFA('PO/TOY'), required: ['pra_prcd', 'eyes', 'patellas'], optional: [] },
  'miniature-schnauzer': { name: 'Miniature Schnauzer', url: OFA('MSC'), required: ['eyes', 'heart'], optional: ['myotonia', 'mac', 'pra_b'] },
  // Papillon and Pomeranian each also require one test from an elective group, listed as optional here.
  papillon: { name: 'Papillon', url: OFA('PA'), required: ['eyes', 'patellas'], optional: ['heart', 'heart_advanced', 'pra1', 'nad'] },
  'pembroke-welsh-corgi': { name: 'Pembroke Welsh Corgi', url: OFA('WCP'), required: ['hips', 'eyes'], optional: [] },
  pomeranian: { name: 'Pomeranian', url: OFA('PN'), required: ['heart_advanced', 'patellas'], optional: ['eyes', 'thyroid', 'hips', 'legg_perthes'] },
  'saint-bernard': { name: 'Saint Bernard', url: OFA('SB'), required: ['hips', 'elbows', 'eyes', 'heart', 'dm'], optional: ['thyroid'] },
  'shih-tzu': { name: 'Shih Tzu', url: OFA('SHT'), required: ['eyes', 'patellas'], optional: ['hips', 'heart'] },
  'yorkshire-terrier': { name: 'Yorkshire Terrier', url: OFA('YT'), required: ['eyes', 'patellas'], optional: ['legg_perthes', 'thyroid', 'hips'] },
  'australian-shepherd': { name: 'Australian Shepherd', url: OFA('AS'), required: ['hips', 'elbows', 'eyes'], optional: ['thyroid', 'cea', 'mdr1'] },
  'miniature-american-shepherd': { name: 'Miniature American Shepherd', url: OFA('MAS/AM'), required: ['hips', 'eyes', 'pra_prcd', 'mdr1', 'hsf4', 'nad'], optional: ['elbows', 'patellas', 'dentition', 'cea', 'dm', 'cddy', 'cmr1', 'huu'] },
  'bichon-frise': { name: 'Bichon Frise', url: OFA('BCF'), required: ['hips', 'patellas', 'eyes'], optional: ['heart', 'legg_perthes'] },
};

// Every breed a parent can be, by the site's breed slug where there is one, and the programs whose
// tests it takes. A cross takes the tests of both parent breeds. Where a cross is bred from a Toy or
// Miniature Poodle, it takes the Miniature list, which holds every Toy test and hips as well.
// Australian Shepherd, Miniature American Shepherd and Bichon Frise are not breeds on the site, but
// they are the other parent of the Aussiedoodle and the Shichon.
const BREEDS = [
  ['australian-shepherd', 'Australian Shepherd', ['australian-shepherd']],
  ['bernese-mountain-dog', 'Bernese Mountain Dog', ['bernese-mountain-dog']],
  ['bichon-frise', 'Bichon Frise', ['bichon-frise']],
  ['boston-terrier', 'Boston Terrier', ['boston-terrier']],
  ['cavalier-king-charles-spaniel', 'Cavalier King Charles Spaniel', ['cavalier-king-charles-spaniel']],
  ['cavapoo', 'Cavapoo', ['cavalier-king-charles-spaniel', 'poodle-miniature']],
  ['cocker-spaniel', 'Cocker Spaniel', ['cocker-spaniel']],
  ['doberman-pinscher', 'Doberman Pinscher', ['doberman-pinscher']],
  ['english-bulldog', 'English Bulldog', ['bulldog']],
  ['f1b-mini-goldendoodle', 'F1b Mini Goldendoodle', ['golden-retriever', 'poodle-miniature']],
  ['french-bulldog', 'French Bulldog', ['french-bulldog']],
  ['golden-retriever', 'Golden Retriever', ['golden-retriever']],
  ['great-dane', 'Great Dane', ['great-dane']],
  ['havanese', 'Havanese', ['havanese']],
  ['labrador-retriever', 'Labrador Retriever', ['labrador-retriever']],
  ['maltese', 'Maltese', ['maltese']],
  ['miniature-american-shepherd', 'Miniature American Shepherd', ['miniature-american-shepherd']],
  ['mini-aussiedoodle', 'Mini Aussiedoodle', ['miniature-american-shepherd', 'australian-shepherd', 'poodle-miniature']],
  ['mini-bernedoodle', 'Mini Bernedoodle', ['bernese-mountain-dog', 'poodle-miniature']],
  ['miniature-dachshund', 'Miniature Dachshund', ['dachshund']],
  ['miniature-poodle', 'Miniature Poodle', ['poodle-miniature']],
  ['miniature-schnauzer', 'Miniature Schnauzer', ['miniature-schnauzer']],
  ['munchkin-bernedoodle', 'Munchkin Bernedoodle', ['bernese-mountain-dog', 'poodle-miniature']],
  ['papillon', 'Papillon', ['papillon']],
  ['pembroke-welsh-corgi', 'Pembroke Welsh Corgi', ['pembroke-welsh-corgi']],
  ['pomeranian', 'Pomeranian', ['pomeranian']],
  ['saint-bernard', 'Saint Bernard', ['saint-bernard']],
  ['shih-tzu', 'Shih Tzu', ['shih-tzu']],
  ['shih-poo', 'Shih-poo', ['shih-tzu', 'poodle-miniature']],
  ['teddy-bear-shihchon', 'Teddy Bear (Shihchon)', ['shih-tzu', 'bichon-frise']],
  ['toy-poodle', 'Toy Poodle', ['poodle-toy']],
  // OFA has no Victorian Bulldog program, and none was found elsewhere (2026-10-21).
  ['victorian-bulldog', 'Victorian Bulldog', []],
  ['yorkshire-terrier', 'Yorkshire Terrier', ['yorkshire-terrier']],
];

/** The breeds a parent can be, in name order, for the picker. */
export function breedList() {
  return BREEDS.map(([slug, name]) => ({ slug, name }));
}

/**
 * The tests offered for a breed slug: the programs' required tests first, then their optional ones,
 * each once. A breed with no program, including one added in the admin after this file was written,
 * gets the common screenings and general: true, which the portal says in words.
 */
export function testsFor(slug) {
  const entry = BREEDS.find((b) => b[0] === slug);
  const programs = (entry ? entry[2] : []).map((k) => PROGRAMS[k]).filter(Boolean);
  if (!programs.length) return { tests: GENERAL.map((k) => ({ key: k, label: TESTS[k], required: false })), sources: [], general: true };
  const req = new Set(programs.flatMap((p) => p.required));
  const keys = [...new Set([...programs.flatMap((p) => p.required), ...programs.flatMap((p) => p.optional)])];
  return {
    tests: keys.map((k) => ({ key: k, label: TESTS[k], required: req.has(k) })),
    sources: programs.map((p) => ({ name: `OFA CHIC program, ${p.name}`, url: p.url })),
    general: false,
  };
}
