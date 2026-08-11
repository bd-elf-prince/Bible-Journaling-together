-- Applied through the owner dashboard on 2026-08-11 after a transaction-local
-- create/function behavior test was rolled back successfully.
-- Source migrations:
--   20260811000100_harden_username_login.sql
--   20260811000200_write_gateway_idempotency.sql
--   20260811000300_board_cursor_indexes.sql
--   20260811000400_bible_search_index.sql

select json_build_object(
  'rate_table', to_regclass('public.request_rate_limits') is not null,
  'idempotency_table', to_regclass('public.request_idempotency') is not null,
  'resolve_function', to_regprocedure('public.resolve_member_user_id(text)') is not null,
  'rate_function', to_regprocedure('public.consume_request_rate_limit(text,integer,integer)') is not null,
  'claim_function', to_regprocedure('public.claim_request_idempotency(text,text)') is not null,
  'expected_indexes', (
    select count(*) from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'comments_visible_verse_cursor_idx',
        'discussion_comments_visible_cursor_idx',
        'board_posts_public_cursor_idx',
        'board_posts_board_latest_cursor_idx',
        'board_posts_board_reactions_cursor_idx',
        'board_posts_board_comments_cursor_idx',
        'board_posts_board_views_cursor_idx',
        'bible_verses_content_trgm_idx'
      )
  ),
  'anon_rate_execute', has_function_privilege(
    'anon',
    'public.consume_request_rate_limit(text,integer,integer)',
    'execute'
  ),
  'service_rate_execute', has_function_privilege(
    'service_role',
    'public.consume_request_rate_limit(text,integer,integer)',
    'execute'
  ),
  'anon_rate_table', has_table_privilege('anon', 'public.request_rate_limits', 'select')
) as verification;
