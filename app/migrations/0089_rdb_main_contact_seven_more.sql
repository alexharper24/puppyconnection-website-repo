-- Alex, 2026-11-01 (docs/batch-2026-11-02-post-launch.md, n11-rdb-21). The Responsible Dog Breeder Network manages 21
-- kennels to start. Fourteen took the network address as their main contact in 0085. These seven take it now in place
-- of their placeholder addresses. Nobody has signed in to them, so no session or password changes, and one invitation
-- to the network address then opens all of them. Main contact addresses are private, so the site does not change and
-- there is no publish marker. Each change is guarded on the placeholder address, so a second run changes nothing.
-- Generated 2026-11-01T21:26:41Z.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-pawprintacres', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-pawprintacres' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-pawprintacres' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-heartlandminischnauzers', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-heartlandminischnauzers' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-heartlandminischnauzers' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-tmcountrysidek9', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-tmcountrysidek9' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-tmcountrysidek9' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-willowlanebulldogs', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-willowlanebulldogs' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-willowlanebulldogs' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-maplelanepets', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-maplelanepets' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-maplelanepets' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-cornerstonecavaliers', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-cornerstonecavaliers' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-cornerstonecavaliers' AND email LIKE '%@breeders.test';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-01T21:26:41Z', 'operator', 'claude', 'breeder.email', 'breeder', 'seed-perfectmatchpoodles', json_object('email', email), json_object('email', 'administrator@responsibledogbreeder.com', 'why', 'RDB network main contact, Alex 2026-11-01')
    FROM breeders WHERE id = 'seed-perfectmatchpoodles' AND email LIKE '%@breeders.test';
UPDATE breeders SET email = 'administrator@responsibledogbreeder.com', updated_at = '2026-11-01T21:26:41Z', version = version + 1 WHERE id = 'seed-perfectmatchpoodles' AND email LIKE '%@breeders.test';
