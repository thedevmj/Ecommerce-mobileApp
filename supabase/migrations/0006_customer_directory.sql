-- Admin customer directory.
-- Joins auth.users for email while keeping the data behind an admin check.

create or replace function public.admin_customer_directory(
  p_customer_id uuid default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text,
  created_at timestamptz,
  order_count bigint,
  total_spent numeric,
  last_order_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with directory as (
    select
      p.id,
      p.full_name,
      u.email::text as email,
      p.phone,
      p.avatar_url,
      p.role,
      p.created_at,
      count(o.id) as order_count,
      coalesce(
        sum(o.total) filter (where o.status not in ('cancelled', 'refunded')),
        0
      )::numeric as total_spent,
      max(o.placed_at) as last_order_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.orders o on o.user_id = p.id
    where public.is_admin()
      and (p_customer_id is null or p.id = p_customer_id)
      and (
        p_search is null
        or p_search = ''
        or p.full_name ilike '%' || p_search || '%'
        or u.email ilike '%' || p_search || '%'
        or p.phone ilike '%' || p_search || '%'
      )
    group by p.id, u.email
  )
  select
    d.*,
    count(*) over() as total_count
  from directory d
  order by d.created_at desc
  limit greatest(coalesce(p_limit, 25), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.admin_customer_directory(
  uuid,
  text,
  integer,
  integer
) from public;

grant execute on function public.admin_customer_directory(
  uuid,
  text,
  integer,
  integer
) to authenticated;

notify pgrst, 'reload schema';
