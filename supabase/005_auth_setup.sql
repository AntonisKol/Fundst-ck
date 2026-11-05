-- Run this in the Supabase SQL editor for this project.
-- Adds user attribution to posts and restricts posting to signed-in
-- users. Browsing (select) stays open to everyone - only insert changes.

alter table public.found_items add column if not exists user_id uuid references auth.users(id);
alter table public.lost_items add column if not exists user_id uuid references auth.users(id);

-- lost_items: drop the old "anyone can insert" policy from
-- supabase/003_lost_items.sql and replace it with an authenticated-only one.
drop policy if exists "Public can insert lost items" on public.lost_items;

drop policy if exists "Authenticated users can insert own lost items" on public.lost_items;
create policy "Authenticated users can insert own lost items"
  on public.lost_items for insert
  to authenticated
  with check (auth.uid() = user_id);

-- found_items predates this migration and may have an insert policy with a
-- project-specific name. Remove every INSERT/ALL policy before adding the
-- authenticated owner-only policy, including when this migration is rerun.
do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'found_items'
      and cmd in ('INSERT', 'ALL')
  loop
    execute format('drop policy %I on public.found_items', policy_name);
  end loop;
end $$;

alter table public.found_items enable row level security;
drop policy if exists "Public can read found items" on public.found_items;
create policy "Public can read found items"
  on public.found_items for select
  using (true);

drop policy if exists "Authenticated users can insert own found items" on public.found_items;
create policy "Authenticated users can insert own found items"
  on public.found_items for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Storage: restrict photo uploads to signed-in users too (read stays public).
drop policy if exists "Public can upload item photos" on storage.objects;
drop policy if exists "Authenticated users can upload item photos" on storage.objects;

create policy "Authenticated users can upload item photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'item-photos');
