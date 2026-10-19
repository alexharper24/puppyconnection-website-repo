-- 2026-10-19. A third state on the mailing list, for every Wix contact rather than only the
-- subscribers (Alex and Amber, 2026-10-19). The Wix contacts export carries an "Email subscriber
-- status" column of Subscribed, Unsubscribed or Never subscribed. Subscribed contacts join the list,
-- unsubscribed ones are stored unsubscribed, and never-subscribed ones are stored as 'contact', kept
-- with no list email until Amber decides whether to invite them.
--
-- A new status value on the one table was chosen over a separate contacts table. Every send, count
-- and export already selects status = 'subscribed', so a contact is left out with no change to
-- them; one row per address keeps the unique email rule across all three states; and the
-- unsubscribe link and a site sign-up work on a contact's row the way they do on any other.
--
-- SQLite cannot change a CHECK in place, so the table is rebuilt, as one group (ops/d1-apply.mjs).
-- campaign_sends refers to it, and deferring foreign keys is not enough on its own: dropping the
-- old table counts a broken reference for every send row, and the rename does not clear it, so a
-- rehearsal with one send row failed at commit. The send rows are set aside first and put back
-- after the rename. Run twice, it rebuilds the same table again and changes nothing.

PRAGMA defer_foreign_keys = true;

-- group
DROP TABLE IF EXISTS campaign_sends_keep;
CREATE TABLE campaign_sends_keep AS SELECT * FROM campaign_sends;
DELETE FROM campaign_sends;
DROP TABLE IF EXISTS subscribers_new;
CREATE TABLE subscribers_new (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name             TEXT,
  source           TEXT NOT NULL CHECK (source IN ('site','import','admin')),
  status           TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed','contact')),
  unsub_token      TEXT NOT NULL UNIQUE,
  created_at       TEXT NOT NULL,
  unsubscribed_at  TEXT,
  import_batch     TEXT
);
INSERT INTO subscribers_new (id, email, name, source, status, unsub_token, created_at, unsubscribed_at, import_batch)
  SELECT id, email, name, source, status, unsub_token, created_at, unsubscribed_at, import_batch FROM subscribers;
DROP TABLE subscribers;
ALTER TABLE subscribers_new RENAME TO subscribers;
CREATE INDEX IF NOT EXISTS subscribers_status ON subscribers(status, created_at);
INSERT INTO campaign_sends SELECT * FROM campaign_sends_keep;
DROP TABLE campaign_sends_keep;
