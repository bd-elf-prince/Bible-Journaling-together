-- Bible Journaling Together: bible_verses setup.
-- Run this first, then run all part files in order.

create table if not exists public.bible_verses (
  id text primary key,
  book_key text not null,
  book_name text not null,
  chapter integer not null,
  verse integer not null,
  content text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now(),
  unique(book_key, chapter, verse)
);

create index if not exists bible_verses_book_chapter_idx
  on public.bible_verses (book_key, chapter, verse);

alter table public.bible_verses enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.bible_verses to anon, authenticated;

drop policy if exists "public read bible verses" on public.bible_verses;
create policy "public read bible verses"
  on public.bible_verses for select
  to public
  using (true);
