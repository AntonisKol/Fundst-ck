-- Run this in the Supabase SQL editor for this project.
-- Mirrors the found_items table so lost items can be posted, listed, and mapped.
-- If your found_items RLS policies differ from the permissive ones below,
-- match those instead so both tables behave consistently.

create table if not exists public.lost_items (
  id uuid primary key default gen_random_uuid(),
  image_url text,
  category text,
  location text not null,
  notes text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.lost_items enable row level security;

create policy "Public can read lost items"
  on public.lost_items for select
  using (true);

create policy "Public can insert lost items"
  on public.lost_items for insert
  with check (true);

-- Enable realtime updates for the feed/map subscriptions
alter publication supabase_realtime add table public.lost_items;
