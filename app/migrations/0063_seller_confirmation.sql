-- Launch workplan A6 (Amber and Alex approved the wording on 2026-10-24). The date a breeder ticked
-- the box confirming they are the seller of the puppies they list, once, with the listing terms.
-- Every breeder who submitted a profile before this is asked on their next visit, through the same
-- banner as new terms. schema.sql already carries the column for a new database. Back up D1 first
-- and confirm the export printed "Downloaded". It changes no listing or breeder shown on the site.
ALTER TABLE breeders ADD COLUMN seller_confirmed_at TEXT;
