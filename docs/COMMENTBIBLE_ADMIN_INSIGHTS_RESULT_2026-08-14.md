# CommentBible 관리자 인사이트 candidate 결과

## 화면과 지표

- 경로: `/admin/insights/`
- 상태: loading, empty, error, forbidden, desktop/tablet/mobile
- 지표: 현재(5분), 오늘, 7일, 30일 고유 방문자; 고유 세션; 신규/재방문; pageview; 가입/로그인/글/댓글; 신고/error/429; read/write p50/p95; browser/ingest drop
- 분해: 시간대, 성경 책·장, 경로, referrer/UTM source, coarse device/browser/country, 방문→성경→로그인→글·댓글 funnel
- 방문 기록: 날짜/event/source/login filter, typed 최대 100행 cursor pagination, 최대 1,000행 CSV
- 작성자·본문 감사는 기존 `/admin.html` 권한 흐름으로 분리하며 analytics와 content join을 제공하지 않는다.

## 데이터·보안

- 브라우저 ID: 임의 UUID visitor 30일 rotation, session 30분 비활동 또는 일 경계 rotation.
- 서버 저장 ID: `ANALYTICS_HMAC_KEY` HMAC(visitor/session). 로그인 사용자는 검증된 JWT의 `user.id`만 서버가 연결한다.
- IP: HMAC keyed rate digest로만 사용, 2일 후 제거. 화면/로그/event에는 없음.
- 미수집: raw IP, 정확 위치, 원문 User-Agent, password, token/cookie, 글·댓글/성경 본문.
- 수집: event type/time, path(query 제거), coarse referrer/device/browser/country, allowlisted dimensions, latency.
- ACL: 내부 `private.cb_insights_admins`를 Edge가 매 요청 조회. anon/auth/user/client role claim은 raw와 visitor/rollup을 읽지 못한다. service role 함수만 ingest/admin API 내부에서 사용한다.
- 삭제: consent withdrawal 시 visitor와 검증 user의 linkable raw/session 삭제, replay 방지 tombstone 35일.
- 보존: raw event 30일, session 30일, rate digest 2일, tombstone 35일, daily rollup 760일.

## 비차단·부하

- core 요청은 analytics 응답을 await하지 않는다. 수집 실패는 64개 local outbox에서 재시도하고 20개 batch로 전송한다.
- 큐 초과는 오래된 항목을 drop하고 `browser_dropped`; ingest rejection과 함께 admin에 노출한다.
- 10k 모델: 평균 25, peak 350 events/s; batch fill 12에서 peak 29.2 ingest req/s; DB txn 80ms 가정 2.33 연결; 30일 raw+index 약 49.0GB.
- 50k 모델: 평균 125, peak 1,750 events/s; peak 145.8 ingest req/s; 11.67 연결; 약 244.9GB. 연결보다 partition IOPS, session upsert hot index, storage/rollup 비용이 먼저 병목이다.
- 월 partition+default, time/session/visitor/type/path/user indexes, daily rollup/retention advisory lock 후보를 포함한다.
- 숫자는 무네트워크 결정론 모델이며 staging 실측이 아니다.

## 자동 검증

- 인사이트 10 tests: dedupe/order/retry, offline bounded outbox, rotation, ACL matrix/client claim, sensitive leak/query stripping, CSV formula/XSS, withdrawal/tombstone, retention rollup, cursor, 10k/50k.
- 기존 전체 기능 8 tests 포함 총 18/18 PASS.
- static security gate, JS syntax, skill artifact validator PASS.
- PostgreSQL runtime은 현재 환경에 없어 migration 실행·RLS/EXPLAIN은 staging gate다.

## 독립 P0/P1 재감사

- 해결 P0: 상대 ingest URL이 정적 사이트 origin으로 전송될 수 있음 → Supabase Edge 절대 endpoint로 고정.
- 해결 P1: 익명 ingest만으로 로그인 세션 식별/회원 삭제가 불완전 → 별도 auth client의 현재 session을 전송하고 서버 `auth.getUser()`로 검증.
- 해결 P1: token refresh도 login 전환으로 셀 수 있음 → `grant_type=password` 성공만 login conversion.
- 해결 P1: 생성 partition ACL이 parent revoke만 의존 → 모든 child partition 명시 revoke.
- OPEN candidate code: P0 0, P1 0.

## 실제 배포 전 남은 값

staging project/ref, 내부 관리자 UUID, `ANALYTICS_HMAC_KEY`, `ANALYTICS_ALLOWED_ORIGINS`, `ADMIN_ALLOWED_ORIGINS`, Edge 배포/라우팅, pg_cron 일정, partition 사전 생성, 실제 catalog/RLS matrix, EXPLAIN ANALYZE, k6 1k→5k→10k, DB compute/pooler/storage/IOPS/Edge quota, 50k에서 raw 기간 축소 또는 warehouse 전송 결정을 확정해야 한다.
