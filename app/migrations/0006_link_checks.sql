-- 2026-10-07. The breeder link check (lib/jobs.js, links). Each puppy's link to its own page on
-- the breeder's site, and each breeder's website, is fetched about once a week, and a link that
-- breaks or starts sending families to the breeder's home page shows in Needs attention.
CREATE TABLE IF NOT EXISTS link_checks (
  url           TEXT PRIMARY KEY,
  checked_at    TEXT NOT NULL,
  status        INTEGER,
  final_url     TEXT,
  verdict       TEXT NOT NULL CHECK (verdict IN ('ok', 'broken', 'home')),
  failing_since TEXT
);
