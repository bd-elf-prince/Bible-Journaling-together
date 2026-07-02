-- Bible Journaling Together: comments MVP setup.
-- Preferred full setup: run supabase/comments-mvp.sql.
-- Quick RLS repair: run supabase/mvp-fix-comments-rls.sql.

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
  deleted_at timestamptz
);

create index if not exists comments_visible_verse_created_idx
  on public.comments (verse_id, created_at desc)
  where deleted_at is null;

alter table public.comments enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;

drop policy if exists "Public can read comments" on public.comments;
drop policy if exists "Anon can insert comments" on public.comments;
drop policy if exists "public read visible comments" on public.comments;
drop policy if exists "public insert anonymous comments" on public.comments;
drop policy if exists "bjt public read visible comments" on public.comments;
drop policy if exists "bjt public insert verse comments" on public.comments;

create policy "bjt public read visible comments"
  on public.comments
  for select
  to public
  using (deleted_at is null);

create policy "bjt public insert verse comments"
  on public.comments
  for insert
  to public
  with check (
    verse_id is not null
    and verse_id ~ '^[a-z0-9]+-[0-9]+-[0-9]+$'
    and anonymous_id is not null
    and char_length(trim(anonymous_id)) > 0
    and user_name is not null
    and char_length(trim(user_name)) > 0
    and content is not null
    and char_length(trim(content)) between 1 and 1000
    and deleted_at is null
  );
