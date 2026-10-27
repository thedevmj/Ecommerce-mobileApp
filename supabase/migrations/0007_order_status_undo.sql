-- One-step undo for admin order status changes.
-- Stores the status replaced by the most recent change; cleared after undo.

alter table public.orders
  add column if not exists previous_status public.order_status;

comment on column public.orders.previous_status is
  'Status before the most recent admin status change; cleared after undo.';

notify pgrst, 'reload schema';
