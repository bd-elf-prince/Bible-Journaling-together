-- Applied through the owner dashboard on 2026-08-11.
-- Source: migrations/20260811000500_board_search_indexes.sql

select count(*) as expected_indexes
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'board_posts_title_trgm_idx',
    'board_posts_content_trgm_idx',
    'board_posts_author_trgm_idx'
  );

-- Verified result: 3
