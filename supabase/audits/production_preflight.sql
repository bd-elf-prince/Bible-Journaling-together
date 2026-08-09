-- Read-only metadata audit for CommentBible production.
-- This file reads catalog/statistics only and does not read application row data.

select
  n.nspname as schema_name,
  c.relname as relation_name,
  c.relkind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_total_relation_size(c.oid) as total_bytes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm')
order by n.nspname, c.relkind, c.relname;

select
  table_schema, table_name, ordinal_position, column_name,
  data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema in ('public', 'storage')
order by table_schema, table_name, ordinal_position;

select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname,
  con.contype,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
order by n.nspname, c.relname, con.contype, con.conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname in ('public', 'storage')
order by schemaname, tablename, indexname;

select
  schemaname, tablename, policyname, permissive, roles, cmd,
  qual as using_expression, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, cmd, policyname;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by table_schema, table_name, grantee, privilege_type;

select
  n.nspname as schema_name,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig,
  coalesce(array_to_string(p.proacl, ','), '<default PUBLIC execute>') as acl,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by n.nspname, p.proname, arguments;

select schemaname, viewname, definition
from pg_views
where schemaname = 'public'
order by viewname;

select
  schemaname, relname as table_name, seq_scan, seq_tup_read,
  idx_scan, n_live_tup, n_dead_tup, last_analyze, last_autoanalyze
from pg_stat_user_tables
order by seq_tup_read desc;

-- Run the following block only when the pg_stat_statements extension is installed.
select
  calls,
  round(total_exec_time::numeric, 2) as total_exec_ms,
  round(mean_exec_time::numeric, 2) as mean_exec_ms,
  rows,
  shared_blks_hit,
  shared_blks_read,
  query
from pg_stat_statements
where query ilike any (array[
  '%discussion_comment%',
  '%board_post%',
  '%user_verse_mark%',
  '%profile%'
])
order by total_exec_time desc
limit 100;
