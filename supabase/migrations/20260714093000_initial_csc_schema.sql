-- CSC / Forge Je'daii - Initial Supabase PostgreSQL schema
-- No legacy data is migrated by this migration.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Domain enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('member', 'moderator', 'admin');
create type public.profile_status as enum ('active', 'suspended', 'deleted');
create type public.match_mode as enum (
  'duel',
  'official_duel',
  'handicap',
  'tournament',
  'highlander',
  'battle_royale'
);
create type public.match_status as enum ('draft', 'active', 'completed', 'cancelled');
create type public.match_result_type as enum (
  'health',
  'points',
  'time',
  'disqualification',
  'draw',
  'forfeit',
  'other'
);
create type public.fault_type as enum ('yellow', 'red', 'black');
create type public.penalty_type as enum ('warning', 'health', 'points', 'disqualification');
create type public.tournament_type as enum ('single_elimination', 'round_robin');
create type public.tournament_status as enum ('draft', 'registration', 'active', 'completed', 'cancelled');
create type public.participant_status as enum ('registered', 'active', 'eliminated', 'withdrawn', 'winner');
create type public.achievement_condition_type as enum (
  'victories',
  'matches',
  'win_streak',
  'perfect_games',
  'score',
  'custom'
);
create type public.badge_rarity as enum ('common', 'rare', 'epic', 'legendary');
create type public.app_theme as enum ('dark', 'light', 'cyber');
create type public.app_language as enum ('fr', 'en');

-- ---------------------------------------------------------------------------
-- Identity, organizations and authorization
-- ---------------------------------------------------------------------------

create table public.clubs (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  description text,
  city text,
  department_code text,
  region text,
  country_code char(2) not null default 'FR',
  website_url text,
  logo_path text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint clubs_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint clubs_country_code_format check (country_code ~ '^[A-Z]{2}$'),
  constraint clubs_website_url_format check (website_url is null or website_url ~ '^https?://')
);

create unique index clubs_slug_uidx on public.clubs (slug);
create unique index clubs_normalized_name_country_uidx
  on public.clubs (normalized_name, country_code);
create index clubs_location_idx on public.clubs (country_code, region, department_code);
create index clubs_verified_idx on public.clubs (is_verified) where is_verified;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  normalized_display_name text generated always as (lower(btrim(display_name))) stored,
  club_id uuid references public.clubs(id) on delete set null,
  bio text,
  avatar_path text,
  share_data boolean not null default false,
  status public.profile_status not null default 'active',
  onboarding_completed boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 2 and 40),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500)
);

create unique index profiles_normalized_display_name_uidx
  on public.profiles (normalized_display_name)
  where status <> 'deleted';
create index profiles_club_idx on public.profiles (club_id);
create index profiles_public_directory_idx
  on public.profiles (club_id, normalized_display_name)
  where share_data and status = 'active';

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_role_idx on public.user_roles (role, user_id);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sound_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  theme public.app_theme not null default 'cyber',
  language public.app_language not null default 'fr',
  auto_save boolean not null default true,
  show_tutorial boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Legacy identifiers stay outside the exposed public schema.
create table private.legacy_user_mappings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  mongo_object_id text unique,
  numeric_user_id bigint unique,
  created_at timestamptz not null default now(),
  constraint legacy_user_numeric_id_positive check (numeric_user_id is null or numeric_user_id > 0),
  constraint legacy_user_identifier_present check (mongo_object_id is not null or numeric_user_id is not null)
);

-- ---------------------------------------------------------------------------
-- Achievement and badge catalogs
-- ---------------------------------------------------------------------------

