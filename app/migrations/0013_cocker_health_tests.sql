-- 2026-10-11. The Cocker Spaniel guide on the breed page said AKC's page did not show the breed
-- club's health tests. The October 11 guide check found them (a hip evaluation and an eye exam by
-- a veterinary ophthalmologist), and the breed highlights now name them, so this brings the older
-- guide text into step (Alex, 2026-10-11). Run once on each database after a backup.
UPDATE breeds SET guide = replace(guide,
  'Ask the breeder what health screening the parents have had and to see the results, since AKC''s page did not show the national club''s test list when this guide was checked.',
  'The American Spaniel Club recommends a hip evaluation and an eye exam by a veterinary ophthalmologist for breeding dogs, so ask to see both parents'' results.'),
  guide_updated_at = '2026-10-11T23:00:00.000Z'
WHERE slug = 'cocker-spaniel' AND guide LIKE '%did not show the national club%';
