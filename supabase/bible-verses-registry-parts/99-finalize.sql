-- Bible Journaling Together: bible_verses verification and comments link.
-- Run this after all part files are complete.

alter table public.comments
  drop constraint if exists comments_verse_id_bible_verses_fkey;

alter table public.comments
  add constraint comments_verse_id_bible_verses_fkey
  foreign key (verse_id)
  references public.bible_verses(id)
  not valid;

-- Optional after old invalid test rows are removed:
-- alter table public.comments validate constraint comments_verse_id_bible_verses_fkey;

select
  count(*) as verse_targets,
  count(distinct id) as unique_verse_targets,
  min(id) filter (where id = 'gen-1-1') as has_gen_1_1,
  min(id) filter (where id = 'gen-16-1') as has_gen_16_1,
  min(id) filter (where id = 'jhn-3-16') as has_jhn_3_16
from public.bible_verses;