create table public.rarities (
  id uuid primary key default extensions.gen_random_uuid(),
  legacy_mongo_id text unique,
  code text not null unique,
  name text not null,
  category text not null,
  description text,
  sort_order smallint not null default 0,
  color_hex text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rarities_code_format check (code ~ '^[a-z0-9_]+$'),
  constraint rarities_color_format check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create index rarities_category_sort_idx on public.rarities (category, sort_order, name);

create table public.achievements (
  id uuid primary key default extensions.gen_random_uuid(),
  legacy_mongo_id text unique,
  code text not null unique,
  name text not null,
  description text not null,
  condition_type public.achievement_condition_type not null,
  condition_value integer,
  condition_metadata jsonb not null default '{}'::jsonb,
  icon text not null,
  badge_label text,
  points_reward integer not null default 0,
  is_active boolean not null default true,
  is_secret boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievements_code_format check (code ~ '^[a-z0-9_]+$'),
  constraint achievements_condition_value_positive check (condition_value is null or condition_value > 0),
  constraint achievements_points_reward_nonnegative check (points_reward >= 0),
  constraint achievements_condition_metadata_object check (jsonb_typeof(condition_metadata) = 'object')
);

create index achievements_active_condition_idx
  on public.achievements (condition_type, condition_value)
  where is_active;

create table public.achievement_rarities (
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  rarity_id uuid not null references public.rarities(id) on delete cascade,
  primary key (achievement_id, rarity_id)
);

create index achievement_rarities_rarity_idx
  on public.achievement_rarities (rarity_id, achievement_id);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  source_match_id uuid,
  progress_snapshot jsonb not null default '{}'::jsonb,
  primary key (user_id, achievement_id),
  constraint user_achievements_progress_object check (jsonb_typeof(progress_snapshot) = 'object')
);

create index user_achievements_recent_idx
  on public.user_achievements (user_id, unlocked_at desc);
create index user_achievements_achievement_idx
  on public.user_achievements (achievement_id, unlocked_at desc);

create table public.badges (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  rarity public.badge_rarity not null default 'common',
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint badges_code_format check (code ~ '^[a-z0-9_]+$')
);

create index badges_catalog_idx on public.badges (category, rarity, name) where is_active;

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  progress integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, badge_id),
  constraint user_badges_progress_range check (progress between 0 and 100),
  constraint user_badges_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index user_badges_recent_idx on public.user_badges (user_id, unlocked_at desc);

-- ---------------------------------------------------------------------------
-- Tournaments
-- ---------------------------------------------------------------------------

create table public.tournaments (
  id uuid primary key default extensions.gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  description text,
  type public.tournament_type not null,
  status public.tournament_status not null default 'draft',
  game_mode public.match_mode not null default 'tournament',
  match_duration_seconds integer,
  max_participants integer not null default 16,
  starts_at timestamptz,
  ended_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournaments_name_length check (char_length(btrim(name)) between 2 and 120),
  constraint tournaments_duration_positive check (match_duration_seconds is null or match_duration_seconds > 0),
  constraint tournaments_participant_limit check (max_participants between 2 and 512),
  constraint tournaments_dates_order check (ended_at is null or starts_at is null or ended_at >= starts_at),
  constraint tournaments_settings_object check (jsonb_typeof(settings) = 'object')
);

create index tournaments_creator_idx on public.tournaments (created_by, created_at desc);
create index tournaments_club_status_idx on public.tournaments (club_id, status, starts_at desc);
create index tournaments_status_start_idx on public.tournaments (status, starts_at desc);

create table public.tournament_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  display_name_snapshot text not null,
  seed integer,
  final_rank integer,
  status public.participant_status not null default 'registered',
  registered_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint tournament_participants_name_length check (char_length(btrim(display_name_snapshot)) between 1 and 80),
  constraint tournament_participants_seed_positive check (seed is null or seed > 0),
  constraint tournament_participants_rank_positive check (final_rank is null or final_rank > 0),
  constraint tournament_participants_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index tournament_participants_user_uidx
  on public.tournament_participants (tournament_id, user_id)
  where user_id is not null;
create unique index tournament_participants_seed_uidx
  on public.tournament_participants (tournament_id, seed)
  where seed is not null;
create unique index tournament_participants_rank_uidx
  on public.tournament_participants (tournament_id, final_rank)
  where final_rank is not null;
create index tournament_participants_status_idx
  on public.tournament_participants (tournament_id, status, seed);

-- ---------------------------------------------------------------------------
-- Matches, participants, faults and event log
-- ---------------------------------------------------------------------------

