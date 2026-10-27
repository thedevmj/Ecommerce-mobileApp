# Agent Handoff — Shopcart Mobile App Redesign

This file captures what was done across sessions and what remains to continue later from the same repo state.

## Current State
- Branch/state: local working tree at `D:\Junaid Mansuri\Downloads\shopcart-mobileapp-main\shopcart-mobileapp-main`
- Client app root: `client-app/` (Expo SDK 58, React 19, React Native 0.88, Expo Router 58, TypeScript)
- Data source: Supabase-first via `lib/api.ts` → `store/productStore.ts`, with DummyJSON fallback when Supabase is unavailable. No `.env` in the repo; `config.ts` contains dev fallbacks for the Supabase URL/anon key.
- Cart/favorites persist with AsyncStorage (Zustand). Auth sessions now restore in the root layout.
- Design system: `constants/theme.ts`, `hooks/useAppTheme.ts`, `constants/Colors.ts`, `components/ui/*`, `DESIGN.md`, `design-tokens.json`, `design-preview.html`.
- Core flows complete: Home, Shop (with Filter & Sort), Search, Favorites, Cart, Product details (with Reviews), Profile, Auth (modal), Checkout (COD only), Orders, Address book, Not found.
- Payments: **cash on delivery only** — no card/wallet gateway. Orders store `payment_method = 'cod'`. Admin Phases 1–5 are complete: roles + RLS, admin shell/auth, orders management, catalog/category/image/review management, and customers/coupons/metrics.
- Latest admin work: admin account settings (name, login email, contact phone) and password recovery are implemented, alongside Phase 5 customer directory, coupon CRUD, dashboard metrics, inline orders-list status dropdown, and one-step order status undo. Apply `0005`, `0006`, and `0007` for image uploads, customer email search, and undo; apply `0008` for enquiries. Configure the Supabase `/auth/callback` redirect URL for reset and email-change links.
- Latest mobile work: keyboard avoidance is fixed across Auth, Address form, Filter & Sort, Cart, and Product details (including reviews). Android now uses `softwareKeyboardLayoutMode: "resize"` and `KeyboardAvoidingView` `height` behavior; cart/product action bars lift above the keyboard.
- In progress: customer enquiries. Database migration, mobile data helpers, and the mobile enquiry form/history screen are written, but the screen is not linked from Profile/navigation and the admin-side workflow is not built. `0008_enquiries.sql` has not been applied.

## What Was Done

### Current Session — Enquiries (Work In Progress)

- `supabase/migrations/0008_enquiries.sql` (untracked, not applied): adds `public.enquiries` with owner contact snapshot (`name`, `email`, `phone`), `subject`, `message`, status (`open`, `in_progress`, `resolved`, `closed`), `admin_reply`, `replied_at`, timestamps, length/status checks, indexes, updated-at trigger, grants, and RLS.
- Enquiries RLS: customers can insert/select only their own rows; admins can manage all rows via `public.is_admin()`.
- `client-app/lib/enquiries.ts` (untracked): enquiry/status types, status metadata, validation, Supabase fetch/create helpers, and row mapping.
- `client-app/app/enquiries.tsx` (untracked, not routed or linked yet): signed-out gate, reply-email card, subject/message form with validation and character count, pull-to-refresh, loading/error/empty states, history cards with status badges, and support-reply display. Uses the keyboard-avoidance pattern (`padding` iOS, `height` Android).
- Verified after lint fix: `rtk tsc --noEmit` and `rtk npm run lint` pass in `client-app`.
- Not started: Profile/navigation link, admin list/detail/reply UI, admin actions/navigation, dashboard surfacing, migration application, live RLS/QA.
- `0005`–`0007` remain unapplied; `0008` should be applied after them.

### Earlier Session — Mobile Keyboard Handling

- `app.json`: added `android.softwareKeyboardLayoutMode: "resize"` so Android resizes the app window instead of panning. This is native config and requires a rebuild/prebuild to take effect.
- `app/auth.tsx`, `app/address-form.tsx`, `components/FilterSheet.tsx`: `KeyboardAvoidingView` now uses `height` on Android (previously `undefined`) and `padding` on iOS.
- `app/(tabs)/cart.tsx`: wrapped the cart scroll view and checkout bar in `KeyboardAvoidingView`; added `keyboardShouldPersistTaps="handled"` so promo input keeps working while the keyboard is open.
- `app/product/[id].tsx`: wrapped the product scroll view and sticky purchase bar in `KeyboardAvoidingView`; enabled `keyboardShouldPersistTaps` for the review form.
- `app/address-form.tsx`: kept the existing scroll view, safe-area handling, and bottom padding; Android keyboard avoidance is now active for all address fields.
- Verified: `rtk tsc --noEmit`, `rtk npm run lint`, and `npx expo config --type public` pass.
- Still needs device/emulator QA: open the keyboard on the lower address fields, cart promo input, product review form, and filter price inputs; confirm focused inputs stay visible and action bars remain above the keyboard.

### Earlier Session — Admin Account & Password Recovery

