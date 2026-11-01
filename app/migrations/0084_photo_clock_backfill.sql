-- Alex, 2026-11-01 (docs/batch-2026-11-02-post-launch.md, n1-photo-clock). Each listed puppy's photo clock
-- (last_photo_at) moves to the date of its newest photo: Wix's Last-Modified for a photo still at a Wix address,
-- the upload time for any other. The go-live hold (photo_clock_start 2026-11-01) stays. photo_clock_stop turns on,
-- so the clock stops at the first warning and nothing goes offline or is removed until Alex lifts it. Listings
-- already past six weeks whose breeder has never signed in get the first warning here, so the breeder portal shows
-- it on their first sign-in; one whose breeder has signed in is warned, with the email, by the next daily run.
-- Written by app/ops/photo_clock_backfill.py from production-2026-11-01-pre0084.sql, generated 2026-11-01T14:25:03Z.
-- Each update is guarded on the value it replaces, so a photo added since wins and a second run changes nothing.
-- Nothing here is on the public site, so there is no publish marker.
INSERT INTO settings (key, value) VALUES ('photo_clock_stop', '1') ON CONFLICT (key) DO NOTHING;

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', '01M69GH6VA5Q0HGQEJX2QW2E74', json_object('last_photo_at', '2026-10-31T17:46:54Z'), json_object('last_photo_at', '2026-10-31T17:37:01Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = '01M69GH6VA5Q0HGQEJX2QW2E74' AND last_photo_at = '2026-10-31T17:46:54Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = '01M69GH6VA5Q0HGQEJX2QW2E74' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-31T17:37:01Z' WHERE id = '01M69GH6VA5Q0HGQEJX2QW2E74' AND last_photo_at = '2026-10-31T17:46:54Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', '01M69GXA6RVWK4Q9M3JWDT2FKE', json_object('last_photo_at', '2026-10-31T17:46:54Z'), json_object('last_photo_at', '2026-10-31T17:43:24Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = '01M69GXA6RVWK4Q9M3JWDT2FKE' AND last_photo_at = '2026-10-31T17:46:54Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = '01M69GXA6RVWK4Q9M3JWDT2FKE' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-31T17:43:24Z' WHERE id = '01M69GXA6RVWK4Q9M3JWDT2FKE' AND last_photo_at = '2026-10-31T17:46:54Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0001', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:33:21Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0001' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0001' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:33:21Z' WHERE id = 'seed-p-0001' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0007', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-23T00:09:04Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0007' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0007' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:09:04Z' WHERE id = 'seed-p-0007' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0009', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-15T15:31:55Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0009' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0009' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-15T15:31:55Z' WHERE id = 'seed-p-0009' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0010', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T18:40:02Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0010' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0010' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T18:40:02Z' WHERE id = 'seed-p-0010' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0011', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:16:42Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0011' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0011' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:16:42Z' WHERE id = 'seed-p-0011' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0013', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-27T20:01:01Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0013' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0013' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-27T20:01:01Z' WHERE id = 'seed-p-0013' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0014', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:32:22Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0014' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0014' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:32:22Z' WHERE id = 'seed-p-0014' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0017', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:26:15Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0017' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0017' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:26:15Z' WHERE id = 'seed-p-0017' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0018', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-15T15:31:09Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0018' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0018' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-15T15:31:09Z' WHERE id = 'seed-p-0018' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0020', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:42:25Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0020' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0020' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:42:25Z' WHERE id = 'seed-p-0020' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0021', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T12:49:54Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0021' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0021' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T12:49:54Z' WHERE id = 'seed-p-0021' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0022', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:18:06Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0022' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0022' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:18:06Z' WHERE id = 'seed-p-0022' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0023', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T15:32:30Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0023' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0023' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T15:32:30Z' WHERE id = 'seed-p-0023' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0024', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-23T00:09:58Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0024' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0024' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:09:58Z' WHERE id = 'seed-p-0024' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0026', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-20T23:35:02Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0026' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0026' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-20T23:35:02Z' WHERE id = 'seed-p-0026' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0027', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-17T12:38:30Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0027' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0027' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-17T12:38:30Z' WHERE id = 'seed-p-0027' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0029', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-27T20:29:15Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0029' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0029' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-27T20:29:15Z' WHERE id = 'seed-p-0029' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0030', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-17T12:35:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0030' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0030' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-17T12:35:52Z' WHERE id = 'seed-p-0030' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0032', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:24:52Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0032' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0032' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:24:52Z' WHERE id = 'seed-p-0032' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0033', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-06T21:48:16Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0033' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0033' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-06T21:48:16Z' WHERE id = 'seed-p-0033' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0037', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T15:29:08Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0037' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0037' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T15:29:08Z' WHERE id = 'seed-p-0037' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0040', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-06T21:49:58Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0040' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0040' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-06T21:49:58Z' WHERE id = 'seed-p-0040' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0049', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T15:35:19Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0049' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0049' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T15:35:19Z' WHERE id = 'seed-p-0049' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0051', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:24:06Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0051' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0051' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:24:06Z' WHERE id = 'seed-p-0051' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0054', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-19T00:25:57Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0054' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0054' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-19T00:25:57Z' WHERE id = 'seed-p-0054' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0057', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-20T23:37:34Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0057' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0057' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-20T23:37:34Z' WHERE id = 'seed-p-0057' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0060', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T15:25:53Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0060' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0060' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T15:25:53Z' WHERE id = 'seed-p-0060' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0061', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-28T20:27:22Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0061' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0061' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-28T20:27:22Z' WHERE id = 'seed-p-0061' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0063', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T15:34:25Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0063' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0063' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T15:34:25Z' WHERE id = 'seed-p-0063' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0069', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-28T20:28:13Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0069' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0069' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-28T20:28:13Z' WHERE id = 'seed-p-0069' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0071', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-18T01:06:49Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0071' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0071' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-18T01:06:49Z' WHERE id = 'seed-p-0071' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0071', NULL, json_object('newest_photo', '2026-09-18T01:06:49Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0071' AND last_photo_at = '2026-09-18T01:06:49Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0071' AND last_photo_at = '2026-09-18T01:06:49Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0072', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:18:51Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0072' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0072' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:18:51Z' WHERE id = 'seed-p-0072' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0075', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T12:53:51Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0075' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0075' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T12:53:51Z' WHERE id = 'seed-p-0075' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0076', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:19:39Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0076' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0076' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:19:39Z' WHERE id = 'seed-p-0076' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0077', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T00:50:56Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0077' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0077' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T00:50:56Z' WHERE id = 'seed-p-0077' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0078', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:46:11Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0078' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0078' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:46:11Z' WHERE id = 'seed-p-0078' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0081', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-06T22:54:17Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0081' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0081' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-06T22:54:17Z' WHERE id = 'seed-p-0081' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0082', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-28T20:29:21Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0082' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0082' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-28T20:29:21Z' WHERE id = 'seed-p-0082' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0083', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-27T20:06:32Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0083' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0083' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-27T20:06:32Z' WHERE id = 'seed-p-0083' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0085', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-28T15:10:11Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0085' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0085' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-28T15:10:11Z' WHERE id = 'seed-p-0085' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0086', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-07-31T11:09:05Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0086' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0086' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-07-31T11:09:05Z' WHERE id = 'seed-p-0086' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0086', NULL, json_object('newest_photo', '2026-07-31T11:09:05Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0086' AND last_photo_at = '2026-07-31T11:09:05Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0086' AND last_photo_at = '2026-07-31T11:09:05Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0088', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-28T15:13:45Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0088' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0088' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-28T15:13:45Z' WHERE id = 'seed-p-0088' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0091', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-22T02:14:57Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0091' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0091' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-22T02:14:57Z' WHERE id = 'seed-p-0091' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0094', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-12T12:37:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0094' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0094' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-12T12:37:52Z' WHERE id = 'seed-p-0094' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0095', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:20:26Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0095' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0095' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:20:26Z' WHERE id = 'seed-p-0095' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0100', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-15T15:28:56Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0100' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0100' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-15T15:28:56Z' WHERE id = 'seed-p-0100' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0107', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-07-31T11:14:24Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0107' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0107' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-07-31T11:14:24Z' WHERE id = 'seed-p-0107' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0107', NULL, json_object('newest_photo', '2026-07-31T11:14:24Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0107' AND last_photo_at = '2026-07-31T11:14:24Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0107' AND last_photo_at = '2026-07-31T11:14:24Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0108', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:54:37Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0108' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0108' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:54:37Z' WHERE id = 'seed-p-0108' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0109', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-23T00:44:15Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0109' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0109' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:44:15Z' WHERE id = 'seed-p-0109' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0111', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-08-18T13:41:23Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0111' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0111' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-08-18T13:41:23Z' WHERE id = 'seed-p-0111' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0111', NULL, json_object('newest_photo', '2026-08-18T13:41:23Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0111' AND last_photo_at = '2026-08-18T13:41:23Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0111' AND last_photo_at = '2026-08-18T13:41:23Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0113', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-14T16:29:13Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0113' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0113' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-14T16:29:13Z' WHERE id = 'seed-p-0113' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0115', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-07-31T11:20:36Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0115' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0115' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-07-31T11:20:36Z' WHERE id = 'seed-p-0115' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0115', NULL, json_object('newest_photo', '2026-07-31T11:20:36Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0115' AND last_photo_at = '2026-07-31T11:20:36Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0115' AND last_photo_at = '2026-07-31T11:20:36Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0116', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-07-31T11:23:27Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0116' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0116' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-07-31T11:23:27Z' WHERE id = 'seed-p-0116' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0116', NULL, json_object('newest_photo', '2026-07-31T11:23:27Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0116' AND last_photo_at = '2026-07-31T11:23:27Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0116' AND last_photo_at = '2026-07-31T11:23:27Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0117', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-20T23:50:48Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0117' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0117' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-20T23:50:48Z' WHERE id = 'seed-p-0117' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0120', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:21:21Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0120' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0120' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:21:21Z' WHERE id = 'seed-p-0120' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0121', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-19T00:41:31Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0121' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0121' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-19T00:41:31Z' WHERE id = 'seed-p-0121' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0123', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-09T19:40:47Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0123' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0123' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-09T19:40:47Z' WHERE id = 'seed-p-0123' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0124', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T12:25:55Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0124' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0124' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T12:25:55Z' WHERE id = 'seed-p-0124' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0127', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T12:27:13Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0127' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0127' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T12:27:13Z' WHERE id = 'seed-p-0127' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0128', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T01:59:57Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0128' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0128' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T01:59:57Z' WHERE id = 'seed-p-0128' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0134', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T02:12:35Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0134' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0134' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T02:12:35Z' WHERE id = 'seed-p-0134' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0136', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T15:33:00Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0136' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0136' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T15:33:00Z' WHERE id = 'seed-p-0136' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0137', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-12T11:47:54Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0137' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0137' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-12T11:47:54Z' WHERE id = 'seed-p-0137' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0138', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-19T00:28:19Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0138' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0138' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-19T00:28:19Z' WHERE id = 'seed-p-0138' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0139', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T21:58:06Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0139' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0139' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T21:58:06Z' WHERE id = 'seed-p-0139' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0140', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-19T00:34:29Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0140' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0140' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-19T00:34:29Z' WHERE id = 'seed-p-0140' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0141', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-25T23:07:45Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0141' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0141' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-25T23:07:45Z' WHERE id = 'seed-p-0141' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0143', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T15:33:15Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0143' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0143' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T15:33:15Z' WHERE id = 'seed-p-0143' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0144', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-08-19T21:11:30Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0144' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0144' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-08-19T21:11:30Z' WHERE id = 'seed-p-0144' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0144', NULL, json_object('newest_photo', '2026-08-19T21:11:30Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0144' AND last_photo_at = '2026-08-19T21:11:30Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0144' AND last_photo_at = '2026-08-19T21:11:30Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0145', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-06T22:38:24Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0145' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0145' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-06T22:38:24Z' WHERE id = 'seed-p-0145' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0146', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T12:30:23Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0146' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0146' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T12:30:23Z' WHERE id = 'seed-p-0146' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0148', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T12:33:04Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0148' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0148' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T12:33:04Z' WHERE id = 'seed-p-0148' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0150', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-30T20:53:43Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0150' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0150' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-30T20:53:43Z' WHERE id = 'seed-p-0150' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0154', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-27T03:07:29Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0154' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0154' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-27T03:07:29Z' WHERE id = 'seed-p-0154' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0155', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T12:34:03Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0155' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0155' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T12:34:03Z' WHERE id = 'seed-p-0155' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0156', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T12:35:28Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0156' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0156' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T12:35:28Z' WHERE id = 'seed-p-0156' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0160', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T12:52:20Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0160' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0160' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T12:52:20Z' WHERE id = 'seed-p-0160' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0161', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T15:29:47Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0161' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0161' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T15:29:47Z' WHERE id = 'seed-p-0161' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0162', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-12T11:48:59Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0162' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0162' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-12T11:48:59Z' WHERE id = 'seed-p-0162' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0163', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-07T11:51:23Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0163' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0163' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-07T11:51:23Z' WHERE id = 'seed-p-0163' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0165', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:10:05Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0165' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0165' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:10:05Z' WHERE id = 'seed-p-0165' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0166', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T00:52:11Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0166' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0166' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T00:52:11Z' WHERE id = 'seed-p-0166' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0170', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-14T16:29:57Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0170' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0170' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-14T16:29:57Z' WHERE id = 'seed-p-0170' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0171', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-07T11:53:02Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0171' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0171' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-07T11:53:02Z' WHERE id = 'seed-p-0171' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0174', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:41:59Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0174' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0174' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:41:59Z' WHERE id = 'seed-p-0174' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0176', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-06T22:37:25Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0176' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0176' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-06T22:37:25Z' WHERE id = 'seed-p-0176' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0181', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-04T23:43:02Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0181' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0181' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-04T23:43:02Z' WHERE id = 'seed-p-0181' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0182', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:22:11Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0182' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0182' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:22:11Z' WHERE id = 'seed-p-0182' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0185', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-15T15:27:10Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0185' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0185' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-15T15:27:10Z' WHERE id = 'seed-p-0185' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0188', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-27T20:39:55Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0188' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0188' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-27T20:39:55Z' WHERE id = 'seed-p-0188' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0191', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:00:10Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0191' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0191' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:00:10Z' WHERE id = 'seed-p-0191' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0192', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T18:47:09Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0192' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0192' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T18:47:09Z' WHERE id = 'seed-p-0192' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0195', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:32:10Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0195' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0195' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:32:10Z' WHERE id = 'seed-p-0195' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0196', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T12:47:42Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0196' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0196' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T12:47:42Z' WHERE id = 'seed-p-0196' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0197', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-28T20:35:42Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0197' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0197' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-28T20:35:42Z' WHERE id = 'seed-p-0197' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0198', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-22T22:20:14Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0198' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0198' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-22T22:20:14Z' WHERE id = 'seed-p-0198' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0199', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:35:17Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0199' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0199' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:35:17Z' WHERE id = 'seed-p-0199' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0209', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-07T11:54:35Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0209' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0209' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-07T11:54:35Z' WHERE id = 'seed-p-0209' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0210', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-07T11:57:27Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0210' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0210' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-07T11:57:27Z' WHERE id = 'seed-p-0210' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0211', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-07T12:08:09Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0211' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0211' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-07T12:08:09Z' WHERE id = 'seed-p-0211' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0219', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-27T20:11:21Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0219' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0219' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-27T20:11:21Z' WHERE id = 'seed-p-0219' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0223', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:47:54Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0223' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0223' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:47:54Z' WHERE id = 'seed-p-0223' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0225', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-23T00:47:51Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0225' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0225' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:47:51Z' WHERE id = 'seed-p-0225' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0228', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-21T18:08:38Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0228' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0228' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-21T18:08:38Z' WHERE id = 'seed-p-0228' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0230', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-07T12:16:49Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0230' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0230' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-07T12:16:49Z' WHERE id = 'seed-p-0230' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0231', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-23T00:46:58Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0231' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0231' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:46:58Z' WHERE id = 'seed-p-0231' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0233', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:33:07Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0233' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0233' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:33:07Z' WHERE id = 'seed-p-0233' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0240', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-28T20:30:15Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0240' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0240' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-28T20:30:15Z' WHERE id = 'seed-p-0240' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0241', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T14:44:19Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0241' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0241' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T14:44:19Z' WHERE id = 'seed-p-0241' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0242', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-20T23:53:46Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0242' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0242' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-20T23:53:46Z' WHERE id = 'seed-p-0242' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0243', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:33:26Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0243' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0243' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:33:26Z' WHERE id = 'seed-p-0243' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0245', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-15T15:26:21Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0245' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0245' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-15T15:26:21Z' WHERE id = 'seed-p-0245' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0247', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-22T03:19:47Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0247' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0247' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-22T03:19:47Z' WHERE id = 'seed-p-0247' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0248', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:35:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0248' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0248' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:35:52Z' WHERE id = 'seed-p-0248' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0249', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-30T12:02:30Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0249' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0249' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-30T12:02:30Z' WHERE id = 'seed-p-0249' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0250', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-06T22:52:00Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0250' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0250' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-06T22:52:00Z' WHERE id = 'seed-p-0250' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0252', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:53:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0252' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0252' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:53:52Z' WHERE id = 'seed-p-0252' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0253', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-28T20:32:20Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0253' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0253' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-28T20:32:20Z' WHERE id = 'seed-p-0253' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0256', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-28T16:37:48Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0256' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0256' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-28T16:37:48Z' WHERE id = 'seed-p-0256' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0258', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-06-17T17:15:55Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0258' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0258' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-06-17T17:15:55Z' WHERE id = 'seed-p-0258' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0258', NULL, json_object('newest_photo', '2026-06-17T17:15:55Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0258' AND last_photo_at = '2026-06-17T17:15:55Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0258' AND last_photo_at = '2026-06-17T17:15:55Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0259', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-27T20:17:44Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0259' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0259' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-27T20:17:44Z' WHERE id = 'seed-p-0259' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0262', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T00:59:14Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0262' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0262' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T00:59:14Z' WHERE id = 'seed-p-0262' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0264', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:45:42Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0264' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0264' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:45:42Z' WHERE id = 'seed-p-0264' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0267', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-14T16:40:44Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0267' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0267' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-14T16:40:44Z' WHERE id = 'seed-p-0267' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0268', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T15:39:10Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0268' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0268' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T15:39:10Z' WHERE id = 'seed-p-0268' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0273', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T14:45:21Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0273' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0273' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T14:45:21Z' WHERE id = 'seed-p-0273' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0274', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:13:35Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0274' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0274' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:13:35Z' WHERE id = 'seed-p-0274' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0275', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:23:03Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0275' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0275' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:23:03Z' WHERE id = 'seed-p-0275' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0276', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T15:31:29Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0276' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0276' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T15:31:29Z' WHERE id = 'seed-p-0276' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0277', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-24T15:21:54Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0277' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0277' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T15:21:54Z' WHERE id = 'seed-p-0277' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0278', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-09T00:18:45Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0278' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0278' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-09T00:18:45Z' WHERE id = 'seed-p-0278' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0279', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:05:10Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0279' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0279' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:05:10Z' WHERE id = 'seed-p-0279' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0280', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-05T20:52:30Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0280' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0280' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-05T20:52:30Z' WHERE id = 'seed-p-0280' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0281', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:11:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0281' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0281' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:11:52Z' WHERE id = 'seed-p-0281' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0282', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T15:43:35Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0282' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0282' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T15:43:35Z' WHERE id = 'seed-p-0282' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0283', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-09-10T23:19:48Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0283' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0283' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-09-10T23:19:48Z' WHERE id = 'seed-p-0283' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'listing.reminded_1', 'puppy', 'seed-p-0283', NULL, json_object('newest_photo', '2026-09-10T23:19:48Z', 'note', 'overdue at the 2026-11-01 backfill, warning only')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0283' AND last_photo_at = '2026-09-10T23:19:48Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed');
UPDATE puppies SET inactive_stage = 'reminded_1', stage_at = '2026-11-01T14:25:03Z' WHERE id = 'seed-p-0283' AND last_photo_at = '2026-09-10T23:19:48Z' AND inactive_stage IS NULL AND publication_state = 'published' AND operator_hold = 0 AND availability != 'placed';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0285', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:21:38Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0285' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0285' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:21:38Z' WHERE id = 'seed-p-0285' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0286', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:21:05Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0286' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0286' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:21:05Z' WHERE id = 'seed-p-0286' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0287', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-12T15:03:00Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0287' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0287' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-12T15:03:00Z' WHERE id = 'seed-p-0287' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0289', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:05:56Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0289' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0289' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:05:56Z' WHERE id = 'seed-p-0289' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0291', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-12T15:13:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0291' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0291' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-12T15:13:52Z' WHERE id = 'seed-p-0291' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0292', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T15:45:52Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0292' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0292' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T15:45:52Z' WHERE id = 'seed-p-0292' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0293', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T15:49:42Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0293' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0293' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T15:49:42Z' WHERE id = 'seed-p-0293' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0294', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:50:29Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0294' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0294' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:50:29Z' WHERE id = 'seed-p-0294' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0295', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-16T14:53:23Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0295' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0295' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-16T14:53:23Z' WHERE id = 'seed-p-0295' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0297', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:49:01Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0297' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0297' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:49:01Z' WHERE id = 'seed-p-0297' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0298', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-10T14:09:56Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0298' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0298' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-10T14:09:56Z' WHERE id = 'seed-p-0298' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0299', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:06:35Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0299' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0299' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:06:35Z' WHERE id = 'seed-p-0299' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0300', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T12:02:59Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0300' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0300' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T12:02:59Z' WHERE id = 'seed-p-0300' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0301', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-22T02:24:22Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0301' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0301' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T02:24:22Z' WHERE id = 'seed-p-0301' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0302', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-10-21T12:04:34Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0302' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0302' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-21T12:04:34Z' WHERE id = 'seed-p-0302' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0303', json_object('last_photo_at', '2026-10-19T19:51:09Z'), json_object('last_photo_at', '2026-11-01T01:09:18Z', 'source', 'portal')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0303' AND last_photo_at = '2026-10-19T19:51:09Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0303' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-11-01T01:09:18Z' WHERE id = 'seed-p-0303' AND last_photo_at = '2026-10-19T19:51:09Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0304', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-26T12:09:02Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0304' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0304' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-26T12:09:02Z' WHERE id = 'seed-p-0304' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0305', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-23T00:53:15Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0305' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0305' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:53:15Z' WHERE id = 'seed-p-0305' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0306', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-26T12:03:48Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0306' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0306' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-26T12:03:48Z' WHERE id = 'seed-p-0306' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0307', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-24T01:31:45Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0307' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0307' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T01:31:45Z' WHERE id = 'seed-p-0307' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0308', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-24T02:42:45Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0308' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0308' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T02:42:45Z' WHERE id = 'seed-p-0308' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0309', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-23T00:54:44Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0309' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0309' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:54:44Z' WHERE id = 'seed-p-0309' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0310', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-22T15:47:50Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0310' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0310' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T15:47:50Z' WHERE id = 'seed-p-0310' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0311', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-24T01:56:43Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0311' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0311' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T01:56:43Z' WHERE id = 'seed-p-0311' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0312', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-23T00:51:45Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0312' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0312' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-23T00:51:45Z' WHERE id = 'seed-p-0312' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0313', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-26T12:06:28Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0313' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0313' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-26T12:06:28Z' WHERE id = 'seed-p-0313' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0315', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-24T01:43:12Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0315' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0315' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-24T01:43:12Z' WHERE id = 'seed-p-0315' AND last_photo_at = '2026-10-31T03:32:28Z';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T14:25:03Z', 'system', 'claude', 'puppy.photo_clock_backfill', 'puppy', 'seed-p-0316', json_object('last_photo_at', '2026-10-31T03:32:28Z'), json_object('last_photo_at', '2026-10-22T15:44:28Z', 'source', 'wix')
   WHERE EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0316' AND last_photo_at = '2026-10-31T03:32:28Z')
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity = 'puppy' AND entity_id = 'seed-p-0316' AND action = 'puppy.photo_clock_backfill');
UPDATE puppies SET last_photo_at = '2026-10-22T15:44:28Z' WHERE id = 'seed-p-0316' AND last_photo_at = '2026-10-31T03:32:28Z';
