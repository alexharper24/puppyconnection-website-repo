-- Saved moms and dads, and document uploads (launch workplan A19 and A20, Amber 2026-10-21, Alex's
-- go-ahead the same day). A breeder saves each mom and dad once, with a photo, registration, health
-- tests picked from the breed's list (lib/healthtests.js) and an Other box, and pedigree, then picks
-- them on each litter. The litter's mom and dad weights stay as they are. Health records, guarantees
-- and pedigrees are uploaded for a puppy or a parent, each shown to families or kept for Puppy
-- Connection staff only. A public file lives in R2 under docs/, a private one under private/, and
-- only the public views below can reach the site. Schema only, so no data file changes until a
-- breeder fills something in. Back up D1 first and confirm the export printed "Downloaded".
-- Run it once, because the two ALTER lines fail on a second run. Everything before them is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS parent_dogs (
  id                TEXT PRIMARY KEY,
  breeder_id        TEXT NOT NULL REFERENCES breeders(id),
  sex               TEXT NOT NULL CHECK (sex IN ('female','male')),
  name              TEXT NOT NULL,
  breed             TEXT,
  registry          TEXT,
  registration      TEXT,
  health_tests_json TEXT NOT NULL DEFAULT '[]',
  health_other      TEXT,
  pedigree          TEXT,
  photo_key         TEXT,
  archived_at       TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  UNIQUE (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS parent_dogs_breeder ON parent_dogs(breeder_id);

CREATE TABLE IF NOT EXISTS documents (
  id           TEXT PRIMARY KEY,
  breeder_id   TEXT NOT NULL REFERENCES breeders(id),
  puppy_id     TEXT,
  parent_id    TEXT,
  kind         TEXT NOT NULL CHECK (kind IN ('health','guarantee','pedigree','other')),
  title        TEXT NOT NULL,
  visibility   TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
  r2_key       TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  bytes        INTEGER NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  CHECK ((puppy_id IS NULL) <> (parent_id IS NULL)),
  FOREIGN KEY (puppy_id, breeder_id) REFERENCES puppies (id, breeder_id),
  FOREIGN KEY (parent_id, breeder_id) REFERENCES parent_dogs (id, breeder_id)
);
CREATE INDEX IF NOT EXISTS documents_puppy ON documents(puppy_id);
CREATE INDEX IF NOT EXISTS documents_parent ON documents(parent_id);

ALTER TABLE litters ADD COLUMN mom_id TEXT REFERENCES parent_dogs(id);
ALTER TABLE litters ADD COLUMN dad_id TEXT REFERENCES parent_dogs(id);

DROP VIEW IF EXISTS public_documents;
DROP VIEW IF EXISTS public_parents;
DROP VIEW IF EXISTS public_litters;
CREATE VIEW public_litters AS
SELECT l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom_weight_lb,
       l.dad_weight_lb, l.description, l.mom_id, l.dad_id
FROM litters l
WHERE l.archived_at IS NULL
  AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.litter_id = l.id);
CREATE VIEW public_parents AS
SELECT d.id, d.breeder_id, d.sex, d.name, d.breed, d.registry, d.registration, d.health_tests_json,
       d.health_other, d.pedigree, d.photo_key
FROM parent_dogs d
WHERE d.id IN (SELECT mom_id FROM public_litters UNION SELECT dad_id FROM public_litters);
CREATE VIEW public_documents AS
SELECT doc.id, doc.puppy_id, doc.parent_id, doc.kind, doc.title, doc.content_type, doc.r2_key
FROM documents doc
WHERE doc.visibility = 'public' AND doc.r2_key LIKE 'docs/%'
  AND (doc.puppy_id IN (SELECT id FROM public_puppies) OR doc.parent_id IN (SELECT id FROM public_parents));

