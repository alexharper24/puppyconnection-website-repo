-- Alex 2026-10-31, the night before launch. These 27 puppies are marked *ADOPTED* on the live Wix store
-- (read 2026-10-31T03:22:17Z) but were still available here. Each becomes placed, the state a breeder sets with Adopted in the
-- portal; the trigger from migration 0019 stamps placed_at. Only a puppy still available changes, so a second run
-- changes nothing. Back up D1 first and confirm the export printed "Downloaded".
--   Queenie - Shih Tzu
--   Khalil - Cavalier King Charles Spaniel
--   Matilda - Cavapoo
--   Curly - Miniature  Poodle
--   Lexa - French Bulldog
--   Pearl - Great Dane
--   Kaylin - Miniature Poodle
--   Kyla - Miniature Poodle
--   Winnie - Havanese
--   Illius - Cavapoo
--   Asher - Miniature Dachshund
--   Ridge - Mini Bernedoodle
--   Phineas - Labrador Retriever
--   Blaise - Cavapoo
--   Darcy - Havanese
--   Leo - Maltese
--   Bonnie - Cavalier King Charles Spaniel
--   Iris - Havanese
--   Magnolia - Miniature Schnauzer
--   Romeo - Papillon
--   Amore - Cavapoo
--   Norah - Golden Retriever
--   Summit - Mini Bernedoodle
--   Riley - Miniature  Poodle
--   Amy - Golden Retriever
--   Rookie - Havanese
--   Marco - Cavalier King Charles Spaniel
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-10-31T03:22:17Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM puppies WHERE id IN ('seed-p-0227', 'seed-p-0153', 'seed-p-0184', 'seed-p-0079', 'seed-p-0168', 'seed-p-0214', 'seed-p-0149', 'seed-p-0157', 'seed-p-0272', 'seed-p-0125', 'seed-p-0015', 'seed-p-0234', 'seed-p-0221', 'seed-p-0036', 'seed-p-0084', 'seed-p-0284', 'seed-p-0041', 'seed-p-0126', 'seed-p-0180', 'seed-p-0237', 'seed-p-0003', 'seed-p-0201', 'seed-p-0251', 'seed-p-0235', 'seed-p-0004', 'seed-p-0238', 'seed-p-0288') AND availability != 'placed');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-10-31T03:22:17Z', 'system', 'claude', 'puppy.placed', 'puppy', id, json_object('availability', availability), json_object('availability', 'placed', 'why', 'Alex, 2026-10-31, marked adopted on the Wix store')
    FROM puppies WHERE id IN ('seed-p-0227', 'seed-p-0153', 'seed-p-0184', 'seed-p-0079', 'seed-p-0168', 'seed-p-0214', 'seed-p-0149', 'seed-p-0157', 'seed-p-0272', 'seed-p-0125', 'seed-p-0015', 'seed-p-0234', 'seed-p-0221', 'seed-p-0036', 'seed-p-0084', 'seed-p-0284', 'seed-p-0041', 'seed-p-0126', 'seed-p-0180', 'seed-p-0237', 'seed-p-0003', 'seed-p-0201', 'seed-p-0251', 'seed-p-0235', 'seed-p-0004', 'seed-p-0238', 'seed-p-0288') AND availability != 'placed';
UPDATE puppies SET availability = 'placed', updated_at = '2026-10-31T03:22:17Z', version = version + 1
  WHERE id IN ('seed-p-0227', 'seed-p-0153', 'seed-p-0184', 'seed-p-0079', 'seed-p-0168', 'seed-p-0214', 'seed-p-0149', 'seed-p-0157', 'seed-p-0272', 'seed-p-0125', 'seed-p-0015', 'seed-p-0234', 'seed-p-0221', 'seed-p-0036', 'seed-p-0084', 'seed-p-0284', 'seed-p-0041', 'seed-p-0126', 'seed-p-0180', 'seed-p-0237', 'seed-p-0003', 'seed-p-0201', 'seed-p-0251', 'seed-p-0235', 'seed-p-0004', 'seed-p-0238', 'seed-p-0288') AND availability != 'placed';
