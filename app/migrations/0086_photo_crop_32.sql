-- Alex, 2026-11-01 (docs/batch-2026-11-02-post-launch.md, n2-crop-preview). The 4:3 and 5:4 photos of listed puppies
-- he approved in the crop preview move to their 3:2 crops, and the seven non-photos (the Bentley stud poster and the
-- Bred with H.E.A.R.T. badges) come off their galleries. Written by app/ops/crop_photos.py from
-- production-2026-11-01-pre0086.sql, generated 2026-11-01T19:17:52Z. The cropped files are already in R2 beside the originals, which stay.
-- Each removed row is kept whole in the audit log, and its files stay in R2, so it can be put back.
-- Every write is guarded on the value it replaces, so a second run changes nothing.
-- The publish marker goes first, guarded on the first photo still holding its old key.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-01T19:17:52Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM photos WHERE id = '01M69H7DF2EGMTESWXJ4B1503Q' AND r2_key = 'uploads/seed-teapup/01M69H7DF2EGMTESWXJ4B1503Q.webp');

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0081-img7';
DELETE FROM photos WHERE id = 'seed-p-0081-img7';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0250-img8';
DELETE FROM photos WHERE id = 'seed-p-0250-img8';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0276-img9';
DELETE FROM photos WHERE id = 'seed-p-0276-img9';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0295-img9';
DELETE FROM photos WHERE id = 'seed-p-0295-img9';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0280-img6';
DELETE FROM photos WHERE id = 'seed-p-0280-img6';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0294-img8';
DELETE FROM photos WHERE id = 'seed-p-0294-img8';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.remove', 'puppy', puppy_id, json_object('id', id, 'breeder_id', breeder_id, 'puppy_id', puppy_id, 'r2_key', r2_key, 'external_url', external_url, 'content_type', content_type, 'bytes', bytes, 'position', position, 'aspect', aspect, 'committed_at', committed_at, 'created_at', created_at, 'width', width, 'height', height, 'focus_x', focus_x, 'focus_y', focus_y, 'quality', quality, 'quality_reasons', quality_reasons, 'quality_checked_at', quality_checked_at, 'quality_note', quality_note), json_object('reason', 'not a photo of the puppy, Alex 2026-11-01')
    FROM photos WHERE id = 'seed-p-0297-img8';
DELETE FROM photos WHERE id = 'seed-p-0297-img8';

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69H7DF2EGMTESWXJ4B1503Q-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4999, 'top_px', 17)
    FROM photos WHERE id = '01M69H7DF2EGMTESWXJ4B1503Q' AND r2_key = 'uploads/seed-teapup/01M69H7DF2EGMTESWXJ4B1503Q.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69H7DF2EGMTESWXJ4B1503Q-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4999, bytes = 485476
  WHERE id = '01M69H7DF2EGMTESWXJ4B1503Q' AND r2_key = 'uploads/seed-teapup/01M69H7DF2EGMTESWXJ4B1503Q.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69H7H9TTNRSHKXJ28ZWVQ9W-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4978, 'top_px', 0)
    FROM photos WHERE id = '01M69H7H9TTNRSHKXJ28ZWVQ9W' AND r2_key = 'uploads/seed-teapup/01M69H7H9TTNRSHKXJ28ZWVQ9W.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69H7H9TTNRSHKXJ28ZWVQ9W-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4978, bytes = 197688
  WHERE id = '01M69H7H9TTNRSHKXJ28ZWVQ9W' AND r2_key = 'uploads/seed-teapup/01M69H7H9TTNRSHKXJ28ZWVQ9W.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69H79S43X1SJP9XT8T6767P-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4997, 'top_px', 62)
    FROM photos WHERE id = '01M69H79S43X1SJP9XT8T6767P' AND r2_key = 'uploads/seed-teapup/01M69H79S43X1SJP9XT8T6767P.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69H79S43X1SJP9XT8T6767P-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4997, bytes = 540952
  WHERE id = '01M69H79S43X1SJP9XT8T6767P' AND r2_key = 'uploads/seed-teapup/01M69H79S43X1SJP9XT8T6767P.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69H7N00W0MSTSKH92B4Q5S3-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4996, 'top_px', 98)
    FROM photos WHERE id = '01M69H7N00W0MSTSKH92B4Q5S3' AND r2_key = 'uploads/seed-teapup/01M69H7N00W0MSTSKH92B4Q5S3.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69H7N00W0MSTSKH92B4Q5S3-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4996, bytes = 264046
  WHERE id = '01M69H7N00W0MSTSKH92B4Q5S3' AND r2_key = 'uploads/seed-teapup/01M69H7N00W0MSTSKH92B4Q5S3.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0005-img0-crop32.jpg', 'width', 3720, 'height', 2480, 'focus_y', 0.5002, 'top_px', 250)
    FROM photos WHERE id = 'seed-p-0005-img0' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0005-img0-crop32.jpg', width = 3720, height = 2480, aspect = 1.5, focus_y = 0.5002, bytes = 2065750
  WHERE id = 'seed-p-0005-img0' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0005-img1-crop32.jpg', 'width', 5001, 'height', 3334, 'focus_y', 0.5, 'top_px', 305)
    FROM photos WHERE id = 'seed-p-0005-img1' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0005-img1-crop32.jpg', width = 5001, height = 3334, aspect = 1.5, focus_y = 0.5, bytes = 3980850
  WHERE id = 'seed-p-0005-img1' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0005-img3-crop32.jpg', 'width', 4277, 'height', 2851, 'focus_y', 0.5001, 'top_px', 76)
    FROM photos WHERE id = 'seed-p-0005-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0005-img3-crop32.jpg', width = 4277, height = 2851, aspect = 1.5002, focus_y = 0.5001, bytes = 3106154
  WHERE id = 'seed-p-0005-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0005-img6-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.5002, 'top_px', 164)
    FROM photos WHERE id = 'seed-p-0005-img6' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0005-img6-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.5002, bytes = 829876
  WHERE id = 'seed-p-0005-img6' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0005-img7-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4998, 'top_px', 57)
    FROM photos WHERE id = 'seed-p-0005-img7' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0005-img7-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4998, bytes = 726087
  WHERE id = 'seed-p-0005-img7' AND r2_key = 'uploads/seed-teapup/seed-p-0005-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-chainolakescompanions/seed-p-0009-img7-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4972, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0009-img7' AND r2_key = 'uploads/seed-chainolakescompanions/seed-p-0009-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-chainolakescompanions/seed-p-0009-img7-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4972, bytes = 1299661
  WHERE id = 'seed-p-0009-img7' AND r2_key = 'uploads/seed-chainolakescompanions/seed-p-0009-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-pleasantviewpuppies/seed-p-0011-wx-2207fdc94a32-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4806, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0011-wx-2207fdc94a32' AND r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0011-wx-2207fdc94a32.jpg';
UPDATE photos SET r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0011-wx-2207fdc94a32-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4806, bytes = 210262
  WHERE id = 'seed-p-0011-wx-2207fdc94a32' AND r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0011-wx-2207fdc94a32.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-riverdale-paw-pals/seed-p-0010-wx-bba871be08d9-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4061, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0010-wx-bba871be08d9' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0010-wx-bba871be08d9.jpg';