create table public.matches (
  id uuid primary key default extensions.gen_random_uuid(),
  legacy_mongo_id text unique,
  public_id bigint generated always as identity unique,
  created_by uuid not null references public.profiles(id) on delete restrict,
  tournament_id uuid references public.tournaments(id) on delete set null,
  mode public.match_mode not null,
  status public.match_status not null default 'draft',
  result_type public.match_result_type,
  winner_participant_id uuid,
  event_name text,
  referee_id uuid references public.profiles(id) on delete set null,
  round_number integer,
  bracket_position integer,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  max_duration_seconds integer,
  verification_hash text,
  rules_version text not null default 'csc-1',
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_round_positive check (round_number is null or round_number > 0),
  constraint matches_bracket_position_positive check (bracket_position is null or bracket_position > 0),
  constraint matches_duration_nonnegative check (duration_seconds is null or duration_seconds >= 0),
  constraint matches_max_duration_positive check (max_duration_seconds is null or max_duration_seconds > 0),
  constraint matches_dates_order check (ended_at is null or started_at is null or ended_at >= started_at),
  constraint matches_completed_fields check (
    status <> 'completed'
    or (ended_at is not null and result_type is not null)
  ),
  constraint matches_settings_object check (jsonb_typeof(settings) = 'object'),
  constraint matches_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index matches_creator_recent_idx on public.matches (created_by, created_at desc);
create index matches_tournament_round_idx
  on public.matches (tournament_id, round_number, bracket_position)
  where tournament_id is not null;
create unique index matches_tournament_bracket_uidx
  on public.matches (tournament_id, round_number, bracket_position)
  where tournament_id is not null and round_number is not null and bracket_position is not null;
create index matches_status_schedule_idx on public.matches (status, scheduled_at);
create index matches_completed_recent_idx on public.matches (ended_at desc) where status = 'completed';
create index matches_referee_idx on public.matches (referee_id, ended_at desc) where referee_id is not null;

create table public.match_participants (
  id uuid primary key default extensions.gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  tournament_participant_id uuid references public.tournament_participants(id) on delete set null,
  display_name_snapshot text not null,
  position smallint not null,
  team smallint,
  starting_health integer,
  final_health integer,
  score integer not null default 0,
  placement integer,
  is_winner boolean not null default false,
  is_disqualified boolean not null default false,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint match_participants_name_length check (char_length(btrim(display_name_snapshot)) between 1 and 80),
  constraint match_participants_position_positive check (position > 0),
  constraint match_participants_team_positive check (team is null or team > 0),
  constraint match_participants_health_nonnegative check (
    (starting_health is null or starting_health >= 0)
    and (final_health is null or final_health >= 0)
  ),
  constraint match_participants_placement_positive check (placement is null or placement > 0),
  constraint match_participants_stats_object check (jsonb_typeof(stats) = 'object')
);

alter table public.match_participants
  add constraint match_participants_id_match_unique unique (id, match_id);

create unique index match_participants_position_uidx
  on public.match_participants (match_id, position);
create unique index match_participants_user_uidx
  on public.match_participants (match_id, user_id)
  where user_id is not null;
create unique index match_participants_tournament_participant_uidx
  on public.match_participants (match_id, tournament_participant_id)
  where tournament_participant_id is not null;
create unique index match_participants_single_winner_uidx
  on public.match_participants (match_id)
  where is_winner;
create index match_participants_user_history_idx
  on public.match_participants (user_id, match_id)
  where user_id is not null;

alter table public.matches
  add constraint matches_winner_participant_fk
  foreign key (winner_participant_id, id)
  references public.match_participants(id, match_id)
  on delete no action
  deferrable initially deferred;

create table public.match_faults (
  id uuid primary key default extensions.gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  participant_id uuid not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  type public.fault_type not null,
  reason_code text not null,
  reason_label text not null,
  penalty public.penalty_type not null,
  health_delta integer not null default 0,
  score_delta integer not null default 0,
  occurred_at timestamptz not null default now(),
  round_number integer,
  metadata jsonb not null default '{}'::jsonb,
  constraint match_faults_reason_code_format check (reason_code ~ '^[a-z0-9_]+$'),
  constraint match_faults_round_positive check (round_number is null or round_number > 0),
  constraint match_faults_metadata_object check (jsonb_typeof(metadata) = 'object')
);

alter table public.match_faults
  add constraint match_faults_participant_match_fk
  foreign key (participant_id, match_id)
  references public.match_participants(id, match_id)
  on delete cascade;

create index match_faults_match_time_idx on public.match_faults (match_id, occurred_at);
create index match_faults_participant_idx on public.match_faults (participant_id, occurred_at);
create index match_faults_assigned_by_idx on public.match_faults (assigned_by, occurred_at desc);

create table public.match_events (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  participant_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  sequence_number integer not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint match_events_type_format check (event_type ~ '^[a-z0-9_]+$'),
  constraint match_events_sequence_positive check (sequence_number > 0),
  constraint match_events_payload_object check (jsonb_typeof(payload) = 'object'),
  unique (match_id, sequence_number)
);

alter table public.match_events
  add constraint match_events_participant_match_fk
  foreign key (participant_id, match_id)
  references public.match_participants(id, match_id)
  on delete cascade;

create index match_events_timeline_idx on public.match_events (match_id, sequence_number);
create index match_events_participant_idx on public.match_events (participant_id, occurred_at);

alter table public.user_achievements
  add constraint user_achievements_source_match_fk
  foreign key (source_match_id) references public.matches(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Ranking projection and immutable role audit
-- ---------------------------------------------------------------------------

create table public.rankings (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode public.match_mode,
  score integer not null default 1000,
  victories integer not null default 0,
  defeats integer not null default 0,
  draws integer not null default 0,
  matches_played integer not null default 0,
  current_win_streak integer not null default 0,
  longest_win_streak integer not null default 0,
  perfect_games integer not null default 0,
  last_match_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rankings_score_floor check (score >= 0),
  constraint rankings_counts_nonnegative check (
    victories >= 0 and defeats >= 0 and draws >= 0 and matches_played >= 0
    and current_win_streak >= 0 and longest_win_streak >= 0 and perfect_games >= 0
  ),
  constraint rankings_matches_consistent check (matches_played = victories + defeats + draws),
  unique nulls not distinct (user_id, mode)
);

create index rankings_overall_score_idx
  on public.rankings (score desc, victories desc, user_id)
  where mode is null;
create index rankings_mode_score_idx
  on public.rankings (mode, score desc, victories desc, user_id)
  where mode is not null;

create table public.role_audit_log (
  id bigint generated always as identity primary key,
  target_user_id uuid not null,
  role public.app_role not null,
  action text not null check (action in ('grant', 'revoke')),
  actor_id uuid,
  occurred_at timestamptz not null default now()
);

create index role_audit_target_idx on public.role_audit_log (target_user_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Generic trigger helpers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.protect_profile_managed_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status
     and not private.is_staff()
     and not private.is_service_role() then
    raise exception 'profile status is managed by staff' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger clubs_set_updated_at before update on public.clubs
for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger profiles_protect_managed_fields before update on public.profiles
for each row execute function private.protect_profile_managed_fields();
create trigger user_settings_set_updated_at before update on public.user_settings
for each row execute function private.set_updated_at();
create trigger rarities_set_updated_at before update on public.rarities
for each row execute function private.set_updated_at();
create trigger achievements_set_updated_at before update on public.achievements
for each row execute function private.set_updated_at();
create trigger badges_set_updated_at before update on public.badges
for each row execute function private.set_updated_at();
create trigger tournaments_set_updated_at before update on public.tournaments
for each row execute function private.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
for each row execute function private.set_updated_at();
create trigger rankings_set_updated_at before update on public.rankings
for each row execute function private.set_updated_at();

-- Automatically provisions the public profile and private settings row.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');

  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(requested_name, split_part(coalesce(new.email, 'member'), '@', 1)), 31)
      || '-' || left(new.id::text, 8)
  );

  insert into public.user_settings (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.role_audit_log (target_user_id, role, action, actor_id)
  values (
    coalesce(new.user_id, old.user_id),
    coalesce(new.role, old.role),
    case when tg_op = 'INSERT' then 'grant' else 'revoke' end,
    (select auth.uid())
  );
  return coalesce(new, old);
end;
$$;

create trigger user_roles_audit
after insert or delete on public.user_roles
for each row execute function private.audit_role_change();

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------

create or replace function private.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = required_role
  );
$$;

create or replace function private.is_service_role()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'role'), '') = 'service_role';
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('moderator') or private.has_role('admin');
$$;