- `app/dashboard/account/page.tsx`: Account settings page showing login email, contact phone, admin-since/last-sign-in dates, editable name/email/phone, and a password-reset card.
- `app/dashboard/account/actions.ts`: `updateAccountDetails` saves `profiles.full_name`/`phone` and updates the sign-in email with `supabase.auth.updateUser` (confirmation may be required); `sendAccountPasswordReset` emails a recovery link to the login address.
- `components/account/AccountDetailsForm.tsx`: client form for name, login email, and contact phone with saved/error feedback.
- `components/account/PasswordResetRequestForm.tsx`: shared reset-request form used by the account page (fixed login email) and public forgot-password page (email input).
- `components/account/ResetPasswordForm.tsx`: new-password/confirm form; successful changes sign the user out and return to `/login?reset=1`.
- `app/forgot-password/page.tsx` + `actions.ts`: public reset request with email validation; returns a non-enumerating success message on accepted submissions.
- `app/auth/callback/route.ts`: exchanges the Supabase PKCE code for a session and redirects only to allowlisted `next` paths (`/reset-password` or `/dashboard/account`).
- `app/reset-password/page.tsx` + `actions.ts`: recovery-session password update with minimum length and confirmation checks.
- `proxy.ts`: `/forgot-password` is public, `/auth/callback` is excluded from the auth gate, and signed-in users on public auth pages are sent to the dashboard.
- `components/LoginForm.tsx` + `app/login/page.tsx`: added the Forgot-password link, password-updated notice, and callback error display.
- `components/Sidebar.tsx`: added the Account navigation item for desktop and mobile nav.
- `lib/account.ts`, `lib/request-origin.ts`: shared form/state helpers and request-origin resolution for Supabase redirect URLs.
- No new migration is required. `profiles.phone` is contact data only; password recovery uses the login email. SMS reset requires Supabase phone auth/SMS separately.
- Supabase Auth URL Configuration must allow `http://localhost:3000/auth/callback` and the production equivalent, or reset/email-change links will not return to the app.
- Verified: `rtk lint .`, `rtk tsc --noEmit`, and `rtk npm run build` pass with `/dashboard/account`, `/forgot-password`, `/auth/callback`, and `/reset-password` routes.

#### Remaining Account QA
- Configure the Supabase Auth email provider and allowed redirect URLs, then request a reset from `/forgot-password` and from the Account page.
- Confirm the recovery link lands on `/reset-password`, rejects weak/mismatched passwords, updates successfully, signs out, and shows the login notice.
- Change the login email and confirm whether Supabase requires confirmation; verify the callback returns to the Account page.
- Save name/phone and reload; confirm `profiles` values persist and the account snapshot updates.

### Earlier Session — Admin Phase 5: Customers, Coupons & Metrics

#### Customers
- `app/dashboard/customers/page.tsx`: customer directory with name/email/phone search, pagination, new-this-month count, page-level order/lifetime-value stats, avatar initials, admin badges, last order, and a fallback notice when `0006` is not applied.
- `app/dashboard/customers/[id]/page.tsx`: customer profile, email/phone/join date, order count, lifetime value, and full order history linked to order details.
- `lib/customers.ts`: directory types, admin RPC loader with a `profiles` + `orders` fallback, order aggregation, search sanitizing, and name/initial helpers.
- `supabase/migrations/0006_customer_directory.sql`: admin-only `admin_customer_directory` security-definer RPC joining `auth.users` for email, order count, lifetime spend, last order, search, and pagination. Execute is restricted to authenticated users and results are gated by `is_admin()`.

#### Coupons
- `app/dashboard/coupons/page.tsx`: coupon list with all/active/expired/inactive tabs and counts, code/description search, pagination, discount/expiry/minimum-subtotal display.
- `app/dashboard/coupons/new/page.tsx`, `[code]/page.tsx`, `actions.ts`: admin-guarded create/edit/delete, code normalization/uniqueness, percentage and fixed-amount validation, expiry date, minimum subtotal, active toggle, rename guard for codes already used on orders, and revalidation/redirects.
- `components/coupons/CouponForm.tsx`: client form with discount-type switching, active toggle, validation errors, and saved state.
- `lib/coupons.ts`: coupon types, state/label/tone helpers, discount and expiry formatting, and date-input conversion.

#### Dashboard & Orders Polish
- `app/dashboard/page.tsx`: live metrics for delivered revenue, orders today, low stock, and customers; pending-order badge; Customers/Coupons tool links; Phase 5 marked complete.
- `components/OrderStatusQuickForm.tsx` + `app/dashboard/orders/page.tsx`: inline status dropdown on each order row. Selecting a valid next status auto-submits; closed orders show a disabled dropdown.
- `supabase/migrations/0007_order_status_undo.sql`: adds `orders.previous_status` for one-step admin status undo.
- `app/dashboard/orders/actions.ts`: `updateOrderStatus` now records the replaced status and remains transition-validated; `undoOrderStatus` restores only the stored previous status, verifies the current/previous pair, and clears the undo state.
- `components/UndoOrderStatusButton.tsx` + `components/OrderStatusForm.tsx`: undo is available on the order detail page, including closed orders. The orders list shows a compact undo button beside the status dropdown.
- `admin-app/README.md` updated for migrations `0001`–`0007`, status undo, and Phase 5 complete.
- Verified: `rtk lint .`, `rtk tsc --noEmit`, and `rtk npm run build` pass with the new customers/coupons routes.

#### Remaining Phase 5 QA
- Apply `0006_customer_directory.sql` for customer email display/search. Without it, the customer directory falls back to profiles and name/phone search.
- Apply `0007_order_status_undo.sql` for undo. Change a status, confirm undo restores the exact previous status, works after page reload, and disappears after use; verify invalid transitions are still rejected.
- Create percentage and fixed-amount coupons; verify active/expired/inactive filters, expiry, minimum subtotal, rename, and delete.
- Verify a customer's order history and lifetime value exclude cancelled/refunded orders.
- Check dashboard revenue/orders-today/low-stock numbers against real orders after `0003`/`0004` are applied.

