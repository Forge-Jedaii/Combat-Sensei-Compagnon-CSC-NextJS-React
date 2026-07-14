begin;

-- Minimal authenticated directory: the UI receives no email or private profile field.
create or replace function public.active_fighter_directory()
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select profile.id, profile.display_name
  from public.profiles profile
  where profile.status = 'active'
  order by lower(profile.display_name), profile.id;
$$;

revoke execute on function public.active_fighter_directory() from public, anon;
grant execute on function public.active_fighter_directory() to authenticated, service_role;

-- Existing tournament RPCs store their stable participant key in metadata.
-- When that key is an active profile UUID, preserve the account relation and
-- propagate it to every tournament match so rankings and achievements update.
create or replace function private.link_tournament_participant_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare selected_profile public.profiles;
begin
  if new.user_id is null and nullif(new.metadata->>'key', '') is not null then
    begin
      select * into selected_profile from public.profiles
      where id = (new.metadata->>'key')::uuid and status = 'active';
    exception when invalid_text_representation then
      selected_profile := null;
    end;
    if selected_profile.id is not null then
      new.user_id := selected_profile.id;
      new.display_name_snapshot := selected_profile.display_name;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tournament_participant_link_identity on public.tournament_participants;
create trigger tournament_participant_link_identity
before insert or update of user_id, metadata on public.tournament_participants
for each row execute function private.link_tournament_participant_identity();

create or replace function private.link_match_participant_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare tournament_participant public.tournament_participants;
begin
  if new.tournament_participant_id is not null then
    select * into tournament_participant from public.tournament_participants
    where id = new.tournament_participant_id;
    if tournament_participant.id is null then raise exception 'tournament participant not found' using errcode = '23503'; end if;
    new.user_id := tournament_participant.user_id;
    new.display_name_snapshot := tournament_participant.display_name_snapshot;
  end if;
  return new;
end;
$$;

drop trigger if exists match_participant_link_identity on public.match_participants;
create trigger match_participant_link_identity
before insert or update of tournament_participant_id on public.match_participants
for each row execute function private.link_match_participant_identity();

create table if not exists public.achievement_badges (
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  primary key (achievement_id, badge_id)
);

alter table public.achievement_badges enable row level security;
create policy achievement_badges_public_read on public.achievement_badges
for select to anon, authenticated using (true);
create policy achievement_badges_admin_write on public.achievement_badges
for all to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));
grant select on public.achievement_badges to anon, authenticated;
grant insert, update, delete on public.achievement_badges to authenticated;
grant all on public.achievement_badges to service_role;

create or replace function public.evaluate_achievements(target_user_id uuid)
returns setof public.achievements
language plpgsql
security definer
set search_path = ''
as $$
declare progress record; inserted_id uuid; unlocked public.achievements;
begin
  if target_user_id <> (select auth.uid()) and not private.is_staff() then
    raise exception 'not allowed to evaluate achievements for this user' using errcode = '42501';
  end if;
  for progress in select * from public.achievement_progress(target_user_id) where eligible loop
    inserted_id := null;
    insert into public.user_achievements (user_id, achievement_id, progress_snapshot)
    values (target_user_id, progress.achievement_id,
      jsonb_build_object('current', progress.current_value, 'target', progress.target_value, 'progress', progress.progress))
    on conflict do nothing returning achievement_id into inserted_id;
    if inserted_id is not null then
      insert into public.user_badges (user_id, badge_id, progress, metadata)
      select target_user_id, link.badge_id, 100, jsonb_build_object('source_achievement_id', inserted_id)
      from public.achievement_badges link where link.achievement_id = inserted_id
      on conflict (user_id, badge_id) do update set progress = greatest(public.user_badges.progress, excluded.progress);
      select * into unlocked from public.achievements where id = inserted_id;
      return next unlocked;
    end if;
  end loop;
end;
$$;

revoke execute on function public.evaluate_achievements(uuid) from public, anon;
grant execute on function public.evaluate_achievements(uuid) to authenticated;

