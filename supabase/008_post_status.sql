-- Run this in the Supabase SQL editor for this project, after 005_auth_setup.sql.
-- Adds an open/returned status to posts and lets posters update and delete
-- only their own posts. Safe to re-run.

-- Status: every existing and new post starts as 'open'.
alter table public.found_items add column if not exists status text not null default 'open';
alter table public.lost_items add column if not exists status text not null default 'open';
alter table public.found_items add column if not exists returned_at timestamptz;
alter table public.lost_items add column if not exists returned_at timestamptz;

alter table public.found_items drop constraint if exists found_items_status_check;
alter table public.found_items add constraint found_items_status_check check (status in ('open', 'returned'));
alter table public.lost_items drop constraint if exists lost_items_status_check;
alter table public.lost_items add constraint lost_items_status_check check (status in ('open', 'returned'));

-- The Feed and Map will only show open posts.
create index if not exists found_items_status_created_idx on public.found_items (status, created_at desc);
create index if not exists lost_items_status_created_idx on public.lost_items (status, created_at desc);

-- returned_at is set by the database, never by the app: stamped when a post
-- becomes 'returned', cleared if it's reopened.
create or replace function public.set_returned_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    new.returned_at := case when new.status = 'returned' then now() end;
  end if;
  return new;
end;
$$;

drop trigger if exists found_items_set_returned_at on public.found_items;
create trigger found_items_set_returned_at
  before update on public.found_items
  for each row execute function public.set_returned_at();

drop trigger if exists lost_items_set_returned_at on public.lost_items;
create trigger lost_items_set_returned_at
  before update on public.lost_items
  for each row execute function public.set_returned_at();

-- Signed-in users may only change the editable fields - never id, user_id,
-- created_at or returned_at - and RLS below limits them to their own rows.
revoke update on public.found_items from anon, authenticated;
revoke update on public.lost_items from anon, authenticated;
grant update (status, category, location, notes, image_url, latitude, longitude) on public.found_items to authenticated;
grant update (status, category, location, notes, image_url, latitude, longitude) on public.lost_items to authenticated;

drop policy if exists "Posters can update own found items" on public.found_items;
create policy "Posters can update own found items"
  on public.found_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Posters can update own lost items" on public.lost_items;
create policy "Posters can update own lost items"
  on public.lost_items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Posters can delete own found items" on public.found_items;
create policy "Posters can delete own found items"
  on public.found_items for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Posters can delete own lost items" on public.lost_items;
create policy "Posters can delete own lost items"
  on public.lost_items for delete
  to authenticated
  using (auth.uid() = user_id);
