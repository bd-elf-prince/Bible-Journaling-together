-- Trigram indexes for bounded server-side board search.

create extension if not exists pg_trgm with schema extensions;

create index if not exists board_posts_title_trgm_idx
  on public.board_posts using gin (title extensions.gin_trgm_ops)
  where deleted_at is null;

create index if not exists board_posts_content_trgm_idx
  on public.board_posts using gin (content extensions.gin_trgm_ops)
  where deleted_at is null;

create index if not exists board_posts_author_trgm_idx
  on public.board_posts using gin (author_name extensions.gin_trgm_ops)
  where deleted_at is null;
