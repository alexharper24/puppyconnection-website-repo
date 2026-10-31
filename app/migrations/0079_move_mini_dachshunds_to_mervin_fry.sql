-- Alex 2026-10-31, from Amber. Joy, Jasper, Johnny and Jaxon, the four Miniature Dachshunds added from Wix on
-- 2026-10-31 under Unassigned Wix listings (migration 0078), belong to Mervin Fry. Their litter, the puppies and their
-- photos move to Mervin Fry. Mervin Fry has no website on record, so breeder_url stays empty. The photo files stay where
-- they are in R2. Each step checks the old owner, so a second run changes nothing. Back up D1 first and confirm the
-- export printed "Downloaded". Apply with app/ops/d1-apply.mjs, because the photos point at (puppy, breeder) and the
-- puppies at (litter, breeder), so the three tables change in one batch with the foreign keys checked at the end.
PRAGMA defer_foreign_keys = true;
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-31T17:10:05Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0307' AND breeder_id = 'seed-unassigned');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-31T17:10:05Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder', 'seed-unassigned'), json_object('breeder', 'seed-mervin-fry', 'why', 'Amber via Alex, 2026-10-31')
    FROM puppies WHERE id IN ('seed-p-0307', 'seed-p-0308', 'seed-p-0311', 'seed-p-0315') AND breeder_id = 'seed-unassigned';
-- group
UPDATE photos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id IN ('seed-p-0307', 'seed-p-0308', 'seed-p-0311', 'seed-p-0315') AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-31T17:10:05Z', version = version + 1
  WHERE id IN ('seed-p-0307', 'seed-p-0308', 'seed-p-0311', 'seed-p-0315') AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-31T17:10:05Z', version = version + 1
  WHERE id = 'seed-l-wix-unassigned-2026-09-26-miniature-dachshund' AND breeder_id = 'seed-unassigned';
