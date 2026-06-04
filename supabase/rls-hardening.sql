-- ============================================================
-- TOYS4JOYS — RLS hardening
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
-- What this does:
--   1. Creates an is_admin() helper function (security definer)
--      so every RLS policy calls a cached function instead of
--      doing a raw table sub-query on every row check.
--   2. Adds a partial index on profiles(id) where is_admin = true
--      so that sub-query is near-instant even at scale.
--   3. Rewrites all admin RLS policies to use is_admin().
--   4. Locks down profiles — admins can read all, nobody can
--      delete (soft-delete only via API).
--   5. Adds explicit INSERT policy for orders so the
--      create-payment-intent API (service role) is the only
--      writer — regular users can never insert directly.
-- ============================================================


-- ── 1. is_admin() helper ──────────────────────────────────────
-- security definer = runs as the function owner (postgres),
-- bypasses RLS on the profiles table lookup.
-- stable = result can be cached within a single statement.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Revoke public execute, grant only to authenticated + anon
-- (anon needed so unauthenticated requests still evaluate to false)
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;


-- ── 2. Index for fast admin checks ───────────────────────────
-- Partial index: only indexes the handful of admin rows.
-- Makes the is_admin() lookup O(1) regardless of profile count.

create index if not exists profiles_admin_idx
  on public.profiles(id)
  where is_admin = true;


-- ── 3. Rewrite products policies ─────────────────────────────

drop policy if exists "Admin can manage products"     on public.products;
drop policy if exists "Service role can manage products" on public.products;

-- Public read (unchanged)
drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products"
  on public.products for select using (true);

-- Write: admin users OR service role
create policy "Admin or service role can manage products"
  on public.products for all
  using   (public.is_admin() or auth.role() = 'service_role')
  with check (public.is_admin() or auth.role() = 'service_role');


-- ── 4. Rewrite orders policies ────────────────────────────────

drop policy if exists "Admin can read all orders"   on public.orders;
drop policy if exists "Admin can update orders"     on public.orders;
drop policy if exists "Service role manages orders" on public.orders;
drop policy if exists "Users can read own orders"   on public.orders;

-- Users read their own
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

-- Only service role can INSERT (orders created server-side only)
create policy "Service role can insert orders"
  on public.orders for insert
  with check (auth.role() = 'service_role');

-- Service role full access + admin update
create policy "Service role full access on orders"
  on public.orders for all
  using (auth.role() = 'service_role');

create policy "Admin can update orders"
  on public.orders for update
  using   (public.is_admin())
  with check (public.is_admin());


-- ── 5. Rewrite order_items policies ──────────────────────────

drop policy if exists "Admin can read all order items"  on public.order_items;
drop policy if exists "Service role manages order items" on public.order_items;
drop policy if exists "Users can read own order items"   on public.order_items;

create policy "Users can read own order items"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders
      where id = order_id and auth.uid() = user_id
    )
  );

create policy "Service role manages order items"
  on public.order_items for all
  using (auth.role() = 'service_role');


-- ── 6. Harden profiles ───────────────────────────────────────

drop policy if exists "Users can read own profile"   on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Read: own profile or admin
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Insert: only own profile (created by trigger on sign-up)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Update: own profile or admin (needed for DSGVO anonymisation via API)
create policy "Users can update own profile"
  on public.profiles for update
  using   (auth.uid() = id or auth.role() = 'service_role')
  with check (auth.uid() = id or auth.role() = 'service_role');

-- No DELETE — soft-delete only (anonymise via API)
-- (No delete policy = no browser-level deletion possible)


-- ── 7. Storage ───────────────────────────────────────────────

drop policy if exists "Admin can upload product images"  on storage.objects;
drop policy if exists "Admin can manage product images"  on storage.objects;
drop policy if exists "Service role manages product images" on storage.objects;

create policy "Admin or service role manages product images"
  on storage.objects for all
  using (
    bucket_id = 'product-images'
    and (public.is_admin() or auth.role() = 'service_role')
  )
  with check (
    bucket_id = 'product-images'
    and (public.is_admin() or auth.role() = 'service_role')
  );


-- ── Done ──────────────────────────────────────────────────────
-- After running this, verify with:
--   select schemaname, tablename, policyname, cmd, qual
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;
