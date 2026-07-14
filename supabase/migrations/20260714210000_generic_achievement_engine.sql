begin;

alter table public.achievements alter column condition_type set default 'custom';

create table public.achievement_metric_definitions (
  metric_path text primary key,
  label text not null,
  value_type text not null default 'number' check (value_type in ('number', 'text', 'boolean')),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint achievement_metric_path_format check (metric_path ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$')
);

insert into public.achievement_metric_definitions (metric_path, label, description) values
  ('ranking.score', 'Score CSC', 'Score du classement général'),
  ('ranking.victories', 'Victoires', 'Nombre total de victoires'),
  ('ranking.defeats', 'Défaites', 'Nombre total de défaites'),
  ('ranking.draws', 'Égalités', 'Nombre total d’égalités'),
  ('ranking.matches_played', 'Matchs joués', 'Nombre total de matchs terminés'),
  ('ranking.current_win_streak', 'Série actuelle', 'Série de victoires actuelle'),
  ('ranking.longest_win_streak', 'Meilleure série', 'Meilleure série de victoires'),
  ('ranking.perfect_games', 'Combats parfaits', 'Victoires sans perte de vie'),
  ('combat.kills', 'Kills', 'Adversaires terminant à zéro PV'),
  ('combat.deaths', 'Deaths', 'Matchs terminés à zéro PV'),
  ('combat.touches', 'Touches', 'Touches infligées'),
  ('combat.damage_dealt', 'Dégâts infligés', 'Somme des dégâts infligés'),
  ('combat.damage_received', 'Dégâts reçus', 'Somme des dégâts reçus'),
  ('combat.duration_seconds', 'Temps de combat', 'Durée cumulée des combats en secondes'),
  ('faults.yellow', 'Cartons jaunes', 'Nombre de cartons jaunes reçus'),
  ('faults.red', 'Cartons rouges', 'Nombre de cartons rouges reçus'),
  ('faults.black', 'Cartons noirs', 'Nombre de cartons noirs reçus')
on conflict (metric_path) do update set label = excluded.label, description = excluded.description;

insert into public.achievement_metric_definitions (metric_path, label, description)
select 'modes.' || mode::text || '.' || metric, initcap(replace(mode::text, '_', ' ')) || ' · ' || label, description
from unnest(enum_range(null::public.match_mode)) as modes(mode)
cross join (values
  ('score', 'Score', 'Score dans ce mode'), ('victories', 'Victoires', 'Victoires dans ce mode'),
  ('defeats', 'Défaites', 'Défaites dans ce mode'), ('draws', 'Égalités', 'Égalités dans ce mode'),
  ('matches_played', 'Matchs', 'Matchs joués dans ce mode'), ('current_win_streak', 'Série actuelle', 'Série actuelle dans ce mode'),
  ('longest_win_streak', 'Meilleure série', 'Meilleure série dans ce mode'), ('perfect_games', 'Combats parfaits', 'Combats parfaits dans ce mode')
) definition(metric, label, description)
on conflict (metric_path) do nothing;

alter table public.achievement_metric_definitions enable row level security;
create policy achievement_metrics_read on public.achievement_metric_definitions for select to authenticated using (is_active or private.has_role('admin'));
create policy achievement_metrics_admin_write on public.achievement_metric_definitions for all to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));
grant select, insert, update, delete on public.achievement_metric_definitions to authenticated;
grant all on public.achievement_metric_definitions to service_role;

