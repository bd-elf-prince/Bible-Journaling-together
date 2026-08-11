-- CommentBible production login hardening.
-- Resolves a username through the existing expression index and enforces
-- distributed rate limits without scanning the Supabase Auth user list.

create table if not exists public.request_rate_limits (
  subject_hash text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0),
  updated_at timestamptz not null default now()
);

alter table public.request_rate_limits enable row level security;

revoke all on table public.request_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.request_rate_limits to service_role;

create index if not exists request_rate_limits_updated_idx
  on public.request_rate_limits (updated_at);

create or replace function public.resolve_member_user_id(p_username text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select mi.user_id
  from public.member_identities as mi
  where lower(btrim(mi.username)) = lower(btrim(p_username))
  limit 1
$$;

revoke all on function public.resolve_member_user_id(text) from public, anon, authenticated;
grant execute on function public.resolve_member_user_id(text) to service_role;

create or replace function public.consume_request_rate_limit(
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempts integer;
  v_now timestamptz := clock_timestamp();
  v_window interval;
begin
  if p_subject_hash is null
     or length(p_subject_hash) < 16
     or p_limit not between 1 and 1000
     or p_window_seconds not between 10 and 86400 then
    return false;
  end if;

  v_window := p_window_seconds * interval '1 second';

  insert into public.request_rate_limits as limits (
    subject_hash,
    window_started_at,
    attempts,
    updated_at
  ) values (
    p_subject_hash,
    v_now,
    1,
    v_now
  )
  on conflict (subject_hash) do update
  set attempts = case
        when limits.window_started_at <= v_now - v_window then 1
        else limits.attempts + 1
      end,
      window_started_at = case
        when limits.window_started_at <= v_now - v_window then v_now
        else limits.window_started_at
      end,
      updated_at = v_now
  returning attempts into v_attempts;

  if random() < 0.01 then
    delete from public.request_rate_limits
    where subject_hash in (
      select subject_hash
      from public.request_rate_limits
      where updated_at < v_now - interval '1 day'
      order by updated_at
      limit 1000
    );
  end if;

  return v_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_request_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_request_rate_limit(text, integer, integer)
  to service_role;
