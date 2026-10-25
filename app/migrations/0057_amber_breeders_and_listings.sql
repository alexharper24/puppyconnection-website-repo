-- Amber's answers of 2026-10-25 (Alex pasted them; hs-proposals/puppyconnection/2026-10-25-amber-answers-launch-asks.md).
-- 1. The unassigned Wix listings go to their breeders. Daniel Ramsey and Mervin Fry had no account
--    on staging, so each is added as an imported breeder under their own name, with no contact
--    details invented. Carmen goes to TM Countryside K9 (Melva Burkholder).
-- 2. Brady, Brian, Lanie, Jelly, Peanut Butter and Remy are archived, which takes them off the site
--    and keeps the record; Amber said they will be deleted.
-- 3. The breeders Amber manages are marked as the existing arrangement (workplan A24). Each is
--    matched by business name or by the person named on the breeder's own page in the Wix import,
--    never by phone. Marion Bontrager (Premier Paw Pals) has no account on staging and is left out.
-- Run once on staging after a backup, with ops/d1-apply.mjs, because the moves need
-- PRAGMA defer_foreign_keys. Every write is guarded, so a second run changes nothing.
PRAGMA defer_foreign_keys = true;
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-daniel-ramsey', 'daniel-ramsey@breeders.test', 'approved', '2026-10-25T14:00:00Z', '2026-10-25T14:00:00Z', 'legacy-wix', '2026-10-25T14:00:00Z', '2026-10-25T14:00:00Z', 'migration 0057', 1, '2026-10-25T14:00:00Z', '2026-10-25T14:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, updated_at) VALUES ('seed-daniel-ramsey', 'Daniel Ramsey', 'daniel-ramsey', '2026-10-25T14:00:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.import', 'breeder', 'seed-daniel-ramsey', NULL, json_object('business_name', 'Daniel Ramsey', 'why', 'Amber named them as the breeder of unassigned Wix listings, 2026-10-25')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'breeder.import' AND entity_id = 'seed-daniel-ramsey');
INSERT OR IGNORE INTO breeders (id, email, status, email_verified_at, profile_submitted_at, terms_version, terms_accepted_at, decided_at, decided_by, legacy, created_at, updated_at)
  VALUES ('seed-mervin-fry', 'mervin-fry@breeders.test', 'approved', '2026-10-25T14:00:00Z', '2026-10-25T14:00:00Z', 'legacy-wix', '2026-10-25T14:00:00Z', '2026-10-25T14:00:00Z', 'migration 0057', 1, '2026-10-25T14:00:00Z', '2026-10-25T14:00:00Z');
INSERT OR IGNORE INTO breeder_profiles (breeder_id, business_name, slug, updated_at) VALUES ('seed-mervin-fry', 'Mervin Fry', 'mervin-fry', '2026-10-25T14:00:00Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.import', 'breeder', 'seed-mervin-fry', NULL, json_object('business_name', 'Mervin Fry', 'why', 'Amber named them as the breeder of unassigned Wix listings, 2026-10-25')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'breeder.import' AND entity_id = 'seed-mervin-fry');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-daniel-ramsey', 'breed-golden-retriever');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-daniel-ramsey', 'breed-pomeranian');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-mervin-fry', 'breed-miniature-dachshund');
INSERT OR IGNORE INTO breeder_breeds (breeder_id, breed_id) VALUES ('seed-tmcountrysidek9', 'breed-great-dane');

-- The moves. Each puppy is alone in its litter, so the litter moves with it.
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0004') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0004' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0137') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0137' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0162') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0162' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0188') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0188' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0154') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0154' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0029') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0029' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0259') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0259' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0013') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0013' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0083') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0083' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-daniel-ramsey', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0219') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-daniel-ramsey' WHERE puppy_id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-daniel-ramsey', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0219' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-tmcountrysidek9', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-tmcountrysidek9', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0277') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-tmcountrysidek9' WHERE puppy_id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-tmcountrysidek9', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0277' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-mervin-fry', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0275') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0275' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-mervin-fry', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0285') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0285' AND breeder_id = 'seed-unassigned';
-- group
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.move', 'puppy', id, json_object('breeder_id', breeder_id), json_object('breeder_id', 'seed-mervin-fry', 'why', 'Amber, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';
UPDATE litters SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = (SELECT litter_id FROM puppies WHERE id = 'seed-p-0286') AND breeder_id = 'seed-unassigned';
UPDATE photos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';
UPDATE puppy_videos SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';
UPDATE documents SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';
UPDATE listing_reports SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';
UPDATE checkout_items SET breeder_id = 'seed-mervin-fry' WHERE puppy_id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';
UPDATE puppies SET breeder_id = 'seed-mervin-fry', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0286' AND breeder_id = 'seed-unassigned';