create or replace function private.can_manage_match(target_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff() or exists (
    select 1
    from public.matches m
    where m.id = target_match_id
      and (m.created_by = (select auth.uid()) or m.referee_id = (select auth.uid()))
  );
$$;

create or replace function private.can_view_match(target_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_manage_match(target_match_id)
    or exists (
      select 1
      from public.match_participants mp
      where mp.match_id = target_match_id
        and mp.user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.matches m
      where m.id = target_match_id
        and m.status = 'completed'
        and exists (
          select 1
          from public.match_participants mp
          join public.profiles p on p.id = mp.user_id
          where mp.match_id = m.id
            and p.share_data
            and p.status = 'active'
        )
    );
$$;

create or replace function private.can_manage_tournament(target_tournament_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff() or exists (
    select 1
    from public.tournaments t
    where t.id = target_tournament_id
      and t.created_by = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Atomic business functions
-- ---------------------------------------------------------------------------

create or replace function public.grant_app_role(target_user_id uuid, target_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('admin') and not private.is_service_role() then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (target_user_id, target_role, (select auth.uid()))
  on conflict (user_id, role) do nothing;
end;
$$;

create or replace function public.revoke_app_role(target_user_id uuid, target_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('admin') and not private.is_service_role() then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  if target_user_id = (select auth.uid()) and target_role = 'admin' then
    raise exception 'an administrator cannot revoke their own admin role' using errcode = '23514';
  end if;

  delete from public.user_roles
  where user_id = target_user_id and role = target_role;
end;
$$;

-- Finalizes one match and updates both overall and per-mode ranking projections.
-- It is idempotent: an already completed match cannot be scored twice.
create or replace function public.complete_match(
  target_match_id uuid,
  target_result_type public.match_result_type,
  target_winner_participant_id uuid default null,
  target_ended_at timestamptz default now()
)
returns public.matches
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_match public.matches;
  participant record;
  is_draw boolean;
begin
  select * into current_match
  from public.matches
  where id = target_match_id
  for update;

  if current_match.id is null then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if not private.can_manage_match(target_match_id) then
    raise exception 'not allowed to complete this match' using errcode = '42501';
  end if;
  if current_match.status = 'completed' then
    raise exception 'match is already completed' using errcode = '23505';
  end if;
  if current_match.status = 'cancelled' then
    raise exception 'cancelled match cannot be completed' using errcode = '23514';
  end if;
  if (select count(*) from public.match_participants where match_id = target_match_id) < 2 then
    raise exception 'a match requires at least two participants' using errcode = '23514';
  end if;
  if target_winner_participant_id is not null and not exists (
    select 1 from public.match_participants
    where id = target_winner_participant_id and match_id = target_match_id
  ) then
    raise exception 'winner is not a participant in this match' using errcode = '23503';
  end if;

  is_draw := target_result_type = 'draw';
  if is_draw <> (target_winner_participant_id is null) then
    raise exception 'draws must have no winner; other results require one winner' using errcode = '23514';
  end if;

  update public.match_participants
  set is_winner = (id = target_winner_participant_id)
  where match_id = target_match_id;

  update public.matches
  set status = 'completed',
      result_type = target_result_type,
      winner_participant_id = target_winner_participant_id,
      ended_at = target_ended_at,
      duration_seconds = case
        when started_at is not null then greatest(0, extract(epoch from (target_ended_at - started_at))::integer)
        else duration_seconds
      end
  where id = target_match_id
  returning * into current_match;

  for participant in
    select mp.user_id, mp.id, mp.is_winner,
           coalesce(mp.final_health = mp.starting_health and mp.is_winner, false) as perfect_game
    from public.match_participants mp
    where mp.match_id = target_match_id and mp.user_id is not null
  loop
    insert into public.rankings (
      user_id, mode, score, victories, defeats, draws, matches_played,
      current_win_streak, longest_win_streak, perfect_games, last_match_at
    )
    values (
      participant.user_id,
      null,
      greatest(0, 1000 + case when is_draw then 0 when participant.is_winner then 30 else -10 end),
      case when participant.is_winner then 1 else 0 end,
      case when not is_draw and not participant.is_winner then 1 else 0 end,
      case when is_draw then 1 else 0 end,
      1,
      case when participant.is_winner then 1 else 0 end,
      case when participant.is_winner then 1 else 0 end,
      case when participant.perfect_game then 1 else 0 end,
      target_ended_at
    )
    on conflict (user_id, mode) do update set
      score = greatest(0, public.rankings.score + case when is_draw then 0 when participant.is_winner then 30 else -10 end),
      victories = public.rankings.victories + case when participant.is_winner then 1 else 0 end,
      defeats = public.rankings.defeats + case when not is_draw and not participant.is_winner then 1 else 0 end,
      draws = public.rankings.draws + case when is_draw then 1 else 0 end,
      matches_played = public.rankings.matches_played + 1,
      current_win_streak = case when participant.is_winner then public.rankings.current_win_streak + 1 else 0 end,
      longest_win_streak = greatest(
        public.rankings.longest_win_streak,
        case when participant.is_winner then public.rankings.current_win_streak + 1 else 0 end
      ),
      perfect_games = public.rankings.perfect_games + case when participant.perfect_game then 1 else 0 end,
      last_match_at = target_ended_at;

    insert into public.rankings (
      user_id, mode, score, victories, defeats, draws, matches_played,
      current_win_streak, longest_win_streak, perfect_games, last_match_at
    )
    values (
      participant.user_id,
      current_match.mode,
      greatest(0, 1000 + case when is_draw then 0 when participant.is_winner then 30 else -10 end),
      case when participant.is_winner then 1 else 0 end,
      case when not is_draw and not participant.is_winner then 1 else 0 end,
      case when is_draw then 1 else 0 end,
      1,
      case when participant.is_winner then 1 else 0 end,
      case when participant.is_winner then 1 else 0 end,
      case when participant.perfect_game then 1 else 0 end,
      target_ended_at
    )
    on conflict (user_id, mode) do update set
      score = greatest(0, public.rankings.score + case when is_draw then 0 when participant.is_winner then 30 else -10 end),
      victories = public.rankings.victories + case when participant.is_winner then 1 else 0 end,
      defeats = public.rankings.defeats + case when not is_draw and not participant.is_winner then 1 else 0 end,
      draws = public.rankings.draws + case when is_draw then 1 else 0 end,
      matches_played = public.rankings.matches_played + 1,
      current_win_streak = case when participant.is_winner then public.rankings.current_win_streak + 1 else 0 end,
      longest_win_streak = greatest(
        public.rankings.longest_win_streak,
        case when participant.is_winner then public.rankings.current_win_streak + 1 else 0 end
      ),
      perfect_games = public.rankings.perfect_games + case when participant.perfect_game then 1 else 0 end,
      last_match_at = target_ended_at;
  end loop;

  return current_match;
end;
$$;

-- Grants deterministic achievements from the ranking projection.
create or replace function public.evaluate_achievements(target_user_id uuid)
returns setof public.achievements
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id <> (select auth.uid()) and not private.is_staff() then
    raise exception 'not allowed to evaluate achievements for this user' using errcode = '42501';
  end if;

  return query
  with overall as (
    select * from public.rankings
    where user_id = target_user_id and mode is null
  ), eligible as (
    select a.id
    from public.achievements a
    cross join overall r
    where a.is_active
      and a.condition_type <> 'custom'
      and case a.condition_type
        when 'victories' then r.victories >= a.condition_value
        when 'matches' then r.matches_played >= a.condition_value
        when 'win_streak' then r.longest_win_streak >= a.condition_value
        when 'perfect_games' then r.perfect_games >= a.condition_value
        when 'score' then r.score >= a.condition_value
        else false
      end
  ), inserted as (
    insert into public.user_achievements (user_id, achievement_id)
    select target_user_id, e.id from eligible e
    on conflict do nothing
    returning achievement_id
  )
  select a.* from public.achievements a
  join inserted i on i.achievement_id = a.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_settings enable row level security;
alter table public.rarities enable row level security;
alter table public.achievements enable row level security;
alter table public.achievement_rarities enable row level security;
alter table public.user_achievements enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.match_faults enable row level security;
alter table public.match_events enable row level security;
alter table public.rankings enable row level security;
alter table public.role_audit_log enable row level security;

create policy clubs_public_read on public.clubs for select to anon, authenticated using (true);
create policy clubs_staff_insert on public.clubs for insert to authenticated with check (private.is_staff());
create policy clubs_staff_update on public.clubs for update to authenticated using (private.is_staff()) with check (private.is_staff());
create policy clubs_admin_delete on public.clubs for delete to authenticated using (private.has_role('admin'));

create policy profiles_self_or_public_read on public.profiles for select to anon, authenticated
using (status = 'active' and share_data or id = (select auth.uid()) or private.is_staff());
create policy profiles_self_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_staff_update on public.profiles for update to authenticated
using (private.is_staff()) with check (private.is_staff());

create policy user_roles_self_read on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or private.has_role('admin'));

create policy settings_self_all on public.user_settings for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy rarities_public_read on public.rarities for select to anon, authenticated using (true);
create policy rarities_admin_write on public.rarities for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));
create policy achievements_public_read on public.achievements for select to anon, authenticated
using ((is_active and not is_secret) or private.is_staff());
create policy achievements_admin_write on public.achievements for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));
create policy achievement_rarities_public_read on public.achievement_rarities for select to anon, authenticated using (true);
create policy achievement_rarities_admin_write on public.achievement_rarities for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));

