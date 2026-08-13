-- Korean substring search used by the reader's server fallback.
-- Keep the extension in the Supabase-managed extensions schema.

create extension if not exists pg_trgm with schema extensions;

create index if not exists bible_verses_content_trgm_idx
  on public.bible_verses using gin (content extensions.gin_trgm_ops);
