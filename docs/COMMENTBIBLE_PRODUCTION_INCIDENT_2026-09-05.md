# CommentBible 운영 댓글 장애 preflight — 2026-09-05

## 판정

- 운영 배포: **금지 유지**
- 운영 mutation: **0**
- 공개 사이트: `https://commentbible.com/` HTTP 200
- 공개 runtime: `mode=normal`, `dynamicReads=true`, `writes=true`, `auth=true`
- 배포 JavaScript: `write-gateway-v4` 호출
- 운영 Supabase ref: `rayvvlerwxumqvmodvsy`
- 운영 Supabase REST/Edge: HTTP 502, `connection refused`
- 브라우저 재현: Genesis 1:1에서 `unified comments select failed`; 화면은 `댓글 서버 연결을 확인해주세요. 잠시 후 다시 시도해 주세요.` 표시
- 자동 preflight 재검증: `2026-09-05T15:55:44.312Z`, site 200, API 502, gateway 502, 공개 3개 relation count 모두 미확인, mutation 0

정적 Worker는 열리지만 동적 Supabase origin이 도달 불가다. 같은 작업 환경에서 연결된 활성 Supabase 프로젝트는 REST root에 정상적인 HTTP 401을 반환하므로, 일반 인터넷 또는 Supabase 전체 장애로 분류하지 않는다. 현재 증거로는 운영 프로젝트가 다른 계정에 있거나 비활성·삭제·이전된 상태를 구분할 수 없다.

## 데이터 보존 체크포인트

기존 데이터에 접근할 수 없어 아래 값은 억지로 0으로 기록하지 않고 `미확인`으로 보존한다.

| 항목 | 결과 |
|---|---|
| 회원 수 | 미확인 — Auth/DB 접근 불가 |
| 게시글 수 | 미확인 — REST 502 |
| 절·게시글 댓글/답글 수 | 미확인 — REST 502 |
| 표본 게시글/댓글/사용자 ID | 미확인 — 조회 불가 |
| DB 백업/PITR 체크포인트 | 미확인 — 프로젝트 권한 없음 |
| Cloudflare rollback 기준 | 과거 기록 `d2edb34e-d960-49cc-bc24-81c99874d1ed`; 현재 배포와 동일한지 미확인 |
| GitHub 기준 | `main@f38005f2370369b846cd359bea6fc76fdbc00b82` |

데이터 수가 미확인인 상태에서 신규 Supabase 프로젝트 생성, 스키마 초기화, v5 전체 SQL 적용, Cloudflare origin 교체를 하면 기존 데이터를 고립시키거나 덮어쓸 수 있으므로 금지한다.

## 최신 보안 재감사

기존 v5 후보는 운영 배포 가능한 v6가 아니다. 아래 P0/P1이 코드 또는 실제 catalog 검증 없이 남아 있다.

### P0

1. 운영 프로젝트와 기존 데이터 백업/롤백 지점을 읽을 권한이 없다.
2. `write-gateway-v5` CORS가 `*`이고 Turnstile secret이 없을 때 `REQUIRE_TURNSTILE=false`이면 익명 쓰기가 fail-open 된다.
3. 익명 actor가 클라이언트 `localStorage` ID 그대로이며 서버 서명·만료 검증이 없다.
4. Turnstile 검증이 expected hostname/action/cData와 결합되지 않았고 frontend site key fail-closed 경로가 없다.
5. PUBLIC/service_role EXECUTE, 함수 owner, RLS/FORCE RLS, 실제 RPC 반환형을 운영 catalog에서 검증하지 못했다.

### P1

1. `cf-connecting-ip`, `x-real-ip`, 첫 번째 `x-forwarded-for`를 무조건 신뢰해 IP quota 우회 가능성이 있다.
2. idempotency `expires_at`가 claim 재획득에 사용되지 않고, transient/429/완료 실패의 재시도 상태 전이가 불완전하다.
3. RPC가 `false`를 반환해도 성공으로 포장할 수 있다.
4. 실제 PostgreSQL/RLS/RPC/Edge 통합 및 회원·익명·타 사용자 거부 smoke가 실행되지 않았다.

따라서 P0/P1=0 조건을 충족하지 못했고 canary/운영 적용을 수행하지 않았다.

## 다음 실행 순서

1. ChatGPT Work에 `rayvvlerwxumqvmodvsy`를 소유한 Supabase 계정을 연결한다.
2. Cloudflare 연결에서 `commentbible.com` zone과 현재 Worker version을 읽기 전용 확인한다.
3. 회원·게시글·댓글/답글 수와 표본 ID, migrations/functions/catalog ACL/RLS/owner를 기록한다.
4. Supabase backup/PITR 또는 논리 백업과 Cloudflare Worker rollback version을 확정한다.
5. 실제 schema에 맞춘 최소 migration과 Edge 수정만 staging/dry-run 한다.
6. 독립 P0/P1 재감사 후 0일 때만 canary를 적용하고 SMOKE 데이터는 soft-delete 보관한다.

## 재현 명령

```bash
npm run preflight:production
npm run test:production-preflight
```

preflight는 공개 배포 자산에서 publishable 연결값을 메모리로만 읽으며 출력하지 않는다. 등록되지 않은 action만 gateway에 보내 DB 쓰기 전에 거부되도록 하므로 콘텐츠 mutation 수는 0이다.

## 이번 branch 검증

- 전체 무네트워크 Node 회귀: 21/21 PASS
- 새 production preflight 단위 테스트: 3/3 PASS(21개에 포함)
- 기존 full-function 정적 게이트: PASS
- 기존 admin-insights 정적 게이트: PASS
- 새 파일 Node syntax: PASS
- `package.json` parse: PASS
- `git diff --check`: PASS
- UTF-8·헤더·푸터·민감정보 후보 검사: 3/3 PASS
- 실제 PostgreSQL/RLS/RPC/Edge/회원·익명 smoke: NOT RUN — 운영 프로젝트 접근 불가