-- A connected match can only contain active, existing accounts. Names are always
-- copied from profiles, never trusted from the browser.
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
security definer
set search_path = ''
as $$
declare
  created_match public.matches;
  participant jsonb;
  selected_profile public.profiles;
  selected_user_id uuid;
  participant_position integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(target_participants) <> 'array' or jsonb_array_length(target_participants) < 2 then
    raise exception 'at least two participants are required' using errcode = '23514';
  end if;
  if exists (
    select 1 from jsonb_array_elements(target_participants) item
    where nullif(item->>'user_id', '') is null
  ) then raise exception 'every connected participant must reference an existing user' using errcode = '23514'; end if;
  if (select count(distinct item->>'user_id') from jsonb_array_elements(target_participants) item) <> jsonb_array_length(target_participants) then
    raise exception 'a user cannot participate twice in the same match' using errcode = '23505';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_client_session_id::text, 0));
  select * into created_match from public.matches
  where created_by = (select auth.uid()) and metadata->>'client_session_id' = target_client_session_id::text
    and status in ('draft', 'active') limit 1;
  if created_match.id is not null then
    return jsonb_build_object('match', to_jsonb(created_match), 'participants',
      (select jsonb_agg(to_jsonb(mp) order by mp.position) from public.match_participants mp where mp.match_id = created_match.id));
  end if;

  insert into public.matches (created_by, event_name, max_duration_seconds, mode, started_at, status, tournament_id, metadata, settings)
  values ((select auth.uid()), nullif(btrim(target_event_name), ''), target_max_duration_seconds, target_mode, now(), 'active',
    target_tournament_id, jsonb_build_object('client_session_id', target_client_session_id), coalesce(target_settings, '{}'::jsonb))
  returning * into created_match;

  for participant in select value from jsonb_array_elements(target_participants) loop
    participant_position := participant_position + 1;
    begin selected_user_id := (participant->>'user_id')::uuid;
    exception when invalid_text_representation then raise exception 'invalid participant user id' using errcode = '22023'; end;
    select * into selected_profile from public.profiles where id = selected_user_id and status = 'active';
    if selected_profile.id is null then raise exception 'participant is not an active user' using errcode = '23514'; end if;
    insert into public.match_participants (match_id, user_id, display_name_snapshot, position, starting_health, final_health)
    values (created_match.id, selected_profile.id, selected_profile.display_name, participant_position,
      coalesce((participant->>'starting_health')::integer, 10), coalesce((participant->>'starting_health')::integer, 10));
  end loop;
  insert into public.match_events (match_id, actor_id, event_type, payload)
  values (created_match.id, (select auth.uid()), 'match_started', jsonb_build_object('mode', target_mode));
  return jsonb_build_object('match', to_jsonb(created_match), 'participants',
    (select jsonb_agg(to_jsonb(mp) order by mp.position) from public.match_participants mp where mp.match_id = created_match.id));
end;
$$;

revoke execute on function public.start_match(public.match_mode, jsonb, integer, text, uuid, uuid, jsonb) from public, anon;
grant execute on function public.start_match(public.match_mode, jsonb, integer, text, uuid, uuid, jsonb) to authenticated;

-- Official, idempotent maintenance boundary for clearing combat-derived V1 data.
create or replace function public.reset_combat_history()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare deleted_matches bigint; deleted_rankings bigint; deleted_achievements bigint; deleted_badges bigint;
begin
  if not private.is_privileged_sql_caller() then raise exception 'postgres or service_role required' using errcode = '42501'; end if;
  delete from public.user_achievements; get diagnostics deleted_achievements = row_count;
  delete from public.user_badges; get diagnostics deleted_badges = row_count;
  delete from public.rankings; get diagnostics deleted_rankings = row_count;
  delete from public.matches; get diagnostics deleted_matches = row_count;
  return jsonb_build_object('matches', deleted_matches, 'rankings', deleted_rankings, 'user_achievements', deleted_achievements, 'user_badges', deleted_badges);
end;
$$;

revoke execute on function public.reset_combat_history() from public, anon, authenticated;
grant execute on function public.reset_combat_history() to service_role;

commit;
