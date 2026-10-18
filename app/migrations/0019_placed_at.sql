-- 2026-10-17. Adopted puppies out of Google after 30 days (launch workplan A8). placed_at is
-- when a puppy was marked adopted. The generator leaves a puppy out of the sitemap and marks its
-- page noindex once placed_at is more than adopted_index_days (30) old, while the page itself
-- stays up so its litter can be seen.
ALTER TABLE puppies ADD COLUMN placed_at TEXT;

-- Two triggers keep placed_at right on every path that changes a puppy's status (the portal, the
-- admin, the import), so no route can forget it. Leaving placed clears it.
CREATE TRIGGER IF NOT EXISTS puppies_placed_at_update AFTER UPDATE OF availability ON puppies
WHEN NEW.availability IS NOT OLD.availability
BEGIN
  UPDATE puppies SET placed_at = CASE WHEN NEW.availability = 'placed' THEN strftime('%Y-%m-%dT%H:%M:%SZ','now') ELSE NULL END
   WHERE id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS puppies_placed_at_insert AFTER INSERT ON puppies
WHEN NEW.availability = 'placed' AND NEW.placed_at IS NULL
BEGIN
  UPDATE puppies SET placed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = NEW.id;
END;

-- Puppies already adopted. An imported Wix listing is dated at its import (created_at); any other
-- is dated at its last change, the closest record there is of when it was marked.
UPDATE puppies SET placed_at = CASE
    WHEN breeder_id IN (SELECT id FROM breeders WHERE legacy = 1) THEN created_at
    ELSE updated_at END
 WHERE availability = 'placed' AND placed_at IS NULL;

INSERT OR IGNORE INTO settings (key, value) VALUES ('adopted_index_days', '30');

DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;
CREATE VIEW public_puppies AS
SELECT pu.id, pu.breeder_id, pu.litter_id, pu.slug, pu.name, pu.sex, pu.color,
       pu.price_cents, pu.deposit_cents, pu.description, pu.breeder_url, pu.includes_json,
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at,
       pu.legacy_slug, pu.coat,
       pu.registry, pu.markings, pu.health_notes, pu.vaccinations, pu.deworming, pu.disclosures, pu.deposit_url,
       pu.placed_at
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

UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
