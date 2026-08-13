-- Cursor indexes matching the production board list sort modes.

create index if not exists board_posts_board_latest_cursor_idx
  on public.board_posts (board_type, is_pinned desc, created_at desc, id desc)
  where deleted_at is null;

create index if not exists board_posts_board_reactions_cursor_idx
  on public.board_posts (
    board_type,
    is_pinned desc,
    reaction_count desc,
    created_at desc,
    id desc
  )
  where deleted_at is null;

create index if not exists board_posts_board_comments_cursor_idx
  on public.board_posts (
    board_type,
    is_pinned desc,
    comment_count desc,
    created_at desc,
    id desc
  )
  where deleted_at is null;

create index if not exists board_posts_board_views_cursor_idx
  on public.board_posts (
    board_type,
    is_pinned desc,
    view_count desc,
    created_at desc,
    id desc
  )
  where deleted_at is null;

