# CommentBible 전체 기능·10k 후보 감사 — 2026-08-14

## 감사 범위와 근거

기준은 `codex/production-upgrade@374cca38f8b10f30eaaf7e30c67c6eb18091a75b`이다. 지정된 2026-08-12 감사 파일은 저장소에 없어, 기준 커밋의 코드·배포 manifest·production upgrade plan·Supabase audit 기록으로 재구성했다.

## disabled 경로

| 경로 | 현재 동작 | 최종 후보 요구 |
|---|---|---|
| `data/runtime-config.json` | `mode=surge`, Auth/동적 읽기/쓰기 false | 운영 파일은 그대로 두고 별도 full-function candidate config 제공 |
| reader 초기화 | Auth 미초기화, 댓글 조회 생략, controls disabled | 정상 모드 전체 기능; config 실패는 성경 생존 + 명시적 degraded 안내 |
| community 초기화 | 서버 게시판 연결 생략, controls disabled | 서버 오류를 빈 게시판/로컬 정상처럼 표시하지 않음 |
| `write-gateway-v4` | `SURGE_READ_ONLY=true`이면 DB 접근 전 503 | v5에서 normal/guarded/severe/emergency 단계 분리 |
| 기존 v1~v4 gateway | rollback 후보가 병존 | 배포 승인 시 v5 단일 진입점 전환·구버전 직접 호출 차단 별도 수행 |

## 중앙 gateway 우회 경로

- reader 댓글 수정·삭제: 직접 `db.rpc`.
- reader 개인 노트·북마크·하이라이트: 직접 `user_verse_marks.upsert`.
- community 게시글 수정·삭제: 직접 `db.rpc`.
- community 댓글 수정·삭제: 직접 `db.rpc`.
- Auth signup/login/logout/refresh/recovery: Supabase Auth 공식 경로이며 애플리케이션 DB gateway 대상이 아니다. 비밀번호를 자체 gateway로 전달하지 않는다.
- 공개 읽기: RLS가 적용되는 bounded cursor RPC/Data API 대상이며 write gateway 대상이 아니다.

## P0

1. 지정 감사 문서와 AGENTS/CURRENT_TASK가 기준에 없음: 이번 후보가 새 산출물을 제공하되 과거 감사가 있었다고 주장하지 않는다.
2. 정상 기능을 증명하지 않은 채 운영 surge 모드를 해제하면 안 된다.
3. 직접 DB 쓰기 우회는 rate limit/idempotency/circuit breaker를 우회한다.
4. service-role gateway는 payload allowlist, 실제 사용자 JWT 검증, RLS caller client를 유지해야 한다.
5. 운영 Free/nano·60 DB 연결 스냅샷은 10k 근거가 아니다. compute·pooler·SMTP/Auth quota는 격리 부하 결과로 결정한다.
6. 관리자 권한은 user_metadata가 아니라 server-controlled app_metadata 또는 내부 매핑을 사용해야 한다.
7. SECURITY DEFINER는 private/internal lookup에만 사용하고 PUBLIC execute를 회수해야 한다.

## P1

1. 댓글·게시글 keyset cursor를 RPC 계약으로 고정하고 OFFSET·대형 window를 금지한다.
2. idempotency는 요청 본문 hash와 action/actor를 묶고 진행 중 lease·완료 response·실패 재시도 상태를 구분한다.
3. non-critical side effect는 짧은 transaction outbox queue로 분리하고 `SKIP LOCKED`, retry, DLQ를 사용한다.
4. config/API 장애를 빈 게시판 또는 정상 local mode로 오인시키지 않는다.
5. Edge/DB/API 예산, queue depth/age, rate-limit, auth failure, 5xx를 구조화 로그와 경보 계약으로 남긴다.
6. 10k k6는 운영이 아닌 mock 또는 승인된 staging만 대상으로 한다.

## 정상 경로 증명 대상

- 이메일 가입→확인 callback→아이디 로그인→세션 갱신→비밀번호 복구→로그아웃.
- 노트·북마크·하이라이트 소유자별 upsert/read.
- 댓글/게시글 create/read/update/delete와 익명 비밀번호·회원 소유권.
- 신고·차단·관리자 moderation·감사 보존.
- 타 사용자 row read/write 공격 거부.
- 동일 idempotency key replay가 중복 row를 만들지 않음.
- cursor page 간 누락·중복 없음.

## 과부하 fallback 증명 대상

- guarded: 비핵심 side effect queue/backpressure, 핵심 CRUD 유지.
- severe: 신규 비핵심 write 429/503, 수정·삭제·신고 유지.
- emergency: 명시적 503과 retry-after; 성경 hash shard는 DB 없이 제공.
- 모든 단계에서 오류 UI가 빈 게시판으로 위장되지 않음.

## 감사 판정

- 코드 후보 P0: 구현 및 클라우드 CI 전까지 미판정.
- 운영 배포 P0: 차단 유지.
- 10k 용량 판정: 격리 10k 시험 전 미검증.
