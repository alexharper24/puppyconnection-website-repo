-- Removes Amber's live payment-test kennel, Puppy Connection Test (Alex, 2026-10-29): its profile,
-- litter, puppy, photo row, saved reference, sign-in and session. It follows the steps of the
-- retention job's account removal (lib/retention.js). The two checkout records and the refunded
-- payment stay, because a real live charge went through Stripe and payment records are kept for
-- seven years, and the activity record stays. The breeders row stays, suspended, with its sign-in
-- address changed to a placeholder so info@puppy-connection.com is free again. The stored photo file
-- in R2 is deleted separately. Back up D1 first and confirm the export printed "Downloaded".
-- Re-running changes nothing, because the last guarded steps key on the old address.

UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-29T20:00:00Z'), generation = generation + 1
 WHERE id = 1 AND EXISTS (SELECT 1 FROM breeders WHERE id = '01M5XAWP63WNA5CBSFZNW9CCJM' AND email = 'info@puppy-connection.com');
UPDATE checkout_items SET puppy_name = (SELECT p.name FROM puppies p WHERE p.id = checkout_items.puppy_id)
 WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM' AND puppy_name IS NULL;
DELETE FROM puppy_holds WHERE puppy_id IN (SELECT id FROM puppies WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM');
DELETE FROM puppy_stats WHERE puppy_id IN (SELECT id FROM puppies WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM');
DELETE FROM photos WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM puppy_videos WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM documents WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM puppies WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM litters WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM parent_dogs WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM breeder_breeds WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM breeder_members WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM breeder_references WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM sessions WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM credentials WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM auth_tokens WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM login_tokens WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
DELETE FROM breeder_profiles WHERE breeder_id = '01M5XAWP63WNA5CBSFZNW9CCJM';
UPDATE breeders SET email = 'removed-puppy-connection-test@breeders.test', status = 'suspended',
       status_reason = 'Test kennel removed on 2026-10-29. Its payment records are kept.', updated_at = '2026-10-29T20:00:00Z', version = version + 1
 WHERE id = '01M5XAWP63WNA5CBSFZNW9CCJM' AND email = 'info@puppy-connection.com';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-29T20:00:00Z', 'system', 'claude', 'account.removed', 'breeder', '01M5XAWP63WNA5CBSFZNW9CCJM', NULL,
         json_object('why', 'Alex, 2026-10-29, the live payment-test kennel', 'photos', 1, 'litters', 1, 'puppies', 1, 'kept', 'checkouts, payments and the activity record')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = '01M5XAWP63WNA5CBSFZNW9CCJM' AND action = 'account.removed');