UPDATE photos SET r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0010-wx-bba871be08d9-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4061, bytes = 518445
  WHERE id = 'seed-p-0010-wx-bba871be08d9' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0010-wx-bba871be08d9.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-chainolakescompanions/seed-p-0018-img7-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4972, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0018-img7' AND r2_key = 'uploads/seed-chainolakescompanions/seed-p-0018-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-chainolakescompanions/seed-p-0018-img7-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4972, bytes = 1299661
  WHERE id = 'seed-p-0018-img7' AND r2_key = 'uploads/seed-chainolakescompanions/seed-p-0018-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0023-img8-crop32.jpg', 'width', 2632, 'height', 1755, 'focus_y', 0.4209, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0023-img8' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0023-img8.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0023-img8-crop32.jpg', width = 2632, height = 1755, aspect = 1.4997, focus_y = 0.4209, bytes = 554732
  WHERE id = 'seed-p-0023-img8' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0023-img8.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0023-img9-crop32.jpg', 'width', 2449, 'height', 1633, 'focus_y', 0.5003, 'top_px', 101)
    FROM photos WHERE id = 'seed-p-0023-img9' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0023-img9.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0023-img9-crop32.jpg', width = 2449, height = 1633, aspect = 1.4997, focus_y = 0.5003, bytes = 994363
  WHERE id = 'seed-p-0023-img9' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0023-img9.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-johnny-miller/seed-p-0026-wx-b59d758177e5-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.3631, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0026-wx-b59d758177e5' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0026-wx-b59d758177e5.jpg';
UPDATE photos SET r2_key = 'uploads/seed-johnny-miller/seed-p-0026-wx-b59d758177e5-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.3631, bytes = 143840
  WHERE id = 'seed-p-0026-wx-b59d758177e5' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0026-wx-b59d758177e5.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0029-img6-crop32.jpg', 'width', 1677, 'height', 1118, 'focus_y', 0.419, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0029-img6' AND r2_key = 'uploads/seed-unassigned/seed-p-0029-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0029-img6-crop32.jpg', width = 1677, height = 1118, aspect = 1.5, focus_y = 0.419, bytes = 285230
  WHERE id = 'seed-p-0029-img6' AND r2_key = 'uploads/seed-unassigned/seed-p-0029-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0029-wx-6b2f5ee8c843-crop32.jpg', 'width', 4344, 'height', 2896, 'focus_y', 0.4477, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0029-wx-6b2f5ee8c843' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0029-wx-6b2f5ee8c843.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0029-wx-6b2f5ee8c843-crop32.jpg', width = 4344, height = 2896, aspect = 1.5, focus_y = 0.4477, bytes = 1798369
  WHERE id = 'seed-p-0029-wx-6b2f5ee8c843' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0029-wx-6b2f5ee8c843.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-pawprintacres/seed-p-0032-img9-crop32.jpg', 'width', 4615, 'height', 3077, 'focus_y', 0.5, 'top_px', 45)
    FROM photos WHERE id = 'seed-p-0032-img9' AND r2_key = 'uploads/seed-pawprintacres/seed-p-0032-img9.jpg';
UPDATE photos SET r2_key = 'uploads/seed-pawprintacres/seed-p-0032-img9-crop32.jpg', width = 4615, height = 3077, aspect = 1.4998, focus_y = 0.5, bytes = 2764914
  WHERE id = 'seed-p-0032-img9' AND r2_key = 'uploads/seed-pawprintacres/seed-p-0032-img9.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-signature-puppies/seed-p-0033-img6-crop32.jpg', 'width', 2424, 'height', 1616, 'focus_y', 0.4999, 'top_px', 45)
    FROM photos WHERE id = 'seed-p-0033-img6' AND r2_key = 'uploads/seed-signature-puppies/seed-p-0033-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-signature-puppies/seed-p-0033-img6-crop32.jpg', width = 2424, height = 1616, aspect = 1.5, focus_y = 0.4999, bytes = 1130777
  WHERE id = 'seed-p-0033-img6' AND r2_key = 'uploads/seed-signature-puppies/seed-p-0033-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-260c31493dd1-crop32.jpg', 'width', 2632, 'height', 1755, 'focus_y', 0.4209, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0037-wx-260c31493dd1' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-260c31493dd1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-260c31493dd1-crop32.jpg', width = 2632, height = 1755, aspect = 1.4997, focus_y = 0.4209, bytes = 554732
  WHERE id = 'seed-p-0037-wx-260c31493dd1' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-260c31493dd1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-5ce80aa6d1b0-crop32.jpg', 'width', 2449, 'height', 1633, 'focus_y', 0.5003, 'top_px', 101)
    FROM photos WHERE id = 'seed-p-0037-wx-5ce80aa6d1b0' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-5ce80aa6d1b0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-5ce80aa6d1b0-crop32.jpg', width = 2449, height = 1633, aspect = 1.4997, focus_y = 0.5003, bytes = 994363
  WHERE id = 'seed-p-0037-wx-5ce80aa6d1b0' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0037-wx-5ce80aa6d1b0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-signature-puppies/seed-p-0040-img6-crop32.jpg', 'width', 2424, 'height', 1616, 'focus_y', 0.4999, 'top_px', 45)
    FROM photos WHERE id = 'seed-p-0040-img6' AND r2_key = 'uploads/seed-signature-puppies/seed-p-0040-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-signature-puppies/seed-p-0040-img6-crop32.jpg', width = 2424, height = 1616, aspect = 1.5, focus_y = 0.4999, bytes = 1130777
  WHERE id = 'seed-p-0040-img6' AND r2_key = 'uploads/seed-signature-puppies/seed-p-0040-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0049-img9-crop32.jpg', 'width', 2449, 'height', 1633, 'focus_y', 0.5003, 'top_px', 101)
    FROM photos WHERE id = 'seed-p-0049-img9' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0049-img9.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0049-img9-crop32.jpg', width = 2449, height = 1633, aspect = 1.4997, focus_y = 0.5003, bytes = 994363
  WHERE id = 'seed-p-0049-img9' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0049-img9.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0049-wx-260c31493dd1-crop32.jpg', 'width', 2632, 'height', 1755, 'focus_y', 0.4209, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0049-wx-260c31493dd1' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0049-wx-260c31493dd1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0049-wx-260c31493dd1-crop32.jpg', width = 2632, height = 1755, aspect = 1.4997, focus_y = 0.4209, bytes = 554732
  WHERE id = 'seed-p-0049-wx-260c31493dd1' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0049-wx-260c31493dd1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-blessyourpawspuppies/seed-p-0054-wx-fed16e68d3ea-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4872, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0054-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0054-wx-fed16e68d3ea.jpg';
UPDATE photos SET r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0054-wx-fed16e68d3ea-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4872, bytes = 343916
  WHERE id = 'seed-p-0054-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0054-wx-fed16e68d3ea.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0277-img8-crop32.jpg', 'width', 2477, 'height', 1651, 'focus_y', 0.4998, 'top_px', 149)
    FROM photos WHERE id = 'seed-p-0277-img8' AND r2_key = 'uploads/seed-unassigned/seed-p-0277-img8.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0277-img8-crop32.jpg', width = 2477, height = 1651, aspect = 1.5003, focus_y = 0.4998, bytes = 675461
  WHERE id = 'seed-p-0277-img8' AND r2_key = 'uploads/seed-unassigned/seed-p-0277-img8.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-johnny-miller/seed-p-0057-wx-fae1d87939dc-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4709, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0057-wx-fae1d87939dc' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0057-wx-fae1d87939dc.jpg';
