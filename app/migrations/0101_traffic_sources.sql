-- Where visitors came from, for the Reports traffic chart (Alex, 2026-11-19).
--
-- The site's page counter now sends where the visit began: paid ads, search, social, AI
-- assistants, other sites or direct (lib/stats.js SOURCES). It is worked out in the visitor's
-- browser from the landing address's ad tags and the referring site, and only that one word is
-- sent. Nothing about the visitor is stored.
--
-- traffic_source_daily holds the day's totals by kind of page and source, for the chart.
-- page_source_stats holds each page's counts by source, for the top pages under a source filter.
-- A puppy page is keyed 'puppy:<puppy id>', as puppy_stats keys it by id. The counts start from
-- the deploy that ships this file, and nothing earlier is filled in, because the source of an
-- earlier view was never recorded.
--
-- Safe to run twice: both tables and indexes are created only if missing, and no row is written.

CREATE TABLE IF NOT EXISTS traffic_source_daily (
  day      TEXT NOT NULL,
  kind     TEXT NOT NULL,
  source   TEXT NOT NULL,
  views    INTEGER NOT NULL DEFAULT 0,
  clicks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, source)
);

CREATE TABLE IF NOT EXISTS page_source_stats (
  page     TEXT NOT NULL,
  day      TEXT NOT NULL,
  source   TEXT NOT NULL,
  views    INTEGER NOT NULL DEFAULT 0,
  clicks   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page, day, source)
);
CREATE INDEX IF NOT EXISTS page_source_stats_day ON page_source_stats(day, source);
