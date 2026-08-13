# CommentBible 10k 용량 모델과 부하 예산

## 동시 사용자 모델

목표 동시 세션 10,000명을 다음과 같이 모델링한다.

| 사용자 행위 | 비율 | 사용자 수 | 평균 빈도 | 목표 요청률 |
|---|---:|---:|---:|---:|
| 정적 성경 읽기/장 이동 | 70% | 7,000 | 20초당 1회 | 350 RPS, CDN |
| 댓글·게시판 읽기/검색 | 20% | 2,000 | 10초당 1회 | 200 RPS, API |
| Auth/세션 갱신 | 5% | 500 | 60초당 1회 | 8.4 RPS 평균, burst 100 RPS |
| 댓글·게시글·노트 쓰기 | 4% | 400 | 30초당 1회 | 13.4 RPS 평균, burst 100 RPS |
| 관리자·신고 | 1% | 100 | 60초당 1회 | 1.7 RPS 평균, burst 20 RPS |

정적 성경 요청은 Cloudflare content-hash asset에서 처리하고 DB budget에 포함하지 않는다. 동적 정상 목표는 평균 약 225 RPS, 60초 burst 500 RPS다.

## SLO와 budget

- 정적 성경: p95 250ms, p99 750ms, 5xx < 0.01%.
- 동적 read: p95 500ms, p99 1200ms, 5xx < 0.1%.
- write: p95 800ms, p99 1500ms, 중복 생성 0.
- Auth: p95 1000ms, p99 2000ms; 429는 명시적으로 분리 집계.
- DB: CPU 지속 < 70%, connection 사용 < 70%, lock wait p99 < 100ms.
- queue: depth 안정, oldest age < 30초, DLQ 신규 메시지 0.
- circuit breaker: 5분 창에서 DB/API 5xx ≥ 2% 또는 p99 > 2초가 3분 지속하면 guarded; ≥ 5% 또는 connection ≥ 85%면 severe; 정적 성경 위험 또는 DB unavailable이면 emergency.

## Supabase 공식 문서 반영

- Edge/serverless DB 연결은 Supavisor transaction mode를 사용하며 prepared statements를 끈다.
- direct connection은 migration/backup/장기 세션에만 사용한다.
- Auth 429를 정상적인 제한 응답으로 처리하고 CAPTCHA/custom SMTP/이메일 발송 quota를 별도 검증한다.
- RLS 정책에서 `(select auth.uid())`와 소유권 index를 사용한다.
- 새 테이블의 Data API 자동 노출 변경에 의존하지 않고 필요한 GRANT를 명시한다.
- Supabase Queues 또는 동등한 Postgres outbox는 보조 side effect에만 사용한다. 사용자 CRUD 성공을 비동기 queue 성공으로 가장하지 않는다.

## k6 단계

1. PR smoke: mock adapter 50 VU, 30초.
2. isolated soak: 1k→5k→10k VU, 각 5분 ramp + 15분 steady.
3. fault injection: DB latency 500ms, 2%/5% 오류, queue worker 중단, Auth 429.
4. 승인된 staging: synthetic 계정만 사용, 운영 URL 거부 guard 활성.
5. 10k 판정은 staging의 API/DB/Edge/queue 지표가 모두 budget 안일 때만 PASS.
