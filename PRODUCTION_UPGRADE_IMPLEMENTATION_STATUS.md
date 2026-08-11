# CommentBible Production Upgrade — Implementation Status

> 2026-08-11 갱신: 아래 2026-08-09 초기 상태보다 최신인 실제 적용 현황은 `COMMENTBIBLE_PRODUCTION_UPGRADE_PLAN.md` 16절과 `supabase/audits/2026-08-11_*` 기록이 기준이다. 운영 DB index·RLS 성능 교정과 Edge Function v4 서지 차단까지 적용됐으며, 공개 프론트와 Cloudflare zone 설정은 아직 미배포다.

- 상태: `candidate`
- branch: `codex/production-upgrade`
- 작성일: 2026-08-09

## 완료

- 공개 운영 HTML/JS/CSS 9개를 `recovered-production/2026-08-09`에 복구
- 운영 원본과 정규화 문자 비교: 9개 모두 마지막 LF 외 차이 없음
- 구형 V5 전체 comments/reactions 조회를 펼침면 단위 bounded query로 바꾼 `v6-reader.js` 생성
- 운영 reader의 댓글 backend fan-out 제거와 240개 상한 적용
- 운영 community의 `select('*')`, 500건 일괄 조회 제거 및 임시 window 적용
- 관리자 함수 EXECUTE와 신고 SELECT를 잠그는 versioned migration candidate 생성
- Cloudflare `_headers`와 HTTPS/cache/WAF runbook 생성
- Supabase catalog/RLS/index/function/statistics 읽기 전용 preflight SQL 생성
- 자동 정적 보안·성능 회귀검사 추가

## 적용하지 않은 항목

- 대상 Supabase 프로젝트: 현재 연결 계정에 관리 권한 없음
- 대상 Cloudflare zone: dashboard/API 읽기·쓰기 연결 없음
- production 배포: 수행하지 않음
- DB migration: 수행하지 않음

## 차단 이유

- publishable key는 DDL, RLS, function ACL, 실행계획을 확인하거나 변경할 권한이 없다.
- 연결된 Supabase 계정에서 대상 프로젝트 조회가 permission denied로 확인됐다.
- 운영 DB는 저장소의 legacy MVP와 다른 discussion schema를 사용한다.
- 이 상태에서 migration을 강행하면 서비스 중단 또는 잘못된 권한 변경이 발생할 수 있다.

## 다음 적용 게이트

1. 대상 Supabase 프로젝트를 현재 연결 계정에 read-only 이상으로 공유
2. `supabase/audits/production_preflight.sql`과 Security/Performance Advisor 실행
3. 실제 schema 기준 cursor/index/RLS migration 확정
4. staging DB에 migration 적용 및 role matrix/query plan/load test
5. Cloudflare zone 연결 후 HTTPS redirect와 cache rule canary 적용
6. 사용자 승인된 release hash만 production 배포
