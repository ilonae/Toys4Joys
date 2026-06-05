-- ============================================================
-- TOYS4JOYS — Profile enhancements
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================
-- 1. Add email column to profiles (synced from auth.users)
-- 2. Add phone column
-- 3. Backfill existing profiles with email from auth.users
-- ============================================================


-- ── 1. New columns ────────────────────────────────────────────

alter table public.profiles
  add column if not exists email text not null default '',
  add column if not exists phone text not null default '';


-- ── 2. Backfill email for existing users ──────────────────────

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email = '' or p.email is null);


-- ── 3. Sync email on new sign-up ──────────────────────────────
-- Replaces the existing handle_new_user trigger to also store email.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstName', ''),
    coalesce(new.raw_user_meta_data->>'lastName',  ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set email = coalesce(new.email, '');
  return new;
end;
$$;

-- Keep existing trigger (already created in schema.sql), just replace the function above.


-- ── 4. Sync email when user updates their auth email ──────────

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute procedure public.sync_profile_email();


-- ── 5. RLS: admin can read all profiles ───────────────────────
-- (May already exist from rls-hardening.sql — safe to re-run)

drop policy if exists "Admin can read all profiles" on public.profiles;
create policy "Admin can read all profiles"
  on public.profiles for select
  using (public.is_admin());


-- ── Verify ────────────────────────────────────────────────────
-- select id, email, phone, first_name, last_name from public.profiles limit 10;
