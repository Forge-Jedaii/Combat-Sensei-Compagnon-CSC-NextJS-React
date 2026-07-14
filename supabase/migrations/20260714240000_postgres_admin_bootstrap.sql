begin;

-- auth.uid() is intentionally null in the SQL Editor. Distinguish a genuine
-- postgres session from an application RPC without relying on current_user:
-- SECURITY DEFINER changes current_user to the function owner, while
-- session_user remains the original database login.
create or replace function private.is_privileged_sql_caller()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select session_user in ('postgres', 'service_role')
    or private.is_service_role();
$$;

revoke execute on function private.is_privileged_sql_caller() from public, anon, authenticated;
grant execute on function private.is_privileged_sql_caller() to service_role;

-- Keep status protected for ordinary users. Staff continues to be resolved
-- from auth.uid(); SQL Editor and service-role jobs use the privileged path.
create or replace function private.protect_profile_managed_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status
     and not private.is_staff()
     and not private.is_privileged_sql_caller() then
    raise exception 'profile status is managed by staff'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.set_profile_status(target_user_id uuid, target_status text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_profile public.profiles;
  previous_status public.profile_status;
  notification text;
  target_email text;
begin
  if not private.has_role('admin')
     and not private.is_privileged_sql_caller() then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  if target_status not in ('pending', 'active', 'suspended', 'rejected') then
    raise exception 'invalid profile status' using errcode = '22023';
  end if;

  select profile.status
  into previous_status
  from public.profiles profile
  where profile.id = target_user_id
  for update;

  if previous_status is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  update public.profiles
  set status = target_status::public.profile_status
  where id = target_user_id
  returning * into updated_profile;

  -- Do not enqueue duplicate emails when an idempotent call keeps the same
  -- status. Notifications are emitted only for an actual transition.
  if previous_status is distinct from updated_profile.status then
    notification := case target_status
      when 'active' then 'account_activated'
      when 'suspended' then 'account_suspended'
      when 'rejected' then 'account_rejected'
      else null
    end;

    if notification is not null then
      select auth_user.email
      into target_email
      from auth.users auth_user
      where auth_user.id = target_user_id;

      insert into public.email_outbox (user_id, template, payload)
      values (
        target_user_id,
        notification,
        jsonb_build_object(
          'email', target_email,
          'display_name', updated_profile.display_name
        )
      );
    end if;
  end if;

  return updated_profile;
end;
$$;

revoke execute on function public.set_profile_status(uuid, text) from public, anon;
grant execute on function public.set_profile_status(uuid, text) to authenticated, service_role;

-- Official first-owner bootstrap. It can only be called from the SQL Editor
-- as postgres or through a service-role backend. It is safe to replay:
--   * no duplicate profile/settings/roles are created;
--   * an already bootstrapped owner is simply reconciled and activated;
--   * if another administrator exists, this function cannot promote a new one.
create or replace function public.bootstrap_owner(
  target_email text default 'forgejedaii@gmail.com'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user auth.users;
  existing_admin_id uuid;
  target_profile public.profiles;
  requested_name text;
begin
  if not private.is_privileged_sql_caller() then
    raise exception 'postgres or service_role required' using errcode = '42501';
  end if;

  if nullif(btrim(target_email), '') is null then
    raise exception 'owner email is required' using errcode = '22023';
  end if;

  select auth_user.*
  into target_user
  from auth.users auth_user
  where lower(auth_user.email) = lower(btrim(target_email))
  order by auth_user.created_at
  limit 1
  for update;

  if target_user.id is null then
    raise exception 'auth user not found for email %', target_email
      using errcode = 'P0002';
  end if;

  select role_row.user_id
  into existing_admin_id
  from public.user_roles role_row
  where role_row.role = 'admin'
  order by role_row.granted_at, role_row.user_id
  limit 1;

  if existing_admin_id is not null
     and existing_admin_id <> target_user.id
     and not exists (
       select 1
       from public.user_roles target_role
       where target_role.user_id = target_user.id
         and target_role.role = 'admin'
     ) then
    raise exception 'an administrator already exists; owner bootstrap refused'
      using errcode = '23514';
  end if;

  requested_name := nullif(btrim(target_user.raw_user_meta_data ->> 'display_name'), '');

  insert into public.profiles (id, display_name, status)
  values (
    target_user.id,
    left(
      coalesce(requested_name, split_part(coalesce(target_user.email, 'owner'), '@', 1)),
      31
    ) || '-' || left(target_user.id::text, 8),
    'pending'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (target_user.id)
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role, granted_by)
  values (target_user.id, 'member', null)
  on conflict (user_id, role) do nothing;

  insert into public.user_roles (user_id, role, granted_by)
  values (target_user.id, 'admin', null)
  on conflict (user_id, role) do nothing;

  target_profile := public.set_profile_status(target_user.id, 'active');

  return jsonb_build_object(
    'user_id', target_user.id,
    'email', target_user.email,
    'status', target_profile.status,
    'member', exists (
      select 1 from public.user_roles role_row
      where role_row.user_id = target_user.id and role_row.role = 'member'
    ),
    'admin', exists (
      select 1 from public.user_roles role_row
      where role_row.user_id = target_user.id and role_row.role = 'admin'
    )
  );
end;
$$;

revoke execute on function public.bootstrap_owner(text) from public, anon, authenticated;
grant execute on function public.bootstrap_owner(text) to service_role;

-- Apply the bootstrap during this migration when it is unambiguous. A missing
-- Auth user is left untouched so deployments can create it later and replay
-- public.bootstrap_owner(). An unrelated existing admin is never overridden.
do $$
declare
  configured_user_id uuid;
  another_admin_exists boolean;
begin
  select auth_user.id
  into configured_user_id
  from auth.users auth_user
  where lower(auth_user.email) = 'forgejedaii@gmail.com'
  order by auth_user.created_at
  limit 1;

  if configured_user_id is not null then
    select exists (
      select 1
      from public.user_roles role_row
      where role_row.role = 'admin'
        and role_row.user_id <> configured_user_id
    ) into another_admin_exists;

    if not another_admin_exists then
      perform public.bootstrap_owner('forgejedaii@gmail.com');
    end if;
  end if;
end;
$$;

commit;
