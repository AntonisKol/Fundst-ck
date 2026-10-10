-- Run this in the Supabase SQL editor for this project.
-- Adds user attribution to posts and restricts posting to signed-in
-- users. Browsing (select) stays open to everyone - only insert changes.

alter table public.found_items add column if not exists user_id uuid references auth.users(id);
alter table public.lost_items add column if not exists user_id uuid references auth.users(id);

-- lost_items: drop the old "anyone can insert" policy from
-- supabase/003_lost_items.sql and replace it with an authenticated-only one.
drop policy if exists "Public can insert lost items" on public.lost_items;

create policy "Authenticated users can insert own lost items"
  on public.lost_items for insert
  to authenticated
  with check (auth.uid() = user_id);

-- found_items: this table predates this migration and its insert policy
-- name isn't known here. First find it:
--
--   select policyname, cmd, qual, with_check
--   from pg_policies
--   where tablename = 'found_items';
--
-- Then drop whatever the existing permissive INSERT policy is called
-- (something like "Public can insert found items"), e.g.:
--
--   drop policy "<name from the query above>" on public.found_items;
--
-- and run this replacement:

create policy "Authenticated users can insert own found items"
  on public.found_items for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Storage: restrict photo uploads to signed-in users too (read stays public).
drop policy if exists "Public can upload item photos" on storage.objects;

create policy "Authenticated users can upload item photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'item-photos');
