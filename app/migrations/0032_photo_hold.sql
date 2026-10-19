-- 2026-10-19. Take offline until new photos (launch workplan A14, Amber's photo standard of
-- 2026-10-19). An operator hold gets a kind. A photos hold carries a short reason the breeder sees
-- in the portal, and lifts itself when the breeder uploads a photo after hold_at that passes the
-- photo check (photoPassedStmts in lib/inactivity.js). A hold with no kind is the plain hold, which
-- only Release lifts. public_puppies already leaves out every puppy with operator_hold = 1.
ALTER TABLE puppies ADD COLUMN hold_kind TEXT CHECK (hold_kind IN ('photos'));
ALTER TABLE puppies ADD COLUMN hold_reason TEXT;
ALTER TABLE puppies ADD COLUMN hold_at TEXT;

-- Amber's photo standard goes into the working draft of the listing terms, which she edits and
-- publishes on the admin's Terms screen. It is added once, to the draft only, so a published
-- version is never changed and a second run adds nothing.
UPDATE terms_versions
   SET body = body || char(10) || char(10) || 'Photo standard. Photos must be high quality, not blurry, and show the puppy clearly with no signs of illness or distress. A listing that falls short can be taken offline by Puppy Connection until proper photos are uploaded.',
       updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'), updated_by = 'migration 0032'
 WHERE version = 'draft' AND instr(body, 'Photo standard. Photos must be high quality') = 0;
