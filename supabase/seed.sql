insert into public.categories (name, slug, icon, sort_order)
values
  ('Beauty', 'beauty', 'lipstick', 1),
  ('Fragrances', 'fragrances', 'spray', 2),
  ('Furniture', 'furniture', 'sofa-outline', 3),
  ('Groceries', 'groceries', 'basket-outline', 4),
  ('Home Decoration', 'home-decoration', 'lamp-outline', 5),
  ('Kitchen Accessories', 'kitchen-accessories', 'silverware-fork-knife', 6),
  ('Laptops', 'laptops', 'laptop', 7),
  ('Mens Shirts', 'mens-shirts', 'tshirt-crew-outline', 8),
  ('Mens Shoes', 'mens-shoes', 'shoe-sneaker', 9),
  ('Mens Watches', 'mens-watches', 'watch-variant', 10),
  ('Mobile Accessories', 'mobile-accessories', 'cellphone', 11),
  ('Motorcycle', 'motorcycle', 'motorbike', 12),
  ('Skin Care', 'skin-care', 'hand-heart-outline', 13),
  ('Smartphones', 'smartphones', 'cellphone', 14),
  ('Sports Accessories', 'sports-accessories', 'dumbbell', 15),
  ('Sunglasses', 'sunglasses', 'sunglasses', 16),
  ('Tablets', 'tablets', 'tablet', 17),
  ('Tops', 'tops', 'tshirt-crew-outline', 18),
  ('Vehicle', 'vehicle', 'car-outline', 19),
  ('Womens Bags', 'womens-bags', 'bag-personal-outline', 20),
  ('Womens Dresses', 'womens-dresses', 'hanger', 21),
  ('Womens Jewellery', 'womens-jewellery', 'necklace', 22),
  ('Womens Shoes', 'womens-shoes', 'shoe-heel', 23),
  ('Womens Watches', 'womens-watches', 'watch-variant', 24)
on conflict (slug) do update
set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

