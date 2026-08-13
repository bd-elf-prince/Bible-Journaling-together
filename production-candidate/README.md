# CommentBible Production Candidate

- 상태: `candidate` — 운영 배포 금지
- 기준: `recovered-production/2026-08-09`

이 디렉터리는 공개 운영본에서 복구한 JavaScript에 즉시 적용 가능한 bounded-query 안전장치를 반영한 overlay다.

## 변경 사항

- `reader-app.js`
  - 성경 JSON의 `no-store` 제거
  - 통합 댓글 view를 단일 backend로 고정
  - 댓글 응답을 240개 + overflow 확인 1개로 제한
  - 구형 RPC/직접 table fallback 제거
- `community.js`
  - 게시글/댓글 `select('*')` 제거
  - 게시글 초기 window 100개, 댓글 thread 100개로 제한
- `admin.js`
  - 운영 복구 기준본. cursor RPC가 확정되기 전 수정하지 않음

## 배포 전 필수

1. 실제 Supabase view/RPC signature와 RLS 확인
2. 게시글·댓글·관리자 archive cursor RPC 구현
3. 100/240개를 넘는 fixture에서 load-more 누락/중복 시험
4. staging RLS matrix와 `EXPLAIN (ANALYZE, BUFFERS)` 통과
5. Cloudflare HTTPS redirect/cache rule 적용 후 header 검사

현재 제한은 폭주 시 응답 크기를 막는 임시 안전장치다. 완전한 pagination을 대체하지 않는다.
