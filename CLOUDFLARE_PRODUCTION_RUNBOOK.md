# Cloudflare Production Runbook

- 상태: `candidate` — zone 읽기 권한과 staging 검증 전
- 대상: CommentBible production

## P0 적용 순서

1. Cloudflare Dashboard에서 현재 zone 설정을 export하거나 화면별 값을 기록한다.
2. SSL/TLS mode가 `Full (strict)`인지 확인한다.
3. `Always Use HTTPS`를 활성화하고 HTTP 요청이 HTTPS 301/308로 이동하는지 확인한다.
4. HTTP redirect 확인 후 `_headers`의 1일 HSTS를 staging/canary에 적용한다.
5. 모든 사용 중인 subdomain의 HTTPS를 확인한 뒤 HSTS를 30일, 이후 6~12개월로 단계 확대한다.
6. `includeSubDomains`와 preload는 별도 승인 전 적용하지 않는다.

## Cache Rules

| 경로 | Browser TTL | Edge TTL | 비고 |
|---|---:|---:|---|
| HTML 및 `/` | 0, revalidate | 5분 이하 | 배포 전환을 빠르게 반영 |
| version query가 있는 JS/CSS | 1년 immutable | 1년 | 배포마다 version 변경 필수 |
| `/data/bible-kor.json` | 1시간 + stale | 1일 | content-hash 파일 전환 전 임시값 |
| Supabase 동적 API | cache 금지 | cache 금지 | 사용자/권한 데이터 포함 |

성경 데이터를 content-hash 또는 권/장 단위 파일로 바꾼 뒤에만 1년 immutable을 적용한다.

## WAF와 Rate Limit

- 로그인, 댓글, 게시글, 반응, 신고 endpoint별 rule을 분리한다.
- 처음 24~72시간은 managed challenge/log 중심으로 false positive를 확인한다.
- Supabase 도메인으로 직접 전송되는 요청은 이 zone WAF를 통과하지 않는다. 쓰기와 로그인은 first-party Worker/API gateway 또는 Supabase 내부 rate limit이 필요하다.
- key는 IP 하나만 사용하지 않고 IP + user + target + 짧은 시간창을 조합한다.

## 검증 및 롤백

```text
HTTP / -> 301 또는 308 -> HTTPS /
HTTPS / -> HSTS 존재
HTML -> max-age=0
versioned JS/CSS -> max-age=31536000, immutable
동적 API -> Cache-Control private/no-store
```

- redirect 장애: `Always Use HTTPS`를 이전 값으로 복원한다.
- header/CSP 장애: 직전 `_headers` artifact로 rollback한다.
- cache 오염: 해당 release URL purge 후 직전 release hash를 재배포한다.
- HSTS는 브라우저에 남으므로 긴 max-age 적용 전 rollback drill을 완료한다.
