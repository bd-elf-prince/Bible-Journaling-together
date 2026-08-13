# CommentBible admin insights 독립 P0/P1 감사

감사 범위: UI, analytics client, ingest/admin Edge, candidate SQL, offline runtime/tests. 기존 content 감사 권한은 분리 경계만 확인했다.

| 등급 | 발견 | 조치 | 재검증 |
|---|---|---|---|
| P0 | 상대 ingest 경로가 사이트 origin에서 404 가능 | Supabase Edge 절대 URL | static + syntax PASS |
| P1 | 로그인 연결·회원 철회 범위 불완전 | session을 보내되 서버 `auth.getUser()`만 신뢰 | ACL/leak tests PASS |
| P1 | refresh token을 login으로 과계수 | password grant만 conversion | static inspection PASS |
| P1 | partition child ACL 명시 부족 | 모든 child에 anon/auth revoke | SQL gate PASS |
| P1 | CSV/XSS 입력 표면 | formula prefix, DOM `textContent`, typed filters | automated tests PASS |

OPEN P0: 0. OPEN P1: 0. PostgreSQL 실행, 실제 RLS catalog와 부하 실측은 코드 결함이 아닌 배포 게이트로 남긴다.
