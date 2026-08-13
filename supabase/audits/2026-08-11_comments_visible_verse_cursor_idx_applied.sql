-- Applied to the CommentBible production database on 2026-08-11 (Asia/Seoul).
-- Scope: one performance change only.
--
-- The Supabase CLI is not installed in this workspace, so this is an applied
-- change record rather than a migration-history entry. Convert it into a
-- generated Supabase migration before rebuilding another environment.

create index concurrently if not exists comments_visible_verse_cursor_idx
  on public.comments (verse_id, created_at desc, id desc)
  where deleted_at is null;

-- Definition verification
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'comments'
  and indexname = 'comments_visible_verse_cursor_idx';

-- Plan verification
explain (format text)
select id, verse_id, user_name, content, created_at
from public.comments
where verse_id in ('gen-1-1', 'gen-1-2', 'gen-1-3', 'gen-1-4')
  and deleted_at is null
order by created_at desc, id desc
limit 240;

-- Verified result:
-- Index Scan using comments_visible_verse_cursor_idx on comments
