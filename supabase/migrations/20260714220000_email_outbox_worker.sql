begin;

create type public.email_delivery_status as enum ('queued', 'processing', 'retry', 'sent', 'failed');

alter table public.email_outbox
  add column status public.email_delivery_status not null default 'queued',
  add column attempt_count integer not null default 0,
  add column max_attempts integer not null default 5,
  add column next_attempt_at timestamptz not null default now(),
  add column last_attempt_at timestamptz,
  add column locked_at timestamptz,
  add column locked_by uuid,
  add column provider_message_id text,
  add column updated_at timestamptz not null default now(),
  add constraint email_outbox_attempt_count_check check (attempt_count >= 0),
  add constraint email_outbox_max_attempts_check check (max_attempts between 1 and 20),
  add constraint email_outbox_lock_consistency check (
    (status = 'processing' and locked_at is not null and locked_by is not null)
    or (status <> 'processing' and locked_at is null and locked_by is null)
  );

update public.email_outbox
set status = case when sent_at is null then 'queued'::public.email_delivery_status else 'sent'::public.email_delivery_status end;

drop index if exists public.email_outbox_pending_idx;
create index email_outbox_dispatch_idx
  on public.email_outbox (next_attempt_at, created_at)
  where status in ('queued', 'retry', 'processing');
create unique index email_outbox_provider_message_uidx
  on public.email_outbox (provider_message_id)
  where provider_message_id is not null;

create table public.email_delivery_attempts (
  id bigint generated always as identity primary key,
  outbox_id bigint not null references public.email_outbox(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  worker_id uuid not null,
  outcome text not null check (outcome in ('sent', 'retry', 'failed')),
  provider text not null default 'resend',
  provider_message_id text,
  http_status integer check (http_status is null or http_status between 100 and 599),
  error_code text,
  error_message text,
  occurred_at timestamptz not null default now()
);

create index email_delivery_attempts_outbox_idx
  on public.email_delivery_attempts (outbox_id, occurred_at desc);

alter table public.email_delivery_attempts enable row level security;
create policy email_delivery_attempts_admin_read
  on public.email_delivery_attempts for select to authenticated
  using (private.has_role('admin'));

drop policy if exists email_outbox_admin_update on public.email_outbox;
revoke update on public.email_outbox from authenticated;
grant select on public.email_delivery_attempts to authenticated;
grant all on public.email_delivery_attempts to service_role;

create or replace function public.claim_email_outbox(target_worker_id uuid, target_batch_size integer default 10)
returns table (
  id bigint,
  user_id uuid,
  template text,
  payload jsonb,
  attempt_count integer,
  max_attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if target_worker_id is null or target_batch_size not between 1 and 50 then
    raise exception 'invalid worker claim arguments' using errcode = '22023';
  end if;

  return query
  with candidates as (
    select queued.id
    from public.email_outbox queued
    where queued.sent_at is null
      and queued.attempt_count < queued.max_attempts
      and queued.next_attempt_at <= now()
      and (
        queued.status in ('queued', 'retry')
        or (queued.status = 'processing' and queued.locked_at < now() - interval '10 minutes')
      )
    order by queued.next_attempt_at, queued.created_at
    limit target_batch_size
    for update skip locked
  ), claimed as (
    update public.email_outbox queued
    set status = 'processing',
        attempt_count = queued.attempt_count + 1,
        last_attempt_at = now(),
        locked_at = now(),
        locked_by = target_worker_id,
        updated_at = now()
    from candidates
    where queued.id = candidates.id
    returning queued.id, queued.user_id, queued.template, queued.payload,
      queued.attempt_count, queued.max_attempts
  )
  select * from claimed;
end;
$$;

create or replace function public.complete_email_outbox(
  target_outbox_id bigint,
  target_worker_id uuid,
  target_provider_message_id text,
  target_http_status integer default 200
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare completed public.email_outbox;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  update public.email_outbox queued
  set status = 'sent', sent_at = now(), provider_message_id = target_provider_message_id,
      last_error = null, locked_at = null, locked_by = null, updated_at = now()
  where queued.id = target_outbox_id and queued.status = 'processing' and queued.locked_by = target_worker_id
  returning * into completed;

  if completed.id is null then raise exception 'email claim not found' using errcode = 'P0002'; end if;
  insert into public.email_delivery_attempts
    (outbox_id, attempt_number, worker_id, outcome, provider_message_id, http_status)
  values (completed.id, completed.attempt_count, target_worker_id, 'sent', target_provider_message_id, target_http_status);
end;
$$;

create or replace function public.fail_email_outbox(
  target_outbox_id bigint,
  target_worker_id uuid,
  target_http_status integer,
  target_error_code text,
  target_error_message text,
  target_retry_after_seconds integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare failed public.email_outbox; next_status public.email_delivery_status; delay_seconds integer;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  select * into failed from public.email_outbox
  where id = target_outbox_id and status = 'processing' and locked_by = target_worker_id
  for update;
  if failed.id is null then raise exception 'email claim not found' using errcode = 'P0002'; end if;

  next_status := case when failed.attempt_count >= failed.max_attempts then 'failed' else 'retry' end;
  delay_seconds := least(3600, greatest(30,
    coalesce(target_retry_after_seconds, (30 * power(2, greatest(0, failed.attempt_count - 1)))::integer)
  ));

  update public.email_outbox
  set status = next_status,
      next_attempt_at = case when next_status = 'retry' then now() + make_interval(secs => delay_seconds) else next_attempt_at end,
      last_error = left(coalesce(target_error_message, target_error_code, 'unknown provider error'), 2000),
      locked_at = null, locked_by = null, updated_at = now()
  where id = failed.id;

  insert into public.email_delivery_attempts
    (outbox_id, attempt_number, worker_id, outcome, http_status, error_code, error_message)
  values (
    failed.id, failed.attempt_count, target_worker_id,
    case when next_status = 'failed' then 'failed' else 'retry' end,
    target_http_status, left(target_error_code, 120), left(target_error_message, 2000)
  );
end;
$$;

revoke execute on function public.claim_email_outbox(uuid, integer) from public, anon, authenticated;
revoke execute on function public.complete_email_outbox(bigint, uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.fail_email_outbox(bigint, uuid, integer, text, text, integer) from public, anon, authenticated;
grant execute on function public.claim_email_outbox(uuid, integer) to service_role;
grant execute on function public.complete_email_outbox(bigint, uuid, text, integer) to service_role;
grant execute on function public.fail_email_outbox(bigint, uuid, integer, text, text, integer) to service_role;

create trigger email_outbox_set_updated_at before update on public.email_outbox
for each row execute function private.set_updated_at();

create or replace function public.set_profile_status(target_user_id uuid, target_status text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare updated_profile public.profiles; notification text; target_email text;
begin
  if not private.has_role('admin') then raise exception 'admin role required' using errcode = '42501'; end if;
  if target_status not in ('pending', 'active', 'suspended', 'rejected') then raise exception 'invalid profile status' using errcode = '22023'; end if;
  update public.profiles set status = target_status::public.profile_status where id = target_user_id returning * into updated_profile;
  if updated_profile.id is null then raise exception 'profile not found' using errcode = 'P0002'; end if;
  notification := case target_status when 'active' then 'account_activated' when 'suspended' then 'account_suspended' when 'rejected' then 'account_rejected' else null end;
  if notification is not null then
    select email into target_email from auth.users where id = target_user_id;
    insert into public.email_outbox (user_id, template, payload)
    values (target_user_id, notification, jsonb_build_object('email', target_email, 'display_name', updated_profile.display_name));
  end if;
  return updated_profile;
end;
$$;

commit;
