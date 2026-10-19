-- 2026-10-19. Breeder approval by reference (launch workplan A13, Amber's answer of 2026-10-19).
-- A breeder names one person who can confirm they are a real breeder before submitting for
-- approval, and the admin sees it beside Approve. Approval stays once per breeder.
--
-- role  akc            an AKC representative
--       welfare        a board member of their local animal welfare council, such as ICAW
--       breeder        another respected breeder
--       vet            their veterinarian
-- contact is a phone number or an email address, for Puppy Connection only.
--
-- Its own table rather than columns on breeder_profiles, because the public views and the site
-- export read breeder_profiles and a reference is never public.
CREATE TABLE IF NOT EXISTS breeder_references (
  breeder_id  TEXT PRIMARY KEY REFERENCES breeders(id),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('akc','welfare','breeder','vet')),
  contact     TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Breeders already approved, imported from Wix or decided before this change keep their standing
-- and are asked for nothing (Alex asked for the choice to be named). Approval is once per breeder,
-- and a reference proves a new sign-up is real, which an approved breeder has already shown.
-- A breeder still waiting for approval who submitted before this change is asked for a reference
-- in the portal, and the admin can still approve them without one.