### Earlier Session — Admin Login Fix + Phase 4 Catalog & Review Moderation

#### Admin Login Fix
- Added `admin-app/app/api/auth/login/route.ts`: server-side `signInWithPassword`, cookie handling via `@supabase/ssr`, JSON success/error responses, and Supabase error codes for diagnostics.
- `components/LoginForm.tsx` now posts `{ email, password }` to `/api/auth/login` and hard-navigates to `/dashboard` after success. The browser-side Supabase sign-in path was removed.
- `proxy.ts` matcher now excludes `api`, so `/api/auth/login` is not redirected by the auth gate.
- Login confirmed working with the real admin account. `rtk lint .` and `rtk tsc --noEmit` pass after the change.

#### Catalog Management (Phase 4)
- `app/dashboard/products/page.tsx`: search, category filter, status tabs (all/active/inactive/low stock), counts, pagination, rows with image, category, price, stock, featured/active badges.
- `app/dashboard/products/new/page.tsx` + `[id]/page.tsx`: create/edit forms and guarded delete; edit page loads primary image, gallery (ordered), category, pricing, stock, featured/active flags.
- `app/dashboard/products/actions.ts`: admin-guarded `createProduct`, `updateProduct`, `deleteProduct`; slug/category/price/compare-at/stock/URL validation; gallery sync with ordered positions; `revalidatePath`.
- `app/dashboard/categories/page.tsx`: category list with product counts, active/sort badges, and quick links into products.
- `app/dashboard/categories/new/page.tsx` + `[id]/page.tsx`: create/edit/delete forms; delete is blocked while products still reference the category.
- `app/dashboard/categories/actions.ts`: admin-guarded CRUD with slug uniqueness, integer sort order, image URL validation, and revalidation.
- `app/dashboard/reviews/page.tsx`: review moderation list with rating tabs/counts, text search, product links, author names, stars, pagination.
- `app/dashboard/reviews/actions.ts`: admin-guarded `deleteReview` with product rating trigger refresh and revalidation.
- `components/catalog/ProductForm.tsx`, `CategoryForm.tsx`, `ImageUploadField.tsx`, `ProductGalleryField.tsx`, `ConfirmDeleteForm.tsx`, `upload-image.ts`: client forms, image preview/upload, gallery add/reorder/remove, and delete confirmations.
- `lib/catalog.ts`: catalog types, currency/date formatting, slugify, image URL validation, gallery parsing, stock/status tones and gallery limits.
- `lib/admin.ts`: shared server-side admin session/role guard for the new actions and upload route.
- `app/api/catalog/upload/route.ts`: admin-only image uploads to the `product-images` bucket (JPG/PNG/WebP/GIF, 5 MB max) with a helpful missing-bucket message.
- `supabase/migrations/0005_catalog_storage.sql`: public `product-images` bucket plus admin-only insert/update/delete storage policies and public read access.
- Dashboard overview now links to Products, Categories, and Reviews and notes the storage migration requirement.
- `admin-app/README.md` updated: apply migrations `0001`–`0005`, Phase 4 marked done.
- Verified: `rtk lint .` clean, `rtk tsc --noEmit` clean, `rtk npm run build` passes with all new catalog/review/upload routes.

#### Remaining Catalog QA
- Apply `0005_catalog_storage.sql` in Supabase before testing uploads; pasted hosted URLs work without it.
- Add/edit a product with a gallery, toggle active/featured, confirm the mobile catalog reflects the change after refresh.
- Add/edit a category, confirm product counts and category filtering; verify category delete is blocked while products exist.
- Delete a review and confirm the product rating/review count recalculates.
- `0002_reviewer_profiles.sql` / `0003_order_payment.sql` application status is still unverified; review author names and COD payment data may need those applied.

### Earlier Session — Admin Phase 2/3, Orders Fix, Admin Roles, COD Checkout, Shop Filters, Reviews, Addresses

#### Orders Not Showing Fix
- Root cause: the live Supabase project does not have `orders.payment_method` yet (migration `0003` not applied), so order inserts failed and the orders query errored. The screen swallowed the error and showed "No orders yet".
- `app/checkout.tsx`: orders no longer send `payment_method` explicitly; the DB default (`cod` after `0003`) supplies it. Orders now save on the current schema.
- `app/orders.tsx`: selects `*` plus `order_items` so it works with or without `0003`, shows a "Couldn't load orders" retry state instead of a false empty state, and always labels orders as cash on delivery.
- Checkout success "View orders" now navigates to `/orders` instead of the profile tab.
- `hooks/useColorScheme.web.ts`: switched hydration detection to `useSyncExternalStore` to satisfy the React Compiler lint rule.
- Verified: `tsc` clean, lint clean (one generated `.expo/types/router.d.ts` warning), REST check confirmed `payment_method` is missing.
- Still apply `0003` (and `0002`/`0004`) so payment data, review names, and admin access work.

#### Admin Foundation (Phase 1)
- `supabase/migrations/0004_admin_roles.sql`: adds `profiles.role` (`customer`/`admin`), `is_admin()` helper, role-change protection trigger, and admin RLS policies for profiles, categories, products, product images, coupons, orders, order items, and reviews.
- Admins get full catalog/coupon CRUD, read access to all orders/order items/profiles, order updates (COD status flow), and review moderation.
- Role escalation is blocked for normal clients; assign admins with the service role or SQL editor (`update public.profiles set role = 'admin' where id = '<uuid>';`).
- Follow-on admin work: orders UI (Phase 3, done), catalog UI (Phase 4, done), customers/coupons/metrics (Phase 5, done).

