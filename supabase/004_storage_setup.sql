-- Run this in the Supabase SQL editor for this project.
-- Creates the storage bucket used for found/lost item photos, replacing
-- Cloudinary. Photos are publicly readable (same trust model as the
-- found_items/lost_items tables - anyone can view, anyone can post) and
-- anyone can upload, since the app has no auth yet.

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "Public can read item photos"
  on storage.objects for select
  using (bucket_id = 'item-photos');

create policy "Public can upload item photos"
  on storage.objects for insert
  with check (bucket_id = 'item-photos');
