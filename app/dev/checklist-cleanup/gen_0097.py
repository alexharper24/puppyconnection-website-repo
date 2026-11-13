"""Generate migrations/0097_checklist_cleanup.sql (Alex, 2026-11-12).

Alex's ask: the launch list is finished, so mark every launch item done, take the 30-day items off,
move Stripe Connect and puppy video to Gate 1, and clear the other gate items so Amber's choices
from the menu fill the gates back in. Real email and the nightly backup are done too (Alex's answer,
2026-11-12). Nothing is deleted: an item leaves the list by archived_at, as the admin does it.
Every write is guarded, so a second run changes nothing.
"""
from datetime import datetime, timezone
from pathlib import Path

NOW = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
WHY = 'Checklist cleanup asked for by Alex 2026-11-12'

# Open launch items Alex says are done.
DONE = ['cl-073', 'cl-009', 'cl-013', 'cl-075', 'cl-076', 'cl-086', 'cl-087',
        # After launch items Alex says are done, which move out of Gate 1 into the launch list.
        'cl-011', 'cl-027', 'cl-030', 'cl-031']
TO_LAUNCH = ['cl-011', 'cl-027', 'cl-030', 'cl-031']
# Done items that still show open parts get those parts ticked too.
DONE_WITH_OPEN_PARTS = ['cl-021', 'cl-029', 'cl-059', 'cl-078', 'cl-089', 'cl-090', 'cl-092']
# 30-day items that belong to monthly care, and Search Console, which Alex says to remove.
ARCHIVE_REMOVED = ['cl-032', 'cl-093', 'cl-024']
# Gate items cleared for Amber to choose from the menu.
ARCHIVE_GATES = ['cl-058', 'cl-061', 'cl-062', 'cl-064', 'cl-082', 'cl-083',
                 'cl-065', 'cl-066', 'cl-067', 'cl-068', 'cl-069', 'cl-070', 'cl-072']

q = lambda xs: ', '.join(f"'{x}'" for x in xs)
out = [f'-- Checklist cleanup ({WHY}). Generated {NOW} by app/dev/checklist-cleanup/gen_0097.py.',
       '-- Back up D1 first and confirm the export printed "Downloaded". Re-running changes nothing,',
       '-- because every write is guarded on the state it changes. Nothing is deleted.', '']

# 1. Items marked done. Audit first, guarded on the item not being done yet.
out.append('-- 1. Items Alex says are done')
out.append(f"""INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{NOW}', 'system', 'claude', 'checklist.edit', 'checklist_item', i.id, json_object('status', i.status), json_object('status', 'done', 'reason', '{WHY}', 'as', 'Alex')
    FROM checklist_items i WHERE i.id IN ({q(DONE)}) AND i.status != 'done';""")
out.append(f"""UPDATE checklist_items SET status = 'done', waiting_on = NULL, waiting_owner = NULL, done_at = '{NOW}', done_by = 'Alex', updated_at = '{NOW}', version = version + 1
  WHERE id IN ({q(DONE)}) AND status != 'done';""")
out.append('')

# 2. Open parts on every item now done.
parts_of = DONE + DONE_WITH_OPEN_PARTS
out.append('-- 2. Open parts on those items, and on done items that still showed open parts')
out.append(f"""INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{NOW}', 'system', 'claude', 'checklist.part.tick', 'checklist_item', p.item_id, NULL, json_object('part', p.id, 'title', p.title, 'reason', '{WHY}', 'as', 'Alex')
    FROM checklist_parts p WHERE p.item_id IN ({q(parts_of)}) AND p.done_at IS NULL AND p.archived_at IS NULL;""")
out.append(f"""UPDATE checklist_parts SET done_at = '{NOW}', done_by = 'Alex'
  WHERE item_id IN ({q(parts_of)}) AND done_at IS NULL AND archived_at IS NULL;""")
out.append('')

# 3. Finished after-launch items leave Gate 1 for the launch list, keeping their area.
out.append('-- 3. Finished after-launch items move from Gate 1 to the launch list')
for n, iid in enumerate(TO_LAUNCH):
    out.append(f"""INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{NOW}', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'position', position), json_object('section', 'launch', 'reason', '{WHY}', 'as', 'Alex')
    FROM checklist_items WHERE id = '{iid}' AND section = 'gate1';""")
    out.append(f"""UPDATE checklist_items SET section = 'launch', position = (SELECT COALESCE(MAX(position), 0) + 1 FROM checklist_items WHERE section = 'launch'), updated_at = '{NOW}', version = version + 1
  WHERE id = '{iid}' AND section = 'gate1';""")
out.append('')

# 4. Stripe Connect and puppy video move to the top of Gate 1, as open items.
out.append('-- 4. Stripe Connect and puppy video move to Gate 1')
out.append(f"""INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{NOW}', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('section', section, 'area', area, 'title', title), json_object('section', 'gate1', 'area', NULL, 'title', 'Stripe Connect for breeders', 'reason', '{WHY}', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-071' AND section = 'gate3';""")
out.append(f"""UPDATE checklist_items SET section = 'gate1', area = NULL, position = 1, title = 'Stripe Connect for breeders', updated_at = '{NOW}', version = version + 1
  WHERE id = 'cl-071' AND section = 'gate3';""")
out.append(f"""INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{NOW}', 'system', 'claude', 'checklist.edit', 'checklist_item', id, json_object('area', area, 'status', status, 'waiting_on', waiting_on), json_object('area', NULL, 'status', 'not_started', 'waiting_on', NULL, 'reason', '{WHY}', 'as', 'Alex')
    FROM checklist_items WHERE id = 'cl-080' AND area = 'after-launch';""")
out.append(f"""UPDATE checklist_items SET area = NULL, position = 2, status = 'not_started', waiting_on = NULL, waiting_owner = NULL, updated_at = '{NOW}', version = version + 1
  WHERE id = 'cl-080' AND area = 'after-launch';""")
out.append('')

# 5. Archive. Audit first, guarded on the item not being archived yet.
for label, ids, reason in (('Items that belong to monthly care, and Search Console', ARCHIVE_REMOVED, 'Part of monthly care, not a launch item (Alex 2026-11-12)'),
                           ('Gate items cleared for Amber to choose from the menu', ARCHIVE_GATES, 'Gates cleared so Amber chooses from the menu (Alex 2026-11-12)')):
    out.append(f'-- 5. {label}')
    out.append(f"""INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '{NOW}', 'system', 'claude', 'checklist.archive', 'checklist_item', id, NULL, json_object('reason', '{reason}', 'as', 'Alex')
    FROM checklist_items WHERE id IN ({q(ids)}) AND archived_at IS NULL;""")
    out.append(f"""UPDATE checklist_items SET archived_at = '{NOW}', archived_by = 'Alex', updated_at = '{NOW}', version = version + 1
  WHERE id IN ({q(ids)}) AND archived_at IS NULL;""")
    out.append('')

dst = Path(__file__).resolve().parents[2] / 'migrations' / '0097_checklist_cleanup.sql'
dst.write_text('\n'.join(out), encoding='utf-8', newline='\n')
print(dst, NOW)
