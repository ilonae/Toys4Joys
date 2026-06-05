-- ============================================================
-- TOYS4JOYS — Product translations
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
-- Adds JSONB translation columns to products.
-- German name/description stay in existing columns (canonical).
-- English and Spanish translations live in JSONB:
--   name_translations: {"en": "...", "es": "..."}
--   desc_translations: {"en": "...", "es": "..."}
-- Frontend falls back to German if translation is missing.
-- ============================================================

alter table public.products
  add column if not exists name_translations jsonb not null default '{}',
  add column if not exists desc_translations jsonb not null default '{}';

-- GIN index for fast JSONB key lookups
create index if not exists products_name_translations_idx
  on public.products using gin (name_translations);

-- Verify:
-- select id, name, name_translations, desc_translations from public.products limit 5;
