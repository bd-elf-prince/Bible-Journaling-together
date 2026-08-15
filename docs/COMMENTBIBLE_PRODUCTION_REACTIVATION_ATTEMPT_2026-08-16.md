# CommentBible production reactivation attempt — 2026-08-16

## 결과

운영 복구 승인을 받아 production preflight를 수행했으나, CommentBible production deployment access가 현재 workspace에 연결되지 않아 운영 mutation 전에 중단했다. 기능을 read-only로 새로 전환하거나 main을 수정하지 않았다.

## 확인값

- 공개 URL: `https://commentbible.com/`
- 공개 검색 상태: 성경 읽기 페이지 존재, community는 “현재 연결: 로컬 작업본”
- Cloudflare rollback: Worker `d2edb34e-d960-49cc-bc24-81c99874d1ed`
- GitHub main: `f38005f2370369b846cd359bea6fc76fdbc00b82`
- PR #16 head: `0e864a6c04b2d639ebf05bcd9e21e401587bd6b6`
- candidate flags: normal, dynamicReads/writes/auth=true
- gateway: write-gateway-v5
- production Supabase ref: `rayvvlerwxumqvmodvsy`

## 권한 preflight

- Supabase connected projects에는 AFFFFA 계열만 존재한다.
- production ref의 tables, Edge Functions, Auth logs 조회는 모두 permission denied다.
- CommentBible/Supabase/Cloudflare credential environment variable은 없다.
- Cloudflare dashboard/API 연결이 없다.
- cloud browser의 공개 URL 접근도 사용자 권한 정책에서 거부되어 우회하지 않았다.

## 수행하지 않은 변경

- DB migration, DML, Auth 설정 변경: 0
- Edge Function deploy/secret 변경: 0
- Cloudflare Worker/assets/flags/cache 변경: 0
- main merge/push: 0
- 사용자·글·댓글 삭제/초기화: 0
- synthetic row 생성: 0

따라서 데이터 행수는 변경하지 않았으나, 권한 부재로 배포 전후 행수를 직접 조회해 수치 비교할 수는 없다.

## 검증

- 전체 무네트워크 Node 회귀: 18/18 PASS
- remote candidate runtime: normal / true / true / true
- remote write-gateway-v5와 RLS/idempotency/outbox 정적 gate: PASS
- PR #16: open, draft, mergeable, duplicate 없음

## 단일 blocker

이 workspace에 CommentBible production deployment access를 연결해야 한다. 범위는 Supabase project `rayvvlerwxumqvmodvsy`와 Cloudflare `commentbible.com` zone/Worker이며, secret 원문을 채팅이나 저장소에 전달하면 안 된다.
