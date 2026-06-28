# Bible Journaling Together

말씀을 읽고, 절마다 익명 묵상 댓글을 남기고, 다른 사람의 묵상을 함께 읽을 수 있는 성경 저널링 커뮤니티 홈페이지입니다.

## 현재 구조

이 저장소는 Next.js가 아니라 GitHub Pages에서 바로 배포되는 정적 웹 프로젝트입니다.

- `index.html` — 성경 리더 화면, 검색, 절 선택, 댓글 모달 구조
- `styles.css` — 종이책 느낌의 프리미엄 성경 UI, 반응형 스타일
- `script.js` — 창세기 1장 데이터, 절 선택, 익명 닉네임, Supabase 댓글 조회/작성
- `supabase-comments-setup.sql` — Supabase 댓글 테이블과 공개 읽기/쓰기 정책 설정 SQL

## 배포 주소

GitHub Pages가 `main` 브랜치 `/root`로 켜져 있으면 아래 주소에서 확인합니다.

```txt
https://bd-elf-prince.github.io/Bible-Journaling-together/
```

## Supabase 댓글 DB 설정

댓글을 실제로 저장하려면 Supabase SQL Editor에서 `supabase-comments-setup.sql` 내용을 실행해야 합니다.

필요한 테이블 이름은 `comments`입니다.

필수 컬럼:

- `id`
- `verse_id`
- `user_name`
- `content`
- `created_at`

현재 프론트는 `script.js`에서 Supabase publishable key로 접속합니다. Secret key나 service role key는 절대 저장소에 커밋하지 않습니다.

## 현재 구현된 기능

- 창세기 1장 1–10절 읽기
- 종이책 양면 UI
- 절 클릭 시 묵상 댓글 모달 열기
- 브라우저별 고정 익명 닉네임 생성
- Supabase에서 절별 댓글 불러오기
- Supabase에 절별 댓글 저장
- 절별 댓글 수 표시
- 현재 장 안에서 구절 검색
- 글자 크기 변경
- 모바일 반응형 레이아웃

## 다음 개발 작업

1. 성경 전체 장/절 데이터 연결
2. 책/장 선택 기능 실제 데이터와 연결
3. 댓글 신고/숨김 기능
4. 댓글 좋아요 기능
5. 관리자용 댓글 삭제 기능
6. Supabase 환경값 분리 또는 서버 프록시 검토

## 로컬에서 보기

브라우저에서 `index.html` 파일을 직접 열면 됩니다. 다만 Supabase 요청은 인터넷 연결과 Supabase 정책 설정이 필요합니다.

## GitHub Pages 배포

1. GitHub 저장소의 **Settings**로 이동합니다.
2. 왼쪽 메뉴에서 **Pages**를 선택합니다.
3. **Build and deployment**에서 Source를 **Deploy from a branch**로 설정합니다.
4. Branch는 `main`, 폴더는 `/root`를 선택합니다.
5. 저장하면 잠시 뒤 홈페이지 URL이 생성됩니다.