create policy user_achievements_read on public.user_achievements for select to authenticated
using (
  user_id = (select auth.uid()) or private.is_staff() or exists (
    select 1 from public.profiles p where p.id = user_id and p.share_data and p.status = 'active'
  )
);

create policy badges_public_read on public.badges for select to anon, authenticated using (is_active or private.is_staff());
create policy badges_admin_write on public.badges for all to authenticated
using (private.has_role('admin')) with check (private.has_role('admin'));
create policy user_badges_read on public.user_badges for select to authenticated
using (
  user_id = (select auth.uid()) or private.is_staff() or exists (
    select 1 from public.profiles p where p.id = user_id and p.share_data and p.status = 'active'
  )
);

create policy tournaments_public_read on public.tournaments for select to anon, authenticated
using (status in ('registration', 'active', 'completed') or created_by = (select auth.uid()) or private.is_staff());
create policy tournaments_authenticated_insert on public.tournaments for insert to authenticated
with check (created_by = (select auth.uid()));
create policy tournaments_manager_update on public.tournaments for update to authenticated
using (private.can_manage_tournament(id)) with check (private.can_manage_tournament(id));
create policy tournaments_manager_delete on public.tournaments for delete to authenticated
using (private.can_manage_tournament(id) and status = 'draft');

create policy tournament_participants_visible on public.tournament_participants for select to anon, authenticated
using (exists (
  select 1 from public.tournaments t
  where t.id = tournament_id
    and (t.status in ('registration', 'active', 'completed') or private.can_manage_tournament(t.id))
));
create policy tournament_participants_manager_insert on public.tournament_participants for insert to authenticated
with check (private.can_manage_tournament(tournament_id));
create policy tournament_participants_manager_update on public.tournament_participants for update to authenticated
using (private.can_manage_tournament(tournament_id)) with check (private.can_manage_tournament(tournament_id));
create policy tournament_participants_manager_delete on public.tournament_participants for delete to authenticated
using (private.can_manage_tournament(tournament_id));

