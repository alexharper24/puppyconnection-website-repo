-- Areas on the launch checklist (Alex, 2026-10-20). The open items sit in a few broad areas, so the
-- ones that belong together can be handled together, and "By area" is the admin's default view.
-- Areas are listed in the order that unblocks the most, starting with the domain and email. Each item
-- takes one area, which Alex and Amber can change in the item editor, and an item with none groups
-- under its section. The Gate items take an area only where one fits, which is Stripe Connect under
-- Payments. Site and portal build holds the launch build work, all of it done today.
--
-- The three grants under Access to grant each get parts that say who gives the grant and who uses it.
-- Search Console access becomes its own item there, so Amber's part moves from the Search Console
-- item to it. Her old part is archived (kept, never deleted) and the Search Console item now waits on
-- the access item. Claude records these on Alex's instruction, so each audit row says so.
-- No prices go in the database. Back up D1 first and confirm the export printed "Downloaded".
-- Run it once. The ALTER comes first, so a second run stops there before anything else changes, and
-- every statement after it is also safe to repeat. Each statement writes one row or one IN list,
-- because D1 refuses a compound SELECT with many terms (a multi-row VALUES list counts as one).

CREATE TABLE IF NOT EXISTS checklist_areas (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
ALTER TABLE checklist_items ADD COLUMN area TEXT REFERENCES checklist_areas(id);
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('domain-email', 'Domain and email', 1, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('access', 'Access to grant', 2, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('content', 'Content and wording from Amber', 3, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('payments', 'Payments', 4, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('listings', 'Listings and data', 5, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('search', 'Search, analytics and cutover', 6, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('readiness', 'Readiness and training', 7, '2026-10-20T16:00:00Z');
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES ('build', 'Site and portal build', 8, '2026-10-20T16:00:00Z');

-- The Search Console access item, before the areas are set so it takes its own.
INSERT OR IGNORE INTO checklist_items (id, ref, section, position, title, description, owner, status, waiting_on, waiting_owner, created_at, created_by, updated_at, version) VALUES
  ('cl-081', 'E6', 'launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Search Console access for Alex',
   'Amber gives Alex owner access to the Search Console property for puppy-connection.com, so he can verify the new site and submit its sitemap at cutover. Alex''s own Search Console holds no property for the domain today, though the live site carries a verification tag.',
   'Amber', 'waiting', 'Amber giving Alex access to Search Console for puppy-connection.com', 'Amber', '2026-10-20T16:00:00Z', 'Claude', '2026-10-20T16:00:00Z', 1);
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-081', NULL,
         json_object('title', 'Search Console access for Alex', 'section', 'launch', 'owner', 'Amber', 'status', 'waiting', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = 'cl-081' AND action = 'checklist.add');

-- The parts for each grant, each with one audit row.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-012', NULL, json_object('part', 'cl-012-1', 'title', 'Choose the Puppy Connection Google account that owns sign-in, with Alex', 'owner', 'Amber', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-012-1');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-012-1', 'cl-012', 1, 'Choose the Puppy Connection Google account that owns sign-in, with Alex', 'Amber', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-012', NULL, json_object('part', 'cl-012-2', 'title', 'Give Alex access to a Google Cloud project under that account', 'owner', 'Amber', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-012-2');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-012-2', 'cl-012', 2, 'Give Alex access to a Google Cloud project under that account', 'Amber', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-012', NULL, json_object('part', 'cl-012-3', 'title', 'Move sign-in to that project, publish the consent screen and add the real portal address', 'owner', 'Alex', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-012-3');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-012-3', 'cl-012', 3, 'Move sign-in to that project, publish the consent screen and add the real portal address', 'Alex', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-013', NULL, json_object('part', 'cl-013-1', 'title', 'Confirm the address Luke signs in with', 'owner', 'Amber', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-013-1');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-013-1', 'cl-013', 1, 'Confirm the address Luke signs in with', 'Amber', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-013', NULL, json_object('part', 'cl-013-2', 'title', 'Add Luke to the admin sign-in policy and the people list as an owner', 'owner', 'Alex', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-013-2');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-013-2', 'cl-013', 2, 'Add Luke to the admin sign-in policy and the people list as an owner', 'Alex', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-013', NULL, json_object('part', 'cl-013-3', 'title', 'Put the admin sign-in on admin.puppy-connection.com with the two-step check', 'owner', 'Alex', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-013-3');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-013-3', 'cl-013', 3, 'Put the admin sign-in on admin.puppy-connection.com with the two-step check', 'Alex', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-081', NULL, json_object('part', 'cl-081-1', 'title', 'Give Alex owner access to Search Console for puppy-connection.com', 'owner', 'Amber', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-081-1');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-081-1', 'cl-081', 1, 'Give Alex owner access to Search Console for puppy-connection.com', 'Amber', '2026-10-20T16:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-081', NULL, json_object('part', 'cl-081-2', 'title', 'Confirm the property opens in his Search Console', 'owner', 'Alex', 'as', 'Claude')
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-081-2');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-081-2', 'cl-081', 2, 'Confirm the property opens in his Search Console', 'Alex', '2026-10-20T16:00:00Z', 'Claude');

-- Amber's Search Console part moves to the access item.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.archive', 'checklist_item', 'cl-024', NULL,
         json_object('part', 'cl-024-2', 'title', 'Give Search Console access', 'as', 'Claude', 'why', 'moved to Search Console access for Alex')
   WHERE EXISTS (SELECT 1 FROM checklist_parts WHERE id = 'cl-024-2' AND archived_at IS NULL);
UPDATE checklist_parts SET archived_at = '2026-10-20T16:00:00Z', archived_by = 'Alex' WHERE id = 'cl-024-2' AND archived_at IS NULL;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('waiting_on', waiting_on),
         json_object('waiting_on', 'Search Console access for Alex, under Access to grant', 'as', 'Claude')
    FROM checklist_items WHERE id = 'cl-024' AND status = 'waiting' AND waiting_on = 'Amber giving Search Console access';
UPDATE checklist_items SET waiting_on = 'Search Console access for Alex, under Access to grant', updated_at = '2026-10-20T16:00:00Z', version = version + 1
 WHERE id = 'cl-024' AND status = 'waiting' AND waiting_on = 'Amber giving Search Console access';

-- Each item's area, with one audit row per item. Only an item with no area yet is set, so a change
-- Alex or Amber makes in the editor is never put back.
-- Domain and email
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'domain-email', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-021', 'cl-022', 'cl-074', 'cl-075', 'cl-011', 'cl-076', 'cl-040');
UPDATE checklist_items SET area = 'domain-email', version = version + 1 WHERE area IS NULL AND id IN ('cl-021', 'cl-022', 'cl-074', 'cl-075', 'cl-011', 'cl-076', 'cl-040');
-- Access to grant
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'access', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-012', 'cl-013', 'cl-081');
UPDATE checklist_items SET area = 'access', version = version + 1 WHERE area IS NULL AND id IN ('cl-012', 'cl-013', 'cl-081');
-- Content and wording from Amber
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'content', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-073', 'cl-005', 'cl-006', 'cl-017', 'cl-008', 'cl-009', 'cl-018', 'cl-019', 'cl-020', 'cl-043');
UPDATE checklist_items SET area = 'content', version = version + 1 WHERE area IS NULL AND id IN ('cl-073', 'cl-005', 'cl-006', 'cl-017', 'cl-008', 'cl-009', 'cl-018', 'cl-019', 'cl-020', 'cl-043');
-- Payments
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'payments', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-010', 'cl-029', 'cl-071');
UPDATE checklist_items SET area = 'payments', version = version + 1 WHERE area IS NULL AND id IN ('cl-010', 'cl-029', 'cl-071');
-- Listings and data
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'listings', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-014', 'cl-015', 'cl-028', 'cl-042', 'cl-016', 'cl-038', 'cl-079');
UPDATE checklist_items SET area = 'listings', version = version + 1 WHERE area IS NULL AND id IN ('cl-014', 'cl-015', 'cl-028', 'cl-042', 'cl-016', 'cl-038', 'cl-079');
-- Search, analytics and cutover
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'search', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-023', 'cl-024', 'cl-078', 'cl-025', 'cl-026');
UPDATE checklist_items SET area = 'search', version = version + 1 WHERE area IS NULL AND id IN ('cl-023', 'cl-024', 'cl-078', 'cl-025', 'cl-026');
-- Readiness and training
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'readiness', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-027', 'cl-030', 'cl-031', 'cl-032', 'cl-077', 'cl-041', 'cl-001');
UPDATE checklist_items SET area = 'readiness', version = version + 1 WHERE area IS NULL AND id IN ('cl-027', 'cl-030', 'cl-031', 'cl-032', 'cl-077', 'cl-041', 'cl-001');
-- Site and portal build
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', NULL), json_object('area', 'build', 'as', 'Claude')
    FROM checklist_items WHERE area IS NULL AND id IN ('cl-002', 'cl-003', 'cl-004', 'cl-007', 'cl-033', 'cl-034', 'cl-035', 'cl-036', 'cl-037', 'cl-039', 'cl-044', 'cl-045', 'cl-046', 'cl-047', 'cl-048', 'cl-049', 'cl-050', 'cl-051', 'cl-052', 'cl-053', 'cl-054', 'cl-055', 'cl-056', 'cl-057');
UPDATE checklist_items SET area = 'build', version = version + 1 WHERE area IS NULL AND id IN ('cl-002', 'cl-003', 'cl-004', 'cl-007', 'cl-033', 'cl-034', 'cl-035', 'cl-036', 'cl-037', 'cl-039', 'cl-044', 'cl-045', 'cl-046', 'cl-047', 'cl-048', 'cl-049', 'cl-050', 'cl-051', 'cl-052', 'cl-053', 'cl-054', 'cl-055', 'cl-056', 'cl-057');
