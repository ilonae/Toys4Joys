-- ============================================================
-- TOYS4JOYS — Supabase Schema  (safe to re-run)
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ── 0. Enums ─────────────────────────────────────────────────
-- Mirror exactly what the TypeScript types define.

-- Product category (matches src/types/index.ts → Category)
do $$ begin
  create type product_category as enum (
    'Latex & Fetischwear',
    'BDSM & Kontrolle',
    'Vibratoren & Elektro',
    'Dildos',
    'Anal'
  );
exception when duplicate_object then null; end $$;

-- Difficulty level (matches Level)
do $$ begin
  create type product_level as enum (
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
    'All levels'
  );
exception when duplicate_object then null; end $$;

-- Badge (matches BadgeType — nullable)
do $$ begin
  create type product_badge as enum (
    'sale',
    'bestseller',
    'new',
    'expert'
  );
exception when duplicate_object then null; end $$;


-- ── 1. Products ───────────────────────────────────────────────

create table if not exists public.products (
  id          uuid             primary key default gen_random_uuid(),
  name        text             not null,
  brand       text             not null default '',
  cat         product_category not null,
  sub         text             not null default '',   -- free-text subcategory
  price       numeric(10,2)    not null check (price >= 0),
  old_price   numeric(10,2)    check (old_price >= 0),
  badge       product_badge,                          -- null = no badge
  rating      numeric(3,1)     not null default 0 check (rating >= 0 and rating <= 5),
  rev         integer          not null default 0 check (rev >= 0),
  mat         text             not null default '',   -- material
  lvl         product_level    not null default 'All levels',
  description text             not null default '',
  -- image_path stores only the filename, e.g. "xd-19022.jpg"
  -- Full URL = <SUPABASE_URL>/storage/v1/object/public/product-images/<image_path>
  sku         text             unique,                  -- e.g. "T4J-0042" — auto-assigned by tool
  image_path  text,
  featured    boolean          not null default false,
  created_at  timestamptz      not null default now(),
  updated_at  timestamptz      not null default now()
);

-- Row-level security
alter table public.products enable row level security;

create policy "Anyone can read products"
  on public.products for select using (true);

create policy "Service role can manage products"
  on public.products for all using (auth.role() = 'service_role');

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Indexes
create index if not exists products_cat_idx      on public.products(cat);
create index if not exists products_featured_idx on public.products(featured) where featured = true;
create index if not exists products_sub_idx      on public.products(cat, sub);


-- ── 2. Product-images storage bucket ─────────────────────────
-- Public bucket — anyone can read, only service-role can write.
-- Image URL pattern: <SUPABASE_URL>/storage/v1/object/public/product-images/<filename>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,                             -- public = no signed URLs needed
  5242880,                          -- 5 MB limit per image
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Anyone can view product images
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only service-role (Supabase dashboard / server) can upload/delete
drop policy if exists "Service role manages product images" on storage.objects;
create policy "Service role manages product images"
  on storage.objects for all
  using (bucket_id = 'product-images' and auth.role() = 'service_role');


-- ── 3. User profiles ──────────────────────────────────────────
-- Extends auth.users with name + delivery address.
-- Created automatically via trigger on sign-up.

create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  first_name  text        not null default '',
  last_name   text        not null default '',
  street      text        not null default '',
  zip         text        not null default '',
  city        text        not null default '',
  country     text        not null default 'Deutschland',
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ── 4. Auto-create profile on sign-up ────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstName', ''),
    coalesce(new.raw_user_meta_data->>'lastName',  '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Done ──────────────────────────────────────────────────────
/*
  HOW TO ADD A PRODUCT
  ────────────────────
  1. Upload image via:
       Supabase Dashboard → Storage → product-images → Upload file
     Note the filename (e.g. "xd-19022.jpg").

  2. Insert product row:
       Supabase Dashboard → Table Editor → products → Insert row
       Set image_path = 'xd-19022.jpg'
       The shop constructs the full URL automatically.

  SETTINGS TO CHANGE (one-time)
  ─────────────────────────────
  • Auth → Settings → disable "Confirm email" (dev convenience)
  • Auth → Settings → Site URL = http://localhost:5173 (dev)
*/