-- Archived on Amber's word that they will be deleted. The record is kept.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.archive', 'puppy', id, json_object('publication_state', publication_state), json_object('publication_state', 'archived', 'why', 'Amber said Brady will be deleted, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0043' AND publication_state <> 'archived';
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0043' AND publication_state <> 'archived';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.archive', 'puppy', id, json_object('publication_state', publication_state), json_object('publication_state', 'archived', 'why', 'Amber said Brian will be deleted, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0046' AND publication_state <> 'archived';
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0046' AND publication_state <> 'archived';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.archive', 'puppy', id, json_object('publication_state', publication_state), json_object('publication_state', 'archived', 'why', 'Amber said Lanie will be deleted, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0159' AND publication_state <> 'archived';
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0159' AND publication_state <> 'archived';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.archive', 'puppy', id, json_object('publication_state', publication_state), json_object('publication_state', 'archived', 'why', 'Amber said Jelly will be deleted, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0131' AND publication_state <> 'archived';
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0131' AND publication_state <> 'archived';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.archive', 'puppy', id, json_object('publication_state', publication_state), json_object('publication_state', 'archived', 'why', 'Amber said Peanut Butter will be deleted, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0212' AND publication_state <> 'archived';
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0212' AND publication_state <> 'archived';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'puppy.archive', 'puppy', id, json_object('publication_state', publication_state), json_object('publication_state', 'archived', 'why', 'Amber said Remy will be deleted, 2026-10-25')
    FROM puppies WHERE id = 'seed-p-0112' AND publication_state <> 'archived';
UPDATE puppies SET publication_state = 'archived', updated_at = '2026-10-25T14:00:00Z', version = version + 1 WHERE id = 'seed-p-0112' AND publication_state <> 'archived';

-- Puppy Connection access for the 16 breeders Amber manages today (existing arrangement, no new consent, Alex 2026-10-24).
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-maplelanepets' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-maplelanepets' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-tmcountrysidek9' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-tmcountrysidek9' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-pawprintacres' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-pawprintacres' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-little-paws-canine' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-little-paws-canine' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-riverdale-paw-pals' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-riverdale-paw-pals' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-cornerstonecavaliers' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-cornerstonecavaliers' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-chainolakescompanions' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-chainolakescompanions' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-mervin-fry' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-mervin-fry' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-willowlanebulldogs' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-willowlanebulldogs' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-heartlandminischnauzers' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-heartlandminischnauzers' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-pine-creek-bulldogs' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-pine-creek-bulldogs' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-duane-borkholder' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-duane-borkholder' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-johnny-miller' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-johnny-miller' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-perfectmatchpoodles' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-perfectmatchpoodles' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-countryview-pets' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-countryview-pets' AND manage_access = 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-25T14:00:00Z', 'system', 'claude', 'breeder.access', 'breeder', id, json_object('manage_access', manage_access), json_object('manage_access', 1, 'how', 'existing_arrangement', 'why', 'Amber listed them as breeders Puppy Connection manages, 2026-10-25')
    FROM breeders WHERE id = 'seed-signature-puppies' AND manage_access = 0;
UPDATE breeders SET manage_access = 1, manage_access_by = 'Amber, recorded by Alex', manage_access_at = '2026-10-25T14:00:00Z', manage_access_how = 'existing_arrangement', updated_at = '2026-10-25T14:00:00Z' WHERE id = 'seed-signature-puppies' AND manage_access = 0;
