-- Run this in the Supabase SQL editor for this project.
-- Private 1:1 chat between an item's poster and someone contacting them
-- about it. Run after auth_setup.sql (items need a user_id).

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  item_type text not null check (item_type in ('found', 'lost')),
  owner_id uuid not null references auth.users(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (item_type, item_id, requester_id),
  check (owner_id <> requester_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index if not exists conversations_owner_idx on public.conversations (owner_id);
create index if not exists conversations_requester_idx on public.conversations (requester_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Participants only. Conversations are created through start_conversation()
-- below, never inserted directly, so there's no insert policy.
drop policy if exists "Participants can read conversations" on public.conversations;
create policy "Participants can read conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() in (owner_id, requester_id));

create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations
    where id = conv_id and auth.uid() in (owner_id, requester_id)
  );
$$;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id));

drop policy if exists "Participants can send messages as themselves" on public.messages;
create policy "Participants can send messages as themselves"
  on public.messages for insert
  to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

-- No update/delete policies: message history can't be edited. Read receipts
-- go through mark_conversation_read() below.

-- Looks up the item's real poster server-side so a client can't pick who
-- it's chatting with. Returns the existing conversation if there is one.
create or replace function public.start_conversation(p_item_type text, p_item_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_conv uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to contact the poster';
  end if;

  if p_item_type = 'found' then
    select user_id into v_owner from public.found_items where id = p_item_id;
  elsif p_item_type = 'lost' then
    select user_id into v_owner from public.lost_items where id = p_item_id;
  else
    raise exception 'Unknown item type: %', p_item_type;
  end if;

  if v_owner is null then
    raise exception 'This item can''t be contacted';
  end if;
  if v_owner = auth.uid() then
    raise exception 'This is your own post';
  end if;

  insert into public.conversations (item_id, item_type, owner_id, requester_id)
  values (p_item_id, p_item_type, v_owner, auth.uid())
  on conflict (item_type, item_id, requester_id) do nothing
  returning id into v_conv;

  if v_conv is null then
    select id into v_conv from public.conversations
    where item_type = p_item_type and item_id = p_item_id and requester_id = auth.uid();
  end if;

  return v_conv;
end;
$$;

-- Marks the other participant's messages in a conversation as read.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and read_at is null
    and public.is_conversation_participant(p_conversation_id);
$$;

-- Keep conversations sorted by latest activity.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

revoke execute on function public.start_conversation(text, uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.start_conversation(text, uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- Realtime respects the select policies above, so each user only receives
-- messages from their own conversations.
-- Wrapped so re-running this file doesn't fail on already-added tables.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
end $$;
