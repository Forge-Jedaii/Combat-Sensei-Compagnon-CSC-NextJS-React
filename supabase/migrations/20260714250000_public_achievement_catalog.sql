begin;

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
    achievement.id,
    achievement.legacy_mongo_id,
    achievement.code,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then 'Achievement secret' else achievement.name end,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then 'Continuez à combattre pour découvrir cet achievement.' else achievement.description end,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then 'custom' else achievement.condition_type::text end,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then null else achievement.condition_value end,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then '{}'::jsonb else achievement.condition_metadata end,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then '◼' else achievement.icon end,
    case when achievement.is_secret and unlocked.achievement_id is null and not private.is_staff()
      then null else achievement.badge_label end,
    achievement.points_reward,
    achievement.is_active,
    achievement.is_secret,
    achievement.created_at,
    achievement.updated_at
  from public.achievements achievement
  left join public.user_achievements unlocked
    on unlocked.achievement_id = achievement.id
   and unlocked.user_id = (select auth.uid())
  where achievement.is_active
  order by achievement.created_at, achievement.id;
$$;

revoke execute on function public.achievement_catalog() from public;
grant execute on function public.achievement_catalog() to anon, authenticated, service_role;

commit;
