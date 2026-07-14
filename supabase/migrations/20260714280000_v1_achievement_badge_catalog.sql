begin;

create temporary table csc_v1_catalog (
  code text primary key,
  name text not null,
  description text not null,
  metric text not null,
  target integer not null,
  icon text not null,
  points integer not null,
  rarity_code text not null,
  reward_name text not null,
  reward_icon text not null,
  reward_category text not null
) on commit drop;

insert into csc_v1_catalog values
  ('premier_pas', 'Premier pas', 'Terminer son premier combat.', 'ranking.matches_played', 1, '🌱', 20, 'common', 'Novice de la Forge', '🌱', 'titre'),
  ('combattant_5', 'Combattant régulier', 'Terminer 5 combats.', 'ranking.matches_played', 5, '⚔️', 40, 'common', 'Combattant', '⚔️', 'titre'),
  ('combattant_10', 'Habitué de l’arène', 'Terminer 10 combats.', 'ranking.matches_played', 10, '🛡️', 60, 'common', 'Habitué de l’arène', '🛡️', 'titre'),
  ('combattant_25', 'Vétéran', 'Terminer 25 combats.', 'ranking.matches_played', 25, '🏟️', 100, 'rare', 'Vétéran de la Forge', '🏟️', 'titre'),
  ('combattant_50', 'Maître de l’arène', 'Terminer 50 combats.', 'ranking.matches_played', 50, '🔥', 180, 'epic', 'Maître de l’arène', '🔥', 'titre'),
  ('combattant_100', 'Légende vivante', 'Terminer 100 combats.', 'ranking.matches_played', 100, '🌌', 300, 'legendary', 'Légende vivante', '🌌', 'titre'),

  ('premiere_victoire', 'Première victoire', 'Remporter son premier combat.', 'ranking.victories', 1, '🏅', 30, 'common', 'Victorieux', '🏅', 'badge'),
  ('victoires_5', 'Champion débutant', 'Remporter 5 combats.', 'ranking.victories', 5, '🥇', 70, 'common', 'Champion débutant', '🥇', 'titre'),
  ('victoires_10', 'Champion confirmé', 'Remporter 10 combats.', 'ranking.victories', 10, '🏆', 120, 'rare', 'Champion confirmé', '🏆', 'titre'),
  ('victoires_25', 'Seigneur des duels', 'Remporter 25 combats.', 'ranking.victories', 25, '👑', 220, 'epic', 'Seigneur des duels', '👑', 'titre'),
  ('victoires_50', 'Invincible', 'Remporter 50 combats.', 'ranking.victories', 50, '💫', 350, 'legendary', 'Invincible', '💫', 'titre'),

  ('serie_3', 'Élan victorieux', 'Enchaîner 3 victoires.', 'ranking.longest_win_streak', 3, '⚡', 60, 'common', 'Sur une lancée', '⚡', 'badge'),
  ('serie_5', 'Force imparable', 'Enchaîner 5 victoires.', 'ranking.longest_win_streak', 5, '🔥', 120, 'rare', 'Force imparable', '🔥', 'titre'),
  ('serie_10', 'Domination absolue', 'Enchaîner 10 victoires.', 'ranking.longest_win_streak', 10, '☄️', 260, 'legendary', 'Dominateur absolu', '☄️', 'titre'),

  ('parfait_1', 'Sans une égratignure', 'Remporter un combat parfait.', 'ranking.perfect_games', 1, '✨', 60, 'common', 'Intouchable', '✨', 'badge'),
  ('parfait_5', 'Maîtrise parfaite', 'Remporter 5 combats parfaits.', 'ranking.perfect_games', 5, '💎', 150, 'epic', 'Maître parfait', '💎', 'titre'),
  ('parfait_10', 'Perfection incarnée', 'Remporter 10 combats parfaits.', 'ranking.perfect_games', 10, '🌟', 300, 'legendary', 'Perfection incarnée', '🌟', 'titre'),

  ('rang_1000', 'Initiation accomplie', 'Atteindre 100 points CSC.', 'ranking.score', 100, '🔰', 20, 'common', 'Rang Initié', '🔰', 'rang'),
  ('rang_1100', 'Aspirant', 'Atteindre 250 points CSC.', 'ranking.score', 250, '🥉', 70, 'common', 'Rang Aspirant', '🥉', 'rang'),
  ('rang_1250', 'Gardien', 'Atteindre 500 points CSC.', 'ranking.score', 500, '🥈', 130, 'rare', 'Rang Gardien', '🥈', 'rang'),
  ('rang_1500', 'Maître', 'Atteindre 1000 points CSC.', 'ranking.score', 1000, '🥇', 220, 'epic', 'Rang Maître', '🥇', 'rang'),
  ('rang_1750', 'Grand Maître', 'Atteindre 1500 points CSC.', 'ranking.score', 1500, '🏆', 320, 'epic', 'Rang Grand Maître', '🏆', 'rang'),
  ('rang_2000', 'Légende de la Force', 'Atteindre 2500 points CSC.', 'ranking.score', 2500, '👑', 500, 'legendary', 'Rang Légende', '👑', 'rang'),

  ('premier_kill', 'Coup décisif', 'Mettre un adversaire à zéro PV.', 'combat.kills', 1, '💥', 40, 'common', 'Frappe décisive', '💥', 'badge'),
  ('kills_10', 'Finisseur', 'Réaliser 10 kills.', 'combat.kills', 10, '🎯', 120, 'rare', 'Finisseur', '🎯', 'titre'),
  ('kills_25', 'Exécuteur', 'Réaliser 25 kills.', 'combat.kills', 25, '☠️', 240, 'epic', 'Exécuteur', '☠️', 'titre'),

  ('touches_10', 'Précision', 'Infliger 10 touches.', 'combat.touches', 10, '🎯', 30, 'common', 'Précis', '🎯', 'badge'),
  ('touches_50', 'Fine lame', 'Infliger 50 touches.', 'combat.touches', 50, '🤺', 90, 'rare', 'Fine lame', '🤺', 'titre'),
  ('touches_200', 'Danse du sabre', 'Infliger 200 touches.', 'combat.touches', 200, '🌀', 230, 'epic', 'Danseur du sabre', '🌀', 'titre'),
  ('degats_50', 'Impact', 'Infliger 50 points de dégâts.', 'combat.damage_dealt', 50, '💢', 50, 'common', 'Percuteur', '💢', 'badge'),
  ('degats_250', 'Puissance maîtrisée', 'Infliger 250 points de dégâts.', 'combat.damage_dealt', 250, '🔨', 140, 'rare', 'Puissance maîtrisée', '🔨', 'titre'),
  ('degats_1000', 'Force déchaînée', 'Infliger 1000 points de dégâts.', 'combat.damage_dealt', 1000, '🌋', 350, 'legendary', 'Force déchaînée', '🌋', 'titre'),
  ('temps_600', 'Endurant', 'Cumuler 10 minutes de combat.', 'combat.duration_seconds', 600, '⏱️', 50, 'common', 'Endurant', '⏱️', 'badge'),
  ('temps_3600', 'Infatigable', 'Cumuler une heure de combat.', 'combat.duration_seconds', 3600, '⌛', 180, 'epic', 'Infatigable', '⌛', 'titre'),

  ('duel_victoire_1', 'Duelliste', 'Remporter un duel classique.', 'modes.duel.victories', 1, '⚔️', 40, 'common', 'Duelliste', '⚔️', 'badge'),
  ('duel_victoire_10', 'Maître du duel', 'Remporter 10 duels classiques.', 'modes.duel.victories', 10, '🗡️', 160, 'epic', 'Maître du duel', '🗡️', 'titre'),
  ('officiel_victoire_1', 'Combattant officiel', 'Remporter un duel officiel.', 'modes.official_duel.victories', 1, '📜', 60, 'rare', 'Combattant officiel', '📜', 'badge'),
  ('handicap_victoire_1', 'Au-delà des limites', 'Remporter un combat Handicap.', 'modes.handicap.victories', 1, '🎲', 60, 'rare', 'Briseur de limites', '🎲', 'titre'),
  ('highlander_victoire_1', 'Il ne peut en rester qu’un', 'Remporter un combat Highlander.', 'modes.highlander.victories', 1, '🔥', 70, 'rare', 'Highlander', '🔥', 'titre'),
  ('tournoi_victoire_1', 'Compétiteur', 'Remporter un combat de tournoi.', 'modes.tournament.victories', 1, '🏟️', 70, 'rare', 'Compétiteur', '🏟️', 'badge');

