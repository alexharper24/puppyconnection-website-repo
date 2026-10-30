-- Alex 2026-10-30. The lead photo of Pine Acres Puppies' Lacie (seed-p-0282-img0) is a square photo whose
-- stored focus point (y 0.378) sits above the puppy's face, so the 3:2 breeder card showed the dark backdrop
-- and cut the paws. The face sits at about 0.53, so the card now crops around it. Only the focus point changes,
-- and only while it still holds the detector's value, so a later edit in the admin is left alone and a second
-- run changes nothing. Back up D1 first and confirm the export printed "Downloaded".
UPDATE photos SET focus_y = 0.53 WHERE id = 'seed-p-0282-img0' AND focus_y = 0.378;
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-30T19:29:06Z'), generation = generation + 1
 WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE id = 'seed-p-0282-img0' AND focus_y = 0.53)
   AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'seed-p-0282-img0' AND action = 'photo.focus' AND at = '2026-10-30T19:29:06Z');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-30T19:29:06Z', 'system', 'claude', 'photo.focus', 'photo', 'seed-p-0282-img0', json_object('focus_y', 0.378), json_object('focus_y', 0.53, 'why', 'Alex, 2026-10-30, Pine Acres breeder card crop')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'seed-p-0282-img0' AND action = 'photo.focus')
     AND EXISTS (SELECT 1 FROM photos WHERE id = 'seed-p-0282-img0' AND focus_y = 0.53);
