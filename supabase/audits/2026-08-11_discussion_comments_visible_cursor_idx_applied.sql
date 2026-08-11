-- Applied to the CommentBible production database on 2026-08-11.
-- Purpose: support stable per-target keyset reads for comments and replies.

create index concurrently if not exists discussion_comments_visible_cursor_idx
  on public.discussion_comments (target_key, created_at desc, id desc)
  where deleted_at is null;

-- Definition check
select indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'discussion_comments'
  and indexname = 'discussion_comments_visible_cursor_idx';

-- Verified access paths with EXPLAIN in a rolled-back transaction:
-- Index Only Scan using discussion_comments_visible_cursor_idx
-- Index Scan using discussion_comments_visible_cursor_idx

