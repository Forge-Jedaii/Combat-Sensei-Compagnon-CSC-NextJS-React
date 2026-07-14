begin;

create type public.competition_event_status as enum ('draft', 'published', 'active', 'completed', 'cancelled');
create type public.schedule_mode as enum ('fixed', 'after_previous');

create table public.competition_events (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  location text not null check (char_length(btrim(location)) between 2 and 200),
  starts_at timestamptz not null,
  organizer_id uuid not null references public.profiles(id) on delete restrict,
  description text check (description is null or char_length(description) <= 4000),
  status public.competition_event_status not null default 'draft',
  logo_path text,
  image_path text,
  disciplines text[] not null default '{}',
  published_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_event_publication_consistency check (status <> 'published' or published_at is not null),
  constraint competition_event_completion_consistency check (status <> 'completed' or completed_at is not null)
);

create table public.competition_event_clubs (
  event_id uuid not null references public.competition_events(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  invited_at timestamptz not null default now(),
  primary key (event_id, club_id)
);

create table public.competition_event_tournaments (
  event_id uuid not null references public.competition_events(id) on delete cascade,
  tournament_id uuid not null unique references public.tournaments(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  primary key (event_id, tournament_id)
);

create table public.competition_participant_access (
  participant_id uuid primary key references public.tournament_participants(id) on delete cascade,
  public_token uuid not null unique default extensions.gen_random_uuid(),
  created_at timestamptz not null default now()
);

insert into public.competition_participant_access (participant_id)
select id from public.tournament_participants;

create or replace function private.create_competition_participant_access()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.competition_participant_access (participant_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger tournament_participant_create_access
after insert on public.tournament_participants for each row execute function private.create_competition_participant_access();

create table public.competition_activities (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.competition_events(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  schedule_mode public.schedule_mode not null default 'fixed',
  planned_start_at timestamptz,
  previous_activity_id uuid references public.competition_activities(id) on delete restrict,
  estimated_start_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  room text check (room is null or char_length(room) <= 100),
  tatami text check (tatami is null or char_length(tatami) <= 100),
  manager_id uuid references public.profiles(id) on delete set null,
  manager_name text check (manager_name is null or char_length(manager_name) <= 120),
  description text check (description is null or char_length(description) <= 2000),
  position integer not null check (position > 0),
  actual_started_at timestamptz,
  actual_ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint competition_activity_schedule_fields check (
    (schedule_mode = 'fixed' and planned_start_at is not null and previous_activity_id is null)
    or (schedule_mode = 'after_previous' and previous_activity_id is not null)
  ),
  constraint competition_activity_actual_dates check (actual_ended_at is null or actual_started_at is null or actual_ended_at >= actual_started_at),
  constraint competition_activities_event_position_unique unique (event_id, position) deferrable initially deferred
);

create index competition_events_status_start_idx on public.competition_events (status, starts_at desc);
create index competition_events_organizer_idx on public.competition_events (organizer_id, starts_at desc);
create index competition_activities_event_schedule_idx on public.competition_activities (event_id, estimated_start_at, position);
create index competition_activities_tournament_idx on public.competition_activities (tournament_id, estimated_start_at);

create trigger competition_events_set_updated_at before update on public.competition_events
for each row execute function private.set_updated_at();
create trigger competition_activities_set_updated_at before update on public.competition_activities
for each row execute function private.set_updated_at();

create or replace function private.can_manage_competition_event(target_event_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_staff() or exists (
    select 1 from public.competition_events event
    where event.id = target_event_id and event.organizer_id = (select auth.uid())
  );
$$;

create or replace function private.validate_competition_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare previous public.competition_activities;
begin
  if new.schedule_mode = 'fixed' then
    new.estimated_start_at := new.planned_start_at;
  else
    select * into previous from public.competition_activities where id = new.previous_activity_id;
    if previous.id is null or previous.event_id <> new.event_id or previous.id = new.id then
      raise exception 'previous activity must belong to the same event' using errcode = '23514';
    end if;
    if previous.position >= new.position then
      raise exception 'previous activity must precede dependent activity' using errcode = '23514';
    end if;
    new.estimated_start_at := coalesce(previous.actual_ended_at, previous.estimated_start_at + make_interval(mins => previous.duration_minutes));
  end if;
  return new;
end;
$$;

create trigger competition_activity_validate
before insert or update of event_id, schedule_mode, planned_start_at, previous_activity_id, position
on public.competition_activities for each row execute function private.validate_competition_activity();

create or replace function public.recalculate_competition_schedule(target_event_id uuid)
returns setof public.competition_activities
language plpgsql security definer set search_path = '' as $$
declare activity public.competition_activities; previous public.competition_activities; calculated timestamptz;
begin
  if not private.can_manage_competition_event(target_event_id) and not private.is_service_role() then
    raise exception 'not allowed to manage event' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_event_id::text, 0));
  for activity in select * from public.competition_activities where event_id = target_event_id order by position for update loop
    if activity.schedule_mode = 'fixed' then calculated := activity.planned_start_at;
    else
      select * into previous from public.competition_activities where id = activity.previous_activity_id;
      calculated := coalesce(previous.actual_ended_at, greatest(previous.estimated_start_at, coalesce(previous.actual_started_at, previous.estimated_start_at)) + make_interval(mins => previous.duration_minutes));
    end if;
    update public.competition_activities set estimated_start_at = calculated where id = activity.id returning * into activity;
    return next activity;
  end loop;
end;
$$;

create or replace function public.set_competition_event_status(target_event_id uuid, target_status public.competition_event_status)
returns public.competition_events language plpgsql security definer set search_path = '' as $$
declare updated public.competition_events;
begin
  if not private.can_manage_competition_event(target_event_id) then raise exception 'not allowed to manage event' using errcode = '42501'; end if;
  update public.competition_events set status = target_status,
    published_at = case when target_status = 'published' then coalesce(published_at, now()) else published_at end,
    completed_at = case when target_status = 'completed' then coalesce(completed_at, now()) else completed_at end
  where id = target_event_id returning * into updated;
  if updated.id is null then raise exception 'event not found' using errcode = 'P0002'; end if;
  return updated;
end;
$$;

create or replace function public.move_competition_activity(target_activity_id uuid, target_position integer)
returns setof public.competition_activities language plpgsql security definer set search_path = '' as $$
declare moved public.competition_activities; old_position integer;
begin
  select * into moved from public.competition_activities where id = target_activity_id for update;
  if moved.id is null then raise exception 'activity not found' using errcode = 'P0002'; end if;
  if not private.can_manage_competition_event(moved.event_id) then raise exception 'not allowed to manage event' using errcode = '42501'; end if;
  if target_position < 1 then raise exception 'position must be positive' using errcode = '22023'; end if;
  old_position := moved.position;
  if target_position < old_position then
    update public.competition_activities set position = position + 1 where event_id = moved.event_id and position >= target_position and position < old_position;
  elsif target_position > old_position then
    update public.competition_activities set position = position - 1 where event_id = moved.event_id and position > old_position and position <= target_position;
  end if;
  update public.competition_activities set position = target_position where id = target_activity_id;
  perform public.recalculate_competition_schedule(moved.event_id);
  return query select * from public.competition_activities where event_id = moved.event_id order by position;
end;
$$;

create or replace function public.record_competition_activity_timing(
  target_activity_id uuid, target_started_at timestamptz default null, target_ended_at timestamptz default null
)
returns setof public.competition_activities language plpgsql security definer set search_path = '' as $$
declare activity public.competition_activities;
begin
  select * into activity from public.competition_activities where id = target_activity_id for update;
  if activity.id is null then raise exception 'activity not found' using errcode = 'P0002'; end if;
  if not private.can_manage_competition_event(activity.event_id) then raise exception 'not allowed to manage event' using errcode = '42501'; end if;
  update public.competition_activities set
    actual_started_at = coalesce(target_started_at, actual_started_at),
    actual_ended_at = coalesce(target_ended_at, actual_ended_at)
  where id = target_activity_id;
  return query select * from public.recalculate_competition_schedule(activity.event_id);
end;
$$;

create or replace function public.competition_participant_public(target_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'participant', jsonb_build_object('name', participant.display_name_snapshot, 'club', club.name, 'rank', participant.final_rank, 'status', participant.status),
    'tournament', jsonb_build_object('id', tournament.id, 'name', tournament.name, 'status', tournament.status, 'progress', coalesce(tournament.settings->'workflow'->>'status', tournament.status::text)),
    'event', jsonb_build_object('id', event.id, 'name', event.name, 'location', event.location, 'starts_at', event.starts_at, 'status', event.status),
    'next_match', case when next_match.id is null then null else jsonb_build_object('id', next_match.public_id, 'scheduled_at', next_match.scheduled_at, 'round', next_match.round_number, 'opponent', opponent.display_name_snapshot) end,
    'activity', case when activity.id is null then null else jsonb_build_object('name', activity.name, 'estimated_start_at', activity.estimated_start_at, 'room', activity.room, 'tatami', activity.tatami) end,
    'planning', coalesce((select jsonb_agg(jsonb_build_object('name', item.name, 'estimated_start_at', item.estimated_start_at, 'duration_minutes', item.duration_minutes, 'room', item.room, 'tatami', item.tatami) order by item.position) from public.competition_activities item where item.event_id = event.id), '[]'::jsonb)
  )
  from public.tournament_participants participant
  join public.competition_participant_access access on access.participant_id = participant.id
  join public.tournaments tournament on tournament.id = participant.tournament_id
  join public.competition_event_tournaments link on link.tournament_id = tournament.id
  join public.competition_events event on event.id = link.event_id and event.status in ('published', 'active', 'completed')
  left join public.profiles profile on profile.id = participant.user_id
  left join public.clubs club on club.id = profile.club_id
  left join lateral (
    select match.* from public.matches match
    join public.match_participants own on own.match_id = match.id and own.tournament_participant_id = participant.id
    where match.tournament_id = tournament.id and match.status in ('draft', 'active')
    order by match.round_number, match.bracket_position limit 1
  ) next_match on true
  left join lateral (
    select other.display_name_snapshot from public.match_participants other
    where other.match_id = next_match.id and other.tournament_participant_id is distinct from participant.id limit 1
  ) opponent on true
  left join lateral (
    select item.* from public.competition_activities item where item.event_id = event.id and (item.tournament_id = tournament.id or item.tournament_id is null) and item.estimated_start_at >= now() order by item.estimated_start_at limit 1
  ) activity on true
  where access.public_token = target_token;
$$;

alter table public.competition_events enable row level security;
alter table public.competition_event_clubs enable row level security;
alter table public.competition_event_tournaments enable row level security;
alter table public.competition_activities enable row level security;
alter table public.competition_participant_access enable row level security;

create policy competition_events_public_read on public.competition_events for select to anon, authenticated using (status in ('published', 'active', 'completed') or private.can_manage_competition_event(id));
create policy competition_events_insert on public.competition_events for insert to authenticated with check (organizer_id = (select auth.uid()) and private.is_staff());
create policy competition_events_update on public.competition_events for update to authenticated using (private.can_manage_competition_event(id)) with check (private.can_manage_competition_event(id));
create policy competition_events_delete on public.competition_events for delete to authenticated using (private.can_manage_competition_event(id) and status = 'draft');
create policy competition_clubs_read on public.competition_event_clubs for select to anon, authenticated using (exists (select 1 from public.competition_events event where event.id = event_id and (event.status in ('published', 'active', 'completed') or private.can_manage_competition_event(event.id))));
create policy competition_clubs_manage on public.competition_event_clubs for all to authenticated using (private.can_manage_competition_event(event_id)) with check (private.can_manage_competition_event(event_id));
create policy competition_tournaments_read on public.competition_event_tournaments for select to anon, authenticated using (exists (select 1 from public.competition_events event where event.id = event_id and (event.status in ('published', 'active', 'completed') or private.can_manage_competition_event(event.id))));
create policy competition_tournaments_manage on public.competition_event_tournaments for all to authenticated using (private.can_manage_competition_event(event_id)) with check (private.can_manage_competition_event(event_id));
create policy competition_activities_read on public.competition_activities for select to anon, authenticated using (exists (select 1 from public.competition_events event where event.id = event_id and (event.status in ('published', 'active', 'completed') or private.can_manage_competition_event(event.id))));
create policy competition_activities_manage on public.competition_activities for all to authenticated using (private.can_manage_competition_event(event_id)) with check (private.can_manage_competition_event(event_id));
create policy competition_participant_access_private_read on public.competition_participant_access for select to authenticated using (
  private.is_staff() or exists (
    select 1 from public.tournament_participants participant
    where participant.id = participant_id and participant.user_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.competition_events, public.competition_event_clubs, public.competition_event_tournaments, public.competition_activities to authenticated;
grant select on public.competition_events, public.competition_event_clubs, public.competition_event_tournaments, public.competition_activities to anon;
grant select on public.competition_participant_access to authenticated;
revoke execute on function public.recalculate_competition_schedule(uuid) from public, anon;
revoke execute on function public.set_competition_event_status(uuid, public.competition_event_status) from public, anon;
revoke execute on function public.move_competition_activity(uuid, integer) from public, anon;
revoke execute on function public.record_competition_activity_timing(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.recalculate_competition_schedule(uuid) to authenticated, service_role;
grant execute on function public.set_competition_event_status(uuid, public.competition_event_status) to authenticated;
grant execute on function public.move_competition_activity(uuid, integer) to authenticated;
grant execute on function public.record_competition_activity_timing(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.competition_participant_public(uuid) to anon, authenticated;

commit;
