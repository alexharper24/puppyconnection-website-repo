-- Removes the pending breeder sign-up luke.blakeslee@gmail.com made on 2026-10-27 (Alex, 2026-10-29).
-- It held a name-less profile and two sessions, no password, no listings and no payments, so the
-- breeder row goes too and the address can sign up again later. The activity record stays. Back up
-- D1 first and confirm the export printed "Downloaded". Re-running changes nothing.
DELETE FROM sessions WHERE breeder_id = '01M5XJYW3K9YP43CEQ3P5X67F8';
DELETE FROM breeder_profiles WHERE breeder_id = '01M5XJYW3K9YP43CEQ3P5X67F8';
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-29T17:09:52Z', 'system', 'claude', 'breeder.removed', 'breeder', '01M5XJYW3K9YP43CEQ3P5X67F8', json_object('email', 'luke.blakeslee@gmail.com', 'status', 'pending'),
         json_object('why', 'Alex, 2026-10-29, a pending sign-up with no profile text, listings or payments')
   WHERE EXISTS (SELECT 1 FROM breeders WHERE id = '01M5XJYW3K9YP43CEQ3P5X67F8' AND status = 'pending' AND profile_submitted_at IS NULL)
     AND NOT EXISTS (SELECT 1 FROM audit_log WHERE entity_id = '01M5XJYW3K9YP43CEQ3P5X67F8' AND action = 'breeder.removed');
DELETE FROM breeders WHERE id = '01M5XJYW3K9YP43CEQ3P5X67F8' AND status = 'pending' AND profile_submitted_at IS NULL;
