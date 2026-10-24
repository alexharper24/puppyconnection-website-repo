-- 2026-10-24. Keeping and removing information on the schedule the privacy policy states (launch
-- workplan D1, Alex 2026-10-24), run by the daily retention job in lib/retention.js:
--   the activity record (audit_log) is kept 2 years, then deleted;
--   payment records (checkouts, checkout_items, payments, disputes, stripe_events) 7 years;
--   an unsubscribed address keeps only what stops it being emailed again;
--   a breeder account whose close was resolved 30 or more days ago loses its profile, photos,
--   videos, documents, listings, saved parents, people and sessions, files included, while its
--   payment records and activity record keep their own periods.
--
-- checkout_items is rebuilt without its reference to puppies, because a payment record must
-- outlive the listing it paid for. It gains puppy_name, so the record still says which puppies a
-- payment covered once the puppies are removed. Nothing refers to checkout_items, so no other
-- table moves. The reference to checkouts stays.
--
-- subscribers is rebuilt so source may be empty, because how an unsubscribed address joined is not
-- needed to keep it from being emailed again, and the job empties it with the name, the import
-- batch and the join date. campaign_sends refers to subscribers, so its rows are set aside and put
-- back around the rebuild, as migrations/0028 does and for the reason it gives.
--
-- account_requests gains removed_at, the day the retention job finished removing that account, so
-- a second run leaves the account alone. The indexes let the job find old rows without reading
-- every row of each table every day, operator notes and listing reports included, which are kept
-- 2 years like the activity record (Alex, 2026-10-24).
--
-- Back up D1 first and confirm the export printed "Downloaded". Apply with ops/d1-apply.mjs, because
-- the rebuild needs PRAGMA defer_foreign_keys. Run it once, because the ALTER line fails on a second
-- run. Everything before it may run again safely.

PRAGMA defer_foreign_keys = true;

-- group
DROP TABLE IF EXISTS checkout_items_new;
CREATE TABLE checkout_items_new (
  checkout_id TEXT NOT NULL,
  puppy_id    TEXT NOT NULL,
  breeder_id  TEXT NOT NULL,
  puppy_name  TEXT,
  PRIMARY KEY (checkout_id, puppy_id),
  FOREIGN KEY (checkout_id, breeder_id) REFERENCES checkouts (id, breeder_id)
);
INSERT INTO checkout_items_new (checkout_id, puppy_id, breeder_id, puppy_name)
  SELECT i.checkout_id, i.puppy_id, i.breeder_id, p.name FROM checkout_items i LEFT JOIN puppies p ON p.id = i.puppy_id;
DROP TABLE checkout_items;
ALTER TABLE checkout_items_new RENAME TO checkout_items;

-- group
DROP TABLE IF EXISTS campaign_sends_keep;
CREATE TABLE campaign_sends_keep AS SELECT * FROM campaign_sends;
DELETE FROM campaign_sends;
DROP TABLE IF EXISTS subscribers_new;
CREATE TABLE subscribers_new (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name             TEXT,
  source           TEXT CHECK (source IS NULL OR source IN ('site','import','admin')),
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

CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log(at);
CREATE INDEX IF NOT EXISTS checkouts_created ON checkouts(created_at);
CREATE INDEX IF NOT EXISTS stripe_events_received ON stripe_events(received_at);
CREATE INDEX IF NOT EXISTS email_log_to ON email_log(to_addr);
CREATE INDEX IF NOT EXISTS operator_notes_created ON operator_notes(created_at);
CREATE INDEX IF NOT EXISTS listing_reports_created ON listing_reports(created_at);

ALTER TABLE account_requests ADD COLUMN removed_at TEXT;