UPDATE photos SET r2_key = 'uploads/seed-johnny-miller/seed-p-0057-wx-fae1d87939dc-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4709, bytes = 147572
  WHERE id = 'seed-p-0057-wx-fae1d87939dc' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0057-wx-fae1d87939dc.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-johnny-miller/seed-p-0057-wx-40c3d3c0521c-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.399, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0057-wx-40c3d3c0521c' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0057-wx-40c3d3c0521c.jpg';
UPDATE photos SET r2_key = 'uploads/seed-johnny-miller/seed-p-0057-wx-40c3d3c0521c-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.399, bytes = 210027
  WHERE id = 'seed-p-0057-wx-40c3d3c0521c' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0057-wx-40c3d3c0521c.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tmcountrysidek9/seed-p-0060-wx-260c31493dd1-crop32.jpg', 'width', 2632, 'height', 1755, 'focus_y', 0.4209, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0060-wx-260c31493dd1' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0060-wx-260c31493dd1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0060-wx-260c31493dd1-crop32.jpg', width = 2632, height = 1755, aspect = 1.4997, focus_y = 0.4209, bytes = 554732
  WHERE id = 'seed-p-0060-wx-260c31493dd1' AND r2_key = 'uploads/seed-tmcountrysidek9/seed-p-0060-wx-260c31493dd1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-little-paws-canine/seed-p-0077-img4-crop32.jpg', 'width', 2593, 'height', 1729, 'focus_y', 0.4717, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0077-img4' AND r2_key = 'uploads/seed-little-paws-canine/seed-p-0077-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-little-paws-canine/seed-p-0077-img4-crop32.jpg', width = 2593, height = 1729, aspect = 1.4997, focus_y = 0.4717, bytes = 235802
  WHERE id = 'seed-p-0077-img4' AND r2_key = 'uploads/seed-little-paws-canine/seed-p-0077-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img0-crop32.jpg', 'width', 2036, 'height', 1357, 'focus_y', 0.311, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0086-img0' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img0-crop32.jpg', width = 2036, height = 1357, aspect = 1.5004, focus_y = 0.311, bytes = 916652
  WHERE id = 'seed-p-0086-img0' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img1-crop32.jpg', 'width', 1994, 'height', 1329, 'focus_y', 0.5002, 'top_px', 73)
    FROM photos WHERE id = 'seed-p-0086-img1' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img1-crop32.jpg', width = 1994, height = 1329, aspect = 1.5004, focus_y = 0.5002, bytes = 839497
  WHERE id = 'seed-p-0086-img1' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0086-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0094-img0-crop32.jpg', 'width', 4113, 'height', 2742, 'focus_y', 0.4999, 'top_px', 11)
    FROM photos WHERE id = 'seed-p-0094-img0' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0094-img0-crop32.jpg', width = 4113, height = 2742, aspect = 1.5, focus_y = 0.4999, bytes = 2314437
  WHERE id = 'seed-p-0094-img0' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0094-img1-crop32.jpg', 'width', 5001, 'height', 3334, 'focus_y', 0.5, 'top_px', 121)
    FROM photos WHERE id = 'seed-p-0094-img1' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0094-img1-crop32.jpg', width = 5001, height = 3334, aspect = 1.5, focus_y = 0.5, bytes = 3061134
  WHERE id = 'seed-p-0094-img1' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0094-img2-crop32.jpg', 'width', 3970, 'height', 2647, 'focus_y', 0.4999, 'top_px', 277)
    FROM photos WHERE id = 'seed-p-0094-img2' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0094-img2-crop32.jpg', width = 3970, height = 2647, aspect = 1.4998, focus_y = 0.4999, bytes = 2550344
  WHERE id = 'seed-p-0094-img2' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0094-img3-crop32.jpg', 'width', 4344, 'height', 2896, 'focus_y', 0.492, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0094-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0094-img3-crop32.jpg', width = 4344, height = 2896, aspect = 1.5, focus_y = 0.492, bytes = 1753112
  WHERE id = 'seed-p-0094-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0094-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69HEN591MTC2T2YPQAH6GPB-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4559, 'top_px', 0)
    FROM photos WHERE id = '01M69HEN591MTC2T2YPQAH6GPB' AND r2_key = 'uploads/seed-teapup/01M69HEN591MTC2T2YPQAH6GPB.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69HEN591MTC2T2YPQAH6GPB-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4559, bytes = 309310
  WHERE id = '01M69HEN591MTC2T2YPQAH6GPB' AND r2_key = 'uploads/seed-teapup/01M69HEN591MTC2T2YPQAH6GPB.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69HEGQ387MGT1H73TTX45TV-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.5001, 'top_px', 77)
    FROM photos WHERE id = '01M69HEGQ387MGT1H73TTX45TV' AND r2_key = 'uploads/seed-teapup/01M69HEGQ387MGT1H73TTX45TV.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69HEGQ387MGT1H73TTX45TV-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.5001, bytes = 480866
  WHERE id = '01M69HEGQ387MGT1H73TTX45TV' AND r2_key = 'uploads/seed-teapup/01M69HEGQ387MGT1H73TTX45TV.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69HE6XRKW11KM3WF9NRRZSE-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.5004, 'top_px', 5)
    FROM photos WHERE id = '01M69HE6XRKW11KM3WF9NRRZSE' AND r2_key = 'uploads/seed-teapup/01M69HE6XRKW11KM3WF9NRRZSE.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69HE6XRKW11KM3WF9NRRZSE-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.5004, bytes = 478388
  WHERE id = '01M69HE6XRKW11KM3WF9NRRZSE' AND r2_key = 'uploads/seed-teapup/01M69HE6XRKW11KM3WF9NRRZSE.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/01M69HECFQ2ZZZ7A207KA1ZZ4X-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4996, 'top_px', 57)
    FROM photos WHERE id = '01M69HECFQ2ZZZ7A207KA1ZZ4X' AND r2_key = 'uploads/seed-teapup/01M69HECFQ2ZZZ7A207KA1ZZ4X.webp';
UPDATE photos SET r2_key = 'uploads/seed-teapup/01M69HECFQ2ZZZ7A207KA1ZZ4X-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4996, bytes = 517348
  WHERE id = '01M69HECFQ2ZZZ7A207KA1ZZ4X' AND r2_key = 'uploads/seed-teapup/01M69HECFQ2ZZZ7A207KA1ZZ4X.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0101-img2-crop32.jpg', 'width', 5001, 'height', 3334, 'focus_y', 0.5, 'top_px', 61)
    FROM photos WHERE id = 'seed-p-0101-img2' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0101-img2-crop32.jpg', width = 5001, height = 3334, aspect = 1.5, focus_y = 0.5, bytes = 4051287
  WHERE id = 'seed-p-0101-img2' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0101-img3-crop32.jpg', 'width', 4256, 'height', 2837, 'focus_y', 0.4999, 'top_px', 454)
    FROM photos WHERE id = 'seed-p-0101-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0101-img3-crop32.jpg', width = 4256, height = 2837, aspect = 1.5002, focus_y = 0.4999, bytes = 2517355
  WHERE id = 'seed-p-0101-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0101-img4-crop32.jpg', 'width', 5001, 'height', 3334, 'focus_y', 0.4943, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0101-img4' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0101-img4-crop32.jpg', width = 5001, height = 3334, aspect = 1.5, focus_y = 0.4943, bytes = 3011060
  WHERE id = 'seed-p-0101-img4' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0101-img7-crop32.jpg', 'width', 4255, 'height', 2837, 'focus_y', 0.5001, 'top_px', 201)
    FROM photos WHERE id = 'seed-p-0101-img7' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0101-img7-crop32.jpg', width = 4255, height = 2837, aspect = 1.4998, focus_y = 0.5001, bytes = 3033621
  WHERE id = 'seed-p-0101-img7' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0101-img8-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.5, 'top_px', 77)
    FROM photos WHERE id = 'seed-p-0101-img8' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img8.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0101-img8-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.5, bytes = 548132
  WHERE id = 'seed-p-0101-img8' AND r2_key = 'uploads/seed-teapup/seed-p-0101-img8.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-blessyourpawspuppies/seed-p-0121-wx-fed16e68d3ea-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4872, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0121-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0121-wx-fed16e68d3ea.jpg';
