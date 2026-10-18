-- 2026-10-17. The week-by-week inactivity schedule (launch workplan A2, lib/inactivity.js), on the
-- defaults Alex set: a reminder at week 2 and week 3, each with a one-click Still available link,
-- the listing offline at week 4, removed from the directory at week 6 with its record kept, and
-- free reactivation within six weeks of going offline. It replaces the 60-day expiry, which
-- listing_days 0 already switches off.
--
-- last_update_at  the last meaningful update: a change to price, description or status, a photo
--                 added, removed or reordered, the Still available link, or a reactivation.
-- inactive_stage  NULL, reminded_1, reminded_2, offline or removed.
-- stage_at        when the stage last moved, so each step waits its full week.
-- inactive_at     when the listing went offline, which starts the free reactivation window.
-- still_token_hash  SHA-256 of the token in the latest reminder's Still available link.
ALTER TABLE puppies ADD COLUMN last_update_at TEXT;
ALTER TABLE puppies ADD COLUMN inactive_stage TEXT CHECK (inactive_stage IN ('reminded_1','reminded_2','offline','removed'));
ALTER TABLE puppies ADD COLUMN stage_at TEXT;
ALTER TABLE puppies ADD COLUMN inactive_at TEXT;
ALTER TABLE puppies ADD COLUMN still_token_hash TEXT;
CREATE INDEX IF NOT EXISTS puppies_inactive ON puppies(inactive_stage, last_update_at);
CREATE UNIQUE INDEX IF NOT EXISTS puppies_still_token ON puppies(still_token_hash) WHERE still_token_hash IS NOT NULL;

-- When a breeder first signed in. Imported Wix breeders (legacy) are left out of the schedule
-- until this is set, and their puppies' clock starts then.
ALTER TABLE breeders ADD COLUMN first_signin_at TEXT;
UPDATE breeders SET first_signin_at = COALESCE((SELECT MIN(created_at) FROM sessions s WHERE s.breeder_id = breeders.id), created_at)
 WHERE legacy = 0;
UPDATE breeders SET first_signin_at = (SELECT MIN(created_at) FROM sessions s WHERE s.breeder_id = breeders.id)
 WHERE legacy = 1;

-- Every current listing starts its clock now, so nobody is taken offline the day this ships
-- for an update they could not have known they needed to make.
UPDATE puppies SET last_update_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE last_update_at IS NULL;

-- Days from the last meaningful update to each step, and the free reactivation window.
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('inactivity_days', '14,21,28,42'),
  ('reactivate_days', '42');
