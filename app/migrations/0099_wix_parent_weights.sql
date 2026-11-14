-- Alex, 2026-11-14 (docs/batch-2026-11-14-wix-parent-weights.md). Written by app/ops/wix_parent_weights.py, generated 2026-11-14T14:12:49Z.
-- The mom and dad weights in the Wix product descriptions that the import missed. Each fills an empty weight only,
-- and only where every puppy of the litter gives the same number. Every write is guarded, so a second run changes nothing.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-14T14:12:49Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM litters WHERE id = '01M69RJPY3PA3ETRDF7AC9B4WA' AND mom_weight_lb IS NULL);

-- Andre
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 11.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = '01M69RJPY3PA3ETRDF7AC9B4WA' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 11.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = '01M69RJPY3PA3ETRDF7AC9B4WA' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Andre
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = '01M69RJPY3PA3ETRDF7AC9B4WA' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = '01M69RJPY3PA3ETRDF7AC9B4WA' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Sunny
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-cornerstone-sunny' AND breeder_id = 'seed-marlorhomesteadcompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-cornerstone-sunny' AND breeder_id = 'seed-marlorhomesteadcompanions' AND mom_weight_lb IS NULL;
-- Sunny
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-cornerstone-sunny' AND breeder_id = 'seed-marlorhomesteadcompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-cornerstone-sunny' AND breeder_id = 'seed-marlorhomesteadcompanions' AND dad_weight_lb IS NULL;
-- Chloe, Cooper, Norah
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 65.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-kingdomfamilycompanions-com-july-18-2026' AND breeder_id = 'seed-kingdomfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 65.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-kingdomfamilycompanions-com-july-18-2026' AND breeder_id = 'seed-kingdomfamilycompanions' AND mom_weight_lb IS NULL;
-- Chloe, Cooper, Norah
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 70.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-kingdomfamilycompanions-com-july-18-2026' AND breeder_id = 'seed-kingdomfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 70.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-kingdomfamilycompanions-com-july-18-2026' AND breeder_id = 'seed-kingdomfamilycompanions' AND dad_weight_lb IS NULL;
-- Phineas, Wanda, Whitney
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 95.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-april-1-2026--sweetpuppypaws' AND breeder_id = 'seed-sweetpuppypaws' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 95.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-april-1-2026--sweetpuppypaws' AND breeder_id = 'seed-sweetpuppypaws' AND dad_weight_lb IS NULL;
-- Cassie, Charlie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-1-2026' AND breeder_id = 'seed-kingsfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-1-2026' AND breeder_id = 'seed-kingsfamilycompanions' AND dad_weight_lb IS NULL;
-- Everest, Ridge, Summit
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 30.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-13-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 30.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-13-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND mom_weight_lb IS NULL;
-- Everest, Ridge, Summit
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-13-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-13-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND dad_weight_lb IS NULL;
-- Apple, Barley, Boone, Colt, Cornell, Harvest, Huck, Maple
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 90.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-21-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 90.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-21-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND mom_weight_lb IS NULL;
-- Apple, Barley, Boone, Colt, Cornell, Harvest, Huck, Maple
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 25.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-21-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 25.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-21-2026' AND breeder_id = 'seed-pleasantviewpuppies' AND dad_weight_lb IS NULL;
-- Jillian, Jules
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-august-8-2026' AND breeder_id = 'seed-kingsfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-august-8-2026' AND breeder_id = 'seed-kingsfamilycompanions' AND dad_weight_lb IS NULL;
-- Illius, Kelsie, Matilda, Noelle
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-21-2026' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-21-2026' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Illius, Kelsie, Matilda, Noelle
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 13.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-21-2026' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 13.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-21-2026' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Gavin, Gaylord, Gilman, Graham, Granite
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 11.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-23-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 11.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-23-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND mom_weight_lb IS NULL;
-- Gavin, Gaylord, Gilman, Graham, Granite
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-23-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-23-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND dad_weight_lb IS NULL;
-- Flash, Fox
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 13.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-7-2026' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 13.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-7-2026' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Flash, Fox
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 9.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-7-2026' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 9.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-7-2026' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Keanu, Khalil
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 23.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-8-2026--teapup' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 23.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-8-2026--teapup' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Keanu, Khalil
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 19.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-february-8-2026--teapup' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 19.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-february-8-2026--teapup' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Nattie, Nitro
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-10-2026' AND breeder_id = 'seed-familyaffairpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-10-2026' AND breeder_id = 'seed-familyaffairpuppies' AND mom_weight_lb IS NULL;
-- Nattie, Nitro
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-10-2026' AND breeder_id = 'seed-familyaffairpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-10-2026' AND breeder_id = 'seed-familyaffairpuppies' AND dad_weight_lb IS NULL;
-- Kade, Kase, Kaylin, Kolton, Krystal, Kyla
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-16-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-16-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND mom_weight_lb IS NULL;
-- Kade, Kase, Kaylin, Kolton, Krystal, Kyla
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 8.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-16-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 8.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-16-2025' AND breeder_id = 'seed-rollingacresfarmpuppies' AND dad_weight_lb IS NULL;
-- Joshua
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-18-2026--sunsetpawbabies' AND breeder_id = 'seed-sunsetpawbabies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-18-2026--sunsetpawbabies' AND breeder_id = 'seed-sunsetpawbabies' AND mom_weight_lb IS NULL;
-- Joshua
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 18.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-18-2026--sunsetpawbabies' AND breeder_id = 'seed-sunsetpawbabies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 18.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-18-2026--sunsetpawbabies' AND breeder_id = 'seed-sunsetpawbabies' AND dad_weight_lb IS NULL;
-- Jamie, Jewel
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 17.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-8-2026' AND breeder_id = 'seed-rollingacresfarmpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 17.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-8-2026' AND breeder_id = 'seed-rollingacresfarmpuppies' AND mom_weight_lb IS NULL;
-- Jamie, Jewel
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 17.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-july-8-2026' AND breeder_id = 'seed-rollingacresfarmpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 17.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-july-8-2026' AND breeder_id = 'seed-rollingacresfarmpuppies' AND dad_weight_lb IS NULL;
-- Gertie, Guy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 8.5, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 8.5, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND mom_weight_lb IS NULL;
-- Gertie, Guy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND dad_weight_lb IS NULL;
-- Casey, Chad, Cindy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-19-2026' AND breeder_id = 'seed-doubleyypuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-19-2026' AND breeder_id = 'seed-doubleyypuppies' AND mom_weight_lb IS NULL;
-- Casey, Chad, Cindy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-19-2026' AND breeder_id = 'seed-doubleyypuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-19-2026' AND breeder_id = 'seed-doubleyypuppies' AND dad_weight_lb IS NULL;
-- Biscuit, Bramble, Eclair, Flora, Jasmine, Macaron, Orchid, Trifle
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 25.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-21-2026' AND breeder_id = 'seed-preciouspawscompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 25.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-21-2026' AND breeder_id = 'seed-preciouspawscompanions' AND mom_weight_lb IS NULL;
-- Biscuit, Bramble, Eclair, Flora, Jasmine, Macaron, Orchid, Trifle
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-21-2026' AND breeder_id = 'seed-preciouspawscompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-21-2026' AND breeder_id = 'seed-preciouspawscompanions' AND dad_weight_lb IS NULL;
-- Queenie, Quigley, Quincy, Quinton
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
-- Queenie, Quigley, Quincy, Quinton
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 12.6, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 12.6, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-june-4-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
-- Dandy, Rusty, Tulip
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-1-2026' AND breeder_id = 'seed-doubleyypuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-1-2026' AND breeder_id = 'seed-doubleyypuppies' AND mom_weight_lb IS NULL;
-- Dandy, Rusty, Tulip
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-1-2026' AND breeder_id = 'seed-doubleyypuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-1-2026' AND breeder_id = 'seed-doubleyypuppies' AND dad_weight_lb IS NULL;
-- Kenneth
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 16.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 16.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
-- Kenneth
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 19.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 19.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
-- Parker, Patches, Patience, Pearl
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 110.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions--great-dane' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 110.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-17-2026--cuddlyfamilycompanions--great-dane' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
-- Lamar, Leanna, Lilac, Lily
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 18.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-27-2026' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 18.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-27-2026' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
-- Lamar, Leanna, Lilac, Lily
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 19.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-may-27-2026' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 19.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-may-27-2026' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
-- Marine Rue, Matilda Rose, Piper Lou, Sabrina Jane, Winnie Mae
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 65.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-september-2-2026' AND breeder_id = 'seed-goldpawcanine' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 65.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-september-2-2026' AND breeder_id = 'seed-goldpawcanine' AND mom_weight_lb IS NULL;
-- Marine Rue, Matilda Rose, Piper Lou, Sabrina Jane, Winnie Mae
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 70.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-september-2-2026' AND breeder_id = 'seed-goldpawcanine' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 70.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-september-2-2026' AND breeder_id = 'seed-goldpawcanine' AND dad_weight_lb IS NULL;
-- Ben, Betty, Bonnie, Brian
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-september-3-2026' AND breeder_id = 'seed-pineacrespuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-september-3-2026' AND breeder_id = 'seed-pineacrespuppies' AND mom_weight_lb IS NULL;
-- Ben, Betty, Bonnie, Brian
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 18.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-peacefulpawspuppies-com-september-3-2026' AND breeder_id = 'seed-pineacrespuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 18.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-peacefulpawspuppies-com-september-3-2026' AND breeder_id = 'seed-pineacrespuppies' AND dad_weight_lb IS NULL;
-- Cosette, Leon, Romeo
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 8.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-august-24-2026' AND breeder_id = 'seed-little-paws-canine' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 8.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-august-24-2026' AND breeder_id = 'seed-little-paws-canine' AND mom_weight_lb IS NULL;
-- Cosette, Leon, Romeo
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 5.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-august-24-2026' AND breeder_id = 'seed-little-paws-canine' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 5.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-august-24-2026' AND breeder_id = 'seed-little-paws-canine' AND dad_weight_lb IS NULL;
-- Watson, Whitney, Wiley
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 9.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-14-2026' AND breeder_id = 'seed-perfectmatchpoodles' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 9.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-14-2026' AND breeder_id = 'seed-perfectmatchpoodles' AND mom_weight_lb IS NULL;
-- Watson, Whitney, Wiley
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 13.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-14-2026' AND breeder_id = 'seed-perfectmatchpoodles' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 13.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-14-2026' AND breeder_id = 'seed-perfectmatchpoodles' AND dad_weight_lb IS NULL;
-- Curly, Moe, Ricky, Riley
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-18-2026' AND breeder_id = 'seed-duane-borkholder' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-18-2026' AND breeder_id = 'seed-duane-borkholder' AND mom_weight_lb IS NULL;
-- Curly, Moe, Ricky, Riley
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-18-2026' AND breeder_id = 'seed-duane-borkholder' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-18-2026' AND breeder_id = 'seed-duane-borkholder' AND dad_weight_lb IS NULL;
-- Beatrice, Blake, Brittany
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 160.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 160.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND mom_weight_lb IS NULL;
-- Beatrice, Blake, Brittany
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 140.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 140.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-19-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND dad_weight_lb IS NULL;
-- Celestia, Cherish
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 140.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 140.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND mom_weight_lb IS NULL;
-- Celestia, Cherish
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 150.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 150.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-july-29-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND dad_weight_lb IS NULL;
-- Alexa, Anna, Ash, Atlas
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 21.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres' AND breeder_id = 'seed-pawprintacres' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 21.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres' AND breeder_id = 'seed-pawprintacres' AND mom_weight_lb IS NULL;
-- Alexa, Anna, Ash, Atlas
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres' AND breeder_id = 'seed-pawprintacres' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-june-10-2026--pawprintacres' AND breeder_id = 'seed-pawprintacres' AND dad_weight_lb IS NULL;
-- Delsie, Dream, Duke
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 47.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-june-17-2026' AND breeder_id = 'seed-willowlanebulldogs' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 47.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-june-17-2026' AND breeder_id = 'seed-willowlanebulldogs' AND mom_weight_lb IS NULL;
-- Delsie, Dream, Duke
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 65.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-june-17-2026' AND breeder_id = 'seed-willowlanebulldogs' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 65.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-june-17-2026' AND breeder_id = 'seed-willowlanebulldogs' AND dad_weight_lb IS NULL;
-- Junior, Lucy, Teddy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 6.5, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-march-8-2026' AND breeder_id = 'seed-countryview-pets' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 6.5, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-march-8-2026' AND breeder_id = 'seed-countryview-pets' AND mom_weight_lb IS NULL;
-- Junior, Lucy, Teddy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-march-8-2026' AND breeder_id = 'seed-countryview-pets' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-march-8-2026' AND breeder_id = 'seed-countryview-pets' AND dad_weight_lb IS NULL;
-- Billy, Blossom
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-may-19-2026' AND breeder_id = 'seed-pawprintacres' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-19-2026' AND breeder_id = 'seed-pawprintacres' AND mom_weight_lb IS NULL;
-- Billy, Blossom
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-may-19-2026' AND breeder_id = 'seed-pawprintacres' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-19-2026' AND breeder_id = 'seed-pawprintacres' AND dad_weight_lb IS NULL;
-- Annie, Ari, Asher
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 11.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 11.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND mom_weight_lb IS NULL;
-- Annie, Ari, Asher
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-23-2026--tmcountrysidek9' AND breeder_id = 'seed-tmcountrysidek9' AND dad_weight_lb IS NULL;
-- Grady, Lincoln, Loki
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 18.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies' AND breeder_id = 'seed-wagging-tail-puppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 18.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies' AND breeder_id = 'seed-wagging-tail-puppies' AND mom_weight_lb IS NULL;
-- Grady, Lincoln, Loki
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies' AND breeder_id = 'seed-wagging-tail-puppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-may-24-2026--wagging-tail-puppies' AND breeder_id = 'seed-wagging-tail-puppies' AND dad_weight_lb IS NULL;
-- Mila
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-september-6-2025--riverdale-paw-pals' AND breeder_id = 'seed-riverdale-paw-pals' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-september-6-2025--riverdale-paw-pals' AND breeder_id = 'seed-riverdale-paw-pals' AND mom_weight_lb IS NULL;
-- Mila
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 30.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-responsibledogbreeder-com-september-6-2025--riverdale-paw-pals' AND breeder_id = 'seed-riverdale-paw-pals' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 30.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-responsibledogbreeder-com-september-6-2025--riverdale-paw-pals' AND breeder_id = 'seed-riverdale-paw-pals' AND dad_weight_lb IS NULL;
-- Amore
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-amore-cavapoo' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-amore-cavapoo' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Amore
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-amore-cavapoo' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-amore-cavapoo' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Annabelle
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-annabelle-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-annabelle-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Annabelle
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 17.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-annabelle-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 17.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-annabelle-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Apple Jacks
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-apple-jacks-pembroke-welsh-corgi' AND breeder_id = 'seed-riverdale-paw-pals' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-apple-jacks-pembroke-welsh-corgi' AND breeder_id = 'seed-riverdale-paw-pals' AND mom_weight_lb IS NULL;
-- Apple Jacks
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 30.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-apple-jacks-pembroke-welsh-corgi' AND breeder_id = 'seed-riverdale-paw-pals' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 30.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-apple-jacks-pembroke-welsh-corgi' AND breeder_id = 'seed-riverdale-paw-pals' AND dad_weight_lb IS NULL;
-- Beauregard
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-beauregard-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-beauregard-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Beauregard
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 17.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-beauregard-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 17.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-beauregard-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Coco
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 80.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-coco-labrador-retriever' AND breeder_id = 'seed-sweetpuppypaws' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 80.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-coco-labrador-retriever' AND breeder_id = 'seed-sweetpuppypaws' AND dad_weight_lb IS NULL;
-- Cocoa
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-cocoa-boston-terrier' AND breeder_id = 'seed-kingsfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-cocoa-boston-terrier' AND breeder_id = 'seed-kingsfamilycompanions' AND mom_weight_lb IS NULL;
-- Cocoa
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-cocoa-boston-terrier' AND breeder_id = 'seed-kingsfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-cocoa-boston-terrier' AND breeder_id = 'seed-kingsfamilycompanions' AND dad_weight_lb IS NULL;
-- Damon
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 4.5, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-damon-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 4.5, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-damon-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND mom_weight_lb IS NULL;
-- Damon
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 5.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-damon-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 5.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-damon-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND dad_weight_lb IS NULL;
-- Elowen
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 70.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-elowen-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 70.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-elowen-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND mom_weight_lb IS NULL;
-- Elowen
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 100.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-elowen-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 100.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-elowen-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND dad_weight_lb IS NULL;
-- Emerald
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 21.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-emerald-cavapoo' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 21.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-emerald-cavapoo' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Emerald
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 13.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-emerald-cavapoo' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 13.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-emerald-cavapoo' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Garrett
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 11.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-garrett-miniature-dachshund' AND breeder_id = 'seed-riverdale-paw-pals' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 11.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-garrett-miniature-dachshund' AND breeder_id = 'seed-riverdale-paw-pals' AND mom_weight_lb IS NULL;
-- Garrett
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 11.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-garrett-miniature-dachshund' AND breeder_id = 'seed-riverdale-paw-pals' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 11.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-garrett-miniature-dachshund' AND breeder_id = 'seed-riverdale-paw-pals' AND dad_weight_lb IS NULL;
-- Georgia
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-georgia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-georgia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Georgia
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 17.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-georgia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 17.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-georgia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Jasper
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 23.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-jasper-miniature-schnauzer' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 23.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-jasper-miniature-schnauzer' AND breeder_id = 'seed-teapup' AND mom_weight_lb IS NULL;
-- Jasper
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 21.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-jasper-miniature-schnauzer' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 21.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-jasper-miniature-schnauzer' AND breeder_id = 'seed-teapup' AND dad_weight_lb IS NULL;
-- Jelly
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-jelly-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-jelly-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND mom_weight_lb IS NULL;
-- Jelly
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-jelly-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-jelly-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND dad_weight_lb IS NULL;
-- Josie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-josie-pembroke-welsh-corgi' AND breeder_id = 'seed-tyler-eileen-martin' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-josie-pembroke-welsh-corgi' AND breeder_id = 'seed-tyler-eileen-martin' AND mom_weight_lb IS NULL;
-- Josie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-josie-pembroke-welsh-corgi' AND breeder_id = 'seed-tyler-eileen-martin' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-josie-pembroke-welsh-corgi' AND breeder_id = 'seed-tyler-eileen-martin' AND dad_weight_lb IS NULL;
-- Juliet
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 20.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-juliet-french-bulldog' AND breeder_id = 'seed-johnny-miller' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 20.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-juliet-french-bulldog' AND breeder_id = 'seed-johnny-miller' AND mom_weight_lb IS NULL;
-- Juliet
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 22.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-juliet-french-bulldog' AND breeder_id = 'seed-johnny-miller' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 22.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-juliet-french-bulldog' AND breeder_id = 'seed-johnny-miller' AND dad_weight_lb IS NULL;
-- Lanie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 65.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-lanie-golden-retriever' AND breeder_id = 'seed-unassigned' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 65.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-lanie-golden-retriever' AND breeder_id = 'seed-unassigned' AND mom_weight_lb IS NULL;
-- Lanie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 80.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-lanie-golden-retriever' AND breeder_id = 'seed-unassigned' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 80.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-lanie-golden-retriever' AND breeder_id = 'seed-unassigned' AND dad_weight_lb IS NULL;
-- Lars
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 15.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-lars-cavalier-king-charles-spaniel' AND breeder_id = 'seed-cornerstonecavaliers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 15.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-lars-cavalier-king-charles-spaniel' AND breeder_id = 'seed-cornerstonecavaliers' AND mom_weight_lb IS NULL;
-- Laddie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 8.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-leon-papillon' AND breeder_id = 'seed-maplelanepets' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 8.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-leon-papillon' AND breeder_id = 'seed-maplelanepets' AND mom_weight_lb IS NULL;
-- Laddie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 5.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-leon-papillon' AND breeder_id = 'seed-maplelanepets' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 5.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-leon-papillon' AND breeder_id = 'seed-maplelanepets' AND dad_weight_lb IS NULL;
-- Lexi
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 28.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-lexi-f1b-mini-goldendoodle' AND breeder_id = 'seed-sunsetpawbabies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 28.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-lexi-f1b-mini-goldendoodle' AND breeder_id = 'seed-sunsetpawbabies' AND mom_weight_lb IS NULL;
-- Lexi
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 19.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-lexi-f1b-mini-goldendoodle' AND breeder_id = 'seed-sunsetpawbabies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 19.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-lexi-f1b-mini-goldendoodle' AND breeder_id = 'seed-sunsetpawbabies' AND dad_weight_lb IS NULL;
-- Madonna
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 16.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-madonna-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 16.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-madonna-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND mom_weight_lb IS NULL;
-- Madonna
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 8.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-madonna-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 8.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-madonna-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND dad_weight_lb IS NULL;
-- Magnolia
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-magnolia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-magnolia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Magnolia
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 17.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-magnolia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 17.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-magnolia-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Malcolm
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 70.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-malcolm-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 70.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-malcolm-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND mom_weight_lb IS NULL;
-- Malcolm
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 100.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-malcolm-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 100.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-malcolm-doberman-pinscher' AND breeder_id = 'seed-kingdomfamilycompanions' AND dad_weight_lb IS NULL;
-- Mercy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-mercy-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-mercy-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND mom_weight_lb IS NULL;
-- Mercy
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 5.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-mercy-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 5.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-mercy-cavapoo' AND breeder_id = 'seed-familyaffairpuppies' AND dad_weight_lb IS NULL;
-- Nicole
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 6.8, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-nicole-yorkshire-terrier' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 6.8, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-nicole-yorkshire-terrier' AND breeder_id = 'seed-cuddlyfamilycompanions' AND mom_weight_lb IS NULL;
-- Nicole
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 4.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-nicole-yorkshire-terrier' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 4.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-nicole-yorkshire-terrier' AND breeder_id = 'seed-cuddlyfamilycompanions' AND dad_weight_lb IS NULL;
-- Peanut Butter
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-peanut-butter-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-peanut-butter-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND mom_weight_lb IS NULL;
-- Peanut Butter
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 10.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-peanut-butter-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 10.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-peanut-butter-miniature-dachshund' AND breeder_id = 'seed-unassigned' AND dad_weight_lb IS NULL;
-- Peanut
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 11.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-peanut-miniature-dachshund' AND breeder_id = 'seed-ibarcaninecompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 11.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-peanut-miniature-dachshund' AND breeder_id = 'seed-ibarcaninecompanions' AND mom_weight_lb IS NULL;
-- Qeleigh
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-qeleigh-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-qeleigh-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Qeleigh
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 16.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-qeleigh-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 16.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-qeleigh-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Quartz
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-quartz-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-quartz-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Quartz
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 16.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-quartz-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 16.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-quartz-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Quest
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-quest-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-quest-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Quest
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 16.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-quest-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 16.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-quest-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Quinn
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 12.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-quinn-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 12.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-quinn-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND mom_weight_lb IS NULL;
-- Quinn
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 16.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-quinn-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 16.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-quinn-miniature-schnauzer' AND breeder_id = 'seed-heartlandminischnauzers' AND dad_weight_lb IS NULL;
-- Splendor
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 64.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-splendor-victorian-bulldog' AND breeder_id = 'seed-willowlanebulldogs' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 64.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-splendor-victorian-bulldog' AND breeder_id = 'seed-willowlanebulldogs' AND mom_weight_lb IS NULL;
-- Splendor
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 60.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-splendor-victorian-bulldog' AND breeder_id = 'seed-willowlanebulldogs' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 60.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-splendor-victorian-bulldog' AND breeder_id = 'seed-willowlanebulldogs' AND dad_weight_lb IS NULL;
-- Stephan
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 4.5, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-stephan-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 4.5, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-stephan-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND mom_weight_lb IS NULL;
-- Stephan
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 5.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-stephan-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 5.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-stephan-yorkshire-terrier' AND breeder_id = 'seed-premierpawpals' AND dad_weight_lb IS NULL;
-- Tank
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 9.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-tank-teddy-bear-shihchon' AND breeder_id = 'seed-doubleyypuppies' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 9.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-tank-teddy-bear-shihchon' AND breeder_id = 'seed-doubleyypuppies' AND mom_weight_lb IS NULL;
-- Tank
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 13.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-tank-teddy-bear-shihchon' AND breeder_id = 'seed-doubleyypuppies' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 13.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-tank-teddy-bear-shihchon' AND breeder_id = 'seed-doubleyypuppies' AND dad_weight_lb IS NULL;
-- Wendeline
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 95.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-wendeline-saint-bernard' AND breeder_id = 'seed-pawprintacres' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 95.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-wendeline-saint-bernard' AND breeder_id = 'seed-pawprintacres' AND mom_weight_lb IS NULL;
-- Wendeline
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 130.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-solo-wendeline-saint-bernard' AND breeder_id = 'seed-pawprintacres' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 130.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-solo-wendeline-saint-bernard' AND breeder_id = 'seed-pawprintacres' AND dad_weight_lb IS NULL;
-- George, Guther
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('mom_weight_lb', NULL), json_object('mom_weight_lb', 8.5, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-windingstreamscompanions-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND mom_weight_lb IS NULL;
UPDATE litters SET mom_weight_lb = 8.5, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-windingstreamscompanions-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND mom_weight_lb IS NULL;
-- George, Guther
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-14T14:12:49Z', 'system', 'claude', 'litter.update', 'litter', id, json_object('dad_weight_lb', NULL), json_object('dad_weight_lb', 7.0, 'why', 'Wix description, Mom''s or Dad''s information (Alex, 2026-11-14)') FROM litters WHERE id = 'seed-l-windingstreamscompanions-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND dad_weight_lb IS NULL;
UPDATE litters SET dad_weight_lb = 7.0, updated_at = '2026-11-14T14:12:49Z', version = version + 1 WHERE id = 'seed-l-windingstreamscompanions-com-june-16-2026' AND breeder_id = 'seed-windingstreamscompanions' AND dad_weight_lb IS NULL;
