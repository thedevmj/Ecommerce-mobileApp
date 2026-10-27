-- Cash on delivery is the only supported payment method.
alter table public.orders
  add column if not exists payment_method text not null default 'cod';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_payment_method_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method in ('cod'));
  end if;
end $$;

notify pgrst, 'reload schema';