UPDATE photos SET r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0121-wx-fed16e68d3ea-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4872, bytes = 343916
  WHERE id = 'seed-p-0121-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0121-wx-fed16e68d3ea.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-bb0a64b3114e-crop32.jpg', 'width', 2408, 'height', 1605, 'focus_y', 0.5003, 'top_px', 31)
    FROM photos WHERE id = 'seed-p-0124-wx-bb0a64b3114e' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-bb0a64b3114e.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-bb0a64b3114e-crop32.jpg', width = 2408, height = 1605, aspect = 1.5003, focus_y = 0.5003, bytes = 618985
  WHERE id = 'seed-p-0124-wx-bb0a64b3114e' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-bb0a64b3114e.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-dba9c84db86b-crop32.jpg', 'width', 2283, 'height', 1522, 'focus_y', 0.5002, 'top_px', 99)
    FROM photos WHERE id = 'seed-p-0124-wx-dba9c84db86b' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-dba9c84db86b.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-dba9c84db86b-crop32.jpg', width = 2283, height = 1522, aspect = 1.5, focus_y = 0.5002, bytes = 514064
  WHERE id = 'seed-p-0124-wx-dba9c84db86b' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0124-wx-dba9c84db86b.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-c764ff53ceaa-crop32.jpg', 'width', 2251, 'height', 1501, 'focus_y', 0.5016, 'top_px', 251)
    FROM photos WHERE id = 'seed-p-0128-wx-c764ff53ceaa' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-c764ff53ceaa.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-c764ff53ceaa-crop32.jpg', width = 2251, height = 1501, aspect = 1.4997, focus_y = 0.5016, bytes = 881957
  WHERE id = 'seed-p-0128-wx-c764ff53ceaa' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-c764ff53ceaa.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-601fa34ade02-crop32.jpg', 'width', 2209, 'height', 1473, 'focus_y', 0.5001, 'top_px', 276)
    FROM photos WHERE id = 'seed-p-0128-wx-601fa34ade02' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-601fa34ade02.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-601fa34ade02-crop32.jpg', width = 2209, height = 1473, aspect = 1.4997, focus_y = 0.5001, bytes = 754512
  WHERE id = 'seed-p-0128-wx-601fa34ade02' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0128-wx-601fa34ade02.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0134-wx-0b0b931dd7fa-crop32.jpg', 'width', 2211, 'height', 1474, 'focus_y', 0.5001, 'top_px', 95)
    FROM photos WHERE id = 'seed-p-0134-wx-0b0b931dd7fa' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0134-wx-0b0b931dd7fa.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0134-wx-0b0b931dd7fa-crop32.jpg', width = 2211, height = 1474, aspect = 1.5, focus_y = 0.5001, bytes = 653675
  WHERE id = 'seed-p-0134-wx-0b0b931dd7fa' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0134-wx-0b0b931dd7fa.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0137-wx-3f1bc078598b-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4271, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0137-wx-3f1bc078598b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-3f1bc078598b.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-3f1bc078598b-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4271, bytes = 195715
  WHERE id = 'seed-p-0137-wx-3f1bc078598b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-3f1bc078598b.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0137-wx-72fa4a272f39-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4847, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0137-wx-72fa4a272f39' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-72fa4a272f39.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-72fa4a272f39-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4847, bytes = 157732
  WHERE id = 'seed-p-0137-wx-72fa4a272f39' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-72fa4a272f39.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0137-wx-cb4a8ab35a3b-crop32.jpg', 'width', 2055, 'height', 1370, 'focus_y', 0.3823, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0137-wx-cb4a8ab35a3b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-cb4a8ab35a3b.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-cb4a8ab35a3b-crop32.jpg', width = 2055, height = 1370, aspect = 1.5, focus_y = 0.3823, bytes = 318381
  WHERE id = 'seed-p-0137-wx-cb4a8ab35a3b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0137-wx-cb4a8ab35a3b.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-blessyourpawspuppies/seed-p-0138-wx-fed16e68d3ea-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4872, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0138-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0138-wx-fed16e68d3ea.jpg';
UPDATE photos SET r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0138-wx-fed16e68d3ea-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4872, bytes = 343916
  WHERE id = 'seed-p-0138-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0138-wx-fed16e68d3ea.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-blessyourpawspuppies/seed-p-0140-wx-fed16e68d3ea-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4872, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0140-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0140-wx-fed16e68d3ea.jpg';
