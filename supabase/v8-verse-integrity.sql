-- Bible Journaling Together V8: every record must belong to a real Bible verse.
-- This migration is non-destructive. It aborts instead of deleting orphan rows.

do $$
declare
  orphan_table text;
begin
  if exists (select 1 from public.comments c left join public.bible_verses v on v.id=c.verse_id where v.id is null) then orphan_table := 'comments'; end if;
  if orphan_table is null and exists (select 1 from public.verse_reactions r left join public.bible_verses v on v.id=r.verse_id where v.id is null) then orphan_table := 'verse_reactions'; end if;
  if orphan_table is null and exists (select 1 from public.bookmarks b left join public.bible_verses v on v.id=b.verse_id where v.id is null) then orphan_table := 'bookmarks'; end if;
  if orphan_table is null and exists (select 1 from public.verse_notes n left join public.bible_verses v on v.id=n.verse_id where v.id is null) then orphan_table := 'verse_notes'; end if;
  if orphan_table is null and exists (select 1 from public.highlights h left join public.bible_verses v on v.id=h.verse_id where v.id is null) then orphan_table := 'highlights'; end if;
  if orphan_table is not null then
    raise exception 'V8 migration stopped: orphan verse_id exists in %', orphan_table;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='comments_verse_id_fkey' and conrelid='public.comments'::regclass) then
    alter table public.comments add constraint comments_verse_id_fkey foreign key (verse_id) references public.bible_verses(id) on update cascade on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='verse_reactions_verse_id_fkey' and conrelid='public.verse_reactions'::regclass) then
    alter table public.verse_reactions add constraint verse_reactions_verse_id_fkey foreign key (verse_id) references public.bible_verses(id) on update cascade on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='bookmarks_verse_id_fkey' and conrelid='public.bookmarks'::regclass) then
    alter table public.bookmarks add constraint bookmarks_verse_id_fkey foreign key (verse_id) references public.bible_verses(id) on update cascade on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='verse_notes_verse_id_fkey' and conrelid='public.verse_notes'::regclass) then
    alter table public.verse_notes add constraint verse_notes_verse_id_fkey foreign key (verse_id) references public.bible_verses(id) on update cascade on delete restrict not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname='highlights_verse_id_fkey' and conrelid='public.highlights'::regclass) then
    alter table public.highlights add constraint highlights_verse_id_fkey foreign key (verse_id) references public.bible_verses(id) on update cascade on delete restrict not valid;
  end if;
end $$;

alter table public.comments validate constraint comments_verse_id_fkey;
alter table public.verse_reactions validate constraint verse_reactions_verse_id_fkey;
alter table public.bookmarks validate constraint bookmarks_verse_id_fkey;
alter table public.verse_notes validate constraint verse_notes_verse_id_fkey;
alter table public.highlights validate constraint highlights_verse_id_fkey;

create index if not exists comments_verse_id_idx on public.comments(verse_id);
create index if not exists verse_reactions_verse_id_idx on public.verse_reactions(verse_id);
create index if not exists bookmarks_verse_id_idx on public.bookmarks(verse_id);
create index if not exists verse_notes_verse_id_idx on public.verse_notes(verse_id);
create index if not exists highlights_verse_id_idx on public.highlights(verse_id);

