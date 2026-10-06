-- Plan P3, 2026-10-05. Operator notes, breed guide text, versioned listing terms, and disputes.
-- schema.sql already has all of this for a new database. Run this once on a database made
-- before it, after a backup, and then run schema.sql so the starting terms rows are added.
-- Running it twice fails on the duplicate columns, which is harmless, because the tables use
-- IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS operator_notes (
  id         TEXT PRIMARY KEY,
  breeder_id TEXT NOT NULL REFERENCES breeders(id),
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS operator_notes_breeder ON operator_notes(breeder_id, created_at);
CREATE TABLE IF NOT EXISTS terms_versions (
  version      TEXT PRIMARY KEY,
  body         TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  updated_by   TEXT NOT NULL,
  published_at TEXT,
  published_by TEXT
);
CREATE TABLE IF NOT EXISTS disputes (
  id             TEXT PRIMARY KEY,
  payment_intent TEXT NOT NULL,
  checkout_id    TEXT,
  status         TEXT NOT NULL,
  reason         TEXT,
  amount_cents   INTEGER,
  opened_at      TEXT NOT NULL,
  closed_at      TEXT,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS disputes_payment ON disputes(payment_intent);
ALTER TABLE breeds ADD COLUMN guide TEXT;
ALTER TABLE breeds ADD COLUMN guide_updated_at TEXT;
