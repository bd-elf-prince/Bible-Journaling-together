# Recovered Production Artifact Manifest

- 상태: `candidate` — 공개 배포물 복구본
- 복구일: 2026-08-09 (Asia/Seoul)
- 원본: `https://commentbible.com/`
- 목적: Git에 없던 운영 source를 비파괴로 보존하고 source-of-truth 복구의 기준으로 사용

## 포함 파일

| 파일 | 운영 version |
|---|---|
| `index.html` | 2026-08-02 reader 자산 참조 |
| `community.html` | 2026-08-02 author/time layout |
| `admin.html` | 2026-08-02 admin |
| `reader-app.js` | `20260802-pc-book-density-01` |
| `reader-app.css` | `20260802-pc-book-density-01` |
| `community.js` | `20260802-author-time-layout-01` |
| `community.css` | `20260802-author-time-layout-01` |
| `admin.js` | `20260802-author-time-layout-01` |
| `admin.css` | `20260802-admin-01` |

## 무결성 검증

- 모든 파일을 운영 URL에서 UTF-8로 읽었다.
- UTF-8 BOM과 CRLF를 정규화한 뒤 운영 원본과 문자 단위로 비교했다.
- 9개 파일 모두 복구본에 마지막 LF 한 글자만 추가됐고 그 전까지 첫 차이 없음이 확인됐다.
- 공개 publishable 설정은 운영 artifact의 일부로만 보존한다. 서버 비밀키는 발견되지 않았다.

## 제한

- `data/bible-kor.json`은 기존 저장소 `data/bible-kor.json`과 운영 응답의 byte size가 같아 중복 복사하지 않았다. 배포 전 SHA-256을 다시 비교한다.
- Edge Function 본문, DB schema, Cloudflare dashboard 설정은 공개 정적 artifact에 포함되지 않는다.
- 이 디렉터리를 곧바로 배포하지 않는다. 운영 기능·RLS·API 계약을 staging에서 먼저 검증한다.
