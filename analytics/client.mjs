// 스크립트 이름: CommentBible first-party analytics client
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: consent 기반 회전 ID·bounded outbox·비차단 batch 수집
// 용도: 읽기/가입/글·댓글 흐름을 민감정보 없이 계측
// 사용자 입력 필요: 없음

const SUPABASE_URL='https://rayvvlerwxumqvmodvsy.supabase.co',SUPABASE_KEY='sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
const ENDPOINT=`${SUPABASE_URL}/functions/v1/analytics-ingest`,authClient=window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
const ID_KEY='cb-analytics-identity-v1', OUTBOX_KEY='cb-analytics-outbox-v1', CONSENT_KEY='cb-analytics-consent';
const MAX_OUTBOX=64, MAX_BATCH=20, FLUSH_MS=5000;
const ALLOWED=new Set(['page_view','bible_read','signup_succeeded','login_succeeded','post_created','comment_created','content_updated','content_deleted','report_created','notification_opened','http_error','rate_limited','request_timing','consent_withdrawn']);
let flushTimer=0, flushing=false;
const nativeFetch=window.fetch.bind(window);

function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function identity(){
  const now=Date.now(), old=readJson(ID_KEY,{}), day=new Date(now).toISOString().slice(0,10), oldDay=new Date(old.lastActiveAt||0).toISOString().slice(0,10);
  const visitorExpired=!old.visitorId||now-(old.visitorCreatedAt||0)>=30*86400e3;
  const sessionExpired=visitorExpired||!old.sessionId||now-(old.lastActiveAt||0)>=30*60e3||day!==oldDay;
  const next={visitorId:visitorExpired?crypto.randomUUID():old.visitorId,visitorCreatedAt:visitorExpired?now:old.visitorCreatedAt,sessionId:sessionExpired?crypto.randomUUID():old.sessionId,sessionCreatedAt:sessionExpired?now:old.sessionCreatedAt,lastActiveAt:now};
  writeJson(ID_KEY,next); return next;
}
function coarseDevice(){const width=Math.min(screen.width||9999,innerWidth||9999);return width<768?'mobile':width<1100?'tablet':'desktop'}
function coarseBrowser(){const ua=navigator.userAgent;return /Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Other'}
function cleanPath(value){try{return new URL(value,location.origin).pathname.slice(0,160)}catch{return'/'}}
function cleanProps(input={}){const safe=new Set(['book','chapter','page_kind','board','status','operation','utm_source','utm_medium','utm_campaign','referrer_host']);return Object.fromEntries(Object.entries(input).filter(([key])=>safe.has(key)).map(([key,value])=>[key,String(value??'').slice(0,80)]))}
function consented(){return localStorage.getItem(CONSENT_KEY)!=='denied'}

export function track(eventType,properties={},measurement={}){
  if(!consented()||!ALLOWED.has(eventType))return false;
  const ids=identity(), params=new URLSearchParams(location.search), ref=document.referrer?new URL(document.referrer).hostname:'';
  const event={event_id:crypto.randomUUID(),event_type:eventType,occurred_at:new Date().toISOString(),visitor_id:ids.visitorId,session_id:ids.sessionId,path:cleanPath(location.href),referrer_host:ref,device:coarseDevice(),browser:coarseBrowser(),duration_ms:Number.isFinite(measurement.duration_ms)?Math.min(120000,Math.max(0,Math.round(measurement.duration_ms))):undefined,properties:cleanProps({...properties,utm_source:params.get('utm_source')||'',utm_medium:params.get('utm_medium')||'',utm_campaign:params.get('utm_campaign')||''})};
  const queue=readJson(OUTBOX_KEY,[]); if(queue.length>=MAX_OUTBOX){queue.shift();incrementDrop();} queue.push(event); writeJson(OUTBOX_KEY,queue); schedule(); return true;
}
function incrementDrop(){const state=readJson('cb-analytics-drops-v1',{count:0});state.count=Math.min(1e9,(state.count||0)+1);writeJson('cb-analytics-drops-v1',state)}
async function flush(){
  if(flushing||!consented()||!navigator.onLine)return; const queue=readJson(OUTBOX_KEY,[]);if(!queue.length)return;
  flushing=true;const batch=queue.slice(0,MAX_BATCH);
  try{const drops=readJson('cb-analytics-drops-v1',{count:0}),session=authClient?(await authClient.auth.getSession()).data.session:null,headers={'content-type':'application/json',apikey:SUPABASE_KEY};if(session?.access_token)headers.authorization=`Bearer ${session.access_token}`;const response=await nativeFetch(ENDPOINT,{method:'POST',headers,body:JSON.stringify({events:batch,browser_dropped:drops.count||0}),keepalive:true,credentials:'omit'});if(response.ok){const latest=readJson(OUTBOX_KEY,[]);writeJson(OUTBOX_KEY,latest.filter(item=>!new Set(batch.map(x=>x.event_id)).has(item.event_id)));localStorage.removeItem('cb-analytics-drops-v1')}}
  catch{/* analytics는 핵심 기능을 중단시키지 않는다 */}finally{flushing=false;if(readJson(OUTBOX_KEY,[]).length)schedule()}
}
function schedule(){clearTimeout(flushTimer);flushTimer=setTimeout(flush,FLUSH_MS)}
export async function setAnalyticsConsent(allowed){const ids=identity();localStorage.setItem(CONSENT_KEY,allowed?'granted':'denied');if(!allowed){localStorage.removeItem(OUTBOX_KEY);localStorage.removeItem(ID_KEY);const session=authClient?(await authClient.auth.getSession()).data.session:null,headers={'content-type':'application/json',apikey:SUPABASE_KEY};if(session?.access_token)headers.authorization=`Bearer ${session.access_token}`;nativeFetch(ENDPOINT,{method:'DELETE',headers,body:JSON.stringify({visitor_id:ids.visitorId}),keepalive:true,credentials:'omit'}).catch(()=>{})}}

window.fetch=async function analyticsObservedFetch(input,init={}){const started=performance.now(),requestUrl=String(input?.url||input),method=String(init?.method||input?.method||'GET').toUpperCase();try{const response=await nativeFetch(input,init);if(requestUrl.includes('/analytics-ingest'))return response;const operation=method==='GET'?'read':'write';track('request_timing',{operation,status:String(response.status)},{duration_ms:performance.now()-started});if(response.status===429)track('rate_limited',{operation,status:'429'});else if(response.status>=500)track('http_error',{operation,status:String(response.status)});if(response.ok){if(requestUrl.includes('/auth/v1/signup'))track('signup_succeeded');if(requestUrl.includes('/auth/v1/token')&&requestUrl.includes('grant_type=password'))track('login_succeeded');if(requestUrl.includes('/write-gateway-v5')){try{const body=JSON.parse(String(init?.body||'{}')),type={create_board_post:'post_created',create_discussion_comment:'comment_created',create_member_comment:'comment_created',create_anonymous_comment:'comment_created',update_board_post:'content_updated',update_discussion_comment:'content_updated',update_member_comment:'content_updated',update_anonymous_comment:'content_updated',delete_board_post:'content_deleted',delete_discussion_comment:'content_deleted',delete_member_comment:'content_deleted',delete_anonymous_comment:'content_deleted',report_discussion_target:'report_created',report_discussion_comment:'report_created'}[body.action];if(type)track(type,{operation:'write'})}catch{}}}return response}catch(error){if(!requestUrl.includes('/analytics-ingest'))track('http_error',{operation:method==='GET'?'read':'write',status:'network'});throw error}};

window.CommentBibleAnalytics={track,setConsent:setAnalyticsConsent,flush};
addEventListener('online',flush);addEventListener('pagehide',flush);addEventListener('hashchange',()=>track('page_view',{page_kind:location.hash.slice(1)||'home'}));
document.addEventListener('DOMContentLoaded',()=>track('page_view',{page_kind:document.body.classList.contains('community-page')?'community':'reader'}),{once:true});
document.addEventListener('change',event=>{if(event.target?.id==='bookSelect'||event.target?.id==='chapterSelect')track('bible_read',{book:document.getElementById('bookSelect')?.selectedOptions?.[0]?.textContent||'',chapter:document.getElementById('chapterSelect')?.value||''})});

// 스크립트 끝 — CommentBible first-party analytics client 1.0.0