#### Admin Web App (Phase 2)
- Created `admin-app/` with Next.js `16.4.3` (App Router), React 19, TypeScript, Tailwind v4, `@supabase/ssr`, `@supabase/supabase-js`, and `lucide-react`.
- `proxy.ts`: refreshes the Supabase session and redirects unauthenticated visitors to `/login`; signed-in users visiting `/login` go to `/dashboard`. Next 16 uses `proxy.ts` instead of `middleware.ts`.
- `app/login/page.tsx` + `components/LoginForm.tsx`: email/password sign-in with show/hide password, busy/error states, and redirect to `/dashboard`.
- `app/dashboard/layout.tsx`: server-side auth gate, `profiles.role === 'admin'` check, responsive sidebar/mobile nav, COD badge, account email, and sign-out.
- `components/Unauthorized.tsx`: explains missing admin access and shows the exact SQL to promote the signed-in user; detects a missing `0004` role column.
- `app/dashboard/page.tsx`: dashboard overview (Phase 5 replaced the original count cards with revenue/orders-today/low-stock/customer metrics).
- Initial module placeholders: `/products`, `/categories`, `/customers`, `/coupons`, `/reviews`, plus shared `PageHeader`, `StatCard`, `ModulePlaceholder`, and a dashboard error boundary. Products/categories/reviews were replaced in Phase 4; customers/coupons were replaced in Phase 5.
- Styling uses Tailwind v4 `@theme` tokens in `app/globals.css`: brand `#2563EB`, accent `#F97316`, canvas/panel/ink/muted/line/success/warning/danger.
- `.env.local` points at the live Supabase project; `.env.example` is committed via `!.env.example` in `.gitignore`.
- Verified: `npm run build` passes (12 routes, proxy compiled), `rtk lint .` clean, production server returns `/login` 200 and redirects `/` + `/dashboard` to `/login` (307) when signed out. Full admin login/RLS is pending migrations.
- README and `agent.md` updated with admin setup steps.

#### Admin Orders Management (Phase 3)
- `app/dashboard/orders/page.tsx`: status tabs with live counts, order-number search, pagination, COD totals, customer/city/phone summary, and responsive order cards.
- `app/dashboard/orders/[id]/page.tsx`: full order details with line items, delivery address snapshot, payment summary, notes, timestamps, and current status.
- `components/OrderStatusForm.tsx` + `app/dashboard/orders/actions.ts`: server action with admin check, allowed-transition validation (`pending → processing → shipped → delivered/cancelled`), revalidation, and inline success/error feedback.
- `lib/orders.ts`: shared order/status types, status metadata/tone classes, allowed transitions, currency/date formatting, address-snapshot parsing, and item counts.
- `components/OrderStatusBadge.tsx`: consistent status chips.
- Orders query uses `select("*, order_items(*)")`, so it remains compatible before `0003` adds `payment_method`.
- Verified: `npm run build` passes with `/dashboard/orders` and `/dashboard/orders/[id]` routes; `rtk lint .` clean. Live order list/status updates await `0004` + a promoted admin + real order data.

#### Cash on Delivery (COD) Checkout
- Removed the card/wallet payment picker from `app/checkout.tsx`; checkout now shows a single, non-editable "Cash on delivery" option with a note that payment happens on delivery.
- Checkout steps now read Cart → Details → Confirm, and the CTA is "Place COD order".
- Orders insert is COD-only; after `0003` the DB default supplies `payment_method = 'cod'`; confirmation shows "Payment: Cash on delivery".
- `supabase/migrations/0003_order_payment.sql`: adds `orders.payment_method` (default `cod`) with a COD-only check constraint.
- `app/orders.tsx`: order cards show "Cash on delivery" alongside the date.
- Profile no longer advertises payment methods; Home trust row now says "Cash on delivery".

#### Address Book (CRUD)
- `app/addresses.tsx`: saved address list with default badge, add/edit/delete, "Set as default", sign-in gate, loading skeletons, error retry, and an empty state.
- `app/address-form.tsx`: add/edit form with label presets, recipient/phone/street/city/state/postal/country fields, validation, default-address switch (first address auto-default), keyboard avoidance, and loading/not-found handling.
- `lib/addresses.ts`: address types, DB mapping (snake_case ↔ camelCase), validation, line/summary formatting, fetch/create/update/delete/set-default calls (clears old defaults before setting a new one).
- `store/addressStore.ts`: per-session Zustand store with cached load, user-change reset, CRUD actions, and automatic default promotion after deleting the default. `defaultAddress()` helper powers checkout fallback.
- `app/checkout.tsx`: "Ship to" now uses the saved default address (or first saved), supports "Add"/"Change", loads addresses on entry, waits for a fresh load before placing an order, and stores the real address snapshot in `orders.shipping_address`. Orders are blocked with a prompt when no address exists.
- `app/(tabs)/profile.tsx`: Addresses menu item now routes to the address book (auth-gated) instead of a placeholder toast.

#### Shop Filter & Sort
- `components/FilterSheet.tsx`: animated bottom sheet with safe-area handling, reduced-motion support, keyboard avoidance, and backdrop dismiss.
  - Sort radio list (Featured, price ascending/descending, top rated).
  - Price presets plus min/max inputs with validation.
  - Brand multi-select (preview 8 + "show all"), minimum rating chips.
  - Live result count, Reset, and Apply.