UPDATE photos SET r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0140-wx-fed16e68d3ea-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4872, bytes = 343916
  WHERE id = 'seed-p-0140-wx-fed16e68d3ea' AND r2_key = 'uploads/seed-blessyourpawspuppies/seed-p-0140-wx-fed16e68d3ea.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tyler-eileen-martin/seed-p-0141-img0-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.5001, 'top_px', 35)
    FROM photos WHERE id = 'seed-p-0141-img0' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img0-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.5001, bytes = 155432
  WHERE id = 'seed-p-0141-img0' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tyler-eileen-martin/seed-p-0141-img2-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4934, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0141-img2' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img2-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4934, bytes = 171062
  WHERE id = 'seed-p-0141-img2' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tyler-eileen-martin/seed-p-0141-img3-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.312, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0141-img3' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img3-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.312, bytes = 157760
  WHERE id = 'seed-p-0141-img3' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-tyler-eileen-martin/seed-p-0141-img6-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.5004, 'top_px', 38)
    FROM photos WHERE id = 'seed-p-0141-img6' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img6-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.5004, bytes = 133951
  WHERE id = 'seed-p-0141-img6' AND r2_key = 'uploads/seed-tyler-eileen-martin/seed-p-0141-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-wx-18445bce6e0e-crop32.jpg', 'width', 2304, 'height', 1536, 'focus_y', 0.4998, 'top_px', 117)
    FROM photos WHERE id = 'seed-p-0146-wx-18445bce6e0e' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-wx-18445bce6e0e.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-wx-18445bce6e0e-crop32.jpg', width = 2304, height = 1536, aspect = 1.5, focus_y = 0.4998, bytes = 661491
  WHERE id = 'seed-p-0146-wx-18445bce6e0e' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-wx-18445bce6e0e.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-img4-crop32.jpg', 'width', 2125, 'height', 1417, 'focus_y', 0.4889, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0146-img4' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-img4-crop32.jpg', width = 2125, height = 1417, aspect = 1.4996, focus_y = 0.4889, bytes = 95768
  WHERE id = 'seed-p-0146-img4' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0146-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0148-img4-crop32.jpg', 'width', 2125, 'height', 1417, 'focus_y', 0.4889, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0148-img4' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0148-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0148-img4-crop32.jpg', width = 2125, height = 1417, aspect = 1.4996, focus_y = 0.4889, bytes = 95768
  WHERE id = 'seed-p-0148-img4' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0148-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img0-crop32.jpg', 'width', 3608, 'height', 2405, 'focus_y', 0.5, 'top_px', 53)
    FROM photos WHERE id = 'seed-p-0150-img0' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img0-crop32.jpg', width = 3608, height = 2405, aspect = 1.5002, focus_y = 0.5, bytes = 1858650
  WHERE id = 'seed-p-0150-img0' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img1-crop32.jpg', 'width', 3875, 'height', 2583, 'focus_y', 0.5002, 'top_px', 273)
    FROM photos WHERE id = 'seed-p-0150-img1' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img1-crop32.jpg', width = 3875, height = 2583, aspect = 1.5002, focus_y = 0.5002, bytes = 2096989
  WHERE id = 'seed-p-0150-img1' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img2-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.5001, 'top_px', 23)
    FROM photos WHERE id = 'seed-p-0150-img2' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img2-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.5001, bytes = 2405942
  WHERE id = 'seed-p-0150-img2' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img9-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.5, 'top_px', 101)
    FROM photos WHERE id = 'seed-p-0150-img9' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img9.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img9-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.5, bytes = 908249
  WHERE id = 'seed-p-0150-img9' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img9.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img3-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4997, 'top_px', 186)
    FROM photos WHERE id = 'seed-p-0150-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img3-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4997, bytes = 375230
  WHERE id = 'seed-p-0150-img3' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img4-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4908, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0150-img4' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img4-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4908, bytes = 404112
  WHERE id = 'seed-p-0150-img4' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img5-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4956, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0150-img5' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img5.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img5-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4956, bytes = 485998
  WHERE id = 'seed-p-0150-img5' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img5.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img6-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4998, 'top_px', 27)
    FROM photos WHERE id = 'seed-p-0150-img6' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img6-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4998, bytes = 444413
  WHERE id = 'seed-p-0150-img6' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img7-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4998, 'top_px', 113)
    FROM photos WHERE id = 'seed-p-0150-img7' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img7-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4998, bytes = 1151594
  WHERE id = 'seed-p-0150-img7' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-teapup/seed-p-0150-img8-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4764, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0150-img8' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img8.jpg';
