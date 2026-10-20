-- Launch checklist owners are Alex and Amber only (Alex, 2026-10-19: "I just want it to be Amber
-- and Alex"). Work Claude does is Alex's, so every item, part and waiting line that names Claude
-- moves to Alex, and Luke's one part, attending the training, moves to Amber as "Luke attends the
-- training". Who ticked something (done_by) and who wrote a comment are records and stay as they
-- are. lib/checklist.js accepts only Alex and Amber from now on. Each moved item gets one audit row.
-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing.

INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-19T23:00:00Z', 'system', 'claude', 'checklist.edit', 'checklist_item', i.id,
         json_object('owner', i.owner, 'waiting_owner', i.waiting_owner),
         json_object('owner', CASE i.owner WHEN 'Claude' THEN 'Alex' WHEN 'Luke' THEN 'Amber' ELSE i.owner END,
                     'waiting_owner', CASE i.waiting_owner WHEN 'Claude' THEN 'Alex' WHEN 'Luke' THEN 'Amber' ELSE i.waiting_owner END,
                     'as', 'Claude', 'why', 'owners are Alex and Amber only')
    FROM checklist_items i
   WHERE i.owner IN ('Claude', 'Luke') OR i.waiting_owner IN ('Claude', 'Luke')
      OR EXISTS (SELECT 1 FROM checklist_parts p WHERE p.item_id = i.id AND p.owner IN ('Claude', 'Luke'));

UPDATE checklist_items SET owner = 'Alex', version = version + 1 WHERE owner = 'Claude';
UPDATE checklist_items SET owner = 'Amber', version = version + 1 WHERE owner = 'Luke';
UPDATE checklist_items SET waiting_owner = 'Alex' WHERE waiting_owner = 'Claude';
UPDATE checklist_items SET waiting_owner = 'Amber' WHERE waiting_owner = 'Luke';
UPDATE checklist_parts SET owner = 'Alex' WHERE owner = 'Claude';
UPDATE checklist_parts SET title = 'Luke attends the training' WHERE owner = 'Luke' AND title = 'Attend the training';
UPDATE checklist_parts SET owner = 'Amber' WHERE owner = 'Luke';
