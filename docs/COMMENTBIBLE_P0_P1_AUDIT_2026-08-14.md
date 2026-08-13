# CommentBible 후보 독립 P0/P1 감사 — 2026-08-14

## 1차 발견과 조치

| 등급 | 발견 | 조치 | 재검증 |
|---|---|---|---|
| P0 | 개인 기록 gateway가 존재 미확인 RPC를 가정 | 인증 caller client가 `user_verse_marks`를 RLS 아래 upsert | PASS |
| P0 | frontend는 v4를 호출하지만 repo source 경로는 버전이 없음 | additive `write-gateway-v5` 고정 | PASS |
| P1 | guarded/severe가 queue 없이 202 반환 | bounded/deduplicated `cb_outbox` enqueue | PASS |
| P1 | 서버 장애가 로컬 성공처럼 보임 | unavailable fail-closed UI | PASS |
| P1 | optimistic 실패 rollback 증거 없음 | commit/rollback fixture 추가 | PASS |

## 최종 판정

- 후보 코드 OPEN P0: 0
- 후보 코드 OPEN P1: 0
- 배포 게이트: OPEN. 실제 schema 적용·SQL 실행·staging 부하 실측이 없으므로 운영 활성화 금지.