UPDATE photos SET r2_key = 'uploads/seed-teapup/seed-p-0150-img8-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4764, bytes = 536879
  WHERE id = 'seed-p-0150-img8' AND r2_key = 'uploads/seed-teapup/seed-p-0150-img8.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0154-img0-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4499, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0154-img0' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0154-img0-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4499, bytes = 1782206
  WHERE id = 'seed-p-0154-img0' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0154-img1-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4998, 'top_px', 44)
    FROM photos WHERE id = 'seed-p-0154-img1' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0154-img1-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4998, bytes = 1807791
  WHERE id = 'seed-p-0154-img1' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0154-img2-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.3915, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0154-img2' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0154-img2-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.3915, bytes = 1478146
  WHERE id = 'seed-p-0154-img2' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0154-img3-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4308, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0154-img3' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0154-img3-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4308, bytes = 1773769
  WHERE id = 'seed-p-0154-img3' AND r2_key = 'uploads/seed-unassigned/seed-p-0154-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-cac1889cea95-crop32.jpg', 'width', 2202, 'height', 1468, 'focus_y', 0.5, 'top_px', 48)
    FROM photos WHERE id = 'seed-p-0155-wx-cac1889cea95' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-cac1889cea95.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-cac1889cea95-crop32.jpg', width = 2202, height = 1468, aspect = 1.5, focus_y = 0.5, bytes = 547344
  WHERE id = 'seed-p-0155-wx-cac1889cea95' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-cac1889cea95.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-3e3b6e63aca0-crop32.jpg', 'width', 2163, 'height', 1442, 'focus_y', 0.4998, 'top_px', 94)
    FROM photos WHERE id = 'seed-p-0155-wx-3e3b6e63aca0' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-3e3b6e63aca0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-3e3b6e63aca0-crop32.jpg', width = 2163, height = 1442, aspect = 1.5, focus_y = 0.4998, bytes = 435166
  WHERE id = 'seed-p-0155-wx-3e3b6e63aca0' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-wx-3e3b6e63aca0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-img4-crop32.jpg', 'width', 2125, 'height', 1417, 'focus_y', 0.4889, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0155-img4' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-img4-crop32.jpg', width = 2125, height = 1417, aspect = 1.4996, focus_y = 0.4889, bytes = 95768
  WHERE id = 'seed-p-0155-img4' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0155-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-wx-0d4cc3ef87eb-crop32.jpg', 'width', 2394, 'height', 1596, 'focus_y', 0.5, 'top_px', 3)
    FROM photos WHERE id = 'seed-p-0156-wx-0d4cc3ef87eb' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-wx-0d4cc3ef87eb.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-wx-0d4cc3ef87eb-crop32.jpg', width = 2394, height = 1596, aspect = 1.5, focus_y = 0.5, bytes = 745907
  WHERE id = 'seed-p-0156-wx-0d4cc3ef87eb' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-wx-0d4cc3ef87eb.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-img5-crop32.jpg', 'width', 2125, 'height', 1417, 'focus_y', 0.4889, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0156-img5' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-img5.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-img5-crop32.jpg', width = 2125, height = 1417, aspect = 1.4996, focus_y = 0.4889, bytes = 95768
  WHERE id = 'seed-p-0156-img5' AND r2_key = 'uploads/seed-rollingacresfarmpuppies/seed-p-0156-img5.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img0-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4265, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0283-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img0-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4265, bytes = 601043
  WHERE id = 'seed-p-0283-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img1-crop32.jpg', 'width', 1600, 'height', 1067, 'focus_y', 0.4274, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0283-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img1-crop32.jpg', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4274, bytes = 410490
  WHERE id = 'seed-p-0283-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img2-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4073, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0283-img2' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img2-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4073, bytes = 541883
  WHERE id = 'seed-p-0283-img2' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img3-crop32.jpg', 'width', 1600, 'height', 1067, 'focus_y', 0.4995, 'top_px', 25)
    FROM photos WHERE id = 'seed-p-0283-img3' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img3-crop32.jpg', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4995, bytes = 442654
  WHERE id = 'seed-p-0283-img3' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img4-crop32.jpg', 'width', 1600, 'height', 1067, 'focus_y', 0.4116, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0283-img4' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img4-crop32.jpg', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4116, bytes = 517509
  WHERE id = 'seed-p-0283-img4' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img5-crop32.jpg', 'width', 1600, 'height', 1067, 'focus_y', 0.4049, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0283-img5' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img5.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img5-crop32.jpg', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4049, bytes = 446550
  WHERE id = 'seed-p-0283-img5' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img5.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img7-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.4253, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0283-img7' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img7-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.4253, bytes = 2557220
  WHERE id = 'seed-p-0283-img7' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0283-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0162-wx-cb4a8ab35a3b-crop32.jpg', 'width', 2055, 'height', 1370, 'focus_y', 0.3823, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0162-wx-cb4a8ab35a3b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0162-wx-cb4a8ab35a3b.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0162-wx-cb4a8ab35a3b-crop32.jpg', width = 2055, height = 1370, aspect = 1.5, focus_y = 0.3823, bytes = 318381
  WHERE id = 'seed-p-0162-wx-cb4a8ab35a3b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0162-wx-cb4a8ab35a3b.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-ab5ec8f8f84a-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.4999, 'top_px', 234)
    FROM photos WHERE id = 'seed-p-0163-wx-ab5ec8f8f84a' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-ab5ec8f8f84a.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-ab5ec8f8f84a-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.4999, bytes = 2961232
  WHERE id = 'seed-p-0163-wx-ab5ec8f8f84a' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-ab5ec8f8f84a.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-16efb995380c-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.4534, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0163-wx-16efb995380c' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-16efb995380c.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-16efb995380c-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.4534, bytes = 4764146
  WHERE id = 'seed-p-0163-wx-16efb995380c' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-16efb995380c.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-bc293b264697-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5005, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0163-wx-bc293b264697' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-bc293b264697.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-bc293b264697-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5005, bytes = 5813791
  WHERE id = 'seed-p-0163-wx-bc293b264697' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-bc293b264697.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-0faa21f4e481-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5185, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0163-wx-0faa21f4e481' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-0faa21f4e481.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-0faa21f4e481-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5185, bytes = 4284616
  WHERE id = 'seed-p-0163-wx-0faa21f4e481' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-0faa21f4e481.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-5de969a84f2f-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5477, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0163-wx-5de969a84f2f' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-5de969a84f2f.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-5de969a84f2f-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5477, bytes = 5541800
  WHERE id = 'seed-p-0163-wx-5de969a84f2f' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-5de969a84f2f.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-e77e5276b6ac-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5, 'top_px', 311)
    FROM photos WHERE id = 'seed-p-0163-wx-e77e5276b6ac' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-e77e5276b6ac.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-e77e5276b6ac-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5, bytes = 5014308
  WHERE id = 'seed-p-0163-wx-e77e5276b6ac' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-e77e5276b6ac.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-affb7ca40823-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5264, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0163-wx-affb7ca40823' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-affb7ca40823.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-affb7ca40823-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5264, bytes = 5720625
  WHERE id = 'seed-p-0163-wx-affb7ca40823' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-affb7ca40823.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-17d693238ad3-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.6006, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0163-wx-17d693238ad3' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-17d693238ad3.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-17d693238ad3-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.6006, bytes = 4668082
  WHERE id = 'seed-p-0163-wx-17d693238ad3' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-wx-17d693238ad3.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-img6-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.4253, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0163-img6' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-img6-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.4253, bytes = 2557220
  WHERE id = 'seed-p-0163-img6' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0163-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-little-paws-canine/seed-p-0166-img6-crop32.jpg', 'width', 2593, 'height', 1729, 'focus_y', 0.4717, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0166-img6' AND r2_key = 'uploads/seed-little-paws-canine/seed-p-0166-img6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-little-paws-canine/seed-p-0166-img6-crop32.jpg', width = 2593, height = 1729, aspect = 1.4997, focus_y = 0.4717, bytes = 235802
  WHERE id = 'seed-p-0166-img6' AND r2_key = 'uploads/seed-little-paws-canine/seed-p-0166-img6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-wx-4fb9635e2fa1-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5185, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0171-wx-4fb9635e2fa1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-wx-4fb9635e2fa1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-wx-4fb9635e2fa1-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5185, bytes = 5028219
  WHERE id = 'seed-p-0171-wx-4fb9635e2fa1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-wx-4fb9635e2fa1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-img0-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.4253, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0171-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-img0-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.4253, bytes = 2557220
  WHERE id = 'seed-p-0171-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0171-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-066e7e223c64-crop32.jpg', 'width', 1566, 'height', 1044, 'focus_y', 0.5005, 'top_px', 34)
    FROM photos WHERE id = 'seed-p-0181-wx-066e7e223c64' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-066e7e223c64.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-066e7e223c64-crop32.jpg', width = 1566, height = 1044, aspect = 1.5, focus_y = 0.5005, bytes = 570730
  WHERE id = 'seed-p-0181-wx-066e7e223c64' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-066e7e223c64.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-b8d0b0c91b0c-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.5, 'top_px', 147)
    FROM photos WHERE id = 'seed-p-0181-wx-b8d0b0c91b0c' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-b8d0b0c91b0c.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-b8d0b0c91b0c-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.5, bytes = 807499
  WHERE id = 'seed-p-0181-wx-b8d0b0c91b0c' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-b8d0b0c91b0c.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-f87b7a0a9c87-crop32.jpg', 'width', 2047, 'height', 1365, 'focus_y', 0.4636, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0181-wx-f87b7a0a9c87' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-f87b7a0a9c87.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-f87b7a0a9c87-crop32.jpg', width = 2047, height = 1365, aspect = 1.4996, focus_y = 0.4636, bytes = 671259
  WHERE id = 'seed-p-0181-wx-f87b7a0a9c87' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-f87b7a0a9c87.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-249f64ba5696-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4431, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0181-wx-249f64ba5696' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-249f64ba5696.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-249f64ba5696-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4431, bytes = 680349
  WHERE id = 'seed-p-0181-wx-249f64ba5696' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-249f64ba5696.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-031b6a77d7bd-crop32.jpg', 'width', 1586, 'height', 1057, 'focus_y', 0.4954, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0181-wx-031b6a77d7bd' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-031b6a77d7bd.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-031b6a77d7bd-crop32.jpg', width = 1586, height = 1057, aspect = 1.5005, focus_y = 0.4954, bytes = 539336
  WHERE id = 'seed-p-0181-wx-031b6a77d7bd' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-031b6a77d7bd.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-a8c0d83b2c5c-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4998, 'top_px', 115)
    FROM photos WHERE id = 'seed-p-0181-wx-a8c0d83b2c5c' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-a8c0d83b2c5c.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-a8c0d83b2c5c-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4998, bytes = 784517
  WHERE id = 'seed-p-0181-wx-a8c0d83b2c5c' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-a8c0d83b2c5c.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-995f0104ef9b-crop32.jpg', 'width', 2047, 'height', 1365, 'focus_y', 0.456, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0181-wx-995f0104ef9b' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-995f0104ef9b.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-995f0104ef9b-crop32.jpg', width = 2047, height = 1365, aspect = 1.4996, focus_y = 0.456, bytes = 751092
  WHERE id = 'seed-p-0181-wx-995f0104ef9b' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-995f0104ef9b.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-392a7d441b10-crop32.jpg', 'width', 2047, 'height', 1365, 'focus_y', 0.456, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0181-wx-392a7d441b10' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-392a7d441b10.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-392a7d441b10-crop32.jpg', width = 2047, height = 1365, aspect = 1.4996, focus_y = 0.456, bytes = 751092
  WHERE id = 'seed-p-0181-wx-392a7d441b10' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-392a7d441b10.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-36a1f2b25e19-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.5003, 'top_px', 148)
    FROM photos WHERE id = 'seed-p-0181-wx-36a1f2b25e19' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-36a1f2b25e19.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-36a1f2b25e19-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.5003, bytes = 780316
  WHERE id = 'seed-p-0181-wx-36a1f2b25e19' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-36a1f2b25e19.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-d722516fc4ad-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4998, 'top_px', 161)
    FROM photos WHERE id = 'seed-p-0181-wx-d722516fc4ad' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-d722516fc4ad.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-d722516fc4ad-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4998, bytes = 733067
  WHERE id = 'seed-p-0181-wx-d722516fc4ad' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-d722516fc4ad.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-1c90b3111450-crop32.jpg', 'width', 2048, 'height', 1365, 'focus_y', 0.4896, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0181-wx-1c90b3111450' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-1c90b3111450.jpg';
