# CommentBible 전체 기능·10k 후보 결과 — 2026-08-14

## 판정

- 후보 코드: PASS, P0 0건 / P1 0건.
- 운영 배포: 미수행·미승인.
- 실제 10k: 무네트워크 결정론 모델 PASS이며 staging 실측 전에는 완료로 주장하지 않는다.

## 원인과 수정

1. `data/runtime-config.json`이 surge로 Auth·동적 읽기·쓰기를 모두 차단했다. 후보 branch에서 normal로 열되 운영 배포는 하지 않았다.
2. 글/댓글 수정·삭제와 회원 기록 upsert가 중앙 gateway를 우회했다. 모든 쓰기를 additive `write-gateway-v5`로 통일했다.
3. 게시판 서버 오류가 브라우저 로컬 성공 모드로 바뀌었다. 서버 실패는 명시적 unavailable로 유지하고 쓰기 UI를 닫는다.
4. 기존 idempotency가 같은 key의 다른 payload를 구분하지 못했다. actor/action/key와 body hash를 결합한 claim 계약으로 바꿨다.
5. guarded/severe 비핵심 작업이 queue 없이 성공처럼 끝났다. service-role 전용 bounded outbox와 dedupe key를 추가했다.

## 실제 열린 후보 기능

- 이메일 가입·확인 callback, 아이디 로그인, 세션 갱신, 비밀번호 재설정·변경, 로그아웃.
- 해시 성경 shard 읽기·검색.
- 회원/익명 글·댓글 생성·조회·수정·삭제.
- 회원 책갈피·하이라이트·메모의 caller-RLS upsert.
- 신고, 알림, 관리자 app_metadata 경계, 삭제 보관함 계약.
- keyset cursor 최대 100개, idempotency, actor/IP rate limit, optimistic commit/rollback, 장애 복구, bounded outbox.

## 자동 검증

- Node 무네트워크 E2E: 8/8 PASS.
- 가입→확인→로그인→갱신→로그아웃: PASS.
- 회원/익명 CRUD, 비밀번호 소유권, 교차 사용자 거부: PASS.
- 개인 기록 격리, 신고 중복, 알림: PASS.
- cursor 중복/누락, 최대 page bound: PASS.
- rate limit, payload mismatch, 장애 복구: PASS.
- optimistic commit/rollback, outbox backpressure/drain: PASS.
- reader/community JavaScript 구문: PASS.
- 원격 head 중앙 gateway 우회 정적검사: PASS.
- SQL 실행: NOT RUN — psql/Postgres/PGlite/Supabase CLI 없음.

## 부하 근거

| 동시 사용자 | CDN RPS | 동적 RPS | 계산 연결 | read p95 | write p95 | auth p95 | 판정 |
|---:|---:|---:|---:|---:|---:|---:|---|
| 10,000 | 350 | 223.3 | 19 | 243ms | 416ms | 351ms | 모델 PASS |
| 50,000 | 1,750 | 1,116.7 | 94 | 963ms | 1,616ms | 1,351ms | 단일 60-connection 예산 FAIL |

수치는 실측이 아니라 동일 입력에 같은 결과를 내는 무네트워크 예산 모델이다. 50k는 read replica/캐시 적중률 확대, connection budget 상향 또는 API 분할 없이는 승인하지 않는다.

## 배포 전 남은 값

- staging Supabase project ref와 publishable key.
- `DEGRADATION_LEVEL=normal`, Turnstile secret, custom SMTP, Auth redirect allowlist.
- 실제 catalog/RPC signature 확인 뒤 candidate SQL 확정.
- staging SQL/RLS matrix, EXPLAIN ANALYZE, 1k→5k→10k k6 실측.
- DB compute/pooler 최대 연결, Edge concurrency, Auth/SMTP quota, Cloudflare cache/WAF 값.

실키·실개인정보·운영 mutation·배포·결제는 0건이다.
