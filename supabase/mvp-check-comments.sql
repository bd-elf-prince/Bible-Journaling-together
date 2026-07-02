-- Bible Journaling Together: comments MVP verification.
-- Run after supabase/mvp-fix-comments-rls.sql or supabase/comments-mvp.sql.

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('comments', 'comment_reactions', 'comment_reports')
order by tablename, policyname;

select
  has_table_privilege('anon', 'public.comments', 'select') as anon_can_select_comments,
  has_table_privilege('anon', 'public.comments', 'insert') as anon_can_insert_comments,
  has_table_privilege('authenticated', 'public.comments', 'select') as authenticated_can_select_comments,
  has_table_privilege('authenticated', 'public.comments', 'insert') as authenticated_can_insert_comments;

-- Optional manual insert check. Delete the row after testing if desired.
insert into public.comments (verse_id, user_name, anonymous_id, mood, content)
values (
  'gen-1-1',
  'SQL MVP Check',
  'sql-mvp-check',
  '묵상',
  '창세기 1:1 댓글 MVP SQL 확인'
)
returning id, verse_id, user_name, anonymous_id, content, created_at;

select id, verse_id, content, created_at
from public.comments
where anonymous_id = 'sql-mvp-check'
  and verse_id = 'gen-1-1'
order by created_at desc
limit 5;

select id, verse_id, content, created_at
from public.comments
where anonymous_id = 'sql-mvp-check'
  and verse_id = 'gen-1-2'
order by created_at desc
limit 5;
