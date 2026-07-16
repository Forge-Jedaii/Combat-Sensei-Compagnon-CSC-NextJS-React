begin;

-- Internal achievement grant boundary. It is deliberately not executable by
-- API roles: finish_match() must evaluate every linked participant, while the
-- public wrapper remains restricted to self/staff evaluation.
create or replace function private.grant_eligible_achievements(target_user_id uuid)
returns setof public.achievements
language plpgsql
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
  achievement record;
  evaluation jsonb;
  inserted_id uuid;
  unlocked public.achievements;
begin
  snapshot := private.achievement_metric_snapshot(target_user_id);
  for achievement in
    select id, condition_metadata
    from public.achievements
    where is_active
  loop
    evaluation := private.evaluate_achievement_rule(achievement.condition_metadata->'rule', snapshot);
    if not (evaluation->>'eligible')::boolean then continue; end if;

    inserted_id := null;
    insert into public.user_achievements (user_id, achievement_id, progress_snapshot)
    values (
      target_user_id,
      achievement.id,
      jsonb_build_object(
        'current', nullif(evaluation->>'current', '')::numeric,
        'target', nullif(evaluation->>'target', '')::numeric,
        'progress', (evaluation->>'progress')::integer
      )
    )
    on conflict do nothing
    returning achievement_id into inserted_id;

    if inserted_id is not null then
      insert into public.user_badges (user_id, badge_id, progress, metadata)
      select target_user_id, link.badge_id, 100,
        jsonb_build_object('source_achievement_id', inserted_id)
      from public.achievement_badges link
      where link.achievement_id = inserted_id
      on conflict (user_id, badge_id) do update
        set progress = greatest(public.user_badges.progress, excluded.progress);

      select * into unlocked from public.achievements where id = inserted_id;
      return next unlocked;
    end if;
  end loop;
end;
$$;

revoke execute on function private.grant_eligible_achievements(uuid)
from public, anon, authenticated, service_role;

create or replace function public.evaluate_achievements(target_user_id uuid)
returns setof public.achievements
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id <> (select auth.uid()) and not private.is_staff() then
    raise exception 'not allowed to evaluate achievements for this user'
      using errcode = '42501';
  end if;
  return query select * from private.grant_eligible_achievements(target_user_id);
end;
$$;

revoke execute on function public.evaluate_achievements(uuid) from public, anon;
grant execute on function public.evaluate_achievements(uuid) to authenticated;

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

  update public.matches match
  set verification_hash = encode(
    extensions.digest(
      concat_ws('|', match.id::text, match.public_id::text, match.started_at::text,
        match.ended_at::text, match.result_type::text,
        coalesce(match.winner_participant_id::text, 'draw')),
      'sha256'
    ),
    'hex'
  )
  where match.id = target_match_id
  returning * into completed_match;

  for participant in
    select distinct user_id
    from public.match_participants
    where match_id = target_match_id and user_id is not null
  loop
    unlocked := unlocked || coalesce(
      (select jsonb_agg(to_jsonb(achievement))
       from private.grant_eligible_achievements(participant.user_id) achievement),
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

revoke execute on function public.finish_match(uuid, public.match_result_type, uuid) from public, anon;
grant execute on function public.finish_match(uuid, public.match_result_type, uuid) to authenticated;

-- Repair only unambiguous stalled combats: active, exactly one fighter at zero
-- health and at least one persisted event. The last event is used as the real
-- end time so historical duration does not include time spent stalled.
do $$
declare
  stalled record;
  completed public.matches;
  participant record;
begin
  for stalled in
    select
      match.id,
      match.created_by,
      winner.id as winner_id,
      coalesce(max(event.occurred_at), match.started_at, match.created_at) as inferred_end
    from public.matches match
    join public.match_participants winner
      on winner.match_id = match.id and coalesce(winner.final_health, 0) > 0
    join public.match_participants loser
      on loser.match_id = match.id and loser.id <> winner.id and loser.final_health = 0
    join public.match_events event on event.match_id = match.id
    where match.status = 'active'
      and (select count(*) from public.match_participants item where item.match_id = match.id) = 2
      and (select count(*) from public.match_participants item where item.match_id = match.id and item.final_health = 0) = 1
    group by match.id, match.created_by, winner.id
  loop
    perform set_config('request.jwt.claim.sub', stalled.created_by::text, true);
    completed := public.complete_match(stalled.id, 'health', stalled.winner_id, stalled.inferred_end);

    update public.matches match
    set verification_hash = encode(
      extensions.digest(
        concat_ws('|', match.id::text, match.public_id::text, match.started_at::text,
          match.ended_at::text, match.result_type::text,
          coalesce(match.winner_participant_id::text, 'draw')),
        'sha256'
      ),
      'hex'
    )
    where match.id = stalled.id;

    for participant in
      select distinct user_id from public.match_participants
      where match_id = stalled.id and user_id is not null
    loop
      perform * from private.grant_eligible_achievements(participant.user_id);
    end loop;
  end loop;
  perform set_config('request.jwt.claim.sub', '', true);
end;
$$;

commit;
