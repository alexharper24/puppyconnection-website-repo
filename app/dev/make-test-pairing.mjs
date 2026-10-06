// Writes app/dev/fixtures/pairing-made-up.json, the MADE-UP pairing file the Wix import test uses
// (plan P4.7). The real pairing of each Wix listing to its breeder waits on Amber (decision d8).
// This one pairs each listing by the breeder website its harvested listing names, as the concept
// did, and gives every breeder a made-up @breeders.test sign-in address, so nothing can reach a
// real inbox. Listings that name no breeder go to one made-up "Unconfirmed Wix listings" breeder.
//
//   node app/dev/make-test-pairing.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const listings = JSON.parse(fs.readFileSync(path.join(REPO, '_harvest/data/listings.json'), 'utf8'));
const src = fs.readFileSync(path.join(REPO, 'data/data.js'), 'utf8');
const concept = JSON.parse(src.match(/window\.PC_LISTINGS\s*=\s*(\[.*?\]);/s)[1]);
const nameBySlug = Object.fromEntries(concept.map((l) => [l.slug, l.breeder_name]));

const slugify = (s) => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const breeders = {}, pairs = {};
for (const l of listings) {
  const key = l.breeder_domain ? slugify(l.breeder_domain.replace(/\.[a-z]+$/, '')) : 'unconfirmed';
  breeders[key] ||= {
    business_name: (l.breeder_domain && nameBySlug[l.slug]) || (l.breeder_domain ? l.breeder_domain : 'Unconfirmed Wix listings'),
    sign_in_email: `${key}@breeders.test`,
    website: l.breeder_domain ? `https://${l.breeder_domain}` : null,
    public_phone: null, public_email: null, city: null, state: null,
  };
  pairs[l.slug] = key;
}
const out = {
  made_up: true,
  about: 'MADE UP for the import test (plan P4.7). Not Amber\'s pairing. Every sign-in address is @breeders.test. The real file waits on Amber (decision d8) and has the same shape.',
  breeders, listings: pairs,
};
fs.writeFileSync(path.join(HERE, 'fixtures/pairing-made-up.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`pairing-made-up.json: ${Object.keys(breeders).length} breeders, ${Object.keys(pairs).length} listings`);
