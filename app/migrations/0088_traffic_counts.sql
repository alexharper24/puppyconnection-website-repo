-- Views and clicks for every page, and the pre-launch counts taken out (Alex, 2026-11-01).
--
-- 1. page_stats and traffic_daily for the admin's traffic chart, and a day index on puppy_stats
--    for its top pages (lib/stats.js, admin/worker.js traffic).
-- 2. Views and clicks before 2026-11-01 were the team's own testing, so the puppy counts and the
--    breed filter counts dated before then go. Measured on production 2026-11-01: puppy_stats held
--    22 rows dated 2026-10-30 to 2026-10-31 (44 views, 1 click). Launch day stays whole, because a
--    day is not split by the hour and the site went live during it.
-- 3. traffic_daily's puppy rows are set to the sums of puppy_stats. That is right whenever it runs,
--    so this file is applied before the site starts writing the new tables and again after, which
--    takes in any puppy count made between the two.
--
-- Safe to run twice: every statement is guarded, and a second run changes nothing.

CREATE TABLE IF NOT EXISTS page_stats (
  page     TEXT NOT NULL,
  day      TEXT NOT NULL,
  views    INTEGER NOT NULL DEFAULT 0,
  clicks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page, day)
);
CREATE INDEX IF NOT EXISTS page_stats_day ON page_stats(day);
CREATE TABLE IF NOT EXISTS traffic_daily (
  day      TEXT NOT NULL,
  kind     TEXT NOT NULL,
  views    INTEGER NOT NULL DEFAULT 0,
  clicks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind)
);
CREATE INDEX IF NOT EXISTS puppy_stats_day ON puppy_stats(day);

-- One audit row for each table, with what is removed, written only while there is something to remove.
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
SELECT '2026-11-01T20:38:36Z', 'system', 'claude', 'stats.remove_prelaunch', 'puppy_stats', 'before-2026-11-01',
       json_object('rows', COUNT(*), 'views', SUM(views), 'clicks', SUM(clicks), 'first_day', MIN(day), 'last_day', MAX(day)),
       json_object('asked', 'Alex 2026-11-01', 'reason', 'Views and clicks before launch were the team''s own testing')
  FROM puppy_stats WHERE day < '2026-11-01' HAVING COUNT(*) > 0;
INSERT INTO audit_log (at, actor_type, actor, action, entity, entity_id, before_json, after_json)
SELECT '2026-11-01T20:38:36Z', 'system', 'claude', 'stats.remove_prelaunch', 'breed_searches', 'before-2026-11-01',
       json_object('rows', COUNT(*), 'searches', SUM(searches), 'first_day', MIN(day), 'last_day', MAX(day)),
       json_object('asked', 'Alex 2026-11-01', 'reason', 'Breed filter counts before launch were the team''s own testing')
  FROM breed_searches WHERE day < '2026-11-01' HAVING COUNT(*) > 0;

DELETE FROM puppy_stats WHERE day < '2026-11-01';
DELETE FROM breed_searches WHERE day < '2026-11-01';

INSERT INTO traffic_daily (day, kind, views, clicks)
SELECT day, 'puppy', SUM(views), SUM(clicks) FROM puppy_stats WHERE day >= '2026-11-01' GROUP BY day
ON CONFLICT (day, kind) DO UPDATE SET views = excluded.views, clicks = excluded.clicks
  WHERE traffic_daily.views != excluded.views OR traffic_daily.clicks != excluded.clicks;
