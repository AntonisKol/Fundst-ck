-- Run this in the Supabase SQL editor for this project.
-- Creates the public storage bucket for found/lost item photos: anyone can
-- view them. The open upload policy below is replaced by a signed-in-only
-- one in 005_auth_setup.sql.

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "Public can read item photos"
  on storage.objects for select
  using (bucket_id = 'item-photos');

create policy "Public can upload item photos"
  on storage.objects for insert
  with check (bucket_id = 'item-photos');