UPDATE photos SET r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-1c90b3111450-crop32.jpg', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4896, bytes = 685262
  WHERE id = 'seed-p-0181-wx-1c90b3111450' AND r2_key = 'uploads/seed-kingdomfamilycompanions/seed-p-0181-wx-1c90b3111450.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img2-crop32.png', 'width', 2048, 'height', 1365, 'focus_y', 0.4998, 'top_px', 140)
    FROM photos WHERE id = 'seed-p-0287-img2' AND r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img2.png';
UPDATE photos SET r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img2-crop32.png', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.4998, bytes = 2508468
  WHERE id = 'seed-p-0287-img2' AND r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img2.png';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img3-crop32.png', 'width', 2048, 'height', 1365, 'focus_y', 0.5001, 'top_px', 166)
    FROM photos WHERE id = 'seed-p-0287-img3' AND r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img3.png';
UPDATE photos SET r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img3-crop32.png', width = 2048, height = 1365, aspect = 1.5004, focus_y = 0.5001, bytes = 2082909
  WHERE id = 'seed-p-0287-img3' AND r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0287-img3.png';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-marlorhomesteadcompanions/seed-p-0291-img4-crop32.png', 'width', 2126, 'height', 1417, 'focus_y', 0.5, 'top_px', 20)
    FROM photos WHERE id = 'seed-p-0291-img4' AND r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0291-img4.png';
UPDATE photos SET r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0291-img4-crop32.png', width = 2126, height = 1417, aspect = 1.5004, focus_y = 0.5, bytes = 2560604
  WHERE id = 'seed-p-0291-img4' AND r2_key = 'uploads/seed-marlorhomesteadcompanions/seed-p-0291-img4.png';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0188-wx-cb4a8ab35a3b-crop32.jpg', 'width', 2055, 'height', 1370, 'focus_y', 0.3823, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0188-wx-cb4a8ab35a3b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0188-wx-cb4a8ab35a3b.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0188-wx-cb4a8ab35a3b-crop32.jpg', width = 2055, height = 1370, aspect = 1.5, focus_y = 0.3823, bytes = 318381
  WHERE id = 'seed-p-0188-wx-cb4a8ab35a3b' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0188-wx-cb4a8ab35a3b.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-johnny-miller/seed-p-0191-wx-ac420237c880-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4751, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0191-wx-ac420237c880' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0191-wx-ac420237c880.jpg';
UPDATE photos SET r2_key = 'uploads/seed-johnny-miller/seed-p-0191-wx-ac420237c880-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4751, bytes = 161529
  WHERE id = 'seed-p-0191-wx-ac420237c880' AND r2_key = 'uploads/seed-johnny-miller/seed-p-0191-wx-ac420237c880.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-2e85da536727-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.378, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0192-wx-2e85da536727' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-2e85da536727.jpg';
UPDATE photos SET r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-2e85da536727-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.378, bytes = 1520007
  WHERE id = 'seed-p-0192-wx-2e85da536727' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-2e85da536727.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-0420f6f519be-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4758, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0192-wx-0420f6f519be' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-0420f6f519be.jpg';
UPDATE photos SET r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-0420f6f519be-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4758, bytes = 2739628
  WHERE id = 'seed-p-0192-wx-0420f6f519be' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-wx-0420f6f519be.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-riverdale-paw-pals/seed-p-0192-img1-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4681, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0192-img1' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-img1-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4681, bytes = 184383
  WHERE id = 'seed-p-0192-img1' AND r2_key = 'uploads/seed-riverdale-paw-pals/seed-p-0192-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-pleasantviewpuppies/seed-p-0196-wx-f9b7a19f8529-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.3049, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0196-wx-f9b7a19f8529' AND r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0196-wx-f9b7a19f8529.jpg';
