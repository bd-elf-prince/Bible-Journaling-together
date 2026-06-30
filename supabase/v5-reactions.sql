-- Bible Journaling Together V5 reactions and recommendations schema.
-- Run this after supabase/comments-mvp.sql.

create extension if not exists pgcrypto;

alter table public.comments
  add column if not exists anonymous_id text,
  add column if not exists mood text;

create table if not exists public.verse_reactions (
  id uuid primary key default gen_random_uuid(),
  verse_id text not null,
  anonymous_id text not null,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique(verse_id, anonymous_id, reaction_type),
  check (reaction_type in ('like','moved','comfort','strength','amen'))
);

create index if not exists verse_reactions_verse_created_idx
  on public.verse_reactions (verse_id, created_at desc);

create index if not exists verse_reactions_anon_created_idx
  on public.verse_reactions (anonymous_id, created_at desc);

alter table public.verse_reactions enable row level security;

drop policy if exists "public read verse reactions" on public.verse_reactions;
create policy "public read verse reactions"
  on public.verse_reactions for select
  using (true);

drop policy if exists "public insert own verse reactions" on public.verse_reactions;
create policy "public insert own verse reactions"
  on public.verse_reactions for insert
  with check (
    anonymous_id is not null
    and verse_id is not null
    and reaction_type in ('like','moved','comfort','strength','amen')
  );

-- Comments MVP compatibility. Safe to rerun.
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  anonymous_id text not null,
  reaction_type text not null default 'heart',
  created_at timestamptz not null default now(),
  unique(comment_id, anonymous_id, reaction_type)
);

alter table public.comment_reactions enable row level security;

drop policy if exists "public read comment reactions" on public.comment_reactions;
create policy "public read comment reactions"
  on public.comment_reactions for select
  using (true);

drop policy if exists "public insert own comment reactions" on public.comment_reactions;
create policy "public insert own comment reactions"
  on public.comment_reactions for insert
  with check (reaction_type = 'heart');
