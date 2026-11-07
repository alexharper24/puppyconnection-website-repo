-- Alex, 2026-11-07 (docs/batch-2026-11-07-ahrefs-fixes.md). Brittany the Great Dane (seed-p-0049) linked to her page on the
-- breeder's site, https://responsibledogbreeder.com/puppies/brittany/, which answers 404 since at least the Ahrefs crawl
-- of 2026-11-07. The link is cleared, so her page shows no button out until the breeder gives a new one, as for Carmen.
-- Guarded on the old address, so a second run changes nothing. Generated 2026-11-07T20:34:01Z.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, '2026-11-07T20:34:01Z'), generation = generation + 1
  WHERE id = 1 AND EXISTS (SELECT 1 FROM puppies WHERE id = 'seed-p-0049' AND breeder_url = 'https://responsibledogbreeder.com/puppies/brittany/');
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
  SELECT '2026-11-07T20:34:01Z', 'system', 'claude', 'puppy.update', 'puppy', id, json_object('breeder_url', breeder_url),
         json_object('breeder_url', NULL, 'why', 'link answers 404, Ahrefs crawl 2026-11-07, Alex 2026-11-07')
    FROM puppies WHERE id = 'seed-p-0049' AND breeder_url = 'https://responsibledogbreeder.com/puppies/brittany/';
UPDATE puppies SET breeder_url = NULL, updated_at = '2026-11-07T20:34:01Z', version = version + 1
  WHERE id = 'seed-p-0049' AND breeder_url = 'https://responsibledogbreeder.com/puppies/brittany/';
