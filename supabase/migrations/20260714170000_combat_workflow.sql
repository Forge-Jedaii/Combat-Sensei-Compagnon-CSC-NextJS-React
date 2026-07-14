begin;

create or replace function public.start_match(
  target_mode public.match_mode,
  target_participants jsonb,
  target_max_duration_seconds integer default null,
  target_event_name text default null,
  target_tournament_id uuid default null,
  target_client_session_id uuid default extensions.gen_random_uuid(),
  target_settings jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_match public.matches;
  participant jsonb;
  participant_position integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(target_participants) <> 'array' or jsonb_array_length(target_participants) < 2 then
    raise exception 'at least two participants are required' using errcode = '23514';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_client_session_id::text));
  select * into created_match from public.matches
  where created_by = (select auth.uid())
    and metadata->>'client_session_id' = target_client_session_id::text
    and status in ('draft', 'active')
  limit 1;
  if created_match.id is not null then
    return jsonb_build_object(
      'match', to_jsonb(created_match),
      'participants', (select jsonb_agg(to_jsonb(mp) order by mp.position) from public.match_participants mp where mp.match_id = created_match.id)
    );
  end if;

  insert into public.matches (
    created_by, event_name, max_duration_seconds, mode, started_at, status,
    tournament_id, metadata, settings
  ) values (
    (select auth.uid()), nullif(btrim(target_event_name), ''),
    target_max_duration_seconds, target_mode, now(), 'active',
    target_tournament_id, jsonb_build_object('client_session_id', target_client_session_id),
    coalesce(target_settings, '{}'::jsonb)
  ) returning * into created_match;

  for participant in select value from jsonb_array_elements(target_participants)
  loop
    participant_position := participant_position + 1;
    insert into public.match_participants (
      match_id, user_id, display_name_snapshot, position, starting_health,
      final_health
    ) values (
      created_match.id,
      case
        when participant_position = 1 then (select auth.uid())
        else null
      end,
      btrim(participant->>'name'), participant_position,
      coalesce((participant->>'starting_health')::integer, 10),
      coalesce((participant->>'starting_health')::integer, 10)
    );
  end loop;

  insert into public.match_events (match_id, actor_id, event_type, payload)
  values (created_match.id, (select auth.uid()), 'match_started', jsonb_build_object('mode', target_mode));

  return jsonb_build_object(
    'match', to_jsonb(created_match),
    'participants', (
      select jsonb_agg(to_jsonb(mp) order by mp.position)
      from public.match_participants mp where mp.match_id = created_match.id
    )
  );
end;
$$;

create or replace function public.record_match_event(
  target_match_id uuid,
  target_participant_id uuid,
  target_event_type text,
  target_payload jsonb default '{}'::jsonb,
  target_final_health integer default null,
  target_score integer default null
)
returns public.match_participants
language plpgsql
security invoker
set search_path = ''
as $$
declare
  participant public.match_participants;
begin
  if not private.can_manage_match(target_match_id) then
    raise exception 'not allowed to manage this match' using errcode = '42501';
  end if;
  if not exists (select 1 from public.matches where id = target_match_id and status = 'active') then
    raise exception 'match is not active' using errcode = '23514';
  end if;

  update public.match_participants
  set final_health = coalesce(target_final_health, final_health),
      score = coalesce(target_score, score)
  where id = target_participant_id and match_id = target_match_id
  returning * into participant;
  if participant.id is null then
    raise exception 'participant not found' using errcode = 'P0002';
  end if;

  insert into public.match_events (match_id, actor_id, participant_id, event_type, payload)
  values (target_match_id, (select auth.uid()), target_participant_id, target_event_type, coalesce(target_payload, '{}'::jsonb));
  return participant;
end;
$$;

create or replace function public.record_match_fault(
  target_match_id uuid,
  target_participant_id uuid,
  target_type public.fault_type,
  target_reason_code text,
  target_reason_label text,
  target_penalty public.penalty_type,
  target_health_delta integer default 0,
  target_score_delta integer default 0
)
returns public.match_faults
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_fault public.match_faults;
begin
  if not private.can_manage_match(target_match_id) then
    raise exception 'not allowed to manage this match' using errcode = '42501';
  end if;

  insert into public.match_faults (
    match_id, participant_id, assigned_by, type, reason_code, reason_label,
    penalty, health_delta, score_delta
  ) values (
    target_match_id, target_participant_id, (select auth.uid()), target_type,
    target_reason_code, target_reason_label, target_penalty,
    target_health_delta, target_score_delta
  ) returning * into created_fault;

  update public.match_participants
  set final_health = greatest(0, coalesce(final_health, starting_health, 0) + target_health_delta),
      score = score + target_score_delta,
      is_disqualified = target_penalty = 'disqualification' or is_disqualified
  where id = target_participant_id and match_id = target_match_id;

  insert into public.match_events (match_id, actor_id, participant_id, event_type, payload)
  values (
    target_match_id, (select auth.uid()), target_participant_id, 'fault',
    jsonb_build_object('fault_id', created_fault.id, 'type', target_type, 'penalty', target_penalty)
  );
  return created_fault;
end;
$$;

create or replace function public.finish_match(
  target_match_id uuid,
  target_result_type public.match_result_type,
  target_winner_participant_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed_match public.matches;
  participant record;
  unlocked jsonb := '[]'::jsonb;
begin
  if not private.can_manage_match(target_match_id) then
    raise exception 'not allowed to finish this match' using errcode = '42501';
  end if;
  completed_match := public.complete_match(
    target_match_id, target_result_type, target_winner_participant_id, now()
  );

  update public.matches m
  set verification_hash = encode(
    extensions.digest(
      concat_ws('|', m.id::text, m.public_id::text, m.started_at::text,
        m.ended_at::text, m.result_type::text, coalesce(m.winner_participant_id::text, 'draw')),
      'sha256'
    ),
    'hex'
  )
  where m.id = target_match_id
  returning * into completed_match;

  for participant in
    select distinct user_id from public.match_participants
    where match_id = target_match_id and user_id is not null
  loop
    unlocked := unlocked || coalesce(
      (select jsonb_agg(to_jsonb(a)) from public.evaluate_achievements(participant.user_id) a),
      '[]'::jsonb
    );
  end loop;

  return jsonb_build_object(
    'match', to_jsonb(completed_match),
    'participants', (select jsonb_agg(to_jsonb(mp) order by mp.position) from public.match_participants mp where mp.match_id = target_match_id),
    'faults', (select coalesce(jsonb_agg(to_jsonb(mf) order by mf.occurred_at), '[]'::jsonb) from public.match_faults mf where mf.match_id = target_match_id),
    'events', (select coalesce(jsonb_agg(to_jsonb(me) order by me.occurred_at), '[]'::jsonb) from public.match_events me where me.match_id = target_match_id),
    'unlocked_achievements', unlocked
  );
end;
$$;

grant execute on function public.start_match(public.match_mode, jsonb, integer, text, uuid, uuid, jsonb) to authenticated;
grant execute on function public.record_match_event(uuid, uuid, text, jsonb, integer, integer) to authenticated;
grant execute on function public.record_match_fault(uuid, uuid, public.fault_type, text, text, public.penalty_type, integer, integer) to authenticated;
grant execute on function public.finish_match(uuid, public.match_result_type, uuid) to authenticated;

commit;
