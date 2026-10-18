-- 2026-10-17. More reports (launch workplan A4). How many times a day families chose each breed
-- in the browse page's breed filter, or arrived on it from a search for one breed. One row per
-- breed per UTC day with one number, and nothing about the visitor, the same as puppy_stats.
CREATE TABLE IF NOT EXISTS breed_searches (
  breed_id  TEXT NOT NULL REFERENCES breeds(id),
  day       TEXT NOT NULL,
  searches  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (breed_id, day)
);
