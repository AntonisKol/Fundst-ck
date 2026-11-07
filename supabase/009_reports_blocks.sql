-- Run this in the Supabase SQL editor for this project, after 006_chat.sql.
-- Tables for reporting and blocking users. Reports stay anonymous: only the
-- reporter can read their own, and reviewing them happens in the dashboard,
-- which bypasses RLS. Safe to re-run.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  -- Kept as null if the reporter deletes their account, so the report survives.
  reporter_id uuid references auth.users(id) on delete set null,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid references public.messages(id) on delete set null,
  reason text not null check (reason in ('scam', 'harassment', 'spam', 'other')),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_user_id)
);

-- One report per reporter, reported user and message (or no message).
create unique index if not exists reports_unique_idx on public.reports (
  reporter_id,
  reported_user_id,
  coalesce(message_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index if not exists reports_reported_user_idx on public.reports (reported_user_id, created_at desc);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- The primary key covers lookups by blocker; this covers "who blocked this user".
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- Reports: read your own, and file them only as yourself, about someone you
-- share a conversation with. No update/delete policies: reports can't be
-- changed or withdrawn by clients.
drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "Users can report people they chat with" on public.reports;
create policy "Users can report people they chat with"
  on public.reports for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where (c.owner_id = auth.uid() and c.requester_id = reported_user_id)
         or (c.requester_id = auth.uid() and c.owner_id = reported_user_id)
    )
    -- A quoted message must be from the reported user, in a chat with the reporter.
    -- messages' own RLS already limits this lookup to the reporter's conversations.
    and (
      message_id is null
      or exists (
        select 1 from public.messages m
        where m.id = message_id and m.sender_id = reported_user_id
      )
    )
  );

-- Blocks: entirely private to the blocker, who can also undo them.
drop policy if exists "Users can read own blocks" on public.blocks;
create policy "Users can read own blocks"
  on public.blocks for select
  to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "Users can block as themselves" on public.blocks;
create policy "Users can block as themselves"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists "Users can remove own blocks" on public.blocks;
create policy "Users can remove own blocks"
  on public.blocks for delete
  to authenticated
  using (blocker_id = auth.uid());
