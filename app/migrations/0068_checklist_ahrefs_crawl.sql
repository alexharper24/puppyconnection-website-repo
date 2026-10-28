-- Two launch checklist items from the 2026-10-28 Ahrefs crawl of the Wix site (Alex approved 2026-10-28):
-- a new crawl on cutover day compared with the baseline, and a month of weekly reviews after it.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing, because
-- every write is guarded.

INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, created_at, created_by, updated_at, version)
  SELECT 'cl-092', 'A30', 'launch', 'search', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), 'Ahrefs crawl on cutover day', 'Run a new Ahrefs crawl of puppy-connection.com on cutover day and compare it with the October 28 baseline of the old site, so anything not at its target is fixed in the first days.', 'Alex', 'not_started', '2026-10-28T20:00:00Z', 'Claude', '2026-10-28T20:00:00Z', 1
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-092');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-28T20:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-092', NULL, json_object('title', 'Ahrefs crawl on cutover day', 'status', 'not_started', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-092')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-092' AND a.action = 'checklist.add');

INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-092-1', 'cl-092', 1, 'Run a new crawl in Ahrefs once the domain points at the new site and robots.txt is open', 'Alex', '2026-10-28T20:00:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-092-2', 'cl-092', 2, 'Compare the crawl with the baseline and list what is not at its target', 'Claude', '2026-10-28T20:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-28T20:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-092', NULL, json_object('part', p.id, 'title', p.title, 'owner', p.owner, 'as', 'Claude')
    FROM checklist_parts p WHERE p.id IN ('cl-092-1', 'cl-092-2')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-092' AND a.action = 'checklist.part.add' AND json_extract(a.after_json, '$.part') = p.id);

INSERT OR IGNORE INTO checklist_items (id, ref, section, area, position, title, description, owner, status, created_at, created_by, updated_at, version)
  SELECT 'cl-093', 'A31', 'gate1', 'after-launch', (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'gate1'), 'Weekly Ahrefs review for the first month', 'Ahrefs already crawls the domain every Wednesday. Review each crawl for the first four weeks, then monthly, so a removed puppy that is still linked, or a missing tag, shows up within a week.', 'Alex', 'not_started', '2026-10-28T20:00:00Z', 'Claude', '2026-10-28T20:00:00Z', 1
   WHERE NOT EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-093');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-28T20:00:00Z', 'system', 'claude', 'checklist.add', 'checklist_item', 'cl-093', NULL, json_object('title', 'Weekly Ahrefs review for the first month', 'status', 'not_started', 'as', 'Claude')
   WHERE EXISTS (SELECT 1 FROM checklist_items WHERE id = 'cl-093')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-093' AND a.action = 'checklist.add');

INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-093-1', 'cl-093', 1, 'Turn on Ahrefs alerts for new errors', 'Alex', '2026-10-28T20:00:00Z', 'Claude');
INSERT OR IGNORE INTO checklist_parts (id, item_id, position, title, owner, created_at, created_by) VALUES ('cl-093-2', 'cl-093', 2, 'Review each Wednesday crawl for four weeks', 'Alex', '2026-10-28T20:00:00Z', 'Claude');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-28T20:00:00Z', 'system', 'claude', 'checklist.part.add', 'checklist_item', 'cl-093', NULL, json_object('part', p.id, 'title', p.title, 'owner', p.owner, 'as', 'Claude')
    FROM checklist_parts p WHERE p.id IN ('cl-093-1', 'cl-093-2')
     AND NOT EXISTS (SELECT 1 FROM audit_log a WHERE a.entity_id = 'cl-093' AND a.action = 'checklist.part.add' AND json_extract(a.after_json, '$.part') = p.id);
