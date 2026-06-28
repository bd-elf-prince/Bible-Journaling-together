-- Bible Journaling Together 댓글 저장소 설정
-- Supabase Dashboard > SQL Editor에서 전체 실행하세요.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  verse_id text not null,
  user_name text not null default '익명',
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists comments_verse_id_created_at_idx
  on public.comments (verse_id, created_at desc);

alter table public.comments enable row level security;

-- 누구나 절별 댓글을 읽을 수 있게 허용합니다.
drop policy if exists "Public can read comments" on public.comments;
create policy "Public can read comments"
  on public.comments
  for select
  to anon
  using (true);

-- 로그인 없이도 익명 댓글을 작성할 수 있게 허용합니다.
-- content 길이 제한은 테이블 check 제약으로 한 번 더 막습니다.
drop policy if exists "Anon can insert comments" on public.comments;
create policy "Anon can insert comments"
  on public.comments
  for insert
  to anon
  with check (
    verse_id is not null
    and user_name is not null
    and content is not null
    and char_length(trim(content)) > 0
    and char_length(content) <= 1000
  );

-- 프론트에서 사용하는 컬럼만 허용되는 단순 구조입니다.
-- 삭제/수정 기능은 아직 공개하지 않습니다. 관리자 기능을 만들 때 별도 정책을 추가하세요.
