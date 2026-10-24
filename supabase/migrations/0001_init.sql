create extension if not exists pgcrypto;

do $$
begin
  create type public.order_status as enum (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  slug text not null unique,
  description text not null default '',
  brand text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price >= price),
  stock integer not null default 0 check (stock >= 0),
  rating numeric(3, 2) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(brand, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'Home',
  recipient text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country text not null default 'US',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists addresses_one_default_per_user
  on public.addresses (user_id)
  where is_default;

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create table if not exists public.coupons (
  code text primary key,
  description text,
  percent_off integer check (percent_off between 1 and 100),
  amount_off numeric(10, 2) check (amount_off > 0),
  min_subtotal numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (percent_off is not null or amount_off is not null)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_number text not null unique default (
    'SC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  status public.order_status not null default 'pending',
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount numeric(10, 2) not null default 0 check (discount >= 0),
  shipping numeric(10, 2) not null default 0 check (shipping >= 0),
  tax numeric(10, 2) not null default 0 check (tax >= 0),
  total numeric(10, 2) not null check (total >= 0),
  coupon_code text references public.coupons (code) on delete set null,
  shipping_address jsonb not null,
  notes text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title_snapshot text not null,
  image_snapshot text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total numeric(10, 2) generated always as (unit_price * quantity) stored
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (is_featured) where is_active;
create index if not exists products_search_idx on public.products using gin (search_vector);
create index if not exists product_images_product_idx on public.product_images (product_id);
create index if not exists addresses_user_idx on public.addresses (user_id);
create index if not exists cart_items_cart_idx on public.cart_items (cart_id);
create index if not exists orders_user_idx on public.orders (user_id, placed_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists favorites_user_idx on public.favorites (user_id);
create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.carts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_product uuid;
begin
  if tg_op = 'DELETE' then
    target_product := old.product_id;
  else
    target_product := new.product_id;
  end if;

  update public.products p
  set
    rating = coalesce(
      (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.product_id = target_product),
      0
    ),
    review_count = (
      select count(*) from public.reviews r where r.product_id = target_product
    )
  where p.id = target_product;

  return null;
end;
$$;

drop trigger if exists reviews_refresh_product_rating on public.reviews;
create trigger reviews_refresh_product_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;

create policy "Profiles are readable by owner"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Active categories are public"
  on public.categories for select to anon, authenticated
  using (is_active);

create policy "Active products are public"
  on public.products for select to anon, authenticated
  using (is_active);

create policy "Product images are public"
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active
    )
  );

create policy "Active coupons are public"
  on public.coupons for select to anon, authenticated
  using (is_active and (expires_at is null or expires_at > now()));

create policy "Addresses are readable by owner"
  on public.addresses for select to authenticated
  using (auth.uid() = user_id);

create policy "Addresses are insertable by owner"
  on public.addresses for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Addresses are editable by owner"
  on public.addresses for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Addresses are deletable by owner"
  on public.addresses for delete to authenticated
  using (auth.uid() = user_id);

create policy "Carts are readable by owner"
  on public.carts for select to authenticated
  using (auth.uid() = user_id);

create policy "Carts are insertable by owner"
  on public.carts for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Carts are editable by owner"
  on public.carts for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Cart items are readable by owner"
  on public.cart_items for select to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "Cart items are insertable by owner"
  on public.cart_items for insert to authenticated
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "Cart items are editable by owner"
  on public.cart_items for update to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "Cart items are deletable by owner"
  on public.cart_items for delete to authenticated
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

create policy "Favorites are readable by owner"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "Favorites are insertable by owner"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Favorites are deletable by owner"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);

create policy "Orders are readable by owner"
  on public.orders for select to authenticated
  using (auth.uid() = user_id);

create policy "Orders are insertable by owner"
  on public.orders for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

create policy "Order items are readable by owner"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy "Order items are insertable by owner"
  on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy "Reviews are public"
  on public.reviews for select to anon, authenticated
  using (true);

create policy "Reviews are insertable by owner"
  on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Reviews are editable by owner"
  on public.reviews for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Reviews are deletable by owner"
  on public.reviews for delete to authenticated
  using (auth.uid() = user_id);
