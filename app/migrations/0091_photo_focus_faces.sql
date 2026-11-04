-- Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md). Written by app/ops/photo_focus_hand.py, generated 2026-11-04T22:58:25Z.
-- Focus points set by hand on the dog's face for the 4:5 phone card. Every write is guarded on the old value.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-04T22:58:25Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE id = 'seed-p-0010-wx-bba871be08d9' AND focus_x = 0.612);

-- Apple Jacks
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.52, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0010-wx-bba871be08d9' AND focus_x = 0.612;
UPDATE photos SET focus_x = 0.52 WHERE id = 'seed-p-0010-wx-bba871be08d9' AND focus_x = 0.612;
-- Atlas
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.62, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M6ABDQNEGAVBTEES2F0VJY7Z' AND focus_x = 0.686;
UPDATE photos SET focus_x = 0.62 WHERE id = '01M6ABDQNEGAVBTEES2F0VJY7Z' AND focus_x = 0.686;
-- Celestia
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.36, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0060-wx-c0a7ff4ecda2' AND focus_x = 0.505;
UPDATE photos SET focus_x = 0.36 WHERE id = 'seed-p-0060-wx-c0a7ff4ecda2' AND focus_x = 0.505;
-- Charlie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.6, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M6M43V57HP4WNCHHAXDG4SCW' AND focus_x = 0.479;
UPDATE photos SET focus_x = 0.6 WHERE id = '01M6M43V57HP4WNCHHAXDG4SCW' AND focus_x = 0.479;
-- Dixon
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.75, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0086-img0' AND focus_x = 0.62;
UPDATE photos SET focus_x = 0.75 WHERE id = 'seed-p-0086-img0' AND focus_x = 0.62;
-- Emerald
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.55, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M6E7HR5J7N60WW3RAFZ36S8H' AND focus_x = 0.391;
UPDATE photos SET focus_x = 0.55 WHERE id = '01M6E7HR5J7N60WW3RAFZ36S8H' AND focus_x = 0.391;
-- Georgia
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.45, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0109-wx-bf53b4b92da4' AND focus_x = 0.46;
UPDATE photos SET focus_x = 0.45 WHERE id = 'seed-p-0109-wx-bf53b4b92da4' AND focus_x = 0.46;
-- Gunner
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.45, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0117-wx-d72ec3ddbf81' AND focus_x = 0.607;
UPDATE photos SET focus_x = 0.45 WHERE id = 'seed-p-0117-wx-d72ec3ddbf81' AND focus_x = 0.607;
-- Jillian
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.3, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M6M45PVEFQ25E5Y6JRK7APSS' AND focus_x = 0.509;
UPDATE photos SET focus_x = 0.3 WHERE id = '01M6M45PVEFQ25E5Y6JRK7APSS' AND focus_x = 0.509;
-- Josie
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.45, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0141-img0' AND focus_x = 0.525;
UPDATE photos SET focus_x = 0.45 WHERE id = 'seed-p-0141-img0' AND focus_x = 0.525;
-- Jules
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.3, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M6M4730DXSGRNSGG0CCR8FRH' AND focus_x = 0.481;
UPDATE photos SET focus_x = 0.3 WHERE id = '01M6M4730DXSGRNSGG0CCR8FRH' AND focus_x = 0.481;
-- Lars
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.52, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0161-wx-d1fb6c84817c' AND focus_x = 0.412;
UPDATE photos SET focus_x = 0.52 WHERE id = 'seed-p-0161-wx-d1fb6c84817c' AND focus_x = 0.412;
-- Leanna
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.38, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0163-wx-ab5ec8f8f84a' AND focus_x = 0.451;
UPDATE photos SET focus_x = 0.38 WHERE id = 'seed-p-0163-wx-ab5ec8f8f84a' AND focus_x = 0.451;
-- Persephone
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.45, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = 'seed-p-0219-wx-558ef98169b0' AND focus_x = 0.625;
UPDATE photos SET focus_x = 0.45 WHERE id = 'seed-p-0219-wx-558ef98169b0' AND focus_x = 0.625;
-- Sabrina Jane
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.55, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M6MB726ZFGME51K11GJ2X02F' AND focus_x = 0.488;
UPDATE photos SET focus_x = 0.55 WHERE id = '01M6MB726ZFGME51K11GJ2X02F' AND focus_x = 0.488;
-- Samuel
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:58:25Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.6, 'by', 'hand, on the face', 'why', 'Alex 2026-11-04, sixteen phone cards cut the face (docs/batch-2026-11-04-photo-focus.md)')
    FROM photos WHERE id = '01M69GJ5X2RM8RKQFZ7Y0PEEFK' AND focus_x = 0.367;
UPDATE photos SET focus_x = 0.6 WHERE id = '01M69GJ5X2RM8RKQFZ7Y0PEEFK' AND focus_x = 0.367;
