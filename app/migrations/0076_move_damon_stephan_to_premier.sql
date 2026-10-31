-- Alex 2026-10-31. Damon and Stephan, two Yorkshire Terrier males born 2026-07-24, were imported on 2026-10-02 under
-- Heartland Mini Schnauzers, which raises Miniature Schnauzers and shows no Yorkies on its site. Premier Paw Pals lists
-- the same two puppies, by name, birth date and price, on premierpawpals.com, and Yorkshire Terrier is one of its breeds.
-- Their litters, the puppies and their photos move to Premier Paw Pals, and each puppy's breeder link points to
-- Premier's site. The photo files stay where they are in R2. Each step checks the old owner, so a second run changes
-- nothing. Back up D1 first and confirm the export printed "Downloaded".
-- The photos point at (puppy, breeder) and the puppies at (litter, breeder), so the three tables change together and
-- the foreign keys are checked once at the end.
PRAGMA defer_foreign_keys = true;
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-31T02:27:22Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM puppies WHERE id IN ('seed-p-0081', 'seed-p-0250') AND breeder_id = 'seed-heartlandminischnauzers');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-31T02:27:22Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder', 'seed-heartlandminischnauzers', 'breeder_url', breeder_url), json_object('breeder', 'seed-premierpawpals', 'why', 'Alex, 2026-10-31, listed on premierpawpals.com')
    FROM puppies WHERE id IN ('seed-p-0081', 'seed-p-0250') AND breeder_id = 'seed-heartlandminischnauzers';
UPDATE photos SET breeder_id = 'seed-premierpawpals' WHERE puppy_id IN ('seed-p-0081', 'seed-p-0250') AND breeder_id = 'seed-heartlandminischnauzers';
UPDATE puppies SET breeder_id = 'seed-premierpawpals', breeder_url = 'https://www.premierpawpals.com/', updated_at = '2026-10-31T02:27:22Z', version = version + 1
  WHERE id IN ('seed-p-0081', 'seed-p-0250') AND breeder_id = 'seed-heartlandminischnauzers';
UPDATE litters SET breeder_id = 'seed-premierpawpals', updated_at = '2026-10-31T02:27:22Z', version = version + 1
  WHERE id IN ('seed-l-solo-damon-yorkshire-terrier', 'seed-l-solo-stephan-yorkshire-terrier') AND breeder_id = 'seed-heartlandminischnauzers';
