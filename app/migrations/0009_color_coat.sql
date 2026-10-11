-- 2026-10-10. Color and coat choices in the puppy form (Alex, after the keyword research showed
-- large color and coat searches, such as long-haired mini dachshund). Each breed carries a short
-- list of suggested colors and, where the breed has coat types, a list of coats. The portal
-- offers them in the puppy editor and still takes any color a breeder types. Operators can edit
-- both lists in the admin's Breeds screen. Each list is comma-separated.
ALTER TABLE breeds ADD COLUMN colors TEXT;
ALTER TABLE breeds ADD COLUMN coats TEXT;
ALTER TABLE puppies ADD COLUMN coat TEXT;

-- The public view gains the coat, so the site can show it. public_litters reads public_puppies,
-- so it is dropped first and recreated after.
DROP VIEW IF EXISTS public_litters;
DROP VIEW IF EXISTS public_puppies;
CREATE VIEW public_puppies AS
SELECT pu.id, pu.breeder_id, pu.litter_id, pu.slug, pu.name, pu.sex, pu.color,
       pu.price_cents, pu.deposit_cents, pu.description, pu.breeder_url, pu.includes_json,
       pu.hypoallergenic, pu.availability, pu.published_at, pu.expires_at,
       pu.legacy_slug, pu.coat
FROM puppies pu JOIN public_breeders pb ON pb.breeder_id = pu.breeder_id
WHERE pu.publication_state = 'published'
  AND pu.payment_state IN ('paid','comped')
  AND pu.operator_hold = 0
  AND (pu.expires_at IS NULL OR pu.expires_at > strftime('%Y-%m-%dT%H:%M:%SZ','now'));
CREATE VIEW public_litters AS
SELECT l.id, l.breeder_id, l.breed_id, l.born_on, l.ready_on, l.mom_weight_lb,
       l.dad_weight_lb, l.description
FROM litters l
WHERE l.archived_at IS NULL
  AND EXISTS (SELECT 1 FROM public_puppies pp WHERE pp.litter_id = l.id);

-- Suggested colors and coats. Short and common on purpose; Amber edits them in the admin.
UPDATE breeds SET colors = 'Black, rust and white' WHERE slug = 'bernese-mountain-dog';
UPDATE breeds SET colors = 'Black and white, Brindle and white, Seal and white' WHERE slug = 'boston-terrier';
UPDATE breeds SET colors = 'Blenheim, Tricolor, Black and tan, Ruby' WHERE slug = 'cavalier-king-charles-spaniel';
UPDATE breeds SET colors = 'Apricot, Red, Cream, Chocolate, Black, Blenheim, Tricolor, Parti', coats = 'Curly, Wavy, Straight' WHERE slug = 'cavapoo';
UPDATE breeds SET colors = 'Black, Buff, Chocolate, Red, Silver, Black and tan, Parti' WHERE slug = 'cocker-spaniel';
UPDATE breeds SET colors = 'Black and rust, Red and rust, Blue and rust, Fawn and rust' WHERE slug = 'doberman-pinscher';
UPDATE breeds SET colors = 'White, Fawn, Red, Brindle, Piebald, Fawn and white, Red and white' WHERE slug = 'english-bulldog';
UPDATE breeds SET colors = 'Apricot, Red, Cream, Chocolate, Black, Parti, Merle, Phantom', coats = 'Curly, Wavy, Straight' WHERE slug = 'f1b-mini-goldendoodle';
UPDATE breeds SET colors = 'Brindle, Fawn, Cream, White, Blue, Lilac, Merle, Pied' WHERE slug = 'french-bulldog';
UPDATE breeds SET colors = 'Light golden, Golden, Dark golden, Cream, Red' WHERE slug = 'golden-retriever';
UPDATE breeds SET colors = 'Fawn, Brindle, Blue, Black, Harlequin, Mantle, Merle' WHERE slug = 'great-dane';
UPDATE breeds SET colors = 'Black, White, Cream, Gold, Red, Chocolate, Sable, Silver, Brindle, Parti' WHERE slug = 'havanese';
UPDATE breeds SET colors = 'Black, Yellow, Chocolate' WHERE slug = 'labrador-retriever';
UPDATE breeds SET colors = 'Blue merle, Red merle, Black, Chocolate, Tricolor, Phantom, Parti, Cream', coats = 'Curly, Wavy, Straight' WHERE slug = 'mini-aussiedoodle';
UPDATE breeds SET colors = 'Tricolor, Black and white, Chocolate tricolor, Merle, Phantom, Sable, Black', coats = 'Curly, Wavy, Straight' WHERE slug = 'mini-bernedoodle';
UPDATE breeds SET colors = 'Red, Cream, Black and tan, Chocolate and tan, Blue and tan, Dapple, Piebald, Brindle', coats = 'Smooth, Long-haired, Wire-haired' WHERE slug = 'miniature-dachshund';
UPDATE breeds SET colors = 'Apricot, Red, Black, White, Cream, Chocolate, Silver, Blue, Parti, Phantom' WHERE slug = 'miniature-poodle';
UPDATE breeds SET colors = 'Salt and pepper, Black and silver, Black, White' WHERE slug = 'miniature-schnauzer';
UPDATE breeds SET colors = 'Tricolor, Black and white, Chocolate tricolor, Merle, Phantom, Sable, Black', coats = 'Curly, Wavy, Straight' WHERE slug = 'munchkin-bernedoodle';
UPDATE breeds SET colors = 'White and black, White and red, White and sable, White and lemon, Tricolor' WHERE slug = 'papillon';
UPDATE breeds SET colors = 'Red, Sable, Fawn, Red and white, Tricolor' WHERE slug = 'pembroke-welsh-corgi';
UPDATE breeds SET colors = 'Orange, Red, Cream, Black, White, Sable, Chocolate, Blue, Parti, Merle' WHERE slug = 'pomeranian';
UPDATE breeds SET colors = 'Red and white, Brindle and white, Mahogany and white', coats = 'Short-haired, Long-haired' WHERE slug = 'saint-bernard';
UPDATE breeds SET colors = 'Gold and white, Black and white, Liver and white, Silver and white, Black, Brindle, Red' WHERE slug = 'shih-tzu';
UPDATE breeds SET colors = 'White, Cream, Apricot, Gold and white, Black and white, Brown and white, Parti' WHERE slug = 'teddy-bear-shihchon';
UPDATE breeds SET colors = 'Apricot, Red, Black, White, Cream, Chocolate, Silver, Blue, Parti, Phantom' WHERE slug = 'toy-poodle';
UPDATE breeds SET colors = 'Fawn, Brindle, Red, White, Piebald, Fawn and white, Brindle and white' WHERE slug = 'victorian-bulldog';
UPDATE breeds SET colors = 'Black and tan, Blue and tan, Black and gold, Blue and gold, Parti' WHERE slug = 'yorkshire-terrier';

-- Marks the site changed so the next scheduled publish carries the coat field.
UPDATE site_state SET dirty = 1, dirty_since = COALESCE(dirty_since, strftime('%Y-%m-%dT%H:%M:%fZ','now')), generation = generation + 1 WHERE id = 1;
