// 스크립트 이름: CommentBible 관리자 인사이트 정적 게이트
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: 화면·민감정보·ACL/RLS·보존·비차단 수집 검사
// 용도: PR candidate 정적 검증
// 사용자 입력 필요: 없음
import {readFile}from'node:fs/promises';const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8'),assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const [html,ui,client,ingest,admin,sql]=await Promise.all(['admin/insights/index.html','admin/insights/insights.js','analytics/client.mjs','supabase/functions/analytics-ingest/index.ts','supabase/functions/admin-insights/index.ts','supabase/candidates/admin_insights_candidate.sql'].map(read));
for(const token of ['지금 접속','오늘 방문자','시간대별 방문 추이','방문자 기록','권한이 없습니다','CSV 내보내기'])assert((html+ui).includes(token),`화면 누락: ${token}`);
for(const token of ['MAX_OUTBOX=64','MAX_BATCH=20','crypto.randomUUID','nativeFetch','analyticsObservedFetch','browser_dropped'])assert(client.includes(token),`client contract 누락: ${token}`);
assert(!client.includes('localStorage.setItem("password"'),'password 저장 금지');assert(!html.includes('innerHTML'),'dashboard innerHTML 금지');
for(const token of ['ANALYTICS_HMAC_KEY','MAX_BATCH=20','cf-ipcountry','SAFE_PROPS','cb_consume_analytics_rate_limit','cb_ingest_analytics_events'])assert(ingest.includes(token),`ingest contract 누락: ${token}`);
for(const token of ['auth.getUser','cb_is_insights_admin','csvCell','formula','private, no-store'])assert(admin.includes(token)||token==='formula'&&admin.includes('/^[=+\\-@'),`admin contract 누락: ${token}`);
const lower=sql.toLowerCase();for(const token of ['partition by range','enable row level security','force row level security','private.cb_has_insights_access','revoke all','service_role','event_id uuid primary key','30 days','760','privacy_tombstones','pg_advisory_xact_lock'])assert(lower.includes(token),`SQL contract 누락: ${token}`);
for(const forbidden of ['raw_ip','latitude','longitude','user_agent','password','comment_content'])assert(!new RegExp(`\\b${forbidden}\\s+(?:text|jsonb|inet|varchar)\\b`,'i').test(sql),`민감 컬럼 의심: ${forbidden}`);
assert(ui.includes('textContent')&&!ui.includes('innerHTML'),'XSS-safe DOM rendering 필요');console.log(JSON.stringify({status:'passed',route:'/admin/insights/',collection:'bounded-fail-open',acl:'server-dynamic',retention:'raw30/session30/rollup760'},null,2));
// 스크립트 끝 — CommentBible 관리자 인사이트 정적 게이트 1.0.0