create policy matches_read on public.matches for select to authenticated
using (private.can_view_match(id));
create policy matches_creator_insert on public.matches for insert to authenticated
with check (created_by = (select auth.uid()));
create policy matches_manager_update on public.matches for update to authenticated
using (private.can_manage_match(id) and status <> 'completed')
with check (private.can_manage_match(id));
create policy matches_manager_delete on public.matches for delete to authenticated
using (private.can_manage_match(id) and status = 'draft');

create policy match_participants_read on public.match_participants for select to authenticated
using (private.can_view_match(match_id));
create policy match_participants_manager_insert on public.match_participants for insert to authenticated
with check (private.can_manage_match(match_id));
create policy match_participants_manager_update on public.match_participants for update to authenticated
using (private.can_manage_match(match_id)) with check (private.can_manage_match(match_id));
create policy match_participants_manager_delete on public.match_participants for delete to authenticated
using (private.can_manage_match(match_id));

create policy match_faults_read on public.match_faults for select to authenticated
using (private.can_view_match(match_id));
create policy match_faults_manager_insert on public.match_faults for insert to authenticated
with check (private.can_manage_match(match_id));
create policy match_faults_manager_update on public.match_faults for update to authenticated
using (private.can_manage_match(match_id)) with check (private.can_manage_match(match_id));
create policy match_faults_manager_delete on public.match_faults for delete to authenticated
using (private.can_manage_match(match_id));