UPDATE photos SET r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0196-wx-f9b7a19f8529-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.3049, bytes = 4814806
  WHERE id = 'seed-p-0196-wx-f9b7a19f8529' AND r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0196-wx-f9b7a19f8529.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0198-img1-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.3386, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0198-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0198-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0198-img1-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.3386, bytes = 2199224
  WHERE id = 'seed-p-0198-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0198-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img0-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5001, 'top_px', 169)
    FROM photos WHERE id = 'seed-p-0209-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img0-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5001, bytes = 4610196
  WHERE id = 'seed-p-0209-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img1-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.5, 'top_px', 41)
    FROM photos WHERE id = 'seed-p-0209-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img1-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.5, bytes = 3753798
  WHERE id = 'seed-p-0209-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0209-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img0-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.5, 'top_px', 41)
    FROM photos WHERE id = 'seed-p-0210-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img0-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.5, bytes = 3753798
  WHERE id = 'seed-p-0210-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img1-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5001, 'top_px', 169)
    FROM photos WHERE id = 'seed-p-0210-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img1-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5001, bytes = 4610196
  WHERE id = 'seed-p-0210-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0210-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img0-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5001, 'top_px', 169)
    FROM photos WHERE id = 'seed-p-0211-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img0-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5001, bytes = 4610196
  WHERE id = 'seed-p-0211-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img1-crop32.jpg', 'width', 4032, 'height', 2688, 'focus_y', 0.5, 'top_px', 41)
    FROM photos WHERE id = 'seed-p-0211-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img1-crop32.jpg', width = 4032, height = 2688, aspect = 1.5, focus_y = 0.5, bytes = 3753798
  WHERE id = 'seed-p-0211-img1' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0211-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-cuddlyfamilycompanions/seed-p-0230-img0-crop32.jpg', 'width', 5712, 'height', 3808, 'focus_y', 0.5207, 'top_px', 476)
    FROM photos WHERE id = 'seed-p-0230-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0230-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0230-img0-crop32.jpg', width = 5712, height = 3808, aspect = 1.5, focus_y = 0.5207, bytes = 3464045
  WHERE id = 'seed-p-0230-img0' AND r2_key = 'uploads/seed-cuddlyfamilycompanions/seed-p-0230-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GJ5X2RM8RKQFZ7Y0PEEFK-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4996, 'top_px', 121)
    FROM photos WHERE id = '01M69GJ5X2RM8RKQFZ7Y0PEEFK' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJ5X2RM8RKQFZ7Y0PEEFK.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GJ5X2RM8RKQFZ7Y0PEEFK-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4996, bytes = 622984
  WHERE id = '01M69GJ5X2RM8RKQFZ7Y0PEEFK' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJ5X2RM8RKQFZ7Y0PEEFK.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GJA7V4FEJQ6QSYY0GV7EC-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4997, 'top_px', 62)
    FROM photos WHERE id = '01M69GJA7V4FEJQ6QSYY0GV7EC' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJA7V4FEJQ6QSYY0GV7EC.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GJA7V4FEJQ6QSYY0GV7EC-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4997, bytes = 671030
  WHERE id = '01M69GJA7V4FEJQ6QSYY0GV7EC' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJA7V4FEJQ6QSYY0GV7EC.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GJEHCK2HRC182FQ2B254G-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4998, 'top_px', 44)
    FROM photos WHERE id = '01M69GJEHCK2HRC182FQ2B254G' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJEHCK2HRC182FQ2B254G.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GJEHCK2HRC182FQ2B254G-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4998, bytes = 604266
  WHERE id = '01M69GJEHCK2HRC182FQ2B254G' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJEHCK2HRC182FQ2B254G.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GJJ2909QGFMEGSAXKMD49-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4343, 'top_px', 0)
    FROM photos WHERE id = '01M69GJJ2909QGFMEGSAXKMD49' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJJ2909QGFMEGSAXKMD49.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GJJ2909QGFMEGSAXKMD49-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4343, bytes = 465134
  WHERE id = '01M69GJJ2909QGFMEGSAXKMD49' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GJJ2909QGFMEGSAXKMD49.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GXW68PTYH5WGKBW14XJMM-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4999, 'top_px', 90)
    FROM photos WHERE id = '01M69GXW68PTYH5WGKBW14XJMM' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GXW68PTYH5WGKBW14XJMM.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GXW68PTYH5WGKBW14XJMM-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4999, bytes = 738146
  WHERE id = '01M69GXW68PTYH5WGKBW14XJMM' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GXW68PTYH5WGKBW14XJMM.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GY02Q37ENKE5EQ8J1F51G-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4997, 'top_px', 126)
    FROM photos WHERE id = '01M69GY02Q37ENKE5EQ8J1F51G' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GY02Q37ENKE5EQ8J1F51G.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GY02Q37ENKE5EQ8J1F51G-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4997, bytes = 614122
  WHERE id = '01M69GY02Q37ENKE5EQ8J1F51G' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GY02Q37ENKE5EQ8J1F51G.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GY3VEP5RGBA38KKGFFGG1-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.4822, 'top_px', 0)
    FROM photos WHERE id = '01M69GY3VEP5RGBA38KKGFFGG1' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GY3VEP5RGBA38KKGFFGG1.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GY3VEP5RGBA38KKGFFGG1-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.4822, bytes = 348580
  WHERE id = '01M69GY3VEP5RGBA38KKGFFGG1' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GY3VEP5RGBA38KKGFFGG1.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-sweetpuppypaws/01M69GY7YZ6S4H0Q6Y24BGA63V-crop32.webp', 'width', 1600, 'height', 1067, 'focus_y', 0.5002, 'top_px', 64)
    FROM photos WHERE id = '01M69GY7YZ6S4H0Q6Y24BGA63V' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GY7YZ6S4H0Q6Y24BGA63V.webp';
UPDATE photos SET r2_key = 'uploads/seed-sweetpuppypaws/01M69GY7YZ6S4H0Q6Y24BGA63V-crop32.webp', width = 1600, height = 1067, aspect = 1.4995, focus_y = 0.5002, bytes = 443026
  WHERE id = '01M69GY7YZ6S4H0Q6Y24BGA63V' AND r2_key = 'uploads/seed-sweetpuppypaws/01M69GY7YZ6S4H0Q6Y24BGA63V.webp';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0259-img0-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4589, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0259-img0' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img0.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0259-img0-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4589, bytes = 1684405
  WHERE id = 'seed-p-0259-img0' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img0.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0259-img1-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.5002, 'top_px', 82)
    FROM photos WHERE id = 'seed-p-0259-img1' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img1.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0259-img1-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.5002, bytes = 1444363
  WHERE id = 'seed-p-0259-img1' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img1.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0259-img2-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.4567, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0259-img2' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img2.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0259-img2-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.4567, bytes = 1655161
  WHERE id = 'seed-p-0259-img2' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img2.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-unassigned/seed-p-0259-img4-crop32.jpg', 'width', 4000, 'height', 2667, 'focus_y', 0.3825, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0259-img4' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img4.jpg';
UPDATE photos SET r2_key = 'uploads/seed-unassigned/seed-p-0259-img4-crop32.jpg', width = 4000, height = 2667, aspect = 1.4998, focus_y = 0.3825, bytes = 1651009
  WHERE id = 'seed-p-0259-img4' AND r2_key = 'uploads/seed-unassigned/seed-p-0259-img4.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-daniel-ramsey/seed-p-0259-wx-6b2f5ee8c843-crop32.jpg', 'width', 4344, 'height', 2896, 'focus_y', 0.4477, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0259-wx-6b2f5ee8c843' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0259-wx-6b2f5ee8c843.jpg';
UPDATE photos SET r2_key = 'uploads/seed-daniel-ramsey/seed-p-0259-wx-6b2f5ee8c843-crop32.jpg', width = 4344, height = 2896, aspect = 1.5, focus_y = 0.4477, bytes = 1798369
  WHERE id = 'seed-p-0259-wx-6b2f5ee8c843' AND r2_key = 'uploads/seed-daniel-ramsey/seed-p-0259-wx-6b2f5ee8c843.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rockytopbulldogs/seed-p-0300-img7-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.444, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0300-img7' AND r2_key = 'uploads/seed-rockytopbulldogs/seed-p-0300-img7.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rockytopbulldogs/seed-p-0300-img7-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.444, bytes = 240436
  WHERE id = 'seed-p-0300-img7' AND r2_key = 'uploads/seed-rockytopbulldogs/seed-p-0300-img7.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-pleasantviewpuppies/seed-p-0301-wx-ac63bf7552e6-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.4999, 'top_px', 6)
    FROM photos WHERE id = 'seed-p-0301-wx-ac63bf7552e6' AND r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0301-wx-ac63bf7552e6.jpg';
UPDATE photos SET r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0301-wx-ac63bf7552e6-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.4999, bytes = 232391
  WHERE id = 'seed-p-0301-wx-ac63bf7552e6' AND r2_key = 'uploads/seed-pleasantviewpuppies/seed-p-0301-wx-ac63bf7552e6.jpg';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T19:17:52Z', 'system', 'claude', 'photo.crop_32', 'puppy', puppy_id,
    json_object('photo', id, 'r2_key', r2_key, 'width', width, 'height', height, 'aspect', aspect, 'focus_y', focus_y, 'bytes', bytes),
    json_object('photo', id, 'r2_key', 'uploads/seed-rockytopbulldogs/seed-p-0302-img9-crop32.jpg', 'width', 1080, 'height', 720, 'focus_y', 0.444, 'top_px', 0)
    FROM photos WHERE id = 'seed-p-0302-img9' AND r2_key = 'uploads/seed-rockytopbulldogs/seed-p-0302-img9.jpg';
UPDATE photos SET r2_key = 'uploads/seed-rockytopbulldogs/seed-p-0302-img9-crop32.jpg', width = 1080, height = 720, aspect = 1.5, focus_y = 0.444, bytes = 240436
  WHERE id = 'seed-p-0302-img9' AND r2_key = 'uploads/seed-rockytopbulldogs/seed-p-0302-img9.jpg';
