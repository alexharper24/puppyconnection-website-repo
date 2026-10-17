-- 2026-10-17. Report a listing (launch workplan A5). A family reports a puppy or a breeder from
-- the site, through a short form on the portal with Turnstile and the rate limiter. Each report
-- lands here and is emailed to the owners. The reporter's email is optional and only for a reply,
-- and nothing else about the visitor is kept. An operator closes a report as handled or
-- dismissed, with a private note, and can suspend the breeder from the breeder's own screen.
CREATE TABLE IF NOT EXISTS listing_reports (
  id              TEXT PRIMARY KEY,
  breeder_id      TEXT NOT NULL REFERENCES breeders(id),
  puppy_id        TEXT,
  reason          TEXT NOT NULL CHECK (reason IN ('misleading','not_available','scam','welfare','photos','other')),
  details         TEXT NOT NULL,
  reporter_email  TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','handled','dismissed')),
  created_at      TEXT NOT NULL,
  closed_by       TEXT,
  closed_at       TEXT,
  note            TEXT
);
CREATE INDEX IF NOT EXISTS listing_reports_status ON listing_reports(status, created_at);
CREATE INDEX IF NOT EXISTS listing_reports_breeder ON listing_reports(breeder_id);
