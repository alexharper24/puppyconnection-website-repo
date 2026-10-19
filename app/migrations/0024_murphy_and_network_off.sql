-- 2026-10-18. Two answers from Alex after migration 0023. Run once on staging after a backup, with
-- ops/d1-apply.mjs, because the move needs PRAGMA defer_foreign_keys. A second run changes nothing.
--
-- Smurf: "let's put Smurf in uh, Kingdom Family Companions for now. Uh, but Smurf is now Murphy, not
-- Smurf." The live Wix listing still reads Smurf, so legacy_slug keeps the Wix address for its redirect.
-- The breeder rests on Alex's answer alone, since the listing's only contact is 574-377-8023.
PRAGMA defer_foreign_keys = true;
-- group
UPDATE litters SET breeder_id = 'seed-kingdomfamilycompanions', updated_at = '2026-10-18T23:00:00Z', version = version + 1
 WHERE id = 'seed-l-solo-smurf-munchkin-bernedoodle' AND breeder_id <> 'seed-kingdomfamilycompanions';
UPDATE puppies SET breeder_id = 'seed-kingdomfamilycompanions', name = 'Murphy', slug = 'murphy-munchkin-bernedoodle',
  updated_at = '2026-10-18T23:00:00Z', version = version + 1
 WHERE id = 'seed-p-0247' AND breeder_id <> 'seed-kingdomfamilycompanions';
UPDATE photos SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0247';
UPDATE puppy_videos SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0247';
UPDATE listing_reports SET breeder_id = 'seed-kingdomfamilycompanions' WHERE puppy_id = 'seed-p-0247';
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-kingdomfamilycompanions', 'breed-munchkin-bernedoodle');

-- The Responsible Dog Breeder Network: "go ahead and take uh, RDBN off." Its member kennels have their
-- own pages since migration 0023, and it holds no public puppies, so suspending it takes its page off.
UPDATE breeders SET status = 'suspended', status_reason = 'Member kennels have their own pages, so the network page is off the site (Alex, 2026-10-18)',
  decided_at = '2026-10-18T23:00:00Z', decided_by = 'migration 0024', updated_at = '2026-10-18T23:00:00Z', version = version + 1
 WHERE id = 'seed-responsibledogbreeder' AND status <> 'suspended';

-- Mark the site changed, so the next scheduled publish rebuilds it.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
