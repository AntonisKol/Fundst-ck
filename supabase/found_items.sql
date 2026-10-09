-- Run this in the Supabase SQL editor for this project.
-- Creates the found_items table for a fresh project. Older projects already
-- have it (see found_items_add_coordinates.sql), so this is a no-op there.
--
-- Fresh project run order:
--   1. found_items.sql
--   2. lost_items.sql
--   3. storage_setup.sql
--   4. auth_setup.sql

create table if not exists public.found_items (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  category text,
  location text not null,
  notes text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.found_items enable row level security;

drop policy if exists "Public can read found items" on public.found_items;

create policy "Public can read found items"
  on public.found_items for select
  using (true);

-- Enable realtime updates for the feed/map subscriptions
alter publication supabase_realtime add table public.found_items;
