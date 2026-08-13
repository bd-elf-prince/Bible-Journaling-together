# CURRENT_TASK — CommentBible full-function 10k candidate

- 상태: candidate; 운영 배포·활성화 금지
- 작성일: 2026-08-14
- 기준 저장소: `bd-elf-prince/Bible-Journaling-together`
- 기준 커밋: `374cca38f8b10f30eaaf7e30c67c6eb18091a75b`
- 작업 브랜치: `codex/full-function-10k-candidate`

## 목표

회원가입·이메일 확인·로그인·로그아웃·세션 갱신·비밀번호 복구, 성경 읽기·검색·노트·북마크, 댓글/게시판 CRUD, 신고·차단·감사·관리자 기능을 정상 상태에서 제공하면서 10,000 동시 접속 후보를 검증한다.

## 절대 경계

- 운영 `runtime-config.json`, Cloudflare, Supabase 프로젝트를 변경하지 않는다.
- 운영 읽기 전용 모드를 해제하지 않는다.
- 실키·실개인정보·운영 부하 시험을 사용하지 않는다.
- 실제 배포는 별도 명시적 승인 이후에만 가능하다.
- 기능 차단만으로 10k 대응 완료라고 판정하지 않는다.

## 확인된 기준 상태

- 지정된 `COMMENTBIBLE_FULL_SITE_AUDIT_2026-08-12.md`, `AGENTS.md`, 기존 `CURRENT_TASK.md`는 기준 커밋과 저장소 검색에서 발견되지 않았다.
- 기준 커밋은 존재한다.
- `codex/production-upgrade` 현재 head는 기준 이후의 `f2fa1dbc54314b5af4d01de7ea2a99b17cffbc1e`이며 이번 후보에 혼합하지 않는다.
- 운영 보호 모드는 정적 성경 66권 shard를 유지하고 Auth·동적 읽기·쓰기를 차단한다.

## 이번 후보 작업

- [x] 체크포인트 및 누락 감사 문서 확인
- [x] disabled/우회 쓰기 경로 목록화
- [x] 공식 Supabase changelog·Auth·RLS·Supavisor·Queues 문서 검토
- [ ] v5 중앙 gateway와 단계적 degradation 구현
- [ ] cursor RPC·RLS/ACL·queue/DLQ·관측 migration candidate 구현
- [ ] reader/community의 직접 DB 쓰기 제거
- [ ] Auth/CRUD/RLS/재시도/폭주 계약 테스트 구현
- [ ] k6 격리 adapter 부하 harness 구현
- [ ] GitHub Actions 클라우드 검증
- [ ] P0/P1 독립 감사
- [ ] Draft PR 생성

## 성공 판정

- 정상 모드: 요구된 전체 기능의 계약 테스트가 통과한다.
- guarded 모드: 사용자 CRUD는 유지하며 비핵심 집계·뷰 이벤트만 backpressure/queue 대상이 된다.
- severe 모드: 신규 비핵심 쓰기 제한, 기존 콘텐츠 수정·삭제·신고와 Auth 복구는 유지한다.
- emergency 모드: DB 동적 기능이 차단돼도 정적 성경 읽기는 생존하며 명시적 오류를 반환한다.
- 격리 환경 10k 목표: read p95 ≤ 500ms, write p95 ≤ 800ms, p99 ≤ 1500ms, HTTP 실패율 < 0.1%, DB CPU 지속 < 70%, DB 연결 < 70%, queue oldest age < 30초.
- 실제 10k 검증 전에는 “10k 완료”로 표시하지 않는다.
