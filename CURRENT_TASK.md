# CURRENT_TASK — CommentBible full-function 10k candidate

- 상태: 후보 코드 PASS; 운영 배포 금지
- 날짜: 2026-08-14
- branch: codex/full-function-10k-candidate
- head parent: abf356e800ab0d40f5f001b00a7b0ba65b7a455e

## 완료
- [x] PR #16·저장소·runtime/Auth/RLS/rate/cache/queue 감사
- [x] normal 후보에서 Auth·동적 읽기·쓰기 활성
- [x] 글/댓글/개인 기록 전 쓰기 gateway-v5 통일
- [x] idempotency payload binding, rate limit, bounded outbox
- [x] 서버 장애 unavailable 표시와 optimistic rollback
- [x] 가입/로그인/CRUD/RLS/신고/알림/pagination E2E
- [x] 10k/50k 무네트워크 부하 모델
- [x] 독립 P0/P1 재감사: 후보 코드 OPEN P0=0, P1=0

## 검증
- Node E2E 8/8 PASS
- 10k 모델: 223.3 dynamic RPS, 19 calculated connections, read p95 243ms, write p95 416ms
- 50k 모델: 94 calculated connections; single 60-connection budget FAIL
- frontend syntax/static bypass gate PASS
- SQL runtime NOT RUN: Postgres/PGlite/Supabase CLI 없음

## 배포 전 게이트
staging project/ref, catalog/RPC 확인, candidate SQL 적용, RLS matrix, EXPLAIN ANALYZE, k6 1k→5k→10k, Auth/SMTP/CAPTCHA/redirect, compute/pooler/Edge/Cloudflare 값을 확정한다. 운영 mutation·배포는 수행하지 않는다.
