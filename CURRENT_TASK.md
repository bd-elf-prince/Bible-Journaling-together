# CURRENT_TASK — CommentBible production reactivation

- 상태: production deployment access blocked; 운영 mutation 0
- 날짜: 2026-08-16
- branch: `codex/full-function-10k-candidate`
- additive parent: `3b25512705da242b257fb29ccfde2e8dac9c0c75`
- Draft PR: #16 (중복 PR 없음)

## 완료

- [x] `/admin/insights/` 반응형 dashboard와 loading/empty/error/forbidden/mobile 상태
- [x] 방문·세션·전환·신고/오류/429·read/write p50/p95·드롭 지표
- [x] 시간 추이, 성경/페이지, source/UTM, coarse device/browser/country, funnel
- [x] 날짜/event/source/login 필터와 `(last_at, session_hash)` cursor 페이지네이션
- [x] 내부 관리자 매핑을 매 요청 검사; client admin claim 불신; raw/event 직접 조회 차단
- [x] UUID event_id dedupe, 회전 visitor/session, 20 batch·64 outbox, fail-open 수집
- [x] HMAC visitor/session, raw IP/원문 UA/정확 위치/본문·댓글/토큰 미저장
- [x] 동의 철회 삭제+tombstone, 30/30/35/760일 retention·rollup
- [x] 기존 작성자·내용 감사 화면과 일반 방문 통계 분리
- [x] 중복/순서/재시도/offline/RLS/권한/CSV/XSS/누출/retention/10k 자동 테스트
- [x] 별도 P0/P1 감사 후 수정·재검증: OPEN P0=0, P1=0

## 검증

- Node 무네트워크 전체: 18/18 PASS (인사이트 10 + 기존 기능 8)
- 인사이트 정적 보안 게이트: PASS
- UTF-8/헤더/푸터/민감정보 후보: 7/7 PASS
- JS syntax: PASS
- SQL runtime: NOT RUN — PostgreSQL/PGlite/Supabase 자격·런타임 없음
- 10k analytics peak: 350 events/s → batch 29.2 req/s → 계산 DB 연결 2.33, raw+index 30일 약 49.0GB
- 50k analytics peak: 1,750 events/s → batch 145.8 req/s → 계산 DB 연결 11.67, raw+index 30일 약 244.9GB

## 배포 전 게이트

staging에서 migration dry-run, 관리자 UUID seed, `ANALYTICS_HMAC_KEY`, 허용 Origin, Edge 배포, pg_cron retention/partition, RLS matrix, EXPLAIN ANALYZE, 실제 k6 1k→5k→10k, storage/IOPS quota와 50k rollup·warehouse 전략을 확정한다. main·force push·실배포·실키·실개인정보 mutation은 수행하지 않는다.

## 2026-08-16 production reactivation attempt

- 사용자 승인: production 원상복구·기능 재활성화 승인
- public URL: `https://commentbible.com/`
- public indexed state: 성경 읽기 노출, community는 “로컬 작업본”
- production rollback checkpoint: Cloudflare Worker `d2edb34e-d960-49cc-bc24-81c99874d1ed`
- GitHub production main: `f38005f2370369b846cd359bea6fc76fdbc00b82`
- PR #16 head preflight: `0e864a6c04b2d639ebf05bcd9e21e401587bd6b6`
- candidate runtime: normal / dynamicReads=true / writes=true / auth=true
- production Supabase ref `rayvvlerwxumqvmodvsy`: connected project 목록에 없고 API는 permission denied
- connected Supabase projects: AFFFFA 계열만 확인; 오배포 방지를 위해 mutation하지 않음
- Cloudflare production credential/session: 이 workspace에 없음; 브라우저 접근도 사용자 권한 정책에서 거부됨
- environment credential names: CommentBible/Supabase/Cloudflare 관련 값 없음
- migration/Edge/flags/Worker/data mutation: 0
- production 행수: 권한 부재로 조회 불가; 삭제·초기화·synthetic row 생성 0
- 재검증: Node 18/18 PASS, remote runtime/gateway/RLS static gate PASS
- 단일 blocker: 이 workspace에 CommentBible production deployment access(Supabase project + Cloudflare zone)를 연결해야 함

## 2026-09-05 댓글 장애 재검증

- 사용자 승인 범위: 기존 데이터 보존 상태의 운영 기능 정상화
- 작업 branch: `codex/comment-write-recovery-v7` (additive, `ad54ef1` 기반)
- 공개 사이트: HTTP 200, runtime `normal`, writes/auth/dynamicReads=true
- 실제 화면 재현: Genesis 1:1 댓글 조회 실패 및 서버 연결 오류 UI
- 배포 gateway: `write-gateway-v4`
- 운영 Supabase ref: `rayvvlerwxumqvmodvsy`
- 운영 Supabase REST/Edge: HTTP 502 `connection refused`
- 대조: 연결된 활성 Supabase REST는 HTTP 401로 정상 응답
- 연결된 Supabase 목록: CommentBible 없음; 다른 두 프로젝트에는 mutation 0
- Cloudflare: 현재 연결 없음; 과거 rollback version의 현재 유효성 미확인
- 데이터 수/표본/DB backup: 운영 DB 접근 불가로 미확인(0으로 오기록하지 않음)
- 추가 파일: 재실행 가능한 읽기 전용 preflight·단위 테스트·incident 기록
- 자동검증: Node 21/21 PASS, 새 preflight 3/3 PASS, 정적 게이트 2종 PASS, 구문/UTF-8/민감정보 PASS
- 실제 preflight: `2026-09-05T15:55:44.312Z`, site 200 / API 502 / gateway 502 / 공개 count 미확인 / mutation 0
- PostgreSQL/RLS/RPC/Edge 및 회원·익명 smoke: NOT RUN — 운영 프로젝트 접근 불가
- 운영 mutation/배포/SQL/Edge/Worker 변경: 0
- 최신 감사: v5/v6 보안 요구 중 OPEN P0 5, P1 4
- 배포 판정: **금지 유지**
- 단일 권한 blocker: `rayvvlerwxumqvmodvsy` 소유 Supabase 연결과 `commentbible.com` Cloudflare 연결
