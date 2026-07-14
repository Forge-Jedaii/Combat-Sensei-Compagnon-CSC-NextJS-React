begin;

create table if not exists public.email_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  template text not null check (template in ('registration_pending', 'account_activated', 'account_rejected', 'account_suspended')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);

create index if not exists email_outbox_pending_idx on public.email_outbox (created_at) where sent_at is null;
alter table public.email_outbox enable row level security;
create policy email_outbox_admin_read on public.email_outbox for select to authenticated using (private.has_role('admin'));
create policy email_outbox_admin_update on public.email_outbox for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));
grant select, update on public.email_outbox to authenticated;
grant all on public.email_outbox to service_role;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare requested_name text;
begin
  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '');
  insert into public.profiles (id, display_name, status)
  values (new.id, left(coalesce(requested_name, split_part(coalesce(new.email, 'member'), '@', 1)), 31) || '-' || left(new.id::text, 8), 'pending');
  insert into public.user_settings (user_id) values (new.id);
  insert into public.user_roles (user_id, role) values (new.id, 'member');
  insert into public.email_outbox (user_id, template, payload)
  values (new.id, 'registration_pending', jsonb_build_object('email', new.email, 'display_name', requested_name));
  return new;
end;
$$;

create or replace function public.set_profile_status(target_user_id uuid, target_status text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare updated_profile public.profiles; notification text;
begin
  if not private.has_role('admin') then raise exception 'admin role required' using errcode = '42501'; end if;
  if target_status not in ('pending', 'active', 'suspended', 'rejected') then raise exception 'invalid profile status' using errcode = '22023'; end if;
  update public.profiles set status = target_status::public.profile_status where id = target_user_id returning * into updated_profile;
  if updated_profile.id is null then raise exception 'profile not found' using errcode = 'P0002'; end if;
  notification := case target_status when 'active' then 'account_activated' when 'suspended' then 'account_suspended' when 'rejected' then 'account_rejected' else null end;
  if notification is not null then
    insert into public.email_outbox (user_id, template, payload) values (target_user_id, notification, jsonb_build_object('display_name', updated_profile.display_name));
  end if;
  return updated_profile;
end;
$$;

revoke execute on function public.set_profile_status(uuid, text) from public, anon;
grant execute on function public.set_profile_status(uuid, text) to authenticated;

create or replace function public.create_tournament_workflow(
  target_name text, target_type public.tournament_type, target_game_mode public.match_mode,
  target_duration_seconds integer, target_participants jsonb, target_workflow jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare created public.tournaments; item jsonb; position integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(target_participants) <> 'array' or jsonb_array_length(target_participants) < 2 then raise exception 'at least two participants are required' using errcode = '23514'; end if;
  if jsonb_typeof(target_workflow) <> 'object' then raise exception 'workflow must be an object' using errcode = '22023'; end if;
  insert into public.tournaments (created_by, name, type, status, game_mode, match_duration_seconds, max_participants, starts_at, settings)
  values ((select auth.uid()), btrim(target_name), target_type, 'active', target_game_mode, nullif(target_duration_seconds, 0), jsonb_array_length(target_participants), now(), jsonb_build_object('workflow', target_workflow))
  returning * into created;
  for item in select value from jsonb_array_elements(target_participants) loop
    position := position + 1;
    insert into public.tournament_participants (tournament_id, display_name_snapshot, seed, status, metadata)
    values (created.id, btrim(item->>'name'), position, 'active', jsonb_build_object('key', item->>'key'));
  end loop;
  return jsonb_build_object('tournament', to_jsonb(created), 'participants', (select jsonb_agg(to_jsonb(tp) order by tp.seed) from public.tournament_participants tp where tp.tournament_id = created.id));
end;
$$;

create or replace function public.save_tournament_progress(
  target_tournament_id uuid, target_workflow jsonb, target_round integer, target_position integer,
  target_player_one_key text, target_player_two_key text, target_winner_key text,
  target_score_one integer default 0, target_score_two integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare tournament public.tournaments; one public.tournament_participants; two public.tournament_participants; winner public.tournament_participants; created_match public.matches; match_one public.match_participants; match_two public.match_participants; workflow_status text; standing record;
begin
  select * into tournament from public.tournaments where id = target_tournament_id for update;
  if tournament.id is null then raise exception 'tournament not found' using errcode = 'P0002'; end if;
  if not private.can_manage_tournament(target_tournament_id) then raise exception 'not allowed to manage tournament' using errcode = '42501'; end if;
  if tournament.status <> 'active' then raise exception 'tournament is not active' using errcode = '23514'; end if;
  if jsonb_typeof(target_workflow) <> 'object' then raise exception 'workflow must be an object' using errcode = '22023'; end if;
  select * into winner from public.tournament_participants where tournament_id = target_tournament_id and metadata->>'key' = target_winner_key;
  if winner.id is null then raise exception 'winner not found' using errcode = 'P0002'; end if;
  if target_player_one_key <> 'BYE' and target_player_two_key <> 'BYE' then
    select * into one from public.tournament_participants where tournament_id = target_tournament_id and metadata->>'key' = target_player_one_key;
    select * into two from public.tournament_participants where tournament_id = target_tournament_id and metadata->>'key' = target_player_two_key;
    if one.id is null or two.id is null or winner.id not in (one.id, two.id) then raise exception 'invalid tournament pairing' using errcode = '23514'; end if;
    insert into public.matches (created_by, tournament_id, mode, status, event_name, round_number, bracket_position, started_at, settings, metadata)
    values ((select auth.uid()), target_tournament_id, tournament.game_mode, 'active', tournament.name, target_round, target_position, now(), jsonb_build_object('tournament_type', tournament.type), '{}'::jsonb)
    returning * into created_match;
    insert into public.match_participants (match_id, tournament_participant_id, display_name_snapshot, position, score, starting_health, final_health)
    values (created_match.id, one.id, one.display_name_snapshot, 1, target_score_one, 10, case when target_score_one >= target_score_two then 10 else 9 end) returning * into match_one;
    insert into public.match_participants (match_id, tournament_participant_id, display_name_snapshot, position, score, starting_health, final_health)
    values (created_match.id, two.id, two.display_name_snapshot, 2, target_score_two, 10, case when target_score_two >= target_score_one then 10 else 9 end) returning * into match_two;
    perform public.complete_match(created_match.id, 'points', case when winner.id = one.id then match_one.id else match_two.id end, now());
  end if;
  workflow_status := coalesce(target_workflow->>'status', 'bracket');
  update public.tournaments set settings = jsonb_set(settings, '{workflow}', target_workflow, true), status = case when workflow_status = 'results' then 'completed'::public.tournament_status else status end, ended_at = case when workflow_status = 'results' then now() else ended_at end where id = target_tournament_id returning * into tournament;
  if workflow_status = 'results' then
    update public.tournament_participants set status = case when id = winner.id then 'winner'::public.participant_status else 'eliminated'::public.participant_status end, final_rank = null where tournament_id = target_tournament_id;
    for standing in select value, ordinality from jsonb_array_elements(coalesce(target_workflow->'standings', '[]'::jsonb)) with ordinality loop
      update public.tournament_participants set final_rank = standing.ordinality where tournament_id = target_tournament_id and metadata->>'key' = standing.value->>'key';
    end loop;
  end if;
  return jsonb_build_object('tournament', to_jsonb(tournament), 'participants', (select jsonb_agg(to_jsonb(tp) order by tp.seed) from public.tournament_participants tp where tp.tournament_id = target_tournament_id), 'matches', (select coalesce(jsonb_agg(to_jsonb(m) order by m.round_number, m.bracket_position), '[]'::jsonb) from public.matches m where m.tournament_id = target_tournament_id));
end;
$$;

revoke execute on function public.create_tournament_workflow(text, public.tournament_type, public.match_mode, integer, jsonb, jsonb) from public, anon;
revoke execute on function public.save_tournament_progress(uuid, jsonb, integer, integer, text, text, text, integer, integer) from public, anon;
grant execute on function public.create_tournament_workflow(text, public.tournament_type, public.match_mode, integer, jsonb, jsonb) to authenticated;
grant execute on function public.save_tournament_progress(uuid, jsonb, integer, integer, text, text, text, integer, integer) to authenticated;

commit;
