-- Customer enquiries from the mobile app.
-- Customers can create and read their own messages; admins can read and reply to all.

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text not null default 'open',
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enquiries_status_check
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  constraint enquiries_subject_length
    check (char_length(subject) between 3 and 140),
  constraint enquiries_message_length
    check (char_length(message) between 10 and 4000),
  constraint enquiries_reply_length
    check (admin_reply is null or char_length(admin_reply) <= 4000)
);

create index if not exists enquiries_user_created_idx
  on public.enquiries (user_id, created_at desc);

create index if not exists enquiries_status_created_idx
  on public.enquiries (status, created_at desc);

drop trigger if exists enquiries_set_updated_at on public.enquiries;
create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

alter table public.enquiries enable row level security;

drop policy if exists "Enquiries are readable by owner" on public.enquiries;
create policy "Enquiries are readable by owner"
  on public.enquiries for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Enquiries are insertable by owner" on public.enquiries;
create policy "Enquiries are insertable by owner"
  on public.enquiries for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Admins can manage enquiries" on public.enquiries;
create policy "Admins can manage enquiries"
  on public.enquiries for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on table public.enquiries to authenticated;
grant select, insert, update, delete on table public.enquiries to service_role;

notify pgrst, 'reload schema';
