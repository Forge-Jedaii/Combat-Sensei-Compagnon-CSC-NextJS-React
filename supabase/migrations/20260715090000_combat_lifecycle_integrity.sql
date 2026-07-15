begin;

-- Explicit lifecycle boundary for a match left before a result exists.
-- Cancellation never updates rankings or achievements and cannot alter a
-- completed match. SECURITY DEFINER is required so status remains protected;
-- ownership is still checked through auth.uid().
create or replace function public.cancel_match(target_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare cancelled_match public.matches;
begin
  select * into cancelled_match
  from public.matches
  where id = target_match_id
  for update;

  if cancelled_match.id is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if not private.can_manage_match(target_match_id) then
    raise exception 'not allowed to cancel this match' using errcode = '42501';
  end if;
  if cancelled_match.status = 'completed' then
    raise exception 'completed match cannot be cancelled' using errcode = '23514';
  end if;

  if cancelled_match.status <> 'cancelled' then
    update public.matches
    set status = 'cancelled',
        ended_at = now(),
        duration_seconds = case when started_at is null then duration_seconds
          else greatest(0, extract(epoch from (now() - started_at))::integer) end
    where id = target_match_id
    returning * into cancelled_match;
  end if;

  return jsonb_build_object(
    'match', to_jsonb(cancelled_match),
    'participants', (select coalesce(jsonb_agg(to_jsonb(mp) order by mp.position), '[]'::jsonb) from public.match_participants mp where mp.match_id = target_match_id),
    'faults', (select coalesce(jsonb_agg(to_jsonb(mf) order by mf.occurred_at), '[]'::jsonb) from public.match_faults mf where mf.match_id = target_match_id),
    'events', (select coalesce(jsonb_agg(to_jsonb(me) order by me.sequence_number), '[]'::jsonb) from public.match_events me where me.match_id = target_match_id)
  );
end;
$$;

revoke execute on function public.cancel_match(uuid) from public, anon;
grant execute on function public.cancel_match(uuid) to authenticated;

commit;
