-- ============================================================
-- TOYS4JOYS — Add tracking_number to orders
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

alter table public.orders
  add column if not exists tracking_number text;
