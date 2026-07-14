begin;

-- The public profile views use security_invoker and therefore require the
-- caller to have SELECT on their underlying tables. RLS remains the row gate.
grant select on public.profiles to anon;

-- Completing a match directly would bypass ranking and achievement updates.
-- Only the SECURITY DEFINER RPC (owned by postgres) or service role may do it.
create or replace function private.protect_match_completion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status <> 'completed'
     and new.status = 'completed'
     and current_user not in ('postgres', 'service_role') then
    raise exception 'matches must be completed through complete_match'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger matches_protect_completion
before update on public.matches
for each row execute function private.protect_match_completion();

commit;
