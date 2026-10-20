-- 2026-10-19. The photo-based listing schedule (launch workplan A12, lib/inactivity.js), on Amber's
-- rule of 2026-10-19. It replaces the week-by-week schedule of migration 0020: a listing stays up
-- with no end date while it gets a new photo at least every four weeks, the breeder is emailed at
-- weeks 4 and 5, the listing goes offline at week 6 and comes back free with a new photo, and at
-- week 12 it is removed and stays in the breeder's dashboard to relist by paying.
--
-- last_photo_at  the newest photo that passed the photo check, or the payment that listed it.
--                Nothing else restarts the clock. last_update_at and still_token_hash from 0020
--                are no longer read or written, and stay as columns.
ALTER TABLE puppies ADD COLUMN last_photo_at TEXT;
CREATE INDEX IF NOT EXISTS puppies_photo_clock ON puppies(inactive_stage, last_photo_at);

-- How listings already on the site start their clock (Alex asked for the choice to be named):
-- every one starts at this migration. The imported Wix listings carry photos dated from Wix, so
-- counting from the real photo dates would email most breeders "offline in two weeks" on the day
-- this ships. Starting now, the first email arrives four weeks from today and nothing goes offline
-- before six weeks, with two emails first. Imported breeders who have never signed in stay out of
-- the schedule until they do, and their clock starts at that first sign-in, as before.
UPDATE puppies SET last_photo_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE last_photo_at IS NULL;

-- A reminder sent under the old schedule no longer applies, and its Still available link now only
-- opens a page that points to the portal. A listing the old schedule took offline stays offline
-- and comes back free with a new photo.
UPDATE puppies SET inactive_stage = NULL, stage_at = NULL WHERE inactive_stage IN ('reminded_1','reminded_2');
UPDATE puppies SET still_token_hash = NULL WHERE still_token_hash IS NOT NULL;

-- Days with no new photo to the first email, the last email, offline and removed. A new photo
-- brings a listing back free until it is removed, so the separate free window setting goes.
UPDATE settings SET value = '28,35,42,84' WHERE key = 'inactivity_days';
INSERT OR IGNORE INTO settings (key, value) VALUES ('inactivity_days', '28,35,42,84');
DELETE FROM settings WHERE key = 'reactivate_days';
