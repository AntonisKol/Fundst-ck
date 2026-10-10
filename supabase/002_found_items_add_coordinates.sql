-- Run this in the Supabase SQL editor for this project.
-- found_items predates the geocoding feature and is missing the
-- latitude/longitude columns that FoundItemScreen's insert and
-- MapScreen's markers both expect.

alter table public.found_items add column if not exists latitude double precision;
alter table public.found_items add column if not exists longitude double precision;
