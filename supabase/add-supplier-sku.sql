-- ============================================================
-- TOYS4JOYS — Supplier SKU on products
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
-- supplier_sku: the SKU number from your supplier/wholesaler.
-- Distinct from our internal `sku` field.
-- ============================================================

alter table public.products
  add column if not exists supplier_sku text;

create index if not exists products_supplier_sku_idx
  on public.products(supplier_sku)
  where supplier_sku is not null;

-- Verify:
-- select id, name, sku, supplier_sku from public.products limit 10;
