begin;

create or replace function private.set_match_event_sequence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.match_id::text, 0));
  if new.sequence_number is null then
    select coalesce(max(me.sequence_number), 0) + 1
    into new.sequence_number
    from public.match_events me
    where me.match_id = new.match_id;
  end if;
  return new;
end;
$$;

drop trigger if exists match_events_set_sequence on public.match_events;
create trigger match_events_set_sequence
before insert on public.match_events
for each row execute function private.set_match_event_sequence();

-- Authenticated command boundary for creating a complete match aggregate.
-- Ownership is always derived from auth.uid(); no creator id is accepted.
alter function public.start_match(
  public.match_mode, jsonb, integer, text, uuid, uuid, jsonb
) security definer;

revoke execute on function public.start_match(
  public.match_mode, jsonb, integer, text, uuid, uuid, jsonb
) from public, anon;

grant execute on function public.start_match(
  public.match_mode, jsonb, integer, text, uuid, uuid, jsonb
) to authenticated;

create or replace function public.achievement_catalog()
returns table (
  id uuid,
  legacy_mongo_id text,
  code text,
  name text,
  description text,
  condition_type text,
  condition_value integer,
  condition_metadata jsonb,
  icon text,
  badge_label text,
  points_reward integer,
  is_active boolean,
  is_secret boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    a.id,
    a.legacy_mongo_id,
    a.code,
    case when a.is_secret and ua.achievement_id is null and not private.is_staff()
      then 'Achievement secret' else a.name end,
    case when a.is_secret and ua.achievement_id is null and not private.is_staff()
      then 'Continuez à combattre pour découvrir cet achievement.' else a.description end,
    a.condition_type::text,
    a.condition_value,
    a.condition_metadata,
    case when a.is_secret and ua.achievement_id is null and not private.is_staff()
      then '◼' else a.icon end,
    case when a.is_secret and ua.achievement_id is null and not private.is_staff()
      then null else a.badge_label end,
    a.points_reward,
    a.is_active,
    a.is_secret,
    a.created_at,
    a.updated_at
  from public.achievements a
  left join public.user_achievements ua
    on ua.achievement_id = a.id and ua.user_id = (select auth.uid())
  where (select auth.uid()) is not null and a.is_active
  order by a.created_at, a.id;
$$;

revoke execute on function public.achievement_catalog() from public, anon;
grant execute on function public.achievement_catalog() to authenticated;

commit;
