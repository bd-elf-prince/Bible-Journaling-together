-- Pin helper-function resolution to trusted schemas.
alter function public.bjt_comment_block_reason(text)
  set search_path = public, pg_temp;

alter function public.bjt_guard_comment_content()
  set search_path = public, pg_temp;
