-- Alex, 2026-11-01 (docs/batch-2026-11-01-breeder-walkthrough.md). The breeder walkthrough opens by itself the
-- first time a person signs in to an approved kennel, as its main contact or as someone managing it. A row means
-- that person has closed, skipped or finished it for that kennel, so it does not open by itself there again, and
-- Help keeps it to watch any time. Only a new empty table, so a second run changes nothing.
-- Generated 2026-11-01T20:29:19Z.
CREATE TABLE IF NOT EXISTS walkthrough_seen (
  email       TEXT NOT NULL COLLATE NOCASE,
  breeder_id  TEXT NOT NULL REFERENCES breeders(id),
  seen_at     TEXT NOT NULL,
  PRIMARY KEY (email, breeder_id)
);
