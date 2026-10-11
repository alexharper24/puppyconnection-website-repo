-- 2026-10-10. The foundations of Puppy Connection's own mailing list (Amber, meeting of
-- 2026-10-10: about 2,000 to 3,000 people on the Wix list today, and a launch announcement to
-- send from the new site). This holds the list. Sending waits on real email (launch checklist
-- L4), so nothing here sends anything yet.
--
-- People join from the box in the site footer, from a CSV import of the Wix export in the admin,
-- or are added by an operator. Each row carries its own unsubscribe token, so every email can
-- carry a one-click unsubscribe link and the List-Unsubscribe header. An unsubscribed row is kept,
-- so a later import cannot put that person back on the list.
CREATE TABLE IF NOT EXISTS subscribers (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name             TEXT,
  source           TEXT NOT NULL CHECK (source IN ('site','import','admin')),
  status           TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed')),
  unsub_token      TEXT NOT NULL UNIQUE,
  created_at       TEXT NOT NULL,
  unsubscribed_at  TEXT,
  import_batch     TEXT
);
CREATE INDEX IF NOT EXISTS subscribers_status ON subscribers(status, created_at);
