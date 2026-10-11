// Breed guide pages (Alex, 2026-10-10). Each breed page is the money page for "<breed> puppies
// for sale", and the guide pages around it each answer one search families make about that breed,
// such as how big it gets or what colors it comes in, then hand them to the breed page and its
// puppies. Which topics get a page comes from the 2026-10-07 search research
// (hs-seo-data/puppyconnection/2026-10-10/guide-structure.html), never from one template.
//
// Guides live as files in this repository, as Teapup's do, so an operator's publish can never
// overwrite them: content/guides/<breed slug>/<topic>.md, beside build/ in both this repository
// (app/content) and the site repository (content), which build/sync-site-repo.mjs copies.
//
// A file opens with a front matter block of "key: value" lines between two "---" lines:
//
//   breed        the breed's slug, which must match a listed breed or the guide is skipped
//   topic        one of TOPICS below
//   question     the question the guide answers, used as its link text everywhere
//   h1           the page heading
//   title        the <title>; "<h1> | Puppy Connection" when left out
//   description  the meta description, 155 characters or fewer
//   status       "published" builds the page. Anything else, such as draft, builds nothing
//
// The body uses the breed page's guide format: paragraphs split by blank lines, a line starting
// "## " is a section heading, and {{count}}, {{price_range}}, {{deposit_range}}, {{includes}},
// {{parent_weights}} and {{colors_listed}} are sentences computed from the breed's listings.

import fs from 'node:fs';
import path from 'node:path';

export const TOPICS = {
  size: 'Size', lifespan: 'Lifespan and health', shedding: 'Shedding', temperament: 'Temperament',
  grooming: 'Grooming', price: 'Price', comparison: 'Compared', generation: 'Generations', colors: 'Colors',
  coat: 'Coat types', sizes: 'Size names', care: 'Care',
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Every guide file under dir, parsed. A file that does not parse throws, so a typo fails the build. */
export function loadGuides(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  const out = [];
  for (const breed of fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    for (const f of fs.readdirSync(path.join(dir, breed.name)).filter((x) => x.endsWith('.md'))) {
      const file = path.join(dir, breed.name, f);
      const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/^﻿/, '');
      const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      if (!m) throw new Error(`guides: ${file} has no front matter block`);
      const meta = {};
      for (const line of m[1].split('\n')) {
        const kv = line.match(/^(\w+):\s*(.*)$/);
        if (kv) meta[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1');
      }
      for (const k of ['breed', 'topic', 'question', 'h1', 'description']) if (!meta[k]) throw new Error(`guides: ${file} is missing "${k}"`);
      if (!TOPICS[meta.topic]) throw new Error(`guides: ${file} has unknown topic "${meta.topic}"`);
      if (meta.breed !== breed.name) throw new Error(`guides: ${file} says breed "${meta.breed}" but sits in ${breed.name}/`);
      const slug = `${meta.breed}-${path.basename(f, '.md')}`;
      if (!SLUG.test(slug)) throw new Error(`guides: ${file} makes the address "${slug}", which is not letters, numbers and dashes`);
      if (meta.description.length > 158) throw new Error(`guides: ${file} description is ${meta.description.length} characters, over 158`);
      out.push({ ...meta, slug, file: `guide-${slug}.html`, published: meta.status === 'published',
        paragraphs: m[2].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) });
    }
  }
  return out.sort((a, b) => a.breed.localeCompare(b.breed) || Object.keys(TOPICS).indexOf(a.topic) - Object.keys(TOPICS).indexOf(b.topic));
}
