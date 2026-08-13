# Edge Function production changes — 2026-08-11

- `login-by-username`: deployed indexed username lookup, bounded request body, generic credential errors, and IP/username rate limits.
- `login-by-username` verification: nonexistent credentials returned `401`; the eleventh repeated username attempt returned `429` with a 300-second retry window.
- `check-signup-availability`: replaced the unused O(N) Auth-user scan with a `410 endpoint_retired` response. The frontend continues to use the indexed `check_member_identity_availability` RPC.
- `write-gateway-v3`: deployed with legacy JWT verification disabled because the function implements custom user-JWT validation and supports anonymous writes.
- `write-gateway-v3` verification: an anonymous request without an actor returned `400 invalid_actor`; a complete but intentionally invalid anonymous RPC payload reached PostgREST and returned the expected application error without creating content.
- `write-gateway-v4`: deployed the v3 controls plus a DB-before-entry `SURGE_READ_ONLY` emergency switch. Legacy JWT verification is disabled because custom JWT validation and anonymous actors are handled in the function.
- `SURGE_READ_ONLY` is currently enabled for v4. Verification returned `503 surge_read_only` from v4 while the same actor-less request still returned `400 invalid_actor` from v3, proving rollback isolation.
- `write-gateway`, `write-gateway-v2`, and `write-gateway-v3` remain temporarily deployed as rollback candidates. The surge-mode frontend candidate targets only `write-gateway-v4`.
