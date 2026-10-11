-- 2026-10-10. More than one person per kennel (Amber, in the meeting of 2026-10-10: some
-- breeders run their kennel as a couple or a family and each wants their own sign-in). The
-- breeder's own address stays on breeders.email. Each extra person is a row here, signs in with
-- their own address by the same emailed code, link or Google, and has the same access to the
-- kennel's profile, litters, puppies and payments as the first person. Removing someone ends
-- their sessions. An address belongs to one kennel only, and never to a breeder account too.
CREATE TABLE IF NOT EXISTS breeder_members (
  id          TEXT PRIMARY KEY,
  breeder_id  TEXT NOT NULL REFERENCES breeders(id),
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name        TEXT,
  added_by    TEXT NOT NULL,
  added_at    TEXT NOT NULL,
  joined_at   TEXT
);
CREATE INDEX IF NOT EXISTS breeder_members_breeder ON breeder_members(breeder_id);

-- The address a session signed in with, so the portal can say who is signed in and removing a
-- person can end only their sessions. Older sessions have none and count as the breeder's own.
ALTER TABLE sessions ADD COLUMN email TEXT COLLATE NOCASE;
