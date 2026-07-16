begin;

create table if not exists public.match_admin_audit_log (
  id bigint generated always as identity primary key,
  match_id uuid not null,
  public_id bigint not null,
  action text not null check (action = 'delete'),
  actor_id uuid references public.profiles(id) on delete set null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  occurred_at timestamptz not null default now()
);

create index if not exists match_admin_audit_recent_idx
  on public.match_admin_audit_log (occurred_at desc);

alter table public.match_admin_audit_log enable row level security;
create policy match_admin_audit_admin_read on public.match_admin_audit_log
for select to authenticated using (private.has_role('admin'));
grant select on public.match_admin_audit_log to authenticated;
grant all on public.match_admin_audit_log to service_role;

-- Rankings are projections: rebuilding them from completed matches is safer
-- than trying to reverse a historical delta. It also guarantees a zero base.
create or replace function private.rebuild_fighter_progress(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rankings where user_id = target_user_id;

  with fights as (
    select
      participant.user_id,
      match.mode,
      match.ended_at,
      participant.is_winner,
      match.result_type = 'draw' as is_draw,
      participant.final_health = participant.starting_health and participant.is_winner as is_perfect
    from public.match_participants participant
    join public.matches match on match.id = participant.match_id
    where participant.user_id = target_user_id and match.status = 'completed'
  ), expanded as (
    select fights.*, null::public.match_mode as ranking_mode from fights
    union all
    select fights.*, fights.mode as ranking_mode from fights
  ), grouped as (
    select expanded.*,
      sum(case when is_winner then 0 else 1 end) over (
        partition by ranking_mode order by ended_at nulls last
      ) as streak_group
    from expanded
  ), aggregates as (
    select
      user_id,
      ranking_mode,
      sum(case when is_winner then 10 when is_draw then 5 else 2 end)::integer as score,
      count(*) filter (where is_winner)::integer as victories,
      count(*) filter (where not is_winner and not is_draw)::integer as defeats,
      count(*) filter (where is_draw)::integer as draws,
      count(*)::integer as matches_played,
      count(*) filter (
        where is_winner and ended_at > coalesce((
          select max(other.ended_at) from expanded other
          where other.ranking_mode is not distinct from grouped.ranking_mode
            and not other.is_winner
        ), '-infinity'::timestamptz)
      )::integer as current_win_streak,
      coalesce((
        select max(streak_size) from (
          select count(*)::integer as streak_size
          from grouped streak
          where streak.ranking_mode is not distinct from grouped.ranking_mode
            and streak.is_winner
          group by streak.streak_group
        ) streaks
      ), 0)::integer as longest_win_streak,
      count(*) filter (where is_perfect)::integer as perfect_games,
      max(ended_at) as last_match_at
    from grouped
    group by user_id, ranking_mode
  )
  insert into public.rankings (
    user_id, mode, score, victories, defeats, draws, matches_played,
    current_win_streak, longest_win_streak, perfect_games, last_match_at
  )
  select user_id, ranking_mode, score, victories, defeats, draws, matches_played,
    current_win_streak, longest_win_streak, perfect_games, last_match_at
  from aggregates;

  insert into public.rankings (
    user_id, mode, score, victories, defeats, draws, matches_played,
    current_win_streak, longest_win_streak, perfect_games
  )
  values (target_user_id, null, 0, 0, 0, 0, 0, 0, 0, 0)
  on conflict (user_id, mode) do nothing;

  delete from public.user_badges
  where user_id = target_user_id and metadata ? 'source_achievement_id';
  delete from public.user_achievements where user_id = target_user_id;
  perform * from private.grant_eligible_achievements(target_user_id);
end;
$$;

revoke execute on function private.rebuild_fighter_progress(uuid)
from public, anon, authenticated, service_role;

create or replace function public.admin_delete_match(target_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_match public.matches;
  affected_user_id uuid;
  affected_user_ids uuid[];
  deleted_snapshot jsonb;
begin
  if not private.has_role('admin') then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  select * into target_match from public.matches where id = target_match_id for update;
  if target_match.id is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;

  select coalesce(array_agg(distinct participant.user_id) filter (where participant.user_id is not null), '{}'::uuid[])
  into affected_user_ids
  from public.match_participants participant
  where participant.match_id = target_match_id;

  deleted_snapshot := jsonb_build_object(
    'match', to_jsonb(target_match),
    'participants', (select coalesce(jsonb_agg(to_jsonb(participant) order by participant.position), '[]'::jsonb) from public.match_participants participant where participant.match_id = target_match_id),
    'events', (select coalesce(jsonb_agg(to_jsonb(event) order by event.occurred_at), '[]'::jsonb) from public.match_events event where event.match_id = target_match_id),
    'faults', (select coalesce(jsonb_agg(to_jsonb(fault) order by fault.occurred_at), '[]'::jsonb) from public.match_faults fault where fault.match_id = target_match_id)
  );

  insert into public.match_admin_audit_log (match_id, public_id, action, actor_id, snapshot)
  values (target_match.id, target_match.public_id, 'delete', (select auth.uid()), deleted_snapshot);

  delete from public.matches where id = target_match_id;

  foreach affected_user_id in array affected_user_ids loop
    perform private.rebuild_fighter_progress(affected_user_id);
  end loop;

  return jsonb_build_object(
    'deleted_match_id', target_match.id,
    'public_id', target_match.public_id,
    'affected_user_ids', to_jsonb(affected_user_ids)
  );
end;
$$;

revoke execute on function public.admin_delete_match(uuid) from public, anon;
grant execute on function public.admin_delete_match(uuid) to authenticated;

-- Reconcile legacy 1000-point projections with the cumulative 10/5/2 model.
do $$
declare fighter record;
begin
  for fighter in select id from public.profiles where status <> 'deleted' loop
    perform private.rebuild_fighter_progress(fighter.id);
  end loop;
end;
$$;

commit;
