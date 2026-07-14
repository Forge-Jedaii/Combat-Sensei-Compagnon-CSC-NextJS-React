begin;

-- Translate the former Elo-like deltas into a slower cumulative V1 progression.
-- complete_match() remains the exclusive command boundary.
create or replace function private.rebalance_ranking_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare legacy_delta integer;
begin
  if new.matches_played = old.matches_played + 1 then
    legacy_delta := new.score - old.score;
    new.score := old.score + case
      when new.victories = old.victories + 1 and legacy_delta = 30 then 10
      when new.draws = old.draws + 1 then 5
      when new.defeats = old.defeats + 1 then 2
      else greatest(0, legacy_delta)
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists rankings_rebalance_points on public.rankings;
create trigger rankings_rebalance_points
before update of score, victories, defeats, draws, matches_played on public.rankings
for each row execute function private.rebalance_ranking_points();

-- Defensive first-insert compatibility if a projection was manually removed.
create or replace function private.normalize_first_ranking_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.matches_played = 1
     and new.score between 990 and 1030
     and not exists (
       select 1 from public.rankings ranking
       where ranking.user_id = new.user_id and ranking.mode is not distinct from new.mode
     ) then
    new.score := case
      when new.victories = 1 then 10
      when new.draws = 1 then 5
      else 2
    end;
  end if;
  return new;
end;
$$;

-- Additional V1 quest stages. They use existing generic metrics only.
create temporary table csc_extra_quests (
  code text primary key, name text, description text, metric text, target integer,
  icon text, points integer, rarity_code text, reward_name text, reward_icon text, reward_category text
) on commit drop;

insert into csc_extra_quests values
  ('egalite_1', 'Respect mutuel', 'Terminer un combat sur une égalité.', 'ranking.draws', 1, '🤝', 30, 'common', 'Diplomate', '🤝', 'badge'),
  ('egalite_10', 'Équilibre parfait', 'Obtenir 10 égalités.', 'ranking.draws', 10, '☯️', 130, 'rare', 'Gardien de l’équilibre', '☯️', 'titre'),
  ('kills_50', 'Fléau de l’arène', 'Réaliser 50 kills.', 'combat.kills', 50, '🦂', 350, 'legendary', 'Fléau de l’arène', '🦂', 'titre'),
  ('touches_500', 'Mille éclats', 'Infliger 500 touches.', 'combat.touches', 500, '🌠', 350, 'legendary', 'Maître des mille éclats', '🌠', 'titre'),
  ('duel_matchs_25', 'Pilier du duel', 'Terminer 25 duels classiques.', 'modes.duel.matches_played', 25, '🏛️', 170, 'epic', 'Pilier du duel', '🏛️', 'titre'),
  ('officiel_matchs_5', 'Sous le sceau de la Forge', 'Terminer 5 duels officiels.', 'modes.official_duel.matches_played', 5, '📖', 120, 'rare', 'Licencié de la Forge', '📖', 'badge'),
  ('handicap_matchs_10', 'Adaptation totale', 'Terminer 10 combats Handicap.', 'modes.handicap.matches_played', 10, '🧩', 150, 'epic', 'Maître de l’adaptation', '🧩', 'titre'),
  ('highlander_matchs_5', 'Survivant éprouvé', 'Terminer 5 combats Highlander.', 'modes.highlander.matches_played', 5, '🗻', 140, 'epic', 'Survivant éprouvé', '🗻', 'titre'),
  ('tournoi_matchs_10', 'Habitué des compétitions', 'Terminer 10 combats de tournoi.', 'modes.tournament.matches_played', 10, '🎪', 150, 'epic', 'Habitué des compétitions', '🎪', 'titre'),
  ('degats_recus_500', 'Inébranlable', 'Encaisser 500 points de dégâts.', 'combat.damage_received', 500, '🧱', 180, 'epic', 'Inébranlable', '🧱', 'titre');

insert into public.achievements (code, name, description, condition_type, condition_value, condition_metadata, icon, badge_label, points_reward, is_active, is_secret)
select code, name, description, 'custom', target,
  jsonb_build_object('rule', jsonb_build_object('metric', metric, 'operator', 'gte', 'value', target)),
  icon, reward_name, points, true, false
from csc_extra_quests
on conflict (code) do update set name=excluded.name, description=excluded.description,
  condition_value=excluded.condition_value, condition_metadata=excluded.condition_metadata,
  icon=excluded.icon, badge_label=excluded.badge_label, points_reward=excluded.points_reward, is_active=true;

insert into public.badges (code, name, description, icon, rarity, category, is_active)
select 'reward_' || code, reward_name, description, reward_icon,
  rarity_code::public.badge_rarity, reward_category, true
from csc_extra_quests
on conflict (code) do update set name=excluded.name, description=excluded.description,
  icon=excluded.icon, rarity=excluded.rarity, category=excluded.category, is_active=true;

insert into public.achievement_rarities (achievement_id, rarity_id)
select achievement.id, rarity.id from csc_extra_quests seed
join public.achievements achievement on achievement.code=seed.code
join public.rarities rarity on rarity.code=seed.rarity_code on conflict do nothing;

insert into public.achievement_badges (achievement_id, badge_id)
select achievement.id, badge.id from csc_extra_quests seed
join public.achievements achievement on achievement.code=seed.code
join public.badges badge on badge.code='reward_' || seed.code on conflict do nothing;

commit;
