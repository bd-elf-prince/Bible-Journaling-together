-- CommentBible full-function 10k candidate schema.
-- Additive staging candidate only. Do not apply to production before catalog preflight.
-- Generated 2026-08-14; no application rows, secrets, or production identifiers.

begin;
create extension if not exists pgcrypto;

create table if not exists public.cb_member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  nickname text not null check (char_length(btrim(nickname)) between 2 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists cb_member_profiles_username_uq on public.cb_member_profiles (lower(username));
create unique index if not exists cb_member_profiles_nickname_uq on public.cb_member_profiles (lower(nickname));

create table if not exists public.cb_posts (
  id uuid primary key default gen_random_uuid(),
  board_type text not null default 'community' check (board_type in ('notice','news','community')),
  category text not null check (category in ('notice','update','free','meditation','question','testimony','suggestion')),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  content text not null check (char_length(btrim(content)) between 2 and 10000),
  author_user_id uuid references auth.users(id) on delete set null,
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) between 16 and 128),
  anonymous_name text check (anonymous_name is null or char_length(btrim(anonymous_name)) between 1 and 20),
  password_hash text,
  comments_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((author_user_id is not null and anonymous_id is null and password_hash is null) or (author_user_id is null and anonymous_id is not null and password_hash is not null))
);
create index if not exists cb_posts_visible_cursor_idx on public.cb_posts (created_at desc, id desc) where deleted_at is null;
create index if not exists cb_posts_board_cursor_idx on public.cb_posts (board_type, created_at desc, id desc) where deleted_at is null;

create table if not exists public.cb_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.cb_posts(id),
  verse_id text,
  parent_id uuid references public.cb_comments(id),
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  author_user_id uuid references auth.users(id) on delete set null,
  anonymous_id text check (anonymous_id is null or char_length(anonymous_id) between 16 and 128),
  anonymous_name text check (anonymous_name is null or char_length(btrim(anonymous_name)) between 1 and 20),
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((post_id is not null)::integer + (verse_id is not null)::integer = 1),
  check (verse_id is null or verse_id ~ '^[a-z0-9]+-[0-9]+-[0-9]+$'),
  check ((author_user_id is not null and anonymous_id is null and password_hash is null) or (author_user_id is null and anonymous_id is not null and password_hash is not null))
);
create index if not exists cb_comments_post_cursor_idx on public.cb_comments (post_id, created_at desc, id desc) where deleted_at is null;
create index if not exists cb_comments_verse_cursor_idx on public.cb_comments (verse_id, created_at desc, id desc) where deleted_at is null;
create index if not exists cb_comments_parent_idx on public.cb_comments (parent_id) where deleted_at is null;

create table if not exists public.cb_user_verse_marks (
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_id text not null check (verse_id ~ '^[a-z0-9]+-[0-9]+-[0-9]+$'),
  bookmark boolean not null default false,
  highlight boolean not null default false,
  memo text check (memo is null or char_length(memo) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (user_id, verse_id)
);

create table if not exists public.cb_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  target_type text not null check (target_type in ('post','comment')),
  target_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 200),
  created_at timestamptz not null default now(),
  check ((reporter_user_id is not null)::integer + (anonymous_id is not null)::integer = 1)
);
create unique index if not exists cb_reports_member_uq on public.cb_reports (reporter_user_id,target_type,target_id) where reporter_user_id is not null;
create unique index if not exists cb_reports_anon_uq on public.cb_reports (anonymous_id,target_type,target_id) where anonymous_id is not null;
create index if not exists cb_reports_created_idx on public.cb_reports (created_at desc, id desc);

create table if not exists public.cb_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('comment','reply','moderation')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists cb_notifications_recipient_cursor_idx on public.cb_notifications (recipient_user_id, created_at desc, id desc);

create table if not exists public.cb_request_idempotency (
  idempotency_hash text primary key,
  actor_hash text not null,
  action text not null,
  body_hash text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default now() + interval '1 day'
);
create index if not exists cb_request_idempotency_expiry_idx on public.cb_request_idempotency (expires_at);

create table if not exists public.cb_request_rate_limits (
  subject_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  primary key (subject_hash, action)
);

