-- Alex, 2026-11-27 (docs/batch-2026-11-27-hope-feedback.md). Each puppy gets a Socialization
-- section, where the breeder says what the puppy has been raised around, such as children, other
-- dogs, car rides, grooming and household sounds. It shows on the puppy page under its own heading.
-- public_puppies carries the new column to the site build, and the views that read it are made
-- again in the same shape as schema.sql, which already carries all of this for a new database.
-- This runs once. A second run stops on "duplicate column name: socialization" and changes nothing.
ALTER TABLE puppies ADD COLUMN socialization TEXT;

DROP VIEW IF EXISTS public_documents;
DROP VIEW IF EXISTS public_parents;
DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;
CREATE VIEW public_puppies AS
SELECT pu.id, pu.breeder_id, pu.litter_id, pu.slug, pu.name, pu.sex, pu.color,
       pu.price_cents, pu.deposit_cents, pu.description, pu.breeder_url, pu.includes_json,
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at,
       pu.legacy_slug, pu.coat,
       pu.registry, pu.markings, pu.health_notes, pu.vaccinations, pu.deworming, pu.disclosures, pu.deposit_url,
       pu.placed_at, pu.socialization
FROM puppies pu JOIN public_breeders pb ON pb.breeder_id = pu.breeder_id
WHERE pu.publication_state = 'published'
  AND pu.payment_state IN ('paid','comped')
  AND pu.operator_hold = 0
  AND (pu.expires_at IS NULL OR pu.expires_at > strftime('%Y-%m-%dT%H:%M:%SZ','now'));
CREATE VIEW public_litters AS
SELECT l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom_weight_lb,
       l.dad_weight_lb, l.description, l.mom_id, l.dad_id
FROM litters l
WHERE l.archived_at IS NULL
  AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.litter_id = l.id);
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
