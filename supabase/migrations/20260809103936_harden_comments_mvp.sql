-- Candidate migration for the legacy comments MVP.
-- Do not apply to production until the schema preflight and staging RLS matrix pass.

begin;

-- Future objects stay private until a migration grants the intended API roles.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

do $$
begin
  if to_regclass('public.comments') is null
     or to_regclass('public.comment_reactions') is null
     or to_regclass('public.comment_reports') is null then
    raise exception 'legacy comments MVP tables are missing; review schema drift before applying';
  end if;
end
$$;

-- Trigger functions do not need to be public RPC endpoints.
revoke all on function public.prevent_comment_spam() from public, anon, authenticated;
revoke all on function public.increment_comment_report_count() from public, anon, authenticated;

-- Serialize checks for one anonymous id and keep each lookup index-bounded.
create or replace function public.prevent_comment_spam()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if char_length(btrim(new.anonymous_id)) not between 8 and 128 then
    raise exception 'invalid_anonymous_id' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.anonymous_id, 0));

  if exists (
    select 1
    from public.comments c
    where c.anonymous_id = new.anonymous_id
      and c.created_at > statement_timestamp() - interval '12 seconds'
      and c.deleted_at is null
    limit 1
  ) then
    raise exception 'too_many_comments_short_window' using errcode = 'P0001';
  end if;

  if (
    select count(*)
    from (
      select 1
      from public.comments c
      where c.anonymous_id = new.anonymous_id
        and c.created_at > statement_timestamp() - interval '10 minutes'
        and c.deleted_at is null
      limit 5
    ) recent
  ) >= 5 then
    raise exception 'too_many_comments_10_min' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.comments c
    where c.anonymous_id = new.anonymous_id
      and c.verse_id = new.verse_id
      and btrim(c.content) = btrim(new.content)
      and c.created_at > statement_timestamp() - interval '1 day'
      and c.deleted_at is null
    limit 1
  ) then
    raise exception 'duplicate_comment' using errcode = '23505';
  end if;

  return new;
end
$$;

revoke all on function public.prevent_comment_spam() from public, anon, authenticated;

-- The legacy public function remains only for service-role compatibility.
-- A later migration should move the operation behind a private admin API.
create or replace function public.admin_soft_delete_comment(
  target_comment_id uuid,
  reason text default 'admin_delete'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;

  update public.comments
     set deleted_at = statement_timestamp(),
         deleted_by = coalesce(auth.uid()::text, 'service_role'),
         delete_reason = left(coalesce(nullif(btrim(reason), ''), 'admin_delete'), 500)
   where id = target_comment_id
     and deleted_at is null;
end
$$;

revoke all on function public.admin_soft_delete_comment(uuid, text)
from public, anon, authenticated;
grant execute on function public.admin_soft_delete_comment(uuid, text)
to service_role;

-- Reports are write-only for public clients. Inserts must use return=minimal.
revoke select on public.comment_reports from anon, authenticated;
grant insert on public.comment_reports to anon, authenticated;

drop policy if exists "public read reports for insert return" on public.comment_reports;
drop policy if exists "comments reports admin read" on public.comment_reports;

drop policy if exists "public insert reports" on public.comment_reports;
create policy "comment reports insert public client"
  on public.comment_reports
  for insert
  to anon, authenticated
  with check (
    comment_id is not null
    and char_length(btrim(anonymous_id)) between 8 and 128
    and char_length(btrim(reason)) between 1 and 200
  );

-- Explicit Data API roles replace broad PUBLIC-targeted policies.
drop policy if exists "public read visible comments" on public.comments;
create policy "comments read visible public client"
  on public.comments
  for select
  to anon, authenticated
  using (deleted_at is null);

drop policy if exists "public insert anonymous comments" on public.comments;
create policy "comments insert public client"
  on public.comments
  for insert
  to anon, authenticated
  with check (
    verse_id ~ '^[a-z0-9]+-[0-9]+-[0-9]+$'
    and char_length(btrim(anonymous_id)) between 8 and 128
    and char_length(btrim(user_name)) between 1 and 80
    and char_length(btrim(content)) between 1 and 1000
    and deleted_at is null
    and deleted_by is null
    and delete_reason is null
    and report_count = 0
  );

drop policy if exists "public read comment reactions" on public.comment_reactions;
create policy "comment reactions read public client"
  on public.comment_reactions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public insert own comment reactions" on public.comment_reactions;
create policy "comment reactions insert public client"
  on public.comment_reactions
  for insert
  to anon, authenticated
  with check (
    comment_id is not null
    and char_length(btrim(anonymous_id)) between 8 and 128
    and reaction_type = 'heart'
  );

commit;
