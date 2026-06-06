-- ============================================================
-- TOYS4JOYS — Bring PROD schema up to par with DEV
-- Run in: prod Supabase Dashboard (uglhpv…) → SQL Editor → New query
-- ============================================================
-- Generated 2026-06-06 to fix schema drift between dev (cepvqy…)
-- and prod (uglhpv…). Discovered drift:
--
--   products  : missing name_translations, desc_translations, supplier_sku
--   profiles  : missing email, phone
--   orders    : missing tracking_number
--   reviews   : table may not exist
--   wishlists : table may not exist
--
-- After this runs, the data migration script (run from CLI) will
-- mirror products, reviews, wishlists and the matching profile.
-- All statements are idempotent — safe to re-run.
-- ============================================================


-- ── 1. products: i18n + supplier SKU ───────────────────────────
alter table public.products
  add column if not exists name_translations jsonb not null default '{}',
  add column if not exists desc_translations jsonb not null default '{}',
  add column if not exists supplier_sku      text;

create index if not exists products_name_translations_idx
  on public.products using gin (name_translations);

create index if not exists products_supplier_sku_idx
  on public.products(supplier_sku)
  where supplier_sku is not null;


-- ── 2. profiles: contact fields needed by the new register flow ─
alter table public.profiles
  add column if not exists phone text,
  add column if not exists email text;


-- ── 3. orders: tracking number for the shipping email ──────────
alter table public.orders
  add column if not exists tracking_number text;


-- ── 4. reviews: per-product ratings + comments ─────────────────
create table if not exists public.reviews (
  id          uuid          primary key default gen_random_uuid(),
  product_id  uuid          not null references public.products(id) on delete cascade,
  user_id     uuid                       references auth.users(id)  on delete set null,
  author      text          not null,
  rating      smallint      not null check (rating between 1 and 5),
  body        text          not null default '',
  created_at  timestamptz   not null default now()
);

create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_created_at_idx on public.reviews(product_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Service role manages reviews" on public.reviews;

create policy "Anyone can read reviews" on public.reviews
  for select using (true);

create policy "Service role manages reviews" on public.reviews
  for all using (auth.role() = 'service_role');


-- ── 5. wishlists: per-user product favourites ──────────────────
create table if not exists public.wishlists (
  user_id    uuid        not null references auth.users(id)      on delete cascade,
  product_id uuid        not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists wishlists_user_id_idx    on public.wishlists(user_id);
create index if not exists wishlists_created_at_idx on public.wishlists(user_id, created_at desc);

alter table public.wishlists enable row level security;

drop policy if exists "Users read own wishlist"      on public.wishlists;
drop policy if exists "Users insert own wishlist"    on public.wishlists;
drop policy if exists "Users delete own wishlist"    on public.wishlists;
drop policy if exists "Service role manages wishlists" on public.wishlists;

create policy "Users read own wishlist"   on public.wishlists for select using (auth.uid() = user_id);
create policy "Users insert own wishlist" on public.wishlists for insert with check (auth.uid() = user_id);
create policy "Users delete own wishlist" on public.wishlists for delete using (auth.uid() = user_id);
create policy "Service role manages wishlists" on public.wishlists for all using (auth.role() = 'service_role');


-- ── Verify (optional — run after) ──────────────────────────────
-- select count(*) from public.reviews;
-- select count(*) from public.wishlists;
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'products'
--   and column_name in ('name_translations','desc_translations','supplier_sku');
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles'
--   and column_name in ('email','phone');
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'orders'
--   and column_name = 'tracking_number';
