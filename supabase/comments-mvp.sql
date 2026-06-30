-- Bible Journaling Together: verse-level anonymous comments MVP schema.
-- Run this in Supabase SQL editor before calling the MVP complete.

create extension if not exists pgcrypto;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  verse_id text not null,
  anonymous_id text not null,
  user_name text not null default '익명',
  mood text,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  report_count integer not null default 0 check (report_count >= 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by text,
  delete_reason text
);

create index if not exists comments_visible_verse_created_idx
  on public.comments (verse_id, created_at desc)
  where deleted_at is null;

create index if not exists comments_anonymous_created_idx
  on public.comments (anonymous_id, created_at desc);

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  anonymous_id text not null,
  reaction_type text not null default 'heart',
  created_at timestamptz not null default now(),
  unique(comment_id, anonymous_id, reaction_type)
);

create index if not exists comment_reactions_comment_idx
  on public.comment_reactions (comment_id, created_at desc);

create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  anonymous_id text not null,
  reason text not null default 'user_report',
  created_at timestamptz not null default now(),
  unique(comment_id, anonymous_id)
);

create index if not exists comment_reports_comment_idx
  on public.comment_reports (comment_id, created_at desc);

create or replace function public.prevent_comment_spam()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.comments c
    where c.anonymous_id = new.anonymous_id
      and c.created_at > now() - interval '12 seconds'
      and c.deleted_at is null
  ) then
    raise exception 'too_many_comments_short_window';
  end if;

  if (
    select count(*)
    from public.comments c
    where c.anonymous_id = new.anonymous_id
      and c.created_at > now() - interval '10 minutes'
      and c.deleted_at is null
  ) >= 5 then
    raise exception 'too_many_comments_10_min';
  end if;

  if exists (
    select 1
    from public.comments c
    where c.anonymous_id = new.anonymous_id
      and c.verse_id = new.verse_id
      and trim(c.content) = trim(new.content)
      and c.created_at > now() - interval '1 day'
      and c.deleted_at is null
  ) then
    raise exception 'duplicate_comment';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_prevent_spam on public.comments;
create trigger comments_prevent_spam
before insert on public.comments
for each row execute function public.prevent_comment_spam();

create or replace function public.increment_comment_report_count()
returns trigger
language plpgsql
as $$
begin
  update public.comments
     set report_count = report_count + 1
   where id = new.comment_id;
  return new;
end;
$$;

drop trigger if exists comment_reports_increment_count on public.comment_reports;
create trigger comment_reports_increment_count
after insert on public.comment_reports
for each row execute function public.increment_comment_report_count();

create or replace function public.admin_soft_delete_comment(target_comment_id uuid, reason text default 'admin_delete')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Grant execute only to an authenticated admin role/JWT policy in production.
  update public.comments
     set deleted_at = now(),
         deleted_by = coalesce(current_setting('request.jwt.claim.sub', true), 'admin'),
         delete_reason = reason
   where id = target_comment_id;
end;
$$;

alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.comment_reports enable row level security;

drop policy if exists "public read visible comments" on public.comments;
create policy "public read visible comments"
  on public.comments for select
  using (deleted_at is null);

drop policy if exists "public insert anonymous comments" on public.comments;
create policy "public insert anonymous comments"
  on public.comments for insert
  with check (deleted_at is null and char_length(trim(content)) between 1 and 1000);

drop policy if exists "public read comment reactions" on public.comment_reactions;
create policy "public read comment reactions"
  on public.comment_reactions for select
  using (true);

drop policy if exists "public insert own comment reactions" on public.comment_reactions;
create policy "public insert own comment reactions"
  on public.comment_reactions for insert
  with check (reaction_type = 'heart');

drop policy if exists "public insert reports" on public.comment_reports;
create policy "public insert reports"
  on public.comment_reports for insert
  with check (true);

-- Admin deletion options:
-- 1) execute public.admin_soft_delete_comment(...) from a server/edge function with service role; or
-- 2) add a narrow update policy for JWTs with an admin claim, not for public anonymous users.
