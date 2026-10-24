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
-- account_requests gains removed_at, the day the retention job finished removing that account, so
-- a second run leaves the account alone. The indexes let the job find old rows without reading
-- every row of each table every day.
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

CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log(at);
CREATE INDEX IF NOT EXISTS checkouts_created ON checkouts(created_at);
CREATE INDEX IF NOT EXISTS stripe_events_received ON stripe_events(received_at);
CREATE INDEX IF NOT EXISTS email_log_to ON email_log(to_addr);

ALTER TABLE account_requests ADD COLUMN removed_at TEXT;
