-- ============================================================
-- TOYS4JOYS — Hide-from-catalog flag on products
-- Run in: Supabase Dashboard → SQL Editor (BOTH dev and prod)
-- ============================================================
-- Adds an `is_visible` boolean to products so admins can hide a
-- product from the customer-facing catalog without deleting it.
--
-- Semantics:
--   is_visible = true   → shows in catalog (default for all rows)
--   is_visible = false  → hidden from /products lookups; still in Admin
--
-- Different from existing fields:
--   featured  → highlighted on the landing page
--   stock = 0 → shows as AUSVERKAUFT but still visible
--   is_visible = false → not in catalog at all
--
-- All statements are idempotent — safe to re-run.
-- ============================================================

alter table public.products
  add column if not exists is_visible boolean not null default true;

-- Customer-facing queries filter on this — index helps with the WHERE.
create index if not exists products_is_visible_idx
  on public.products(is_visible)
  where is_visible = true;

-- Sanity:
-- select count(*) filter (where is_visible) as visible,
--        count(*) filter (where not is_visible) as hidden
-- from public.products;
