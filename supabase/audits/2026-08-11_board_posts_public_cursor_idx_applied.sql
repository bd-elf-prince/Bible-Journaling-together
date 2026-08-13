-- Applied to the CommentBible production database on 2026-08-11.
-- Purpose: support stable newest-first cursor reads for the public board.

create index concurrently if not exists board_posts_public_cursor_idx
  on public.board_posts (is_pinned desc, created_at desc, id desc)
  where deleted_at is null;

-- Definition check
select indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'board_posts'
  and indexname = 'board_posts_public_cursor_idx';

-- Normal EXPLAIN selected a sequential scan because production held only five
-- visible rows at verification time. With sequential scans disabled locally,
-- PostgreSQL confirmed this access path:
-- Index Scan using board_posts_public_cursor_idx on board_posts

