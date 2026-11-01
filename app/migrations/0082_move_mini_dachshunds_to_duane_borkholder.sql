-- Alex 2026-11-01, from Amber. Joy, Jasper, Johnny and Jaxon, the four Miniature Dachshunds that migration 0079 moved to
-- Mervin Fry, belong to Duane Borkholder. Their litter, the puppies and their 29 photos move to Duane Borkholder. They have
-- no videos or documents. The photo files stay where they are in R2. Each step checks the current owner, so a second run
-- changes nothing. Back up D1 first and confirm "Downloaded". Apply with app/ops/d1-apply.mjs, because the photos point at
-- (puppy, breeder) and the puppies at (litter, breeder), so the three tables change in one batch.
PRAGMA defer_foreign_keys = true;
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-01T01:26:03Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0307' AND breeder_id = 'seed-mervin-fry');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T01:26:03Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder', 'seed-mervin-fry'), json_object('breeder', 'seed-duane-borkholder', 'why', 'Amber via Alex, 2026-11-01')
    FROM puppies WHERE id IN ('seed-p-0307', 'seed-p-0308', 'seed-p-0311', 'seed-p-0315') AND breeder_id = 'seed-mervin-fry';
-- group
UPDATE photos SET breeder_id = 'seed-duane-borkholder' WHERE puppy_id IN ('seed-p-0307', 'seed-p-0308', 'seed-p-0311', 'seed-p-0315') AND breeder_id = 'seed-mervin-fry';
UPDATE puppies SET breeder_id = 'seed-duane-borkholder', updated_at = '2026-11-01T01:26:03Z', version = version + 1
  WHERE id IN ('seed-p-0307', 'seed-p-0308', 'seed-p-0311', 'seed-p-0315') AND breeder_id = 'seed-mervin-fry';
UPDATE litters SET breeder_id = 'seed-duane-borkholder', updated_at = '2026-11-01T01:26:03Z', version = version + 1
  WHERE id = 'seed-l-wix-unassigned-2026-09-26-miniature-dachshund' AND breeder_id = 'seed-mervin-fry';
