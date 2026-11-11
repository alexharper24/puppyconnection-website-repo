-- Alex, 2026-11-10 (docs/batch-2026-11-10-parent-photos.md). Written by app/ops/parent_photo_backfill.py, generated 2026-11-11T01:28:14Z.
-- The size and focus point of each mom and dad photo saved before migrations/0095, so its 4:3 card on a puppy
-- page is cut around the dog. Points come from the dog detector, or by hand on the face where it found no dog.
-- Every write is guarded on the photo it was measured from and on no size stored yet.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-11T01:28:14Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM parent_dogs WHERE id = '01M69FRCYV50T0YNPGK2VNCV6J' AND photo_key = 'parents/seed-sweetpuppypaws/01M69FRCYV50T0YNPGK2VNCV6J-vss1vkpeg1.webp' AND photo_width IS NULL);

-- Sparkle, 1600 by 1280, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1600, 'photo_height', 1280, 'focus_x', 0.511, 'focus_y', 0.435, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M69FRCYV50T0YNPGK2VNCV6J' AND photo_key = 'parents/seed-sweetpuppypaws/01M69FRCYV50T0YNPGK2VNCV6J-vss1vkpeg1.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1600, photo_height = 1280, focus_x = 0.511, focus_y = 0.435 WHERE id = '01M69FRCYV50T0YNPGK2VNCV6J' AND photo_key = 'parents/seed-sweetpuppypaws/01M69FRCYV50T0YNPGK2VNCV6J-vss1vkpeg1.webp' AND photo_width IS NULL;
-- Grizzly, 1226 by 1031, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1226, 'photo_height', 1031, 'focus_x', 0.613, 'focus_y', 0.588, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M69FYNFMWBV8VD86CR7V1H8C' AND photo_key = 'parents/seed-sweetpuppypaws/01M69FYNFMWBV8VD86CR7V1H8C-17a8sb1nvf.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1226, photo_height = 1031, focus_x = 0.613, focus_y = 0.588 WHERE id = '01M69FYNFMWBV8VD86CR7V1H8C' AND photo_key = 'parents/seed-sweetpuppypaws/01M69FYNFMWBV8VD86CR7V1H8C-17a8sb1nvf.webp' AND photo_width IS NULL;
-- Betsy, 1600 by 1066, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1600, 'photo_height', 1066, 'focus_x', 0.657, 'focus_y', 0.431, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M6W8Z9F5EWRSJF3ZS70T970G' AND photo_key = 'parents/01M6W88R2XRQHA8JF7AK2PTZJR/01M6W8Z9F5EWRSJF3ZS70T970G-wr866q4n75.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1600, photo_height = 1066, focus_x = 0.657, focus_y = 0.431 WHERE id = '01M6W8Z9F5EWRSJF3ZS70T970G' AND photo_key = 'parents/01M6W88R2XRQHA8JF7AK2PTZJR/01M6W8Z9F5EWRSJF3ZS70T970G-wr866q4n75.webp' AND photo_width IS NULL;
-- Sailor, 1300 by 855, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1300, 'photo_height', 855, 'focus_x', 0.588, 'focus_y', 0.4, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M6W9696EC8E46DWX1A0JAH20' AND photo_key = 'parents/01M6W88R2XRQHA8JF7AK2PTZJR/01M6W9696EC8E46DWX1A0JAH20-kcaypmzwga.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1300, photo_height = 855, focus_x = 0.588, focus_y = 0.4 WHERE id = '01M6W9696EC8E46DWX1A0JAH20' AND photo_key = 'parents/01M6W88R2XRQHA8JF7AK2PTZJR/01M6W9696EC8E46DWX1A0JAH20-kcaypmzwga.webp' AND photo_width IS NULL;
-- Macy, 1080 by 720, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1080, 'photo_height', 720, 'focus_x', 0.405, 'focus_y', 0.498, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M6WFKXPBXAYFXAFYTNHGJKB8' AND photo_key = 'parents/seed-mervin-fry/01M6WFKXPBXAYFXAFYTNHGJKB8-prdzcvg8fk.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1080, photo_height = 720, focus_x = 0.405, focus_y = 0.498 WHERE id = '01M6WFKXPBXAYFXAFYTNHGJKB8' AND photo_key = 'parents/seed-mervin-fry/01M6WFKXPBXAYFXAFYTNHGJKB8-prdzcvg8fk.webp' AND photo_width IS NULL;
-- Chuckie, 1600 by 1483, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1600, 'photo_height', 1483, 'focus_x', 0.48, 'focus_y', 0.423, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M6WFNWTCSEY7RXCVDG103H27' AND photo_key = 'parents/seed-mervin-fry/01M6WFNWTCSEY7RXCVDG103H27-rwdyqq5yyv.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1600, photo_height = 1483, focus_x = 0.48, focus_y = 0.423 WHERE id = '01M6WFNWTCSEY7RXCVDG103H27' AND photo_key = 'parents/seed-mervin-fry/01M6WFNWTCSEY7RXCVDG103H27-rwdyqq5yyv.webp' AND photo_width IS NULL;
-- Foxy Rose Of The Maples, 1084 by 1228, point by detector
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 1084, 'photo_height', 1228, 'focus_x', 0.502, 'focus_y', 0.453, 'by', 'detector')
    FROM parent_dogs WHERE id = '01M73X6VVG7K3FQMRN8SSSD6YT' AND photo_key = 'parents/01M71GTHKQMY3F52RJ5Z3Y07GN/01M73X6VVG7K3FQMRN8SSSD6YT-d2a60qaq91.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 1084, photo_height = 1228, focus_x = 0.502, focus_y = 0.453 WHERE id = '01M73X6VVG7K3FQMRN8SSSD6YT' AND photo_key = 'parents/01M71GTHKQMY3F52RJ5Z3Y07GN/01M73X6VVG7K3FQMRN8SSSD6YT-d2a60qaq91.webp' AND photo_width IS NULL;
-- Lake Sai's Rogue's Inferno Of The Maples, 682 by 1024, point by hand, on the face
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-11T01:28:14Z', 'system', 'claude', 'parent.photo.focus', 'parent', id, NULL, json_object('photo_width', 682, 'photo_height', 1024, 'focus_x', 0.5, 'focus_y', 0.3, 'by', 'hand, on the face')
    FROM parent_dogs WHERE id = '01M73YR5FY08HKNYPRTFCH3XCN' AND photo_key = 'parents/01M71GTHKQMY3F52RJ5Z3Y07GN/01M73YR5FY08HKNYPRTFCH3XCN-8zt4w1wsn0.webp' AND photo_width IS NULL;
UPDATE parent_dogs SET photo_width = 682, photo_height = 1024, focus_x = 0.5, focus_y = 0.3 WHERE id = '01M73YR5FY08HKNYPRTFCH3XCN' AND photo_key = 'parents/01M71GTHKQMY3F52RJ5Z3Y07GN/01M73YR5FY08HKNYPRTFCH3XCN-8zt4w1wsn0.webp' AND photo_width IS NULL;
