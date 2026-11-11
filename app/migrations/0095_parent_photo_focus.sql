-- Alex, 2026-11-10 (docs/batch-2026-11-10-parent-photos.md). A mom or dad photo keeps its size and a
-- focus point, as a puppy photo does (migrations/0025), so the parent card on a puppy page is cut
-- around the dog's face rather than the middle. The point is 0..1 of the photo across and down,
-- from the dog detector at upload (lib/focus.js) or set by a person with Face (facepick.js).
-- public_parents carries the four columns to the site build, and public_documents is made again
-- because it reads public_parents. schema.sql already carries all of this for a new database.
-- This runs once. A second run stops on "duplicate column name: photo_width" and changes nothing.
ALTER TABLE parent_dogs ADD COLUMN photo_width INTEGER;
ALTER TABLE parent_dogs ADD COLUMN photo_height INTEGER;
ALTER TABLE parent_dogs ADD COLUMN focus_x REAL;
ALTER TABLE parent_dogs ADD COLUMN focus_y REAL;

DROP VIEW IF EXISTS public_documents;
DROP VIEW IF EXISTS public_parents;
CREATE VIEW public_parents AS
SELECT d.id, d.breeder_id, d.sex, d.name, d.breed, d.registry, d.registration, d.health_tests_json,
       d.health_other, d.pedigree, d.photo_key, d.photo_width, d.photo_height, d.focus_x, d.focus_y
FROM parent_dogs d
WHERE d.id IN (SELECT mom_id FROM public_litters UNION SELECT dad_id FROM public_litters);
CREATE VIEW public_documents AS
SELECT doc.id, doc.puppy_id, doc.parent_id, doc.kind, doc.title, doc.content_type, doc.r2_key
FROM documents doc
WHERE doc.visibility = 'public' AND doc.r2_key LIKE 'docs/%'
  AND (doc.puppy_id IN (SELECT id FROM public_puppies) OR doc.parent_id IN (SELECT id FROM public_parents));
