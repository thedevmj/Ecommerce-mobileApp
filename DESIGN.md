# Shopcart Design System

Modern commerce for a mobile-first marketplace. Clean white surfaces, confident blue actions, warm orange accents, disciplined spacing, and product photography as the hero.

## 1. Design Direction

**Style:** Modern commerce
**Personality:** Fast, trustworthy, quietly premium
**Inspiration:** Nike's modular product cards, Shopify's mobile filter patterns, Amazon's decision-first product detail structure.

We borrow three things:

- **Nike:** product imagery leads; cards stay modular across carousels and grids.
- **Shopify:** mobile filters live in a full-screen sheet with a visible "Filter & Sort" entry point and removable chips.
- **Amazon:** price, rating, and the primary CTA are visible above the fold on product detail.

We deliberately reject: gradient hero sections, glassmorphism, purple-to-blue defaults, decorative animation, and cramped 4-column mobile grids.

## 2. Color

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#F8FAFC` | `#0B1120` | App canvas |
| `surface` | `#FFFFFF` | `#111827` | Cards, sheets, headers |
| `surfaceMuted` | `#F1F5F9` | `#1E293B` | Inputs, chips, image wells |
| `text` | `#0F172A` | `#F8FAFC` | Primary copy |
| `textSecondary` | `#475569` | `#CBD5E1` | Supporting copy |
| `textMuted` | `#64748B` | `#94A3B8` | Metadata, placeholders |
| `border` | `#E2E8F0` | `#243047` | Dividers, card outlines |
| `brand` | `#2563EB` | `#60A5FA` | Primary actions, links, active tabs |
| `accent` | `#F97316` | `#FB923C` | Sale badges, savings, highlights |
| `success` | `#059669` | `#10B981` | In stock, order success |
| `warning` | `#D97706` | `#F59E0B` | Low stock |
| `error` | `#DC2626` | `#EF4444` | Errors, destructive actions |

Color rules:

1. One primary action per screen. Everything else is `outline` or `ghost`.
2. Orange is an accent, not a second primary. Use it for urgency and savings only.
3. Never place brand blue on a blue-tinted image without a surface behind it.
4. Product photography sits on white or `surfaceMuted`; never tint the image well.

## 3. Typography

Inter across the app. Four weights only: 400, 500, 600, 700.

| Token | Size / line | Weight | Use |
| --- | --- | --- | --- |
| `display` | 34 / 40 | 700 | Screen hero, checkout total |
| `h1` | 28 / 34 | 700 | Screen title |
| `h2` | 24 / 30 | 700 | Section lead |
| `h3` | 20 / 26 | 600 | Card group title, price on PDP |
| `title` | 18 / 24 | 600 | Product name, sheet title |
| `body` | 16 / 24 | 400 | Default copy |
| `bodySmall` | 14 / 20 | 400/500 | Metadata, buttons, labels |
| `caption` | 12 / 16 | 500 | Badges, helper text |
| `overline` | 11 / 14 | 600 | Category eyebrows, letter-spaced |

Rules: sentence case, max two lines for product titles in grids, tabular numbers for prices and quantities. Prices use 700 weight; original prices use 400 with `textMuted` and a strikethrough.

## 4. Spacing

4-point base: `2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64`.

- Screen horizontal inset: `20`
- Card internal padding: `12`
- Grid gap: `12`
- Section gap: `24`
- Header-to-content: `16`
- Bottom safe area + tab bar clearance: `96`

## 5. Shape and Elevation

- Radii: `6` (badges), `10` (inputs/buttons), `14` (cards), `18` (sheets), `24` (feature banners), `999` (pills).
- Cards: 1px `border`, radius `14`, no shadow by default.
- Floating elements only (tab bar, sticky buy bar, sheets): `md` shadow.
- Never combine a strong shadow with a strong border.

## 6. Components

### Product card
Image well 1:1 on `surfaceMuted`, product name 2 lines max, category overline, price row with optional compare-at price, favorite button top-right (44x44 hit area), add-to-cart icon button bottom-right.

### Buttons
- Primary: blue fill, white 600 label, height 48, radius 10.
- Secondary: orange fill for promotional moments only.
- Outline: transparent, 1px brand border.
- Ghost: text-only, used in headers and link rows.
- Minimum height 44; pressed opacity 0.75.

### Inputs
Height 48, `surfaceMuted` fill or white with border, radius 10, search icon leading, clear action trailing.

### Quantity stepper
44x44 cells, grouped in a `surfaceMuted` pill. Disabled minus at 1.

### Chips
Pill radius, 36 height, selected = brand fill + white text, unselected = surface + border.

### Empty states
Icon in a soft brand circle, short title, one sentence, one primary action. Never a blank screen.

### Skeletons
Use `skeleton` token with 8-radius blocks. No spinners for content areas longer than one screen.

## 7. Layout

- 2-column product grid with 12 gap; single column for editorial/feature sections.
- Horizontal carousels for "Featured" and "Recently viewed" with 150-wide compact cards.
- Tab bar: Home, Shop, Cart, Profile. Badge on Cart.
- Search is a first-class header action, not a tab.
- Favorites is reached from Home and Profile.
- Product detail: swipeable image gallery, title, rating, price, variant, sticky add-to-cart bar.
- Cart: line items with steppers, promo row, summary, sticky checkout.
- Screen padding respects safe areas; tab screens add bottom inset.

## 8. Motion

- Durations: 120ms press feedback, 200ms fades, 280ms sheet transitions.
- Easing: standard ease-out; no spring on page transitions.
- Animate opacity and transform only. No looping decorative animation.
- Respect reduced motion.

## 9. Accessibility

- Body contrast ≥ 4.5:1, large text ≥ 3:1.
- Touch targets ≥ 44x44.
- Every icon-only control has an `accessibilityLabel` and role.
- Prices include currency in the accessibility label ("$24.99").
- Selected chips expose `accessibilityState={{ selected }}`.
- Do not encode stock or sale state with color alone; pair with text.
- Dynamic type: product titles may clamp visually, but accessible labels remain full.

## 10. Supabase Data Model

The UI is designed against these tables (see `supabase/migrations` and `supabase/seed.sql`):

- `profiles` — id, full_name, phone, avatar_url
- `categories` — id, slug, name, icon, image_url, sort_order, is_active
- `products` — id, category_id, slug, title, description, brand, price, compare_at_price, stock, rating, review_count, image_url, is_featured, is_active, search_vector
- `product_images` — product_id, url, alt, position
- `favorites` — user_id, product_id
- `carts` / `cart_items` — one cart per user, quantity
- `addresses` — shipping/billing, default flag
- `orders` / `order_items` — order_number, status, totals, coupon_code, shipping snapshot, line items with `line_total`
- `reviews` — product_id, user_id, rating, body; aggregates back into `products.rating`
- `coupons` — code, percent/amount off, minimum subtotal, expiry

All user tables use RLS. Products, categories, product images, reviews, and active coupons are public-read; catalog writes require the service role. New auth users automatically get a profile and cart.

### Setup

```bash
supabase link --project-ref <project-ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `client-app/.env` (see `.env.example`). Until then the app runs in demo mode on DummyJSON data with local cart and favorites.

## 11. Anti-Slop Rules

- No gradients unless they communicate depth in a single hero banner.
- No glass cards.
- No random hex values outside this token set.
- No more than two font weights in one component.
- No animation that delays the ability to buy.
- No skeleton that is larger than the content it replaces.
