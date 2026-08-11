# CommentBible production deployment manifest — 2026-08-11

Status: deployed to the production Cloudflare Worker on 2026-08-11.

Production version: `d2edb34e-d960-49cc-bc24-81c99874d1ed`.

The public runtime is intentionally in surge read-only mode. Bible navigation stays available from hashed Cloudflare assets while authentication, dynamic comment/board reads, and all writes are disabled.

## Required asset mapping

| Repository source | Production path |
|---|---|
| `production-candidate/reader-app.js` | `/reader-app.js` |
| `production-candidate/community.js` | `/community.js` |
| `data/manifest.json` | `/data/manifest.json` |
| `data/books/*` | `/data/books/*` |
| `data/runtime-config.json` | `/data/runtime-config.json` |
| `_headers` | deployment root `/_headers` |

Keep `/data/bible-kor.json` and `/data/bible-kor-file.js` during the first release. They are the loader fallback and make rollback non-destructive.

## Already-applied backend dependencies

- `request_rate_limits`, `request_idempotency`, and their service-only functions.
- Read, sort, Bible-search, and board-search indexes recorded under `supabase/audits/2026-08-11_*`.
- `login-by-username`, retired `check-signup-availability`, and `write-gateway-v3` Edge Functions. Surge-aware clients use `write-gateway-v4` after its deployment verification.

The candidate frontend explicitly calls `write-gateway-v4`. Do not deploy it until v4 has passed the same anonymous and authenticated tests as v3.

## Canary smoke tests

1. `/data/manifest.json` returns 200 and `max-age=0, must-revalidate`.
2. A content-hash `/data/books/*` file returns 200 and one-year immutable cache.
3. First reader entry downloads the manifest and one current book, not the 4.91MB full JSON.
4. Move across a book boundary, open today's verse, search a reference, and search a two-character Korean phrase.
5. Open boards with latest/recommended/comments/views sorts; load more than 100 posts and more than 100 comments without duplicates.
6. Anonymous and authenticated comment creation succeeds once; a repeated idempotency key does not duplicate content.
7. Invalid login returns 401; burst login returns 429; no credentials or tokens appear in logs.
8. HTML and fixed-name JS/CSS revalidate after a release. Hashed book shards remain immutable.

## Rollback

- Restore `/reader-app.js` and `/community.js` from `recovered-production/2026-08-09/`.
- Restore the previous `/_headers` artifact.
- Leave content-hash book shards in place; they are unreferenced after manifest rollback and do not affect runtime.
- Keep the additive database objects and indexes unless a measured regression requires a separately reviewed rollback. Do not drop them during frontend rollback.

## Unannounced surge mode

When a large influx cannot be load-tested beforehand, availability takes priority over dynamic features:

1. Replace deployed `data/runtime-config.json` with `data/runtime-config.surge.json` content.
2. Set the `write-gateway-v4` secret `SURGE_READ_ONLY=true`.
3. Purge only `/data/runtime-config.json`; its normal edge/browser TTL is 30 seconds.
4. Confirm Bible navigation and all 66 hashed shards remain available from Cloudflare while Auth, comments, and board writes are disabled.
5. Restore normal config and set `SURGE_READ_ONLY=false` only after DB CPU, connections, locks, and 5xx have stabilized.

The candidate currently ships `data/runtime-config.json` in surge mode intentionally. `data/runtime-config.normal.json` is the reviewed restore template.

This mode is a graceful-degradation control, not proof that unrestricted dynamic traffic can handle tens of thousands of simultaneous users.
