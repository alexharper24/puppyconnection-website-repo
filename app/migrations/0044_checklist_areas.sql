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
-- every statement after it is also safe to repeat.

CREATE TABLE IF NOT EXISTS checklist_areas (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  position   INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
ALTER TABLE checklist_items ADD COLUMN area TEXT REFERENCES checklist_areas(id);
INSERT OR IGNORE INTO checklist_areas (id, name, position, created_at) VALUES
  ('domain-email', 'Domain and email', 1, '2026-10-20T16:00:00Z'),
  ('access', 'Access to grant', 2, '2026-10-20T16:00:00Z'),
  ('content', 'Content and wording from Amber', 3, '2026-10-20T16:00:00Z'),
  ('payments', 'Payments', 4, '2026-10-20T16:00:00Z'),
  ('listings', 'Listings and data', 5, '2026-10-20T16:00:00Z'),
  ('search', 'Search, analytics and cutover', 6, '2026-10-20T16:00:00Z'),
  ('readiness', 'Readiness and training', 7, '2026-10-20T16:00:00Z'),
  ('build', 'Site and portal build', 8, '2026-10-20T16:00:00Z');

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
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', p.item_id, NULL, json_object('part', p.id, 'title', p.title, 'owner', p.owner, 'as', 'Claude')
    FROM (SELECT 'cl-012-1' AS id, 'cl-012' AS item_id, 'Choose the Puppy Connection Google account that owns sign-in, with Alex' AS title, 'Amber' AS owner
          UNION ALL SELECT 'cl-012-2', 'cl-012', 'Give Alex access to a Google Cloud project under that account', 'Amber'
          UNION ALL SELECT 'cl-012-3', 'cl-012', 'Move sign-in to that project, publish the consent screen and add the real portal address', 'Alex'
          UNION ALL SELECT 'cl-013-1', 'cl-013', 'Confirm the address Luke signs in with', 'Amber'
          UNION ALL SELECT 'cl-013-2', 'cl-013', 'Add Luke to the admin sign-in policy and the people list as an owner', 'Alex'
          UNION ALL SELECT 'cl-013-3', 'cl-013', 'Put the admin sign-in on admin.puppy-connection.com with the two-step check', 'Alex'
          UNION ALL SELECT 'cl-081-1', 'cl-081', 'Give Alex owner access to Search Console for puppy-connection.com', 'Amber'
          UNION ALL SELECT 'cl-081-2', 'cl-081', 'Confirm the property opens in his Search Console', 'Alex') p
   WHERE NOT EXISTS (SELECT 1 FROM checklist_parts c WHERE c.id = p.id);
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES
  ('cl-012-1', 'cl-012', 1, 'Choose the Puppy Connection Google account that owns sign-in, with Alex', 'Amber', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-012-2', 'cl-012', 2, 'Give Alex access to a Google Cloud project under that account', 'Amber', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-012-3', 'cl-012', 3, 'Move sign-in to that project, publish the consent screen and add the real portal address', 'Alex', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-013-1', 'cl-013', 1, 'Confirm the address Luke signs in with', 'Amber', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-013-2', 'cl-013', 2, 'Add Luke to the admin sign-in policy and the people list as an owner', 'Alex', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-013-3', 'cl-013', 3, 'Put the admin sign-in on admin.puppy-connection.com with the two-step check', 'Alex', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-081-1', 'cl-081', 1, 'Give Alex owner access to Search Console for puppy-connection.com', 'Amber', '2026-10-20T16:00:00Z', 'Claude'),
  ('cl-081-2', 'cl-081', 2, 'Confirm the property opens in his Search Console', 'Alex', '2026-10-20T16:00:00Z', 'Claude');

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
WITH m(id, area) AS (VALUES
  ('cl-021', 'domain-email'),
  ('cl-022', 'domain-email'),
  ('cl-074', 'domain-email'),
  ('cl-075', 'domain-email'),
  ('cl-011', 'domain-email'),
  ('cl-076', 'domain-email'),
  ('cl-040', 'domain-email'),
  ('cl-012', 'access'),
  ('cl-013', 'access'),
  ('cl-081', 'access'),
  ('cl-073', 'content'),
  ('cl-005', 'content'),
  ('cl-006', 'content'),
  ('cl-017', 'content'),
  ('cl-008', 'content'),
  ('cl-009', 'content'),
  ('cl-018', 'content'),
  ('cl-019', 'content'),
  ('cl-020', 'content'),
  ('cl-043', 'content'),
  ('cl-010', 'payments'),
  ('cl-029', 'payments'),
  ('cl-071', 'payments'),
  ('cl-014', 'listings'),
  ('cl-015', 'listings'),
  ('cl-028', 'listings'),
  ('cl-042', 'listings'),
  ('cl-016', 'listings'),
  ('cl-038', 'listings'),
  ('cl-079', 'listings'),
  ('cl-023', 'search'),
  ('cl-024', 'search'),
  ('cl-078', 'search'),
  ('cl-025', 'search'),
  ('cl-026', 'search'),
  ('cl-027', 'readiness'),
  ('cl-030', 'readiness'),
  ('cl-031', 'readiness'),
  ('cl-032', 'readiness'),
  ('cl-077', 'readiness'),
  ('cl-041', 'readiness'),
  ('cl-001', 'readiness'),
  ('cl-002', 'build'),
  ('cl-003', 'build'),
  ('cl-004', 'build'),
  ('cl-007', 'build'),
  ('cl-033', 'build'),
  ('cl-034', 'build'),
  ('cl-035', 'build'),
  ('cl-036', 'build'),
  ('cl-037', 'build'),
  ('cl-039', 'build'),
  ('cl-044', 'build'),
  ('cl-045', 'build'),
  ('cl-046', 'build'),
  ('cl-047', 'build'),
  ('cl-048', 'build'),
  ('cl-049', 'build'),
  ('cl-050', 'build'),
  ('cl-051', 'build'),
  ('cl-052', 'build'),
  ('cl-053', 'build'),
  ('cl-054', 'build'),
  ('cl-055', 'build'),
  ('cl-056', 'build'),
  ('cl-057', 'build'))
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-20T16:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', i.id, json_object('area', NULL), json_object('area', m.area, 'as', 'Claude')
    FROM checklist_items i JOIN m ON m.id = i.id WHERE i.area IS NULL;
WITH m(id, area) AS (VALUES
  ('cl-021', 'domain-email'),
  ('cl-022', 'domain-email'),
  ('cl-074', 'domain-email'),
  ('cl-075', 'domain-email'),
  ('cl-011', 'domain-email'),
  ('cl-076', 'domain-email'),
  ('cl-040', 'domain-email'),
  ('cl-012', 'access'),
  ('cl-013', 'access'),
  ('cl-081', 'access'),
  ('cl-073', 'content'),
  ('cl-005', 'content'),
  ('cl-006', 'content'),
  ('cl-017', 'content'),
  ('cl-008', 'content'),
  ('cl-009', 'content'),
  ('cl-018', 'content'),
  ('cl-019', 'content'),
  ('cl-020', 'content'),
  ('cl-043', 'content'),
  ('cl-010', 'payments'),
  ('cl-029', 'payments'),
  ('cl-071', 'payments'),
  ('cl-014', 'listings'),
  ('cl-015', 'listings'),
  ('cl-028', 'listings'),
  ('cl-042', 'listings'),
  ('cl-016', 'listings'),
  ('cl-038', 'listings'),
  ('cl-079', 'listings'),
  ('cl-023', 'search'),
  ('cl-024', 'search'),
  ('cl-078', 'search'),
  ('cl-025', 'search'),
  ('cl-026', 'search'),
  ('cl-027', 'readiness'),
  ('cl-030', 'readiness'),
  ('cl-031', 'readiness'),
  ('cl-032', 'readiness'),
  ('cl-077', 'readiness'),
  ('cl-041', 'readiness'),
  ('cl-001', 'readiness'),
  ('cl-002', 'build'),
  ('cl-003', 'build'),
  ('cl-004', 'build'),
  ('cl-007', 'build'),
  ('cl-033', 'build'),
  ('cl-034', 'build'),
  ('cl-035', 'build'),
  ('cl-036', 'build'),
  ('cl-037', 'build'),
  ('cl-039', 'build'),
  ('cl-044', 'build'),
  ('cl-045', 'build'),
  ('cl-046', 'build'),
  ('cl-047', 'build'),
  ('cl-048', 'build'),
  ('cl-049', 'build'),
  ('cl-050', 'build'),
  ('cl-051', 'build'),
  ('cl-052', 'build'),
  ('cl-053', 'build'),
  ('cl-054', 'build'),
  ('cl-055', 'build'),
  ('cl-056', 'build'),
  ('cl-057', 'build'))
UPDATE checklist_items SET area = (SELECT m.area FROM m WHERE m.id = checklist_items.id), version = version + 1
 WHERE area IS NULL AND id IN (SELECT id FROM m);
