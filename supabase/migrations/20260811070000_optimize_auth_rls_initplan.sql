-- Evaluate auth.uid() once per statement instead of once per scanned row.
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
