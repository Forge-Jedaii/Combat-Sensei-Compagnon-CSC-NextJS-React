begin;

-- Preserve the exact requested display name. Uniqueness remains enforced by
-- profiles_normalized_display_name_uidx; the application performs a friendly
-- preflight and PostgreSQL remains the final concurrency-safe authority.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare requested_name text;
begin
  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
  if requested_name is null then requested_name := split_part(coalesce(new.email, 'member'), '@', 1); end if;
  insert into public.profiles (id, display_name, status)
  values (new.id, left(requested_name, 40), 'pending');
  insert into public.user_settings (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  insert into public.email_outbox (user_id, template, payload)
  values (new.id, 'registration_pending', jsonb_build_object('email', new.email, 'display_name', requested_name));
  return new;
end;
$$;

-- Remove the historical UUID suffix only when the clean name is unambiguous.
-- Conflicting names are intentionally left unchanged for manual resolution.
do $$
declare profile_row record; clean_name text;
begin
  for profile_row in
    select id, display_name from public.profiles
    where display_name ~ '-[0-9a-f]{8}$'
    order by created_at, id
  loop
    clean_name := regexp_replace(profile_row.display_name, '-[0-9a-f]{8}$', '');
    if char_length(btrim(clean_name)) between 2 and 40 and not exists (
      select 1 from public.profiles other
      where other.id <> profile_row.id
        and other.status <> 'deleted'
        and other.normalized_display_name = lower(btrim(clean_name))
    ) then
      update public.profiles set display_name = clean_name where id = profile_row.id;
    end if;
  end loop;
end;
$$;

-- Definitions recoverable from the former application source. These inserts
-- are idempotent and never overwrite administrator customizations.
insert into public.rarities (code, name, category, description, sort_order, color_hex)
values
  ('common', 'Commun', 'standard', 'Achievement courant.', 10, '#9CA3AF'),
  ('rare', 'Rare', 'standard', 'Achievement peu courant.', 20, '#3B82F6'),
  ('epic', 'Épique', 'standard', 'Achievement difficile.', 30, '#A855F7'),
  ('legendary', 'Légendaire', 'standard', 'Achievement exceptionnel.', 40, '#F59E0B')
on conflict (code) do nothing;

insert into public.achievements (
  code, name, description, condition_type, condition_value, condition_metadata,
  icon, badge_label, points_reward, is_active, is_secret
)
values (
  'champion_debutant', 'Champion débutant', 'Remporter 5 victoires.',
  'victories', 5,
  jsonb_build_object('rule', jsonb_build_object('metric', 'ranking.victories', 'operator', 'gte', 'value', 5)),
  '🥇', null, 100, true, false
)
on conflict (code) do nothing;

insert into public.badges (code, name, description, icon, rarity, category, is_active)
values ('guerrier_confirme', 'Guerrier confirmé', 'Atteindre 1000 points CSC.', '⚔️', 'rare', 'classement', true)
on conflict (code) do nothing;

insert into public.achievement_rarities (achievement_id, rarity_id)
select achievement.id, rarity.id
from public.achievements achievement
join public.rarities rarity on rarity.code = 'rare'
where achievement.code = 'champion_debutant'
on conflict do nothing;

-- Recreate the neutral overall ranking projection removed by the requested
-- history reset. Historical scores cannot be inferred after match deletion.
insert into public.rankings (
  user_id, mode, score, victories, defeats, draws, matches_played,
  current_win_streak, longest_win_streak, perfect_games
)
select profile.id, null, 1000, 0, 0, 0, 0, 0, 0, 0
from public.profiles profile
where profile.status = 'active'
on conflict (user_id, mode) do nothing;

commit;
