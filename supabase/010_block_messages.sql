-- Run this in the Supabase SQL editor for this project, after 009_reports_blocks.sql.
-- Refuses new messages when either person in a conversation has blocked the
-- other. Safe to re-run.

-- security definer: the sender can't read a block made against them, and
-- shouldn't be able to. The message is the same in both directions, so it
-- doesn't reveal who blocked whom.
create or replace function public.check_message_not_blocked()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.conversations c
    join public.blocks b
      on (b.blocker_id = c.owner_id and b.blocked_id = c.requester_id)
      or (b.blocker_id = c.requester_id and b.blocked_id = c.owner_id)
    where c.id = new.conversation_id
  ) then
    raise exception 'You can''t message this person.';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_message_not_blocked() from public, anon, authenticated;

drop trigger if exists messages_check_not_blocked on public.messages;
create trigger messages_check_not_blocked
  before insert on public.messages
  for each row execute function public.check_message_not_blocked();
