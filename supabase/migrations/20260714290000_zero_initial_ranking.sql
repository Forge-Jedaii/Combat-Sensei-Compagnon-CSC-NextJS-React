begin;

alter table public.rankings alter column score set default 0;

-- Existing neutral projections have no combat-derived value and can safely be
-- moved to the new zero-point baseline.
update public.rankings
set score = 0
where matches_played = 0
  and victories = 0
  and defeats = 0
  and draws = 0;

-- Every profile receives its overall zero-point projection immediately. This
-- guarantees that complete_match() always follows its conflict/update branch.
create or replace function private.ensure_initial_ranking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.rankings (
    user_id, mode, score, victories, defeats, draws, matches_played,
    current_win_streak, longest_win_streak, perfect_games
  ) values (new.id, null, 0, 0, 0, 0, 0, 0, 0, 0)
  on conflict (user_id, mode) do nothing;
  return new;
end;
$$;

drop trigger if exists profile_create_initial_ranking on public.profiles;
create trigger profile_create_initial_ranking
after insert on public.profiles
for each row execute function private.ensure_initial_ranking();

-- Reconcile profiles created before this trigger existed.
insert into public.rankings (
  user_id, mode, score, victories, defeats, draws, matches_played,
  current_win_streak, longest_win_streak, perfect_games
)
select profile.id, null, 0, 0, 0, 0, 0, 0, 0, 0
from public.profiles profile
where profile.status <> 'deleted'
on conflict (user_id, mode) do nothing;

-- Defensive compatibility with the historical complete_match() first-insert
-- formula (1000 + delta). It applies only when no ranking projection exists.
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
       where ranking.user_id = new.user_id
         and ranking.mode is not distinct from new.mode
     ) then
    new.score := greatest(0, new.score - 1000);
  end if;
  return new;
end;
$$;

drop trigger if exists rankings_normalize_first_score on public.rankings;
create trigger rankings_normalize_first_score
before insert on public.rankings
for each row execute function private.normalize_first_ranking_score();

commit;
