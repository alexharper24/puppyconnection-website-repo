-- 2026-10-19. Each breed's own photo for its breed page, breed cards and guide pages. Alex chose
-- them from the breed photo picker, which ranked each breed's listing photos by a sharp puppy on a
-- soft background, the puppy's share of the frame, size and exposure. Where he kept today's photo
-- it is pinned here too, so it no longer changes as listings change. A photo that stops being
-- public falls back to the site's own choice (lib/shape.js). Run once on each database after a backup.
ALTER TABLE breeds ADD COLUMN photo_id TEXT;
UPDATE breeds SET photo_id = 'seed-p-0032-img0' WHERE slug = 'boston-terrier';
UPDATE breeds SET photo_id = 'seed-p-0150-img3' WHERE slug = 'cavalier-king-charles-spaniel';
UPDATE breeds SET photo_id = 'seed-p-0075-img2' WHERE slug = 'cavapoo';
UPDATE breeds SET photo_id = 'seed-p-0001-img0' WHERE slug = 'cocker-spaniel';
UPDATE breeds SET photo_id = 'seed-p-0181-img0' WHERE slug = 'doberman-pinscher';
UPDATE breeds SET photo_id = 'seed-p-0300-img0' WHERE slug = 'english-bulldog';
UPDATE breeds SET photo_id = 'seed-p-0026-img0' WHERE slug = 'french-bulldog';
UPDATE breeds SET photo_id = 'seed-p-0004-img0' WHERE slug = 'golden-retriever';
UPDATE breeds SET photo_id = 'seed-p-0277-img0' WHERE slug = 'great-dane';
UPDATE breeds SET photo_id = 'seed-p-0238-img3' WHERE slug = 'havanese';
UPDATE breeds SET photo_id = 'seed-p-0221-img3' WHERE slug = 'labrador-retriever';
UPDATE breeds SET photo_id = 'seed-p-0282-img3' WHERE slug = 'maltese';
UPDATE breeds SET photo_id = 'seed-p-0022-img4' WHERE slug = 'mini-bernedoodle';
UPDATE breeds SET photo_id = 'seed-p-0275-img0' WHERE slug = 'miniature-dachshund';
UPDATE breeds SET photo_id = 'seed-p-0258-img1' WHERE slug = 'miniature-poodle';
UPDATE breeds SET photo_id = 'seed-p-0109-img1' WHERE slug = 'miniature-schnauzer';
UPDATE breeds SET photo_id = 'seed-p-0054-img0' WHERE slug = 'munchkin-bernedoodle';
UPDATE breeds SET photo_id = 'seed-p-0165-img8' WHERE slug = 'papillon';
UPDATE breeds SET photo_id = 'seed-p-0010-img0' WHERE slug = 'pembroke-welsh-corgi';
UPDATE breeds SET photo_id = 'seed-p-0013-img0' WHERE slug = 'pomeranian';
UPDATE breeds SET photo_id = 'seed-p-0268-img0' WHERE slug = 'saint-bernard';
UPDATE breeds SET photo_id = 'seed-p-0299-img2' WHERE slug = 'shih-poo';
UPDATE breeds SET photo_id = 'seed-p-0240-img3' WHERE slug = 'shih-tzu';
UPDATE breeds SET photo_id = 'seed-p-0069-img0' WHERE slug = 'teddy-bear-shihchon';
UPDATE breeds SET photo_id = 'seed-p-0108-img0' WHERE slug = 'toy-poodle';
UPDATE breeds SET photo_id = 'seed-p-0085-img0' WHERE slug = 'victorian-bulldog';
UPDATE breeds SET photo_id = 'seed-p-0081-img0' WHERE slug = 'yorkshire-terrier';
