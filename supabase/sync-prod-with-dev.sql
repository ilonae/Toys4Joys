-- ============================================================
-- TOYS4JOYS — Sync prod schema with dev
-- Run in: Supabase Dashboard → SQL Editor → New query (PROD project)
-- ============================================================
-- Discovered by comparing dev (cepvqygmliifrqihmplu) vs prod
-- (uglhpvdxaxtgnajdjekf) on 2026-06-06.
--
-- Without this, the live storefront returns HTTP 400 on every product
-- query (because it SELECTs name_translations / desc_translations
-- which don't exist on prod) and the admin shows "—" for every
-- supplier SKU.
--
-- All statements are idempotent — safe to re-run.
-- ============================================================

-- ── products: i18n + supplier SKU ───────────────────────────────
alter table public.products
  add column if not exists name_translations jsonb  not null default '{}',
  add column if not exists desc_translations jsonb  not null default '{}',
  add column if not exists supplier_sku      text;

create index if not exists products_name_translations_idx
  on public.products using gin (name_translations);

create index if not exists products_supplier_sku_idx
  on public.products(supplier_sku)
  where supplier_sku is not null;

-- ── orders: tracking number ────────────────────────────────────
alter table public.orders
  add column if not exists tracking_number text;

-- ── profiles: phone + email ────────────────────────────────────
alter table public.profiles
  add column if not exists phone text,
  add column if not exists email text;

-- ── Verify (optional — run after the ALTERs) ───────────────────
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'products'
--   order by column_name;
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'orders'
--   order by column_name;
-- select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'profiles'
--   order by column_name;
