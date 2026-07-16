# Bible Journaling Together V8 candidate

상태: `candidate`

## 화면 기준

- 데스크톱에서는 페이지 전체를 스크롤하는 일반 홈페이지가 아니라 한 화면에 고정된 성경 앱으로 표시합니다.
- 상단 메뉴, 성경책과 읽기 도구, 오른쪽 코멘트 패널이 같은 뷰포트 안에 유지됩니다.
- 900px 이하에서는 코멘트 패널을 본문 아래에 쌓지 않고 오른쪽 드로어로 엽니다.
- 본문과 코멘트 목록처럼 내용이 긴 영역만 내부 스크롤됩니다.
- 한 번에 왼쪽 5절, 오른쪽 5절을 표시합니다.

## 절별 데이터 원칙

- 31,101개의 절마다 고유한 `verse_id`를 사용합니다.
- 댓글과 절 반응은 선택한 `verse_id`를 Supabase 조회 조건으로 전송합니다.
- 화면 렌더링에서도 선택한 `verse_id`와 일치하는 댓글만 표시합니다.
- 책갈피, 메모와 하이라이트는 `user_id + verse_id` 조합으로 분리합니다.
- `gen-1-1`의 댓글이 `gen-1-2`에서 표시되지 않도록 운영 REST 범위 검사를 포함합니다.
- `supabase/v8-verse-integrity.sql`은 모든 절별 기록이 실제 `bible_verses(id)`를 참조하게 만드는 비파괴 FK migration입니다.

## 확인 명령

```bash
npm run check:js
npm run check:v8
npm run check:verse-scope
npm run check:production
```

## 운영 적용 전 남은 확인

- `supabase/v8-verse-integrity.sql` 실행
- `supabase/v8-verify-verse-isolation.sql` 실행 후 성공 및 rollback 확인
- 실제 데스크톱·모바일 브라우저에서 레이아웃과 모든 버튼 확인
- 실제 이메일 가입·로그인·로그아웃과 사용자 기록 CRUD 확인

브라우저에는 Supabase publishable key만 사용하며 service-role key를 포함하지 않습니다.
