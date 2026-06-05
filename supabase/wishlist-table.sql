-- ============================================================
-- TOYS4JOYS — Per-user wishlist table
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
-- Previously the wishlist lived in browser localStorage only, so it was
-- lost when the user switched device, cleared cookies, or signed in
-- somewhere else. This table makes it follow the account.
--
-- Guests still get a localStorage wishlist — the client-side hook merges
-- it into the DB on first login, so a guest can build a wishlist and
-- then carry it over by registering.
--
-- All statements are idempotent — safe to re-run.
-- ============================================================

create table if not exists public.wishlists (
  user_id    uuid        not null references auth.users(id)    on delete cascade,
  product_id uuid        not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists wishlists_user_id_idx     on public.wishlists(user_id);
create index if not exists wishlists_created_at_idx  on public.wishlists(user_id, created_at desc);

-- ── Row-level security ───────────────────────────────────────────
alter table public.wishlists enable row level security;

-- Idempotent policy creation: drop & recreate
drop policy if exists "Users read own wishlist"   on public.wishlists;
drop policy if exists "Users insert own wishlist" on public.wishlists;
drop policy if exists "Users delete own wishlist" on public.wishlists;
drop policy if exists "Service role manages wishlists" on public.wishlists;

create policy "Users read own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users insert own wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users delete own wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);

create policy "Service role manages wishlists"
  on public.wishlists for all
  using (auth.role() = 'service_role');

-- ── Verify (optional) ────────────────────────────────────────────
-- select * from public.wishlists limit 5;
-- select policyname, cmd from pg_policies where tablename = 'wishlists';
