-- Read-path indexes for stable keyset pagination.

create index if not exists comments_visible_verse_cursor_idx
  on public.comments (verse_id, created_at desc, id desc)
  where deleted_at is null;

create index if not exists discussion_comments_visible_cursor_idx
  on public.discussion_comments (target_key, created_at desc, id desc)
  where deleted_at is null;

create index if not exists board_posts_public_cursor_idx
  on public.board_posts (is_pinned desc, created_at desc, id desc)
  where deleted_at is null;