- `components/ui/FilterChip.tsx`: removable active-filter pills.
- `lib/shopFilters.ts`: `ShopFilters`/`SortKey` types, brand and price-bound derivation, price presets, active-filter labels/removal, filter/sort/count helpers.
- `app/(tabs)/shop.tsx`: visible "Filter & Sort" entry point with active-count badge, active filter chips, clear-all, and reset in the empty state; category/search/sort/filters combine in one selection pipeline.

#### Product Reviews
- `components/ProductReviews.tsx`: rating summary with 5→1 distribution bars, review list with author names/initials and "You" badge, empty/loading/error states, and a write/edit form (star picker, headline, body, character count).
  - Guests are prompted to sign in (`/auth`) before reviewing.
  - Submitting upserts one review per product/user and refreshes both the list and the product rating.
- `lib/reviews.ts`: fetch/upsert reviews, UUID guard, review summary/distribution, author-name lookup with graceful fallback.
- `supabase/migrations/0002_reviewer_profiles.sql`: public `reviewer_profiles` view (id, full_name, avatar_url) so author names are readable without exposing the profiles table.
- `components/ui/Rating.tsx`: added `showRate` so star rows can render without the numeric value.
- `lib/format.ts`: added `formatDate` for review dates.
- `app/_layout.tsx`: restores the auth session once at startup (`checkSession`).

