-- ============================================================
-- TOYS4JOYS — Create reviews table (safe to re-run)
-- Run this BEFORE seed-reviews.mjs or seed-ratings.sql
-- No dependency on is_admin() — works on fresh projects.
-- ============================================================

create table if not exists public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        not null references public.products(id) on delete cascade,
  author      text        not null,
  rating      smallint    not null check (rating between 1 and 5),
  body        text        not null,
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Anyone can read reviews (public)
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select using (true);

-- Only service role can write (seed scripts use service role key)
drop policy if exists "Service role manages reviews" on public.reviews;
create policy "Service role manages reviews"
  on public.reviews for all using (auth.role() = 'service_role');

create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);

-- Verify:
-- select count(*) from public.reviews;
