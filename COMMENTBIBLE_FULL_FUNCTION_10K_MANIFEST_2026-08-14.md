# CommentBible full-function 10k candidate manifest — 2026-08-14

- branch: `codex/full-function-10k-candidate`
- status: CODE CANDIDATE PASS / DEPLOYMENT NOT RUN
- runtime candidate: normal (auth/read/write enabled)
- gateway: additive `write-gateway-v5`
- offline E2E: 8/8 PASS
- code audit: OPEN P0 0 / P1 0
- 10k: deterministic model PASS, staging measurement pending
- 50k: single connection budget FAIL; scale-out required

## 핵심 산출물
- `candidate/full-function-10k/runtime.mjs`
- `candidate/full-function-10k/optimistic.mjs`
- `tests/full-function-10k.e2e.test.mjs`
- `tests/full-function-load-model.test.mjs`
- `supabase/candidates/full_function_10k_candidate.sql`
- `supabase/functions/write-gateway-v5/index.ts`
- `docs/COMMENTBIBLE_FULL_FUNCTION_10K_RESULT_2026-08-14.md`
- `docs/COMMENTBIBLE_P0_P1_AUDIT_2026-08-14.md`

main/force push/실배포/실키/실개인정보/결제/파괴 변경: 0.