### Design System & Tokens
- Created `constants/theme.ts` with palette/space/radius/typography/sizes/shadows and light/dark themes (brand blue #2563EB, accent orange #F97316, accessible contrast).
- Added `hooks/useAppTheme.ts` and updated `constants/Colors.ts` for backwards compatibility.
- Primitives: `components/ui/SearchBar.tsx`, `Chip.tsx`, `FilterChip.tsx`, `Badge.tsx`, `Rating.tsx`, `SectionHeader.tsx`, `QuantityStepper.tsx`, `EmptyState.tsx`, `Price.tsx`, `Skeleton.tsx`, `IconButton.tsx`.
- Updated `Button.tsx`, `ProductCard.tsx`, `Logo.tsx`, `HomeHeader.tsx`, `CommonHeader.tsx`, `Wrapper.tsx`, `LoadingSpinner.tsx` (fixed fullScreen return bug).

### Navigation & App Shell
- Fixed Expo Router 58 compatibility: `components/HapticTab.tsx`, `components/ui/TabBarBackground.ios.tsx` imports corrected.
- Updated `app/_layout.tsx`: Inter fonts (optimized to used weights), ThemeProvider with tokens, StatusBar, Stack routes `(tabs)`, `product/[id]`, `checkout`, `orders`, `addresses`, `address-form`, `auth` (modal), `+not-found`, `Toast`, and session restore.
- Updated `app/(tabs)/_layout.tsx`: 4 tabs (Home/Shop/Cart/Profile), Cart badge capped to 9+, hidden routes for search/favorites, theme-based styling. Cart syncs to Supabase on login.
- Moved product route to `app/product/[id].tsx` (stack route, not hidden tab).

### Screens
- `app/(tabs)/index.tsx`: Redesigned Home with hero, trust row, categories, featured, new arrivals, banner.
- `app/(tabs)/shop.tsx`: Category filter, search, Filter & Sort sheet, 2-col grid, active chips, empty state.
- `app/(tabs)/search.tsx`: Live search (>=2 chars), trending/categories suggestions.
- `app/(tabs)/favorites.tsx`: Persisted favorites via `store/favoritesStore.ts`, clear all.
- `app/(tabs)/cart.tsx`: Cart with quantity/clear, free shipping progress, promo (SHOP10), order summary, checkout navigation. Synced to Supabase when logged in.
- `app/(tabs)/profile.tsx`: Account card, stats (live order count), menu groups, preferences toggles, sign in/out. Links to Orders and Addresses.
- `app/product/[id].tsx`: Gallery, rating/stock/badges, description expand, quantity, reviews, related products, sticky add-to-cart/buy now.
- `app/addresses.tsx`: Address book (list, default, edit, delete) with auth/loading/empty/error states.
- `app/address-form.tsx`: Add/edit address form with validation and default toggle.
- `app/auth.tsx`: Sign in/sign up UI (Supabase ready).
- `app/checkout.tsx`: Delivery selection, saved shipping address, COD-only payment, order summary, place order creates order + order_items in Supabase, clears cart on success.
- `app/orders.tsx`: Orders history with order number, status, items, totals, pull-to-refresh.
- `app/+not-found.tsx`: Branded not found.

### Stores & Utils
- `store/cartStore.ts`: Supabase-synced cart (loads from DB on login, merges local cart, syncs add/update/remove/clear). Falls back to local for guests. Persists with AsyncStorage.
- `store/favoritesStore.ts`: Persisted favorites (supports string/number IDs).
- `store/productStore.ts`: Fetch products/categories from Supabase (via lib/api) with caching.
- `store/authStore.ts`: Supabase auth with session persistence.
- `store/addressStore.ts`: Address book state and CRUD orchestration (default handling, cache per user).
- `lib/api.ts`: Supabase-first (products/categories/product_images joins). Falls back to DummyJSON. Handles UUID/string IDs.
- `lib/shopFilters.ts`: Shop filtering/sorting/active-filter logic.
- `lib/reviews.ts`: Reviews fetch/upsert/summary logic.
- `lib/addresses.ts`: Address CRUD, mapping, validation, and formatting.
- `lib/format.ts`, `lib/supabase.ts`, `config.ts`: robustness, env fallbacks, date/price formatting.
- `type.ts`: Extended Product (string|number id, slug), CartItem compatible with UUIDs.

### Supabase
- `supabase/migrations/0001_init.sql`: Full schema (profiles, categories, products, product_images, favorites, carts/cart_items, addresses, coupons, orders/order_items, reviews) with triggers, RLS, search vector, auto profile/cart on signup, rating aggregation.
- `supabase/migrations/0002_reviewer_profiles.sql`: Public reviewer name/avatar view for reviews. Apply it for named authors; the app falls back to "Customer" if absent.
- `supabase/migrations/0003_order_payment.sql`: Adds `orders.payment_method` (default `cod`) with a COD-only check constraint.
- `supabase/migrations/0004_admin_roles.sql`: Adds `profiles.role`, `is_admin()`, role-change protection, and admin RLS policies for catalog/orders/reviews/customers.
- `supabase/migrations/0005_catalog_storage.sql`: Creates the public `product-images` bucket and admin-only storage policies.
- `supabase/migrations/0006_customer_directory.sql`: Adds the admin-only `admin_customer_directory` RPC for customer email search, order counts, lifetime spend, and last order.
- `supabase/migrations/0007_order_status_undo.sql`: Adds `orders.previous_status` for one-step admin status undo.
- `supabase/migrations/0008_enquiries.sql` (created, not applied): Adds customer enquiries, status/reply fields, updated-at trigger, indexes, grants, owner RLS, and admin management RLS.
- `supabase/seed.sql`: Category/product seed (39 products across 24 categories) with images and coupons (SHOP10, WELCOME5). No reviews seeded yet.
- `supabase/fix_grants.sql`: Grants for authenticated/anon roles on public schema/tables/sequences/functions.
- `client-app/.env.example`: Supabase env vars. Hardcoded dev fallbacks live in `config.ts`.
- Applied grants and schema 0001 to the Supabase project. Admin access is confirmed working (`0004` applied for the current admin). `0002`/`0003` application status is still unverified; `0005_catalog_storage.sql` needs to be applied before uploads work, `0006_customer_directory.sql` before customer emails appear, `0007_order_status_undo.sql` before undo is available, and `0008_enquiries.sql` before enquiries work.

### Git/Repo
- Updated `.gitignore` files to ignore `.env` but keep `.env.example`; `admin-app` uses the same rule.

### Validation
- `client-app`: `npx tsc --noEmit` passes, `npm run lint` passes (Expo lint), `npx expo export --platform android` succeeds.
- Latest enquiries WIP check: `rtk tsc --noEmit` and `rtk npm run lint` pass in `client-app`; admin build/lint has not been run because no admin enquiry code exists yet.
- `admin-app`: `rtk npm run build` passes with customer/coupon routes plus catalog/review/upload routes; `rtk lint .` and `rtk tsc --noEmit` are clean.

## Files Created/Modified (Key)

Created:
- `components/FilterSheet.tsx`
- `components/ProductReviews.tsx`
- `components/ui/FilterChip.tsx`
- `components/ui/*` (other primitives)
- `lib/shopFilters.ts`
- `lib/reviews.ts`
- `lib/addresses.ts`
- `lib/enquiries.ts` (WIP)
- `lib/format.ts`
- `store/addressStore.ts`
- `store/cartStore.ts`
- `store/favoritesStore.ts`
- `hooks/useAppTheme.ts`
- `app/addresses.tsx`
- `app/address-form.tsx`
- `app/enquiries.tsx` (WIP, not routed/linked)
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_reviewer_profiles.sql`
- `supabase/migrations/0003_order_payment.sql`
- `supabase/migrations/0004_admin_roles.sql`
- `supabase/migrations/0005_catalog_storage.sql`
- `supabase/migrations/0006_customer_directory.sql`
- `supabase/migrations/0007_order_status_undo.sql`
- `supabase/migrations/0008_enquiries.sql` (WIP, not applied)
- `supabase/seed.sql`
- `DESIGN.md`, `design-tokens.json`, `design-preview.html`
- `client-app/.env.example`
- `admin-app/` (Next.js 16 admin app):
  - `app/login/page.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
  - `app/dashboard/account/page.tsx`, `app/dashboard/account/actions.ts`
  - `app/forgot-password/page.tsx`, `app/forgot-password/actions.ts`
  - `app/auth/callback/route.ts`, `app/reset-password/page.tsx`, `app/reset-password/actions.ts`
  - `app/api/auth/login/route.ts`, `app/api/catalog/upload/route.ts`
  - `app/dashboard/orders/page.tsx`, `app/dashboard/orders/[id]/page.tsx`, `app/dashboard/orders/actions.ts`
  - `app/dashboard/products/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `actions.ts`
  - `app/dashboard/categories/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `actions.ts`
  - `app/dashboard/reviews/page.tsx`, `actions.ts`
  - `app/dashboard/customers/page.tsx`, `[id]/page.tsx`
  - `app/dashboard/coupons/page.tsx`, `new/page.tsx`, `[code]/page.tsx`, `actions.ts`
  - `app/dashboard/error.tsx`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/icon.svg`
  - `components/LoginForm.tsx`, `Sidebar.tsx`, `SignOutButton.tsx`, `Unauthorized.tsx`, `PageHeader.tsx`, `StatCard.tsx`, `ModulePlaceholder.tsx`, `OrderStatusBadge.tsx`, `OrderStatusForm.tsx`, `OrderStatusQuickForm.tsx`, `UndoOrderStatusButton.tsx`
  - `components/catalog/ProductForm.tsx`, `CategoryForm.tsx`, `ImageUploadField.tsx`, `ProductGalleryField.tsx`, `ConfirmDeleteForm.tsx`, `upload-image.ts`
  - `components/coupons/CouponForm.tsx`
  - `components/account/AccountDetailsForm.tsx`, `PasswordResetRequestForm.tsx`, `ResetPasswordForm.tsx`
  - `lib/orders.ts`, `lib/catalog.ts`, `lib/customers.ts`, `lib/coupons.ts`, `lib/account.ts`, `lib/request-origin.ts`, `lib/admin.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`, `next.config.ts`, `eslint.config.mjs`
  - `.env.example`, `README.md`
- `agent.md` (this file)

Modified:
- `app.json` (Android `softwareKeyboardLayoutMode: "resize"`)
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- `app/(tabs)/shop.tsx`, `app/(tabs)/profile.tsx`, `app/product/[id].tsx`, `app/(tabs)/*`, `app/auth.tsx`, `app/checkout.tsx`, `app/orders.tsx`
- `app/(tabs)/cart.tsx`, `app/address-form.tsx`, `components/FilterSheet.tsx` (keyboard avoidance)
- `hooks/useColorScheme.web.ts` (hydration detection for React Compiler lint)
- `components/ProductCard.tsx`, `components/Button.tsx`, `components/Logo.tsx`, `components/CommonHeader.tsx`, `components/HomeHeader.tsx`, `components/ui/Rating.tsx`
- `constants/theme.ts`, `constants/Colors.ts`
- `lib/api.ts`, `lib/supabase.ts`, `config.ts`, `type.ts`
- `admin-app/app/dashboard/page.tsx`, `proxy.ts`, `components/LoginForm.tsx`, `README.md`
- `store/*`

## What Needs To Be Done Next

### Tomorrow — Finish Enquiries (start here)
The database migration and mobile screen exist but are **not linked or applied**. Finish in this order:

1. **Wire the mobile screen**
   - `client-app/app/_layout.tsx`: add `<Stack.Screen name="enquiries" />` beside `orders`/`addresses`.
   - `client-app/app/(tabs)/profile.tsx`: rename the support item `Help center` to `Help & enquiries` (keep `help-circle-outline` or use `message-text-outline`), route it to `/enquiries`, and leave Privacy/About as coming-soon.
   - The screen already handles signed-out users with a sign-in CTA; no extra auth guard is needed.
2. **Add admin helpers**
   - Create `admin-app/lib/enquiries.ts`: enquiry type, status union/labels/tones, date formatting, reply/status validation, and list filters.
   - Keep statuses aligned with the DB: `open`, `in_progress`, `resolved`, `closed`.
3. **Build the admin list**
   - Create `admin-app/app/dashboard/enquiries/page.tsx`.
   - Fetch all enquiries ordered by `created_at desc`; add status tabs/counts, subject/name/email/message search, pagination, and rows with subject/customer/date/status/reply indicator.
   - Link each row to the detail page. Show a clear migration/RLS error state if `0008` is missing.
4. **Build the admin detail + reply flow**
   - Create `admin-app/app/dashboard/enquiries/[id]/page.tsx`: full message, contact details, account/customer link if available, current status, admin reply, and timestamps.
   - Create `components/enquiries/EnquiryStatusForm.tsx` (client form using `useActionState`) and `components/enquiries/EnquiryStatusBadge.tsx`.
   - Create `app/dashboard/enquiries/actions.ts`: call `getAdminSession()`, validate ID/status/reply, update `status`, `admin_reply`, and `replied_at` (`null` when reply is cleared), then `revalidatePath`.
5. **Surface it in admin navigation**
   - `components/Sidebar.tsx`: add an Enquiries item (use the already-imported `MessageSquare` or `MessagesSquare`) for desktop and mobile nav.
   - `app/dashboard/page.tsx`: add an Enquiries tool link and/open-enquiry count. Adjust the stat grid if adding a fifth card.
6. **Apply migrations**
   - Apply `0005`, `0006`, `0007`, then `0008_enquiries.sql` via `supabase db push` or the SQL editor. `0008` depends on `is_admin()` from `0004` but not on `0005`–`0007`.
   - Verify RLS with two customers: A can read only A's enquiries, customers cannot update/delete, and an admin can list/reply to all.
7. **Validate**
   - `client-app`: `rtk tsc --noEmit`, `rtk npm run lint`, and optionally `npx expo export --platform android`.
   - `admin-app`: `rtk lint .`, `rtk tsc --noEmit`, and `rtk npm run build`.
8. **End-to-end QA**
   - Submit an enquiry as a customer → confirm it appears immediately in mobile history → open it in admin → set status and reply → pull-to-refresh mobile and confirm the badge/reply.
   - Check signed-out gate, empty/error states, 3/10-character validation, 140/4,000 limits, long messages, dark mode, and keyboard behavior on the message field.
9. **Docs after completion**
   - Update `admin-app/README.md` for migration `0008` and the enquiries module.
   - Replace the WIP notes in this file with completed work and QA results.

### Immediate (Functional)
1. **Connect Supabase env**: add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `client-app/.env` (dev fallbacks exist in `config.ts`). Run `supabase db push` and `supabase/seed.sql`.
2. **Apply latest migrations**: run `0002_reviewer_profiles.sql` (review names), `0003_order_payment.sql` (COD payment column), `0004_admin_roles.sql` (admin roles + RLS), `0005_catalog_storage.sql` (image uploads), `0006_customer_directory.sql` (customer email search), `0007_order_status_undo.sql` (one-step status undo), and `0008_enquiries.sql` (customer enquiries).
3. **Promote an admin**: after applying 0004, run `update public.profiles set role = 'admin' where id = '<auth-user-uuid>';` in the Supabase SQL editor for the account that will use the dashboard.
4. **Auth QA**: verify login/signup/restore with real keys (session restore now runs in the root layout).
5. **COD order round trip**: verify checkout → `orders` (`payment_method='cod'`, shipping address snapshot) → `order_items` → Orders screen/profile count.
6. **Admin login QA**: with `0004` applied and an admin promoted, sign in at `admin-app/` and confirm the dashboard loads; then test the non-admin unauthorized screen.
7. **Admin orders QA**: create/open a COD order, verify search/filter/pagination, open details, use the inline status dropdown, undo the last change, and walk pending → processing → shipped → delivered; confirm invalid transitions are rejected.
8. **Admin Phase 5 QA**: apply `0006`, verify customer email search/detail/order history, coupon create/edit/rename/delete with status filters, and dashboard revenue/orders-today/low-stock metrics against real data.
9. **Admin account QA**: add `http://localhost:3000/auth/callback` to Supabase Auth redirect URLs, confirm email delivery, then verify profile save, reset-request, reset-password, and email-change flows.
10. **Seed reviews**: add a few demo reviews per product so the summary/list are not empty on first run.
11. **Mobile keyboard QA**: test Auth, Address form, Filter & Sort, Cart promo, and Product reviews on Android and iOS. Confirm the keyboard does not cover focused inputs or the cart/product action bars; rebuild the native app after the `app.json` change.

### Next Major Feature — Admin Dashboard (Web, Phases)
Goal: a web admin app with full control over the store while keeping online payments out of scope (COD only). Do these in order; each phase should ship independently.

1. **Roles & security — DONE (`0004_admin_roles.sql`)**: `profiles.role` (`customer`/`admin`), `is_admin()` helper, role-change protection trigger, and admin RLS policies for profiles/catalog/images/coupons/orders/order items/reviews. Never ship the service-role key to the browser. Apply the migration and promote one test admin.
2. **Admin app shell — DONE (`admin-app/`)**: Next.js 16 + TypeScript + Tailwind v4 + Supabase SSR auth, protected login/layout, admin-role gate, dashboard overview, module routes, and brand tokens. Build/lint pass; needs migrations + a promoted admin for live login QA.
3. **Orders management — DONE**: list/filter/search with counts, pagination, inline status updates, one-step undo, order details (items, address snapshot, COD payment), guarded status transitions (pending → processing → shipped → delivered / cancelled), and totals. Needs live data for QA.
4. **Catalog management - DONE**: product/category CRUD, price/stock/active flags, primary image + ordered gallery, review moderation, and admin-only Supabase Storage upload route. Apply `0005` for uploads.
5. **Customers & coupons — DONE**: customer directory with email/phone search and order history, coupon CRUD with status filters, and dashboard revenue/orders-today/low-stock metrics. Apply `0006` for emails.
6. **Account settings & password recovery - DONE**: editable profile name/phone, login email update with confirmation, reset-email request, PKCE recovery callback, and set-new-password page. Configure the Supabase `/auth/callback` redirect URL.
7. **Mobile sync**: ensure admin edits appear in the app (product store refresh, order status pull-to-refresh, customer/coupon changes); add realtime later if needed.

### UX/Polish
10. **Coupons validation**: cart accepts SHOP10 client-side only; validate against `coupons` and show server-side errors.
11. **Address follow-ups**: address picker at checkout (choose among saved addresses without changing the default), label suggestions beyond Home/Work/Other, and address/number formatting.
12. **Filters follow-ups**: persist selected filters across sessions, saved presets.
13. **Reviews follow-ups**: review photos, helpful votes, moderation/reporting, pagination.
14. **Image optimization**: consider `expo-image` where beneficial (already installed).
15. **Accessibility**: review focus order; icon-only controls already labeled in new components.
16. **Dark mode QA**: themes added; spot-check key screens (filter sheet, reviews form, address cards, COD checkout).

### Testing/Release
17. **E2E smoke**: navigation, add to cart, favorites, filters, reviews, addresses, COD checkout.
18. **Typecheck/lint/export**: re-run before commits.
19. **Assets**: update app icons/splash if desired (Expo defaults).
20. **Deep links**: product URLs work via routes.

## Quick Start For Next Session
```bash
# mobile app
cd client-app
npx expo start
# or
npx tsc --noEmit && npm run lint && npx expo export --platform android

# admin app
cd ../admin-app
npm run dev
# or
npm run build && npm run lint
```
Read this file first to understand scope. Priority: finish enquiries (wire the mobile route/profile link, build admin list/detail/reply, apply `0008_enquiries.sql`); then apply `0005`–`0007`, add the Supabase `/auth/callback` redirect URL, QA account/password recovery plus catalog/review/customer/coupon/order-undo flows in `admin-app/`, and verify mobile sync.
