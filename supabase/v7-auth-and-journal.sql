-- Bible Journaling Together V7 candidate
-- Run after the existing comments / reactions MVP SQL.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  verse_id text not null, reference text not null, verse_text text not null,
  created_at timestamptz not null default now(), unique(user_id,verse_id)
);
create table if not exists public.verse_notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  verse_id text not null, reference text not null, verse_text text not null,
  content text not null check (char_length(content)<=5000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id,verse_id)
);
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  verse_id text not null, reference text not null, verse_text text not null, color text not null default 'gold',
  created_at timestamptz not null default now(), unique(user_id,verse_id)
);
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  font_size text not null default 'normal' check(font_size in ('normal','large','xlarge')),
  theme text not null default 'paper' check(theme in ('paper','dark')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.verse_notes enable row level security;
alter table public.highlights enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_own_all on public.profiles;
create policy profiles_own_all on public.profiles for all to authenticated using (auth.uid()=id) with check (auth.uid()=id);
drop policy if exists bookmarks_own_all on public.bookmarks;
create policy bookmarks_own_all on public.bookmarks for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists notes_own_all on public.verse_notes;
create policy notes_own_all on public.verse_notes for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists highlights_own_all on public.highlights;
create policy highlights_own_all on public.highlights for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists preferences_own_all on public.user_preferences;
create policy preferences_own_all on public.user_preferences for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);

grant select,insert,update,delete on public.profiles,public.bookmarks,public.verse_notes,public.highlights,public.user_preferences to authenticated;
revoke all on public.profiles,public.bookmarks,public.verse_notes,public.highlights,public.user_preferences from anon;

create or replace function public.touch_updated_at() returns trigger language plpgsql security invoker set search_path=public as $$
begin new.updated_at=now(); return new; end; $$;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists notes_touch_updated_at on public.verse_notes;
create trigger notes_touch_updated_at before update on public.verse_notes for each row execute function public.touch_updated_at();
drop trigger if exists preferences_touch_updated_at on public.user_preferences;
create trigger preferences_touch_updated_at before update on public.user_preferences for each row execute function public.touch_updated_at();

create index if not exists bookmarks_user_created_idx on public.bookmarks(user_id,created_at desc);
create index if not exists notes_user_updated_idx on public.verse_notes(user_id,updated_at desc);
create index if not exists highlights_user_created_idx on public.highlights(user_id,created_at desc);