create table if not exists public.cb_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event_type text not null,
  payload jsonb not null,
  attempts integer not null default 0 check (attempts between 0 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create index if not exists cb_outbox_ready_idx on public.cb_outbox (available_at, id) where completed_at is null;

alter table public.cb_member_profiles enable row level security;
alter table public.cb_posts enable row level security;
alter table public.cb_comments enable row level security;
alter table public.cb_user_verse_marks enable row level security;
alter table public.cb_reports enable row level security;
alter table public.cb_notifications enable row level security;
alter table public.cb_request_idempotency enable row level security;
alter table public.cb_request_rate_limits enable row level security;
alter table public.cb_outbox enable row level security;

revoke all on public.cb_member_profiles, public.cb_posts, public.cb_comments, public.cb_user_verse_marks, public.cb_reports, public.cb_notifications, public.cb_request_idempotency, public.cb_request_rate_limits from public, anon, authenticated;
grant select on public.cb_posts, public.cb_comments to anon, authenticated;
grant select, insert, update, delete on public.cb_member_profiles, public.cb_user_verse_marks to authenticated;
grant select, update on public.cb_notifications to authenticated;
grant all on public.cb_request_idempotency, public.cb_request_rate_limits to service_role;
revoke all on public.cb_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.cb_outbox to service_role;

create policy cb_profiles_self_select on public.cb_member_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy cb_profiles_self_insert on public.cb_member_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy cb_profiles_self_update on public.cb_member_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy cb_posts_visible_select on public.cb_posts for select to anon, authenticated using (deleted_at is null);
create policy cb_comments_visible_select on public.cb_comments for select to anon, authenticated using (deleted_at is null);
create policy cb_marks_self_select on public.cb_user_verse_marks for select to authenticated using ((select auth.uid()) = user_id);
create policy cb_marks_self_insert on public.cb_user_verse_marks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy cb_marks_self_update on public.cb_user_verse_marks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy cb_marks_self_delete on public.cb_user_verse_marks for delete to authenticated using ((select auth.uid()) = user_id);
create policy cb_reports_member_insert on public.cb_reports for insert to authenticated with check ((select auth.uid()) = reporter_user_id and anonymous_id is null);
create policy cb_reports_anon_insert on public.cb_reports for insert to anon with check (reporter_user_id is null and char_length(anonymous_id) between 16 and 128);
create policy cb_notifications_self_select on public.cb_notifications for select to authenticated using ((select auth.uid()) = recipient_user_id);
create policy cb_notifications_self_update on public.cb_notifications for update to authenticated using ((select auth.uid()) = recipient_user_id) with check ((select auth.uid()) = recipient_user_id);

create or replace view public.cb_posts_public with (security_invoker = true) as
select id, board_type, category, title, content, author_user_id, anonymous_name as author_name,
       comments_enabled, created_at, updated_at
from public.cb_posts where deleted_at is null;
create or replace view public.cb_comments_public with (security_invoker = true) as
select id, post_id, verse_id, parent_id, content, author_user_id, anonymous_name as author_name,
       created_at, updated_at
from public.cb_comments where deleted_at is null;
grant select on public.cb_posts_public, public.cb_comments_public to anon, authenticated;

-- Gateway-only claim. Payload hash is bound to actor+action+key to reject altered replays.
create or replace function public.cb_claim_idempotency(p_idempotency_hash text,p_actor_hash text,p_action text,p_body_hash text)
returns table(claimed boolean,cached_response jsonb)
language plpgsql security definer set search_path = '' as $$
declare existing public.cb_request_idempotency;
begin
  insert into public.cb_request_idempotency(idempotency_hash,actor_hash,action,body_hash)
  values(p_idempotency_hash,p_actor_hash,p_action,p_body_hash)
  on conflict do nothing;
  if found then return query select true,null::jsonb; return; end if;
  select * into existing from public.cb_request_idempotency where idempotency_hash=p_idempotency_hash;
  if existing.actor_hash<>p_actor_hash or existing.action<>p_action or existing.body_hash<>p_body_hash then
    raise exception 'idempotency_payload_mismatch' using errcode='23505';
  end if;
  return query select false,existing.response;
end $$;
revoke all on function public.cb_claim_idempotency(text,text,text,text) from public,anon,authenticated;
grant execute on function public.cb_claim_idempotency(text,text,text,text) to service_role;

create or replace function public.cb_enqueue_outbox(p_dedupe_key text,p_event_type text,p_payload jsonb,p_max_depth integer default 10000)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  if p_max_depth not between 100 and 100000 then raise exception 'invalid_outbox_bound'; end if;
  if (select count(*) from public.cb_outbox where completed_at is null) >= p_max_depth then
    raise exception 'outbox_backpressure' using errcode='P0001';
  end if;
  insert into public.cb_outbox(dedupe_key,event_type,payload)
  values(p_dedupe_key,p_event_type,p_payload)
  on conflict(dedupe_key) do update set dedupe_key=excluded.dedupe_key
  returning id into result_id;
  return result_id;
end $$;
revoke all on function public.cb_enqueue_outbox(text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.cb_enqueue_outbox(text,text,jsonb,integer) to service_role;

-- Query-plan contract used by staging EXPLAIN tests:
-- select ... from cb_posts where deleted_at is null and (created_at,id) < ($1,$2)
-- order by created_at desc, id desc limit least($3,100);
-- select ... from cb_comments where verse_id=$1 and deleted_at is null
-- and (created_at,id) < ($2,$3) order by created_at desc, id desc limit least($4,100);

commit;