with data (
  category_slug,
  title,
  slug,
  description,
  brand,
  price,
  compare_at_price,
  stock,
  rating,
  review_count,
  is_featured
) as (
  values
    ('beauty', 'Essence Mascara Lash Princess', 'essence-mascara-lash-princess', 'A fan-favorite lengthening mascara with a curved brush that lifts and separates every lash.', 'Essence', 9.99, 12.99, 5, 4.94, 120, true),
    ('beauty', 'Eyeshadow Palette with Mirror', 'eyeshadow-palette-with-mirror', 'Twelve blendable matte and shimmer shades with a full-size mirror for on-the-go touch-ups.', 'Glamour Beauty', 19.99, 24.99, 44, 3.28, 54, false),
    ('beauty', 'Powder Canister', 'powder-canister', 'Lightweight setting powder that blurs pores and keeps shine under control all day.', 'Glamour Beauty', 14.99, null, 91, 4.14, 38, false),
    ('beauty', 'Red Lipstick', 'red-lipstick', 'A creamy, long-wearing red lipstick with a satin finish and comfortable wear.', 'Glamour Beauty', 12.99, 16.99, 73, 4.32, 66, false),
    ('beauty', 'Red Nail Polish', 'red-nail-polish', 'High-shine nail lacquer with a chip-resistant formula and a precision brush.', 'Glamour Beauty', 8.99, null, 79, 3.59, 27, false),
    ('fragrances', 'Chanel Coco Noir Eau De', 'chanel-coco-noir-eau-de', 'A bold amber-floral fragrance with notes of grapefruit, rose, and sandalwood.', 'Chanel', 129.99, 159.99, 12, 4.60, 88, true),
    ('fragrances', 'Dior J adore', 'dior-jadore', 'A luminous floral bouquet of ylang-ylang and jasmine for an elegant everyday signature.', 'Dior', 89.99, null, 20, 4.40, 61, false),
    ('fragrances', 'Gucci Bloom Eau De', 'gucci-bloom-eau-de', 'A rich white-floral scent built around tuberose and rangoon creeper.', 'Gucci', 99.99, 119.99, 17, 4.50, 74, false),
    ('furniture', 'Annibale Colombo Bed', 'annibale-colombo-bed', 'A sculptural upholstered bed frame with a solid wood base and premium linen weave.', 'Annibale Colombo', 1899.00, 2199.00, 5, 4.80, 34, true),
    ('furniture', 'Knives', 'knives', 'A minimalist knife block set with six forged stainless steel blades.', 'Kitchen Studio', 129.00, null, 18, 4.10, 22, false),
    ('furniture', 'Wooden Bathroom Sink', 'wooden-bathroom-sink', 'A warm teak vanity sink with a ceramic basin and soft-close storage.', 'Nordic Home', 649.00, 749.00, 6, 4.70, 19, false),
    ('groceries', 'Fresh Red Apples', 'fresh-red-apples', 'Crisp, sweet red apples picked at peak season. Sold by the pound.', 'Fresh Farms', 1.99, null, 120, 4.20, 40, false),
    ('groceries', 'Organic Dog Food', 'organic-dog-food', 'Complete organic dry food for adult dogs with real chicken and brown rice.', 'Happy Paws', 24.99, 29.99, 55, 4.30, 51, false),
    ('home-decoration', 'Ceramic Planter', 'ceramic-planter', 'Hand-glazed stoneware planter with a drainage tray for indoor plants.', 'Terra', 34.99, null, 45, 4.10, 39, false),
    ('home-decoration', 'Woven Wall Basket', 'woven-wall-basket', 'A set of three hand-woven baskets that add texture to any wall.', 'Terra', 59.99, 74.99, 22, 4.40, 28, false),
    ('kitchen-accessories', 'Chef Knife Set', 'chef-knife-set', 'A five-piece forged knife set with a magnetic walnut stand.', 'Kitchen Pro', 129.99, 169.99, 14, 4.70, 66, true),
    ('kitchen-accessories', 'Cast Iron Skillet', 'cast-iron-skillet', 'A pre-seasoned 12-inch skillet that moves from stovetop to oven.', 'Kitchen Pro', 44.99, null, 38, 4.60, 82, false),
    ('laptops', 'Apple MacBook Pro 14', 'apple-macbook-pro-14', '14-inch MacBook Pro with a Pro chip, 16GB memory, and all-day battery life.', 'Apple', 1999.00, 2199.00, 8, 4.90, 98, true),
    ('laptops', 'Asus Zenbook 14', 'asus-zenbook-14', 'A featherweight OLED laptop with a 14-inch display and 1TB of storage.', 'Asus', 999.00, 1149.00, 15, 4.50, 63, false),
    ('mens-shirts', 'Mens Casual Slim Fit', 'mens-casual-slim-fit', 'A breathable cotton shirt with a modern slim cut and mother-of-pearl buttons.', 'Casual Co', 29.99, 39.99, 40, 4.10, 72, false),
    ('mens-shirts', 'Mens Cotton Overshirt', 'mens-cotton-overshirt', 'A relaxed overshirt in washed cotton twill, perfect for layering.', 'Urban', 49.99, null, 31, 4.30, 44, false),
    ('mens-shoes', 'Nike Air Jordan 1', 'nike-air-jordan-1', 'The original high-top with premium leather panels and iconic color blocking.', 'Nike', 169.99, 189.99, 22, 4.80, 188, true),
    ('mens-shoes', 'Puma Velocity Nitro', 'puma-velocity-nitro', 'A responsive daily trainer with Nitro foam cushioning and a breathable upper.', 'Puma', 119.99, null, 30, 4.40, 92, false),
    ('mens-watches', 'Apple Watch Series 9', 'apple-watch-series-9', 'Advanced health tracking, crash detection, and a bright always-on display.', 'Apple', 399.00, 429.00, 26, 4.70, 140, true),
    ('mens-watches', 'Seiko Presage Cocktail Time', 'seiko-presage-cocktail-time', 'A dress watch with a textured dial and automatic movement.', 'Seiko', 449.00, null, 11, 4.60, 37, false),
    ('mobile-accessories', 'MagSafe Phone Case', 'magsafe-phone-case', 'A slim silicone case with strong magnets and raised camera protection.', 'Apple', 39.99, null, 70, 4.20, 58, false),
    ('mobile-accessories', 'Wireless Earbuds Pro', 'wireless-earbuds-pro', 'Active noise cancellation, spatial audio, and a pocket-sized charging case.', 'SoundLab', 129.99, 159.99, 33, 4.50, 121, true),
    ('skin-care', 'Hydrating Serum', 'hydrating-serum', 'A lightweight hyaluronic serum that plumps and smooths thirsty skin.', 'Glow', 29.99, 39.99, 55, 4.50, 90, true),
    ('skin-care', 'Daily Mineral SPF 40', 'daily-mineral-spf-40', 'A sheer mineral sunscreen that leaves no white cast and layers well under makeup.', 'Glow', 26.99, null, 64, 4.40, 76, false),
    ('smartphones', 'iPhone 13 Pro', 'iphone-13-pro', 'A Pro camera system, Super Retina XDR display, and exceptional battery life.', 'Apple', 1099.00, 1199.00, 18, 4.70, 210, true),
    ('smartphones', 'Samsung Galaxy S10', 'samsung-galaxy-s10', 'A compact flagship with a dynamic AMOLED display and triple camera.', 'Samsung', 699.00, 799.00, 24, 4.30, 156, false),
    ('sports-accessories', 'Eco Yoga Mat', 'eco-yoga-mat', 'A non-slip natural rubber mat with alignment lines and a carry strap.', 'Flex', 49.99, 59.99, 50, 4.60, 80, false),
    ('sunglasses', 'Vintage Round Sunglasses', 'vintage-round-sunglasses', 'Lightweight metal frames with polarized lenses and a retro silhouette.', 'Ray-Ban', 159.99, null, 16, 4.30, 44, false),
    ('tablets', 'iPad Air', 'ipad-air', 'An 11-inch Liquid Retina display, all-day battery, and support for Apple Pencil.', 'Apple', 599.00, 649.00, 20, 4.70, 132, true),
    ('tops', 'Ribbed Everyday Tank', 'ribbed-everyday-tank', 'A soft ribbed tank that holds its shape and layers under everything.', 'Basics', 24.99, null, 66, 4.20, 41, false),
    ('womens-bags', 'Leather Tote Bag', 'leather-tote-bag', 'A structured full-grain leather tote with a laptop sleeve and magnetic close.', 'Atelier', 149.99, 189.99, 19, 4.60, 84, true),
    ('womens-dresses', 'Floral Summer Dress', 'floral-summer-dress', 'A breathable midi dress with a smocked bodice and pockets.', 'Bloom', 59.99, 79.99, 35, 4.30, 110, true),
    ('womens-jewellery', 'Gold Hoop Earrings', 'gold-hoop-earrings', '14k gold-plated hoops with a polished finish and secure clasp.', 'Aurum', 79.99, null, 42, 4.50, 67, false),
    ('womens-shoes', 'Cloud Runner Sneakers', 'cloud-runner-sneakers', 'A cushioned everyday sneaker with a knit upper and lightweight sole.', 'Aero', 89.99, 109.99, 28, 4.40, 95, false)
)
insert into public.products (
  category_id,
  title,
  slug,
  description,
  brand,
  price,
  compare_at_price,
  stock,
  rating,
  review_count,
  image_url,
  is_featured
)
select
  c.id,
  d.title,
  d.slug,
  d.description,
  d.brand,
  d.price,
  d.compare_at_price,
  d.stock,
  d.rating,
  d.review_count,
  'https://picsum.photos/seed/' || d.slug || '/900/900',
  d.is_featured
from data d
join public.categories c on c.slug = d.category_slug
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  brand = excluded.brand,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  stock = excluded.stock,
  rating = excluded.rating,
  review_count = excluded.review_count,
  image_url = excluded.image_url,
  is_featured = excluded.is_featured,
  is_active = true;

insert into public.product_images (product_id, url, alt, position)
select
  p.id,
  'https://picsum.photos/seed/' || p.slug || '-' || g || '/900/900',
  p.title,
  g
from public.products p
cross join generate_series(1, 3) as g
on conflict (product_id, position) do update
set
  url = excluded.url,
  alt = excluded.alt;

insert into public.coupons (code, description, percent_off, amount_off, min_subtotal, is_active)
values
  ('SHOP10', '10% off orders over $50', 10, null, 50, true),
  ('WELCOME5', '$5 off your first order over $25', null, 5, 25, true)
on conflict (code) do update
set
  description = excluded.description,
  percent_off = excluded.percent_off,
  amount_off = excluded.amount_off,
  min_subtotal = excluded.min_subtotal,
  is_active = excluded.is_active;
