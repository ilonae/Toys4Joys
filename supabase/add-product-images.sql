-- ============================================================
-- TOYS4JOYS — Add multi-image support to products
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Add image_paths array column (stores 1–N filenames in order)
-- image_path (single) stays as fallback for rows not yet updated.
alter table public.products
  add column if not exists image_paths text[] not null default '{}';

-- Backfill: migrate existing single image_path into the array
-- (only fills rows where image_path is set but image_paths is still empty)
update public.products
  set image_paths = array[image_path]
  where image_path is not null
    and image_path <> ''
    and array_length(image_paths, 1) is null;

-- ── HOW TO ADD A SECOND IMAGE TO A PRODUCT ───────────────────
-- 1. Upload image via:
--      Supabase Dashboard → Storage → product-images → Upload file
--    Note the filename, e.g. "my-product-view2.jpg"
--
-- 2. Update the product row:
--      update public.products
--        set image_paths = array['my-product-main.jpg', 'my-product-view2.jpg']
--        where id = '<product-uuid>';
--
-- Or via Table Editor: set image_paths = {"main.jpg","side.jpg"}
-- ─────────────────────────────────────────────────────────────
