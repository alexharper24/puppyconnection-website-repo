-- Alex 2026-10-31. Thirty-nine puppies' card photos cut the puppy's face on a phone (4:5) or a desktop (3:2)
-- card, because the detector's focus point sat on the body. Each focus point now sits on the puppy's face, placed
-- by eye on a gridded copy of the photo and checked in both card shapes before this was written. Only the
-- focus point changes. Plain updates by id, so a second run changes nothing. Back up D1 first and confirm the
-- export printed "Downloaded".
UPDATE photos SET focus_x = 0.52, focus_y = 0.42 WHERE id = 'seed-p-0001-img0';  -- Alexa
UPDATE photos SET focus_x = 0.55, focus_y = 0.38 WHERE id = 'seed-p-0010-img0';  -- Apple Jacks
UPDATE photos SET focus_x = 0.55, focus_y = 0.38 WHERE id = 'seed-p-0014-img0';  -- Ash
UPDATE photos SET focus_x = 0.5, focus_y = 0.33 WHERE id = 'seed-p-0015-img0';  -- Asher
UPDATE photos SET focus_x = 0.53, focus_y = 0.45 WHERE id = 'seed-p-0017-img0';  -- Atlas
UPDATE photos SET focus_x = 0.5, focus_y = 0.7 WHERE id = 'seed-p-0030-img0';  -- Betty
UPDATE photos SET focus_x = 0.5, focus_y = 0.33 WHERE id = 'seed-p-0032-img0';  -- Billy
UPDATE photos SET focus_x = 0.45, focus_y = 0.45 WHERE id = 'seed-p-0051-img0';  -- Bubbles
UPDATE photos SET focus_x = 0.45, focus_y = 0.45 WHERE id = 'seed-p-0060-img0';  -- Celestia
UPDATE photos SET focus_x = 0.5, focus_y = 0.38 WHERE id = 'seed-p-0079-img0';  -- Curly
UPDATE photos SET focus_x = 0.6, focus_y = 0.42 WHERE id = 'seed-p-0095-img0';  -- Everest
UPDATE photos SET focus_x = 0.53, focus_y = 0.45 WHERE id = 'seed-p-0100-img0';  -- Florence
UPDATE photos SET focus_x = 0.45, focus_y = 0.42 WHERE id = 'seed-p-0120-img0';  -- Harvest
UPDATE photos SET focus_x = 0.5, focus_y = 0.42 WHERE id = 'seed-p-0281-img0';  -- Inez
UPDATE photos SET focus_x = 0.4, focus_y = 0.42 WHERE id = 'seed-p-0145-img0';  -- Junior
UPDATE photos SET focus_x = 0.53, focus_y = 0.4 WHERE id = 'seed-p-0154-img0';  -- Kibbles
UPDATE photos SET focus_x = 0.65, focus_y = 0.55 WHERE id = 'seed-p-0282-img0';  -- Lacie
UPDATE photos SET focus_x = 0.48, focus_y = 0.38 WHERE id = 'seed-p-0165-img0';  -- Laddie
UPDATE photos SET focus_x = 0.52, focus_y = 0.45 WHERE id = 'seed-p-0162-img0';  -- Lawrence
UPDATE photos SET focus_x = 0.6, focus_y = 0.48 WHERE id = 'seed-p-0284-img0';  -- Leo
UPDATE photos SET focus_x = 0.38, focus_y = 0.42 WHERE id = 'seed-p-0166-img0';  -- Leon
UPDATE photos SET focus_x = 0.55, focus_y = 0.42 WHERE id = 'seed-p-0173-img0';  -- Lincoln
UPDATE photos SET focus_x = 0.6, focus_y = 0.58 WHERE id = 'seed-p-0288-img0';  -- Marco
UPDATE photos SET focus_x = 0.45, focus_y = 0.45 WHERE id = 'seed-p-0289-img0';  -- Marian
UPDATE photos SET focus_x = 0.55, focus_y = 0.52 WHERE id = 'seed-p-0290-img0';  -- Mary
UPDATE photos SET focus_x = 0.6, focus_y = 0.42 WHERE id = 'seed-p-0291-img0';  -- Maverick
UPDATE photos SET focus_x = 0.5, focus_y = 0.45 WHERE id = 'seed-p-0188-img0';  -- Meg
UPDATE photos SET focus_x = 0.45, focus_y = 0.52 WHERE id = 'seed-p-0195-img0';  -- Moe
UPDATE photos SET focus_x = 0.55, focus_y = 0.42 WHERE id = 'seed-p-0292-img0';  -- Pearl
UPDATE photos SET focus_x = 0.38, focus_y = 0.45 WHERE id = 'seed-p-0293-img0';  -- Puck
UPDATE photos SET focus_x = 0.45, focus_y = 0.42 WHERE id = 'seed-p-0225-img0';  -- Qeleigh
UPDATE photos SET focus_x = 0.5, focus_y = 0.42 WHERE id = 'seed-p-0231-img0';  -- Quinn
UPDATE photos SET focus_x = 0.42, focus_y = 0.42 WHERE id = 'seed-p-0233-img0';  -- Ricky
UPDATE photos SET focus_x = 0.45, focus_y = 0.52 WHERE id = 'seed-p-0241-img0';  -- Sabrina Jane
UPDATE photos SET focus_x = 0.55, focus_y = 0.55 WHERE id = 'seed-p-0295-img0';  -- Sage
UPDATE photos SET focus_x = 0.5, focus_y = 0.35 WHERE id = 'seed-p-0243-img0';  -- Scott
UPDATE photos SET focus_x = 0.55, focus_y = 0.45 WHERE id = 'seed-p-0299-img0';  -- Tommy
UPDATE photos SET focus_x = 0.55, focus_y = 0.45 WHERE id = 'seed-p-0264-img0';  -- Vanilla
UPDATE photos SET focus_x = 0.57, focus_y = 0.55 WHERE id = 'seed-p-0300-img0';  -- Walter
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-31T01:40:17Z'), generation = generation + 1
 WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'photo.focus.batch' AND at = '2026-10-31T01:40:17Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-31T01:40:17Z', 'system', 'claude', 'photo.focus.batch', 'photo', 'card-crops-2026-10-31', NULL, json_object('why', 'Alex, 2026-10-31, card crops', 'count', 39)
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE action = 'photo.focus.batch' AND at = '2026-10-31T01:40:17Z');