create or replace function private.achievement_metric_snapshot(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with overall as (
    select coalesce((select to_jsonb(r) from public.rankings r where r.user_id = target_user_id and r.mode is null), '{}'::jsonb) value
  ), per_mode as (
    select coalesce(jsonb_object_agg(r.mode::text, jsonb_build_object(
      'score', r.score, 'victories', r.victories, 'defeats', r.defeats, 'draws', r.draws,
      'matches_played', r.matches_played, 'current_win_streak', r.current_win_streak,
      'longest_win_streak', r.longest_win_streak, 'perfect_games', r.perfect_games
    )), '{}'::jsonb) value from public.rankings r where r.user_id = target_user_id and r.mode is not null
  ), own as (
    select mp.id, mp.match_id, mp.final_health from public.match_participants mp join public.matches m on m.id = mp.match_id
    where mp.user_id = target_user_id and m.status = 'completed'
  ), combat as (
    select
      count(distinct opponent.id) filter (where opponent.final_health = 0)::numeric as kills,
      (select count(*) from own where final_health = 0)::numeric as deaths,
      count(*) filter (where me.event_type = 'hit' and not exists (select 1 from own where id = me.participant_id))::numeric as touches,
      coalesce(sum(case when me.event_type = 'hit' and not exists (select 1 from own where id = me.participant_id) then coalesce((me.payload->>'damage')::numeric, 1) else 0 end), 0) as damage_dealt,
      coalesce(sum(case when me.event_type = 'hit' and exists (select 1 from own where id = me.participant_id) then coalesce((me.payload->>'damage')::numeric, 1) else 0 end), 0) as damage_received
    from public.match_events me
    left join public.match_participants opponent on opponent.id = me.participant_id
    where me.match_id in (select match_id from own)
  ), duration as (
    select coalesce(sum(m.duration_seconds), 0)::numeric value from public.matches m where m.id in (select match_id from own)
  ), faults as (
    select count(*) filter (where mf.type = 'yellow')::numeric yellow, count(*) filter (where mf.type = 'red')::numeric red, count(*) filter (where mf.type = 'black')::numeric black
    from public.match_faults mf where mf.participant_id in (select id from own)
  )
  select jsonb_build_object(
    'ranking', jsonb_build_object(
      'score', coalesce((overall.value->>'score')::numeric, 0), 'victories', coalesce((overall.value->>'victories')::numeric, 0),
      'defeats', coalesce((overall.value->>'defeats')::numeric, 0), 'draws', coalesce((overall.value->>'draws')::numeric, 0),
      'matches_played', coalesce((overall.value->>'matches_played')::numeric, 0), 'current_win_streak', coalesce((overall.value->>'current_win_streak')::numeric, 0),
      'longest_win_streak', coalesce((overall.value->>'longest_win_streak')::numeric, 0), 'perfect_games', coalesce((overall.value->>'perfect_games')::numeric, 0)
    ),
    'modes', per_mode.value,
    'combat', jsonb_build_object('kills', combat.kills, 'deaths', combat.deaths, 'touches', combat.touches, 'damage_dealt', combat.damage_dealt, 'damage_received', combat.damage_received, 'duration_seconds', duration.value),
    'faults', jsonb_build_object('yellow', faults.yellow, 'red', faults.red, 'black', faults.black)
  ) from overall cross join per_mode cross join combat cross join duration cross join faults;
$$;

create or replace function private.evaluate_achievement_rule(target_rule jsonb, target_snapshot jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare child jsonb; child_result jsonb; actual jsonb; selected_metric_path text; operator text; expected numeric; current_value numeric; eligible boolean; progress numeric; aggregate_progress numeric; group_operator text;
begin
  if jsonb_typeof(target_rule) <> 'object' then raise exception 'achievement rule must be an object' using errcode = '22023'; end if;
  if target_rule ? 'rules' then
    if jsonb_typeof(target_rule->'rules') <> 'array' or jsonb_array_length(target_rule->'rules') = 0 then raise exception 'achievement rule group cannot be empty' using errcode = '22023'; end if;
    group_operator := coalesce(target_rule->>'combinator', 'all');
    if group_operator not in ('all', 'any') then raise exception 'invalid achievement combinator' using errcode = '22023'; end if;
    eligible := group_operator = 'all'; aggregate_progress := case when group_operator = 'all' then 100 else 0 end;
    for child in select value from jsonb_array_elements(target_rule->'rules') loop
      child_result := private.evaluate_achievement_rule(child, target_snapshot);
      if group_operator = 'all' then eligible := eligible and (child_result->>'eligible')::boolean; aggregate_progress := least(aggregate_progress, (child_result->>'progress')::numeric);
      else eligible := eligible or (child_result->>'eligible')::boolean; aggregate_progress := greatest(aggregate_progress, (child_result->>'progress')::numeric); end if;
    end loop;
    return jsonb_build_object('eligible', eligible, 'progress', round(aggregate_progress), 'current', null, 'target', null);
  end if;
  selected_metric_path := target_rule->>'metric'; operator := coalesce(target_rule->>'operator', 'gte');
  if selected_metric_path is null or selected_metric_path !~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$' or not exists (select 1 from public.achievement_metric_definitions definition where definition.metric_path = selected_metric_path and definition.is_active) then raise exception 'unknown achievement metric: %', selected_metric_path using errcode = '22023'; end if;
  if operator not in ('gte', 'gt', 'lte', 'lt', 'eq', 'neq') then raise exception 'invalid achievement operator' using errcode = '22023'; end if;
  if jsonb_typeof(target_rule->'value') <> 'number' then raise exception 'achievement target value must be numeric' using errcode = '22023'; end if;
  actual := jsonb_extract_path(target_snapshot, variadic string_to_array(selected_metric_path, '.')); current_value := coalesce((actual #>> '{}')::numeric, 0); expected := (target_rule->>'value')::numeric;
  eligible := case operator when 'gte' then current_value >= expected when 'gt' then current_value > expected when 'lte' then current_value <= expected when 'lt' then current_value < expected when 'eq' then current_value = expected when 'neq' then current_value <> expected end;
  progress := case when eligible then 100 when operator in ('gte', 'gt', 'eq') and expected > 0 then least(99, greatest(0, current_value / expected * 100)) else 0 end;
  return jsonb_build_object('eligible', eligible, 'progress', round(progress), 'current', current_value, 'target', expected);
end;
$$;

with mappings(condition_type, metric_path) as (values
  ('victories'::public.achievement_condition_type, 'ranking.victories'), ('matches'::public.achievement_condition_type, 'ranking.matches_played'),
  ('win_streak'::public.achievement_condition_type, 'ranking.longest_win_streak'), ('perfect_games'::public.achievement_condition_type, 'ranking.perfect_games'),
  ('score'::public.achievement_condition_type, 'ranking.score')
)
update public.achievements a set condition_metadata = jsonb_set(a.condition_metadata, '{rule}', jsonb_build_object('metric', m.metric_path, 'operator', 'gte', 'value', a.condition_value), true)
from mappings m where a.condition_type = m.condition_type and a.condition_value is not null and not (a.condition_metadata ? 'rule');

update public.achievements set is_active = false where is_active and not (condition_metadata ? 'rule');

create or replace function private.validate_achievement_definition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active then perform private.evaluate_achievement_rule(new.condition_metadata->'rule', '{}'::jsonb); end if;
  return new;
end;
$$;

create trigger achievements_validate_definition before insert or update of condition_metadata, is_active on public.achievements for each row execute function private.validate_achievement_definition();

create or replace function public.achievement_progress(target_user_id uuid)
returns table (achievement_id uuid, current_value numeric, target_value numeric, progress integer, eligible boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare snapshot jsonb; achievement record; evaluation jsonb;
begin
  if target_user_id <> (select auth.uid()) and not private.is_staff() then raise exception 'not allowed to read achievement progress' using errcode = '42501'; end if;
  snapshot := private.achievement_metric_snapshot(target_user_id);
  for achievement in select id, condition_metadata from public.achievements where is_active loop
    evaluation := private.evaluate_achievement_rule(achievement.condition_metadata->'rule', snapshot);
    achievement_id := achievement.id; current_value := nullif(evaluation->>'current', '')::numeric; target_value := nullif(evaluation->>'target', '')::numeric; progress := (evaluation->>'progress')::integer; eligible := (evaluation->>'eligible')::boolean; return next;
  end loop;
end;
$$;

create or replace function public.evaluate_achievements(target_user_id uuid)
returns setof public.achievements
language plpgsql
security definer
set search_path = ''
as $$
declare progress record; inserted_id uuid; unlocked public.achievements;
begin
  if target_user_id <> (select auth.uid()) and not private.is_staff() then raise exception 'not allowed to evaluate achievements for this user' using errcode = '42501'; end if;
  for progress in select * from public.achievement_progress(target_user_id) where eligible loop
    inserted_id := null;
    insert into public.user_achievements (user_id, achievement_id, progress_snapshot)
    values (target_user_id, progress.achievement_id, jsonb_build_object('current', progress.current_value, 'target', progress.target_value, 'progress', progress.progress))
    on conflict do nothing returning achievement_id into inserted_id;
    if inserted_id is not null then select * into unlocked from public.achievements where id = inserted_id; return next unlocked; end if;
  end loop;
end;
$$;

revoke execute on function public.achievement_progress(uuid) from public, anon;
grant execute on function public.achievement_progress(uuid) to authenticated;
grant execute on function public.evaluate_achievements(uuid) to authenticated;

commit;
