-- ============================================================
-- TOYS4JOYS — Orders Schema
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ── 1. Orders ─────────────────────────────────────────────

create table if not exists public.orders (
  id                       uuid          primary key default gen_random_uuid(),
  user_id                  uuid          references auth.users(id) on delete set null,
  email                    text          not null,
  status                   text          not null default 'pending'
                                         check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  stripe_payment_intent_id text          unique,
  shipping_address         jsonb,
  subtotal                 numeric(10,2) not null,
  shipping_cost            numeric(10,2) not null default 0,
  total                    numeric(10,2) not null,
  created_at               timestamptz   not null default now(),
  updated_at               timestamptz   not null default now()
);

alter table public.orders enable row level security;

create policy "Users can read own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Service role manages orders"
  on public.orders for all using (auth.role() = 'service_role');

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx  on public.orders(status);


-- ── 2. Order items ────────────────────────────────────────

create table if not exists public.order_items (
  id         uuid          primary key default gen_random_uuid(),
  order_id   uuid          not null references public.orders(id) on delete cascade,
  product_id uuid          references public.products(id) on delete set null,
  name       text          not null,
  price      numeric(10,2) not null,
  qty        integer       not null check (qty > 0),
  image_path text,
  created_at timestamptz   not null default now()
);

alter table public.order_items enable row level security;

create policy "Users can read own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where id = order_id and auth.uid() = user_id
    )
  );

create policy "Service role manages order items"
  on public.order_items for all using (auth.role() = 'service_role');

create index if not exists order_items_order_id_idx on public.order_items(order_id);
