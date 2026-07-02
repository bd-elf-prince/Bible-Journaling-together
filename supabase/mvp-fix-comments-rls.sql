-- Bible Journaling Together: fix comments insert policy for the Genesis 1:1 MVP.
-- Run this in Supabase SQL Editor when comments select works but insert returns:
-- new row violates row-level security policy for table "comments"

alter table public.comments
  add column if not exists anonymous_id text,
  add column if not exists mood text,
  add column if not exists report_count integer not null default 0,
  add column if not exists deleted_at timestamptz;

grant usage on schema public to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;

alter table public.comments enable row level security;

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
