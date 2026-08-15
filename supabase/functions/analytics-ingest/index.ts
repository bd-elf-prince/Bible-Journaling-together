// 스크립트 이름: CommentBible analytics ingest Edge Function
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: HMAC 비식별화·bounded batch·dedupe·privacy withdrawal
// 용도: 핵심 기능과 분리된 first-party 이벤트 수집
// 사용자 입력 필요: ANALYTICS_HMAC_KEY, 허용 Origin
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MAX_BYTES=24_576,MAX_BATCH=20,EVENTS=new Set(['page_view','bible_read','signup_succeeded','login_succeeded','post_created','comment_created','content_updated','content_deleted','report_created','notification_opened','http_error','rate_limited','request_timing','consent_withdrawn']);
const FORBIDDEN=/(password|token|authorization|cookie|content|comment|body|raw_?ip|user_?agent|latitude|longitude)/i;
const SAFE_PROPS=new Set(['book','chapter','page_kind','board','status','operation','utm_source','utm_medium','utm_campaign','referrer_host']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder=new TextEncoder();
function origin(req:Request){const incoming=req.headers.get('origin')||'',allowed=(Deno.env.get('ANALYTICS_ALLOWED_ORIGINS')||'').split(',').map(x=>x.trim()).filter(Boolean);return allowed.includes(incoming)?incoming:(allowed[0]||'null')}
function json(req:Request,status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':origin(req),'access-control-allow-headers':'authorization, apikey, content-type','access-control-allow-methods':'POST, DELETE, OPTIONS','vary':'Origin'}})}
async function hmac(value:string,keyText:string){const key=await crypto.subtle.importKey('raw',encoder.encode(keyText),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=await crypto.subtle.sign('HMAC',key,encoder.encode(value));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
function clean(value:unknown,max=120){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,max)}
function path(value:unknown){try{return new URL(String(value),'https://commentbible.invalid').pathname.slice(0,160)}catch{return'/'}}
async function verifiedUser(req:Request,url:string,anonKey:string){const auth=req.headers.get('authorization')||'';if(!auth.toLowerCase().startsWith('bearer '))return null;const client=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:auth}}});const {data,error}=await client.auth.getUser();return error?null:data.user?.id||null}

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:{'access-control-allow-origin':origin(req),'access-control-allow-headers':'authorization, apikey, content-type','access-control-allow-methods':'POST, DELETE, OPTIONS','vary':'Origin'}});
  if(!['POST','DELETE'].includes(req.method))return json(req,405,{error:'method_not_allowed'});
  try{
    const text=await req.text();if(encoder.encode(text).byteLength>MAX_BYTES)return json(req,413,{error:'request_too_large'});const body=JSON.parse(text||'{}');
    const url=Deno.env.get('SUPABASE_URL'),service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY'),hmacKey=Deno.env.get('ANALYTICS_HMAC_KEY');if(!url||!service||!anon||!hmacKey)throw new Error('missing_server_configuration');
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),userId=await verifiedUser(req,url,anon);
    const ip=clean(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown',80),ipDigest=await hmac(`rate:${ip}`,hmacKey);
    const rate=await admin.rpc('cb_consume_analytics_rate_limit',{p_subject_digest:ipDigest,p_limit:120,p_window_seconds:60});if(rate.error)throw new Error('rate_limit_unavailable');if(!rate.data)return json(req,429,{error:'too_many_requests'});
    if(req.method==='DELETE'){
      if(!uuid.test(String(body.visitor_id||'')))return json(req,400,{error:'invalid_visitor'});const visitorHash=await hmac(`visitor:${body.visitor_id}`,hmacKey);const result=await admin.rpc('cb_withdraw_analytics_consent',{p_visitor_hash:visitorHash,p_user_id:userId});if(result.error)throw new Error('withdraw_failed');return json(req,202,{deleted:true});
    }
    if(!Array.isArray(body.events)||body.events.length>MAX_BATCH)return json(req,400,{error:'invalid_batch'});
    const country=/^[A-Z]{2}$/.test(req.headers.get('cf-ipcountry')||'')?req.headers.get('cf-ipcountry'):'ZZ';const normalized=[];
    for(const event of body.events){
      if(!uuid.test(String(event?.event_id||''))||!EVENTS.has(String(event?.event_type||''))||!uuid.test(String(event?.visitor_id||''))||!uuid.test(String(event?.session_id||'')))continue;
      const occurred=new Date(event.occurred_at);if(!Number.isFinite(occurred.getTime())||Math.abs(Date.now()-occurred.getTime())>7*86400e3)continue;
      const props=event.properties&&typeof event.properties==='object'&&!Array.isArray(event.properties)?event.properties:{};if(Object.keys(props).some(key=>FORBIDDEN.test(key)))continue;
      normalized.push({event_id:event.event_id,event_type:event.event_type,occurred_at:occurred.toISOString(),visitor_hash:await hmac(`visitor:${event.visitor_id}`,hmacKey),session_hash:await hmac(`session:${event.session_id}`,hmacKey),path:path(event.path),referrer_host:clean(event.referrer_host,120),device:['mobile','tablet','desktop','other'].includes(event.device)?event.device:'other',browser:['Chrome','Safari','Firefox','Edge','Other'].includes(event.browser)?event.browser:'Other',country,duration_ms:Number.isFinite(event.duration_ms)?Math.max(0,Math.min(120000,Math.round(event.duration_ms))):null,properties:Object.fromEntries(Object.entries(props).filter(([key])=>SAFE_PROPS.has(key)).map(([key,value])=>[key,clean(value,80)]))});
    }
    const dropped=Math.max(0,Math.min(10_000,Number(body.browser_dropped)||0));const result=await admin.rpc('cb_ingest_analytics_events',{p_events:normalized,p_user_id:userId,p_browser_dropped:dropped});if(result.error)throw new Error('ingest_failed');return json(req,202,result.data||{accepted:0});
  }catch(error){console.error('analytics-ingest failed',error instanceof Error?error.message:'unknown_error');return json(req,500,{error:'analytics_unavailable'})}
});
// 스크립트 끝 — CommentBible analytics ingest Edge Function 1.0.0
