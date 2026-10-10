-- Run this in the Supabase SQL editor for this project, after 006_chat.sql.
-- Server-side chat safety rules. The app checks the same patterns before
-- sending (src/constants/safety.ts - keep the two in sync), but only this
-- trigger is binding: it also covers clients that skip the app's checks.

-- Supports the per-sender rate limit below.
create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at);

create or replace function public.check_message_safety()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Emails first: their domain part would otherwise match as a link.
  if new.body ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then
    raise exception 'Email addresses aren''t allowed in chat. Keep the conversation in the app.';
  end if;

  -- Any domain-like word or IP address, not just known TLDs.
  if new.body ~* '(https?://|www\.|\y[a-z0-9-]+\.[a-z]{2,}\y|\y[0-9]{1,3}(\.[0-9]{1,3}){3}\y)' then
    raise exception 'Links aren''t allowed in chat, to protect you from phishing.';
  end if;

  -- Phone numbers are allowed on purpose: finders and owners often need to
  -- call each other to arrange a handover.

  -- Spam limit: at most 20 messages per sender per minute.
  if (
    select count(*) from public.messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'You''re sending messages too fast. Please wait a moment.';
  end if;

  return new;
end;
$$;

revoke execute on function public.check_message_safety() from public, anon, authenticated;

drop trigger if exists messages_check_safety on public.messages;
create trigger messages_check_safety
  before insert on public.messages
  for each row execute function public.check_message_safety();
