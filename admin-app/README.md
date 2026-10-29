# Shopcart Admin

Web admin console for the Shopcart mobile store. Cash-on-delivery only.

## Setup

1. Copy `.env.example` to `.env.local` and set the Supabase URL and anon key.
2. Apply the migrations in `../supabase/migrations/` in order (`0001` through `0008`). `0005_catalog_storage.sql` creates the public `product-images` bucket and admin-only storage policies. `0006_customer_directory.sql` adds the admin customer-directory RPC used for email search. `0007_order_status_undo.sql` adds one-step order status undo. `0008_enquiries.sql` adds the customer enquiries inbox and reply fields.
3. In Supabase **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your production equivalent) to the allowed redirect URLs. Password-reset and email-change links return through this route. Ensure an email provider is configured if you want reset messages delivered.
4. Promote your account:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

5. Run the app:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with the admin account.

## Status

- Phase 1: admin role + RLS (done)
- Phase 2: app shell, login, protected dashboard (done)
- Phase 3: orders list, details, status updates + one-step undo (done)
- Phase 4: catalog, image uploads, review moderation (done)
- Phase 5: customers, coupons, metrics (done)
- Account: admin name/phone, login email changes, password reset (done)
- Enquiries: list, search, status update, reply (done)

The Account page stores name and contact phone in `profiles` and updates the sign-in email through Supabase Auth. Email changes may require confirmation. Password recovery is sent to the login email; the contact phone is not used for SMS reset unless phone auth is configured separately.

Without `0006_customer_directory.sql`, the customer directory still works but shows no emails and cannot search by email. Without `0007_order_status_undo.sql`, status updates still work but the undo button is unavailable. Without `0008_enquiries.sql`, the Enquiries inbox reports the missing relation. Password-reset links require the `/auth/callback` redirect URL in Supabase Auth settings.
