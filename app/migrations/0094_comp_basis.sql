-- Alex, 2026-11-07 (docs/batch-2026-11-07-listing-without-payment.md). Why a listing was given without
-- payment: 'package' for the $100 per puppy package Hope sells, paid to her outside Puppy Connection, or
-- 'free'. Rows comped before this stay NULL and Reports counts them as free. schema.sql already carries
-- the column for a new database. It changes no listing or breeder shown on the site.
-- This runs once. A second run stops on "duplicate column name: comp_basis" and changes nothing.
ALTER TABLE puppies ADD COLUMN comp_basis TEXT CHECK (comp_basis IN ('package','free'));
