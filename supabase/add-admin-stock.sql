-- ============================================================
-- TOYS4JOYS — Admin role + stock management
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. is_admin flag on profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Stock on products
alter table public.products
  add column if not exists stock integer not null default 0;

-- 3. Products: admin can do full CRUD
drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products"
  on public.products for all
  using   (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 4. Orders: admin can read all + update status
drop policy if exists "Admin can read all orders" on public.orders;
create policy "Admin can read all orders"
  on public.orders for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "Admin can update orders" on public.orders;
create policy "Admin can update orders"
  on public.orders for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 5. Order items: admin can read all
drop policy if exists "Admin can read all order items" on public.order_items;
create policy "Admin can read all order items"
  on public.order_items for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- 6. Storage: admin can upload + manage product images
drop policy if exists "Admin can upload product images" on storage.objects;
create policy "Admin can upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Admin can manage product images" on storage.objects;
create policy "Admin can manage product images"
  on storage.objects for all
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ── HOW TO GRANT ADMIN ACCESS ─────────────────────────────────
-- After running this migration, make yourself admin:
--   update public.profiles set is_admin = true where id = '<your-user-uuid>';
-- Or: Supabase Dashboard → Table Editor → profiles → find your row → set is_admin = true
-- ─────────────────────────────────────────────────────────────
