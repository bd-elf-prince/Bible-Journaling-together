-- Applied and verified on the production project on 2026-08-11.
-- Security Advisor: errors 0, warnings 45 -> 43.
alter function public.bjt_comment_block_reason(text)
  set search_path = public, pg_temp;
alter function public.bjt_guard_comment_content()
  set search_path = public, pg_temp;

-- Performance Advisor: errors 0, warnings 11 -> 6.
alter policy bookmarks_own_all on public.bookmarks
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy highlights_own_all on public.highlights
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy profiles_own_all on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
alter policy preferences_own_all on public.user_preferences
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy notes_own_all on public.verse_notes
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
