-- Alex, 2026-11-04 (docs/batch-2026-11-04-photo-focus.md). Written by app/ops/photo_focus_fix.py, generated 2026-11-04T22:35:56Z.
-- Photos of available puppies stored with no size or focus get the size of the copy the site serves and the
-- lib/focus.js detector point, and seven cover photos get a point set by hand on the dog's face for the phone card.
-- Every write is guarded on the value it replaces, so a second run changes nothing.
-- The publish marker goes first, guarded on the first photo still holding its old value.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-04T22:35:56Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE id = '01M6ABTQ3T8X98EGGRACRHEZRS' AND width IS NULL);

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.5, 'focus_y', 0.489, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTQ3T8X98EGGRACRHEZRS' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.5, focus_y = 0.489 WHERE id = '01M6ABTQ3T8X98EGGRACRHEZRS' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.572, 'focus_y', 0.476, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTRG7PMKDYD15S3EYHBMG' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.572, focus_y = 0.476 WHERE id = '01M6ABTRG7PMKDYD15S3EYHBMG' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.373, 'focus_y', 0.468, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTQS3N0FEW36KR1JS4CKY' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.373, focus_y = 0.468 WHERE id = '01M6ABTQS3N0FEW36KR1JS4CKY' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.334, 'focus_y', 0.525, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTNVT9EJDS6BJHTAGB37R' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.334, focus_y = 0.525 WHERE id = '01M6ABTNVT9EJDS6BJHTAGB37R' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.402, 'focus_y', 0.513, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTN5THB7W5HG83Q0F62M7' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.402, focus_y = 0.513 WHERE id = '01M6ABTN5THB7W5HG83Q0F62M7' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.545, 'focus_y', 0.495, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTMD1JPARSEYBW11T9KX0' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.545, focus_y = 0.495 WHERE id = '01M6ABTMD1JPARSEYBW11T9KX0' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.493, 'focus_y', 0.429, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABTKN1SWWV5F5VNE5FNVWR' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.493, focus_y = 0.429 WHERE id = '01M6ABTKN1SWWV5F5VNE5FNVWR' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.46, 'by', 'hand, on the face', 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = 'seed-p-0009-wx-e64e9b194369' AND focus_x = 0.61;
UPDATE photos SET focus_x = 0.46 WHERE id = 'seed-p-0009-wx-e64e9b194369' AND focus_x = 0.61;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.686, 'focus_y', 0.447, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABDQNEGAVBTEES2F0VJY7Z' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.686, focus_y = 0.447 WHERE id = '01M6ABDQNEGAVBTEES2F0VJY7Z' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.614, 'focus_y', 0.512, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABDPT0ZXVJ5V92M61BH081' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.614, focus_y = 0.512 WHERE id = '01M6ABDPT0ZXVJ5V92M61BH081' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.359, 'focus_y', 0.561, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABDP5H1VVMFVZMFNYJWJTP' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.359, focus_y = 0.561 WHERE id = '01M6ABDP5H1VVMFVZMFNYJWJTP' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.409, 'focus_y', 0.467, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABDNDX9K0GG5BE7S3K4AQ6' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.409, focus_y = 0.467 WHERE id = '01M6ABDNDX9K0GG5BE7S3K4AQ6' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.627, 'focus_y', 0.469, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABCRS3CR9RVZ7TFFDDSDXT' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.627, focus_y = 0.469 WHERE id = '01M6ABCRS3CR9RVZ7TFFDDSDXT' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.427, 'focus_y', 0.404, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB7WW43V6JQT80XNYSJ40K' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.427, focus_y = 0.404 WHERE id = '01M6AB7WW43V6JQT80XNYSJ40K' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.622, 'focus_y', 0.436, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB7VBFVGDAGWSZGXCFJPGS' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.622, focus_y = 0.436 WHERE id = '01M6AB7VBFVGDAGWSZGXCFJPGS' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.54, 'focus_y', 0.408, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB7TM4VRKNZGGT58ZRMJ5D' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.54, focus_y = 0.408 WHERE id = '01M6AB7TM4VRKNZGGT58ZRMJ5D' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.389, 'focus_y', 0.485, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB7SXGAAF87EV1QGRVVJBY' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.389, focus_y = 0.485 WHERE id = '01M6AB7SXGAAF87EV1QGRVVJBY' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.619, 'focus_y', 0.481, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB7RQYFJF0H1XQXH4YGXX2' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.619, focus_y = 0.481 WHERE id = '01M6AB7RQYFJF0H1XQXH4YGXX2' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.609, 'focus_y', 0.411, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABB3GQH73V667X2202NK83' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.609, focus_y = 0.411 WHERE id = '01M6ABB3GQH73V667X2202NK83' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.378, 'focus_y', 0.422, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABB6N9ETTKK2GCEG9MMHWE' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.378, focus_y = 0.422 WHERE id = '01M6ABB6N9ETTKK2GCEG9MMHWE' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.534, 'focus_y', 0.48, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABB5WVCVYJZJP61CXCF6TW' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.534, focus_y = 0.48 WHERE id = '01M6ABB5WVCVYJZJP61CXCF6TW' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.605, 'focus_y', 0.412, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABB53FWTXFF46NTXG4BG52' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.605, focus_y = 0.412 WHERE id = '01M6ABB53FWTXFF46NTXG4BG52' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.557, 'focus_y', 0.33, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ABB2Q3DZ56NYMJ01CRWHYK' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.557, focus_y = 0.33 WHERE id = '01M6ABB2Q3DZ56NYMJ01CRWHYK' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.53, 'by', 'hand, on the face', 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = 'seed-p-0049-wx-247104c2a429' AND focus_x = 0.63;
UPDATE photos SET focus_x = 0.53 WHERE id = 'seed-p-0049-wx-247104c2a429' AND focus_x = 0.63;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.45, 'focus_y', 0.445, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9D21A6BF4G6KXHYRQYZ1M' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.45, focus_y = 0.445 WHERE id = '01M6A9D21A6BF4G6KXHYRQYZ1M' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.577, 'focus_y', 0.588, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9D2RXHEY4D2RF3WBD1VV5' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.577, focus_y = 0.588 WHERE id = '01M6A9D2RXHEY4D2RF3WBD1VV5' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.488, 'focus_y', 0.527, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9D0APARCPTB72WB15BPZR' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.488, focus_y = 0.527 WHERE id = '01M6A9D0APARCPTB72WB15BPZR' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.576, 'focus_y', 0.476, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9CZE6W61QR8KS8ECVFQVX' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.576, focus_y = 0.476 WHERE id = '01M6A9CZE6W61QR8KS8ECVFQVX' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.582, 'focus_y', 0.521, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9CYEDSN18HPCCQA2STQBZ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.582, focus_y = 0.521 WHERE id = '01M6A9CYEDSN18HPCCQA2STQBZ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.551, 'focus_y', 0.527, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9CXPM1V9VXDHVJJW2Z8PH' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.551, focus_y = 0.527 WHERE id = '01M6A9CXPM1V9VXDHVJJW2Z8PH' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.464, 'focus_y', 0.401, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9CWBZ2S32BTV7TGV1NTQE' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.464, focus_y = 0.401 WHERE id = '01M6A9CWBZ2S32BTV7TGV1NTQE' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.5, 'focus_y', 0.51, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA6YF8EM92RJAWZJZ4JECZ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.5, focus_y = 0.51 WHERE id = '01M6AA6YF8EM92RJAWZJZ4JECZ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.569, 'focus_y', 0.451, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA74Q4TPQZPHQ9S5BDB0AZ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.569, focus_y = 0.451 WHERE id = '01M6AA74Q4TPQZPHQ9S5BDB0AZ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.578, 'focus_y', 0.486, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA741X6289TAKAMCX4B1G5' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.578, focus_y = 0.486 WHERE id = '01M6AA741X6289TAKAMCX4B1G5' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.466, 'focus_y', 0.454, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA73919GZH1EZSJHZ46AZY' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.466, focus_y = 0.454 WHERE id = '01M6AA73919GZH1EZSJHZ46AZY' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.659, 'focus_y', 0.495, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA72JT4E500K8G8R1RX03N' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.659, focus_y = 0.495 WHERE id = '01M6AA72JT4E500K8G8R1RX03N' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.338, 'focus_y', 0.51, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA70Q4EMNCNYH7037Z98Z2' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.338, focus_y = 0.51 WHERE id = '01M6AA70Q4EMNCNYH7037Z98Z2' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.435, 'focus_y', 0.503, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA6ZZVTBKQ74SQKBW4G5X0' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.435, focus_y = 0.503 WHERE id = '01M6AA6ZZVTBKQ74SQKBW4G5X0' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.498, 'focus_y', 0.47, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA6Z56BRPF3FGTV3V8K87C' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.498, focus_y = 0.47 WHERE id = '01M6AA6Z56BRPF3FGTV3V8K87C' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.692, 'focus_y', 0.441, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA6XP77QJFN0WXPB2YWE8Y' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.692, focus_y = 0.441 WHERE id = '01M6AA6XP77QJFN0WXPB2YWE8Y' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.533, 'focus_y', 0.516, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CV1ZEVHT72H14PBMP7X73F' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.533, focus_y = 0.516 WHERE id = '01M6CV1ZEVHT72H14PBMP7X73F' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.527, 'focus_y', 0.491, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CV20XH7W94T8VA02AGREE1' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.527, focus_y = 0.491 WHERE id = '01M6CV20XH7W94T8VA02AGREE1' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 865, 'focus_x', 0.421, 'focus_y', 0.398, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CV1YRB4XH9H87JQW2RDF3R' AND width IS NULL;
UPDATE photos SET width = 1080, height = 865, aspect = COALESCE(aspect, 1.2486), focus_x = 0.421, focus_y = 0.398 WHERE id = '01M6CV1YRB4XH9H87JQW2RDF3R' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.649, 'focus_y', 0.505, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CV1XNZ1AW4EWBRCRMEZ5TX' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.649, focus_y = 0.505 WHERE id = '01M6CV1XNZ1AW4EWBRCRMEZ5TX' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 801, 'focus_x', 0.412, 'focus_y', 0.371, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CV1WVSXZH5K0Y1NZ796SDH' AND width IS NULL;
UPDATE photos SET width = 1080, height = 801, aspect = COALESCE(aspect, 1.3483), focus_x = 0.412, focus_y = 0.371 WHERE id = '01M6CV1WVSXZH5K0Y1NZ796SDH' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.54, 'focus_y', 0.474, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CV1VYHBQF061SH9JW9MMDS' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.54, focus_y = 0.474 WHERE id = '01M6CV1VYHBQF061SH9JW9MMDS' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.5, 'focus_y', 0.457, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTK0YC1HTK24DM19N5YFZ8' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.5, focus_y = 0.457 WHERE id = '01M6CTK0YC1HTK24DM19N5YFZ8' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.556, 'focus_y', 0.495, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTK38DSVM0FCKC44K99F7E' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.556, focus_y = 0.495 WHERE id = '01M6CTK38DSVM0FCKC44K99F7E' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.498, 'focus_y', 0.399, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTK2GCPT5N0W2WNBJPKPFF' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.498, focus_y = 0.399 WHERE id = '01M6CTK2GCPT5N0W2WNBJPKPFF' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.345, 'focus_y', 0.417, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTK1Q6SM9037X7ZPJJ5J59' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.345, focus_y = 0.417 WHERE id = '01M6CTK1Q6SM9037X7ZPJJ5J59' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.515, 'focus_y', 0.371, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTK068AAB7A2ZZG4SG729Q' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.515, focus_y = 0.371 WHERE id = '01M6CTK068AAB7A2ZZG4SG729Q' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.496, 'focus_y', 0.373, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTJZD8Q5950DC15QY4GBCZ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.496, focus_y = 0.373 WHERE id = '01M6CTJZD8Q5950DC15QY4GBCZ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.381, 'focus_y', 0.415, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAG13K4ZKJMBDMTH9KX02H' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.381, focus_y = 0.415 WHERE id = '01M6AAG13K4ZKJMBDMTH9KX02H' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.48, 'focus_y', 0.427, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAG4XCK4FFDBCB37K2HGST' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.48, focus_y = 0.427 WHERE id = '01M6AAG4XCK4FFDBCB37K2HGST' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.462, 'focus_y', 0.447, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAG44ASVG9MSACTBFQS9T3' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.462, focus_y = 0.447 WHERE id = '01M6AAG44ASVG9MSACTBFQS9T3' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 708, 'focus_x', 0.552, 'focus_y', 0.334, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAG2ZZZGKJGC8KHXGC32KQ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 708, aspect = COALESCE(aspect, 1.5254), focus_x = 0.552, focus_y = 0.334 WHERE id = '01M6AAG2ZZZGKJGC8KHXGC32KQ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.557, 'focus_y', 0.369, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAG1XDYGGFD68Q5W0ZAETX' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.557, focus_y = 0.369 WHERE id = '01M6AAG1XDYGGFD68Q5W0ZAETX' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.573, 'focus_y', 0.415, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAFZWJTFRNDR7PM6879W0F' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.573, focus_y = 0.415 WHERE id = '01M6AAFZWJTFRNDR7PM6879W0F' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.487, 'focus_y', 0.362, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAFYJX4KXD61V0KMA142HD' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.487, focus_y = 0.362 WHERE id = '01M6AAFYJX4KXD61V0KMA142HD' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.644, 'focus_y', 0.449, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAFXNTM4C1NPVZRMZS7VD2' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.644, focus_y = 0.449 WHERE id = '01M6AAFXNTM4C1NPVZRMZS7VD2' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.5, 'focus_y', 0.373, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAFWQHJS3TKCS62TBS4V1D' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.5, focus_y = 0.373 WHERE id = '01M6AAFWQHJS3TKCS62TBS4V1D' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.397, 'focus_y', 0.479, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9F7WXKCZ07QAXPZ51PD37' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.397, focus_y = 0.479 WHERE id = '01M6A9F7WXKCZ07QAXPZ51PD37' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.43, 'focus_y', 0.373, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9FBPEGQBFPHA69FD97067' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.43, focus_y = 0.373 WHERE id = '01M6A9FBPEGQBFPHA69FD97067' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.52, 'focus_y', 0.454, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9FATBZGTGVEBEF7HFBC6D' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.52, focus_y = 0.454 WHERE id = '01M6A9FATBZGTGVEBEF7HFBC6D' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.562, 'focus_y', 0.416, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9FA2PNATSY36BCS5BPAM3' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.562, focus_y = 0.416 WHERE id = '01M6A9FA2PNATSY36BCS5BPAM3' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.556, 'focus_y', 0.479, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9F9BG2EJCMVTK4ANJ7CPK' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.556, focus_y = 0.479 WHERE id = '01M6A9F9BG2EJCMVTK4ANJ7CPK' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.413, 'focus_y', 0.394, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9F8N7QM9PW1WR5XFJGX21' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.413, focus_y = 0.394 WHERE id = '01M6A9F8N7QM9PW1WR5XFJGX21' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.489, 'focus_y', 0.495, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9F74W3JFCHCET0NE0AYNC' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.489, focus_y = 0.495 WHERE id = '01M6A9F74W3JFCHCET0NE0AYNC' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.498, 'focus_y', 0.507, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ACAJ8AX04H7NWV1R72QY0F' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.498, focus_y = 0.507 WHERE id = '01M6ACAJ8AX04H7NWV1R72QY0F' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.519, 'focus_y', 0.536, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ACAHAAK4SP27B0DMJKCRV1' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.519, focus_y = 0.536 WHERE id = '01M6ACAHAAK4SP27B0DMJKCRV1' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.551, 'focus_y', 0.37, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6ACAEZ24RKW841A11V23F56' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.551, focus_y = 0.37 WHERE id = '01M6ACAEZ24RKW841A11V23F56' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.583, 'focus_y', 0.42, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTMY1JJG670MCDQVQ7WNFE' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.583, focus_y = 0.42 WHERE id = '01M6CTMY1JJG670MCDQVQ7WNFE' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.495, 'focus_y', 0.281, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTMZJZZDH05G23CZRHZWT8' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.495, focus_y = 0.281 WHERE id = '01M6CTMZJZZDH05G23CZRHZWT8' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.424, 'focus_y', 0.33, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTMYTKNDMFCANAHFSJD303' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.424, focus_y = 0.33 WHERE id = '01M6CTMYTKNDMFCANAHFSJD303' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.449, 'focus_y', 0.435, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTMX7T490V8QR33RB0TWR6' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.449, focus_y = 0.435 WHERE id = '01M6CTMX7T490V8QR33RB0TWR6' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.434, 'focus_y', 0.46, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTMWE5RGAMFGNHX83YXJM7' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.434, focus_y = 0.46 WHERE id = '01M6CTMWE5RGAMFGNHX83YXJM7' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.304, 'focus_y', 0.405, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6CTMVN8GF2642R2MNQ2AXBH' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.304, focus_y = 0.405 WHERE id = '01M6CTMVN8GF2642R2MNQ2AXBH' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.523, 'focus_y', 0.436, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB55G9XV1B667DJ08KAQWH' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.523, focus_y = 0.436 WHERE id = '01M6AB55G9XV1B667DJ08KAQWH' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.535, 'focus_y', 0.482, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB59NGNTNKEF6KG7J2B00H' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.535, focus_y = 0.482 WHERE id = '01M6AB59NGNTNKEF6KG7J2B00H' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.587, 'focus_y', 0.412, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB590Q9ZD4VNR3VJHWTWP0' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.587, focus_y = 0.412 WHERE id = '01M6AB590Q9ZD4VNR3VJHWTWP0' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.566, 'focus_y', 0.509, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB58AQ83DZ2R0449EVACY9' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.566, focus_y = 0.509 WHERE id = '01M6AB58AQ83DZ2R0449EVACY9' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.628, 'focus_y', 0.526, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB571815R8MWHKJ3X7120Y' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.628, focus_y = 0.526 WHERE id = '01M6AB571815R8MWHKJ3X7120Y' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.597, 'focus_y', 0.533, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB569C104EEXV8YEAX5Y79' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.597, focus_y = 0.533 WHERE id = '01M6AB569C104EEXV8YEAX5Y79' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.524, 'focus_y', 0.452, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB498AJ2YSEJPE9EKW1J73' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.524, focus_y = 0.452 WHERE id = '01M6AB498AJ2YSEJPE9EKW1J73' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.545, 'focus_y', 0.447, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB48GVSRB9X5C69S11NG90' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.545, focus_y = 0.447 WHERE id = '01M6AB48GVSRB9X5C69S11NG90' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.647, 'focus_y', 0.506, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB47TKQMYARTPY301T9BFF' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.647, focus_y = 0.506 WHERE id = '01M6AB47TKQMYARTPY301T9BFF' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.64, 'focus_y', 0.511, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB4737Z368ZN6KJ5F8KMMV' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.64, focus_y = 0.511 WHERE id = '01M6AB4737Z368ZN6KJ5F8KMMV' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.424, 'focus_y', 0.512, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB45E45QXEE8DJKW69FZY1' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.424, focus_y = 0.512 WHERE id = '01M6AB45E45QXEE8DJKW69FZY1' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.584, 'focus_y', 0.448, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB44DDP7TZ5QAP28DX6KSW' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.584, focus_y = 0.448 WHERE id = '01M6AB44DDP7TZ5QAP28DX6KSW' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.583, 'focus_y', 0.472, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AB43F5S4R9ZGDGD01AV576' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.583, focus_y = 0.472 WHERE id = '01M6AB43F5S4R9ZGDGD01AV576' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.574, 'focus_y', 0.518, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8GCJY3S1GPNR5E0VAMKJ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.574, focus_y = 0.518 WHERE id = '01M6AA8GCJY3S1GPNR5E0VAMKJ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.689, 'focus_y', 0.557, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8HP4ARPF5WQ0NF6G4RN9' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.689, focus_y = 0.557 WHERE id = '01M6AA8HP4ARPF5WQ0NF6G4RN9' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.592, 'focus_y', 0.464, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8H05SDY55RTCY84JDVBJ' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.592, focus_y = 0.464 WHERE id = '01M6AA8H05SDY55RTCY84JDVBJ' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.434, 'focus_y', 0.493, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8FQE2N1XX1EE0T6EDXWB' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.434, focus_y = 0.493 WHERE id = '01M6AA8FQE2N1XX1EE0T6EDXWB' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.48, 'focus_y', 0.493, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8EZD0H6YV9K97KD53QRK' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.48, focus_y = 0.493 WHERE id = '01M6AA8EZD0H6YV9K97KD53QRK' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.596, 'focus_y', 0.399, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8E7W53PAB5Q8VPDJ33P5' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.596, focus_y = 0.399 WHERE id = '01M6AA8E7W53PAB5Q8VPDJ33P5' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.505, 'focus_y', 0.471, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8CPJX6DP57EA4ZBA03HR' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.505, focus_y = 0.471 WHERE id = '01M6AA8CPJX6DP57EA4ZBA03HR' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.554, 'focus_y', 0.494, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8BG4N4JW3C37C4XFQ3XR' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.554, focus_y = 0.494 WHERE id = '01M6AA8BG4N4JW3C37C4XFQ3XR' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.476, 'focus_y', 0.489, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA8AP6FGSDKP0F0YYPVPJN' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.476, focus_y = 0.489 WHERE id = '01M6AA8AP6FGSDKP0F0YYPVPJN' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.55, 'by', 'hand, on the face', 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = 'seed-p-0225-wx-c05eca0034ae' AND focus_x = 0.408;
UPDATE photos SET focus_x = 0.55 WHERE id = 'seed-p-0225-wx-c05eca0034ae' AND focus_x = 0.408;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.6, 'by', 'hand, on the face', 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = 'seed-p-0228-img0' AND focus_x = 0.425;
UPDATE photos SET focus_x = 0.6 WHERE id = 'seed-p-0228-img0' AND focus_x = 0.425;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.54, 'by', 'hand, on the face', 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = 'seed-p-0231-wx-bd94e3f53ed6' AND focus_x = 0.373;
UPDATE photos SET focus_x = 0.54 WHERE id = 'seed-p-0231-wx-bd94e3f53ed6' AND focus_x = 0.373;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.477, 'focus_y', 0.418, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9GJPRSJB7KEVYSDW7GMV3' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.477, focus_y = 0.418 WHERE id = '01M6A9GJPRSJB7KEVYSDW7GMV3' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.595, 'focus_y', 0.434, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6A9GHTHMVC523ETA30HPKBB' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.595, focus_y = 0.434 WHERE id = '01M6A9GHTHMVC523ETA30HPKBB' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.focus', 'puppy', puppy_id, json_object('id', id, 'focus_x', focus_x), json_object('id', id, 'focus_x', 0.48, 'by', 'hand, on the face', 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = 'seed-p-0242-wx-27a5eed6ae0f' AND focus_x = 0.528;
UPDATE photos SET focus_x = 0.48 WHERE id = 'seed-p-0242-wx-27a5eed6ae0f' AND focus_x = 0.528;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.523, 'focus_y', 0.451, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9Q6MGTSC98673D6XTMKY' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.523, focus_y = 0.451 WHERE id = '01M6AA9Q6MGTSC98673D6XTMKY' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.67, 'focus_y', 0.499, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9PAG4TFE5DDQHDBZ6EPY' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.67, focus_y = 0.499 WHERE id = '01M6AA9PAG4TFE5DDQHDBZ6EPY' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.423, 'focus_y', 0.52, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9NGHVVERW3V5VWFJAJDB' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.423, focus_y = 0.52 WHERE id = '01M6AA9NGHVVERW3V5VWFJAJDB' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.484, 'focus_y', 0.441, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9MSNXJBSXP9X9ET2FXN7' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.484, focus_y = 0.441 WHERE id = '01M6AA9MSNXJBSXP9X9ET2FXN7' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.443, 'focus_y', 0.555, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9M3WTYJ4DQKH4PVWJC4G' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.443, focus_y = 0.555 WHERE id = '01M6AA9M3WTYJ4DQKH4PVWJC4G' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.484, 'focus_y', 0.301, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9KBCMKFB6KGD02KRWX7C' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.484, focus_y = 0.301 WHERE id = '01M6AA9KBCMKFB6KGD02KRWX7C' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.502, 'focus_y', 0.536, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9JGXBMYE04YNRTNQRB5Z' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.502, focus_y = 0.536 WHERE id = '01M6AA9JGXBMYE04YNRTNQRB5Z' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.52, 'focus_y', 0.535, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9H8J44JEKY7SYV21H48G' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.52, focus_y = 0.535 WHERE id = '01M6AA9H8J44JEKY7SYV21H48G' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.439, 'focus_y', 0.464, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9GDSDH8QBVPV3Q10HGF7' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.439, focus_y = 0.464 WHERE id = '01M6AA9GDSDH8QBVPV3Q10HGF7' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.487, 'focus_y', 0.58, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AA9FPB6E9XCBXXZYVZY4W1' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.487, focus_y = 0.58 WHERE id = '01M6AA9FPB6E9XCBXXZYVZY4W1' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.556, 'focus_y', 0.483, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAEPD4VW7XTMP2AYVAQ7R1' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.556, focus_y = 0.483 WHERE id = '01M6AAEPD4VW7XTMP2AYVAQ7R1' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.486, 'focus_y', 0.377, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAEQ4V11V5A633QRRJ2GQB' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.486, focus_y = 0.377 WHERE id = '01M6AAEQ4V11V5A633QRRJ2GQB' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.505, 'focus_y', 0.507, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAENRJB3F6F2ZFY0GYPGVY' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.505, focus_y = 0.507 WHERE id = '01M6AAENRJB3F6F2ZFY0GYPGVY' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.513, 'focus_y', 0.421, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAEMYWDA1C2K15HDV06QT0' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.513, focus_y = 0.421 WHERE id = '01M6AAEMYWDA1C2K15HDV06QT0' AND width IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-04T22:35:56Z', 'system', 'claude', 'photo.measure', 'puppy', puppy_id, json_object('id', id, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y), json_object('id', id, 'width', 1080, 'height', 720, 'focus_x', 0.521, 'focus_y', 0.441, 'why', 'photo focus, Alex 2026-11-04')
    FROM photos WHERE id = '01M6AAEKVA9ZKMZD18RD9KJZ1N' AND width IS NULL;
UPDATE photos SET width = 1080, height = 720, aspect = COALESCE(aspect, 1.5), focus_x = 0.521, focus_y = 0.441 WHERE id = '01M6AAEKVA9ZKMZD18RD9KJZ1N' AND width IS NULL;