insert into public.achievements (
  code, name, description, condition_type, condition_value, condition_metadata,
  icon, badge_label, points_reward, is_active, is_secret
)
select
  seed.code, seed.name, seed.description, 'custom', seed.target,
  jsonb_build_object('rule', jsonb_build_object('metric', seed.metric, 'operator', 'gte', 'value', seed.target)),
  seed.icon, seed.reward_name, seed.points, true, false
from csc_v1_catalog seed
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  condition_type = excluded.condition_type,
  condition_value = excluded.condition_value,
  condition_metadata = excluded.condition_metadata,
  icon = excluded.icon,
  badge_label = excluded.badge_label,
  points_reward = excluded.points_reward,
  is_active = true;

insert into public.badges (code, name, description, icon, rarity, category, is_active)
select
  'reward_' || seed.code,
  seed.reward_name,
  'Récompense obtenue en débloquant « ' || seed.name || ' ».',
  seed.reward_icon,
  seed.rarity_code::public.badge_rarity,
  seed.reward_category,
  true
from csc_v1_catalog seed
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  rarity = excluded.rarity,
  category = excluded.category,
  is_active = true;

insert into public.achievement_rarities (achievement_id, rarity_id)
select achievement.id, rarity.id
from csc_v1_catalog seed
join public.achievements achievement on achievement.code = seed.code
join public.rarities rarity on rarity.code = seed.rarity_code
on conflict do nothing;

insert into public.achievement_badges (achievement_id, badge_id)
select achievement.id, badge.id
from csc_v1_catalog seed
join public.achievements achievement on achievement.code = seed.code
join public.badges badge on badge.code = 'reward_' || seed.code
on conflict do nothing;

-- Superseded provisional rows from the legacy recovery migration. Their V1
-- equivalents are victoires_5 and reward_rang_1000.
delete from public.achievements where code = 'champion_debutant';
delete from public.badges where code = 'guerrier_confirme';

commit;
