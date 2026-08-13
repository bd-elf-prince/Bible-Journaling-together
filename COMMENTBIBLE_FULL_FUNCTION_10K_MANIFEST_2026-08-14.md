# CommentBible full-function 10k candidate manifest — 2026-08-14

## 기준

- repository: `bd-elf-prince/Bible-Journaling-together`
- base: `374cca38f8b10f30eaaf7e30c67c6eb18091a75b`
- branch: `codex/full-function-10k-candidate`
- status: BLOCKED, design/audit only

## 추가 산출물

- `CURRENT_TASK.md`
- `COMMENTBIBLE_FULL_SITE_AUDIT_2026-08-14.md`
- `docs/COMMENTBIBLE_10K_CAPACITY_MODEL.md`
- 이 manifest

## 변경하지 않은 항목

- 운영 `data/runtime-config.json`
- reader/community/admin runtime 코드
- Supabase migration 및 Edge Functions
- Cloudflare 설정·Worker
- main 및 기존 `codex/production-upgrade`
- 실키·실개인정보·운영 데이터

## 검증

- 기준 commit 존재: PASS
- 지정 2026-08-12 감사/AGENTS/CURRENT_TASK 존재: FAIL — 저장소에서 찾지 못함
- 대상 Supabase project read-only 접근: FAIL — 연결 project 목록에 없음
- 공식 Supabase changelog/docs 조사: PASS
- disabled/직접-write 경로 목록화: PASS
- backend compile/RLS/E2E/load test: NOT RUN — exact schema blocker
- P0/P1 코드 감사: BLOCKED
- 운영 배포 승인: DENIED

## 재개 게이트

민감정보가 제거된 production catalog/function dump 또는 대상 프로젝트 read-only 연결 후 새 commit에서 구현·CI·격리 부하 시험을 계속한다.
