-- 2026-10-11. Sending to Puppy Connection's own mailing list (migrations/0011_mailing_list.sql
-- holds the list). An owner writes an email in the admin, sends a test to themselves, then sends
-- it to everyone subscribed. A send is one row per person, so a run that stops halfway picks up
-- where it left off and nobody gets the same email twice.
CREATE TABLE IF NOT EXISTS campaigns (
  id              TEXT PRIMARY KEY,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent')),
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  send_started_at TEXT,
  sent_at         TEXT,
  total           INTEGER NOT NULL DEFAULT 0,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  failed_count    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campaign_sends (
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id),
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  provider_id   TEXT,
  error         TEXT,
  sent_at       TEXT,
  PRIMARY KEY (campaign_id, subscriber_id)
);
CREATE INDEX IF NOT EXISTS campaign_sends_pending ON campaign_sends(campaign_id, status);
