-- Plan P4.3, 2026-10-06. public_puppies gains legacy_slug, the old Wix product slug, so the
-- generated site can send each old /product-page/<slug> address to the puppy's new page (the 301
-- map in spec M8). A view holds no data, so this only drops and recreates the two views that
-- depend on it, exactly as schema.sql does. Safe to run more than once.
DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;

CREATE VIEW public_puppies AS
SELECT pu.id, pu.breeder_id, pu.litter_id, pu.slug, pu.name, pu.sex, pu.color,
       pu.price_cents, pu.deposit_cents, pu.description, pu.breeder_url, pu.includes_json,
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at,
       pu.legacy_slug
FROM puppies pu JOIN public_breeders pb ON pb.breeder_id = pu.breeder_id
WHERE pu.publication_state = 'published'
  AND pu.payment_state IN ('paid','comped')
  AND pu.operator_hold = 0
  AND (pu.expires_at IS NULL OR pu.expires_at > strftime('%Y-%m-%dT%H:%M:%SZ','now'));

CREATE VIEW public_litters AS
SELECT l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom_weight_lb,
       l.dad_weight_lb, l.description
FROM litters l
WHERE l.archived_at IS NULL
  AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.litter_id = l.id);