create policy match_events_read on public.match_events for select to authenticated
using (private.can_view_match(match_id));
create policy match_events_manager_insert on public.match_events for insert to authenticated
with check (private.can_manage_match(match_id));

create policy rankings_public_read on public.rankings for select to anon, authenticated
using (
  user_id = (select auth.uid()) or private.is_staff() or exists (
    select 1 from public.profiles p
    where p.id = user_id and p.share_data and p.status = 'active'
  )
);
create policy role_audit_admin_read on public.role_audit_log for select to authenticated
using (private.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Safe, RLS-aware read views
-- ---------------------------------------------------------------------------

create view public.public_profiles
with (security_invoker = true)
as
select
  p.id,
  p.display_name,
  p.club_id,
  c.name as club_name,
  p.bio,
  p.avatar_path,
  p.last_active_at,
  p.created_at
from public.profiles p
left join public.clubs c on c.id = p.club_id
where p.share_data and p.status = 'active';

create view public.leaderboard
with (security_invoker = true)
as
select
  r.user_id,
  p.display_name,
  p.club_id,
  c.name as club_name,
  r.mode,
  r.score,
  r.victories,
  r.defeats,
  r.draws,
  r.matches_played,
  case when r.matches_played = 0 then 0
       else round((r.victories::numeric / r.matches_played::numeric) * 100, 2)
  end as win_rate,
  r.longest_win_streak,
  r.perfect_games,
  r.last_match_at,
  dense_rank() over (partition by r.mode order by r.score desc, r.victories desc) as rank_position
from public.rankings r
join public.profiles p on p.id = r.user_id
left join public.clubs c on c.id = p.club_id
where p.share_data and p.status = 'active';

create view public.match_summaries
with (security_invoker = true)
as
select
  m.id,
  m.public_id,
  m.mode,
  m.status,
  m.result_type,
  m.tournament_id,
  m.event_name,
  m.started_at,
  m.ended_at,
  m.duration_seconds,
  m.rules_version,
  jsonb_agg(
    jsonb_build_object(
      'participant_id', mp.id,
      'user_id', mp.user_id,
      'name', mp.display_name_snapshot,
      'position', mp.position,
      'score', mp.score,
      'final_health', mp.final_health,
      'placement', mp.placement,
      'is_winner', mp.is_winner,
      'is_disqualified', mp.is_disqualified
    ) order by mp.position
  ) as participants
from public.matches m
join public.match_participants mp on mp.match_id = m.id
group by m.id;

create view public.user_statistics
with (security_invoker = true)
as
select
  p.id as user_id,
  p.display_name,
  count(distinct mp.match_id) filter (where m.status = 'completed')::integer as matches_played,
  count(distinct mp.match_id) filter (where m.status = 'completed' and mp.is_winner)::integer as victories,
  count(distinct mp.match_id) filter (
    where m.status = 'completed' and m.result_type = 'draw'
  )::integer as draws,
  count(distinct mp.match_id) filter (
    where m.status = 'completed' and not mp.is_winner and m.result_type <> 'draw'
  )::integer as defeats,
  max(m.ended_at) filter (where m.status = 'completed') as last_match_at
from public.profiles p
left join public.match_participants mp on mp.user_id = p.id
left join public.matches m on m.id = mp.match_id
group by p.id, p.display_name;

-- ---------------------------------------------------------------------------
-- Explicit API grants (RLS remains the row-level gate)
-- ---------------------------------------------------------------------------

grant usage on schema private to anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.has_role(public.app_role) to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.can_manage_match(uuid) to authenticated;
grant execute on function private.can_view_match(uuid) to authenticated;
grant execute on function private.can_manage_tournament(uuid) to authenticated;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.clubs, public.rarities, public.achievements,
  public.achievement_rarities, public.badges, public.rankings,
  public.public_profiles, public.leaderboard
to anon;

grant select on all tables in schema public to authenticated;
grant insert, update on public.profiles, public.user_settings to authenticated;
grant insert, update, delete on public.clubs, public.rarities, public.achievements,
  public.achievement_rarities, public.badges, public.tournaments,
  public.tournament_participants, public.matches, public.match_participants,
  public.match_faults
to authenticated;
grant insert on public.match_events to authenticated;
grant usage on all sequences in schema public to authenticated;
grant select on public.public_profiles, public.leaderboard,
  public.match_summaries, public.user_statistics
to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.complete_match(uuid, public.match_result_type, uuid, timestamptz) to authenticated;
grant execute on function public.evaluate_achievements(uuid) to authenticated;
grant execute on function public.grant_app_role(uuid, public.app_role) to authenticated;
grant execute on function public.revoke_app_role(uuid, public.app_role) to authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Service role retains operational access and bypasses RLS in Supabase.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
grant usage on schema private to service_role;
grant all on all tables in schema private to service_role;

commit;
