// 스크립트 이름: CommentBible 관리자 인사이트 오프라인 런타임
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: 비식별 이벤트, 중복 제거, cursor 페이지네이션, 보존·rollup 모델
// 용도: 원격 DB 없이 analytics 보안/정합성 테스트
// 사용자 입력 필요: 없음

import { createHash, randomUUID } from 'node:crypto';

export const RAW_RETENTION_DAYS = 30;
export const ROLLUP_RETENTION_DAYS = 760;
export const MAX_BATCH = 20;
export const MAX_OUTBOX = 64;
export const ALLOWED_EVENTS = new Set([
  'page_view','bible_read','signup_succeeded','login_succeeded','post_created',
  'comment_created','content_updated','content_deleted','report_created',
  'notification_opened','http_error','rate_limited','request_timing','consent_withdrawn'
]);

const FORBIDDEN_KEYS = /(?:password|token|authorization|cookie|content|comment|body|raw_?ip|user_?agent|latitude|longitude)/i;
const SAFE_PROP_KEYS = new Set(['book','chapter','page_kind','board','status','operation','utm_source','utm_medium','utm_campaign','referrer_host']);
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const hash = value => createHash('sha256').update(`candidate-only-key:${value}`).digest('hex');
const cleanText = (value, max = 120) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
const safePath = value => {
  try { const url = new URL(String(value), 'https://commentbible.invalid'); return url.pathname.slice(0, 160); }
  catch { return '/'; }
};

export function sanitizeEvent(input, receivedAt = new Date()) {
  if (!input || !uuid(input.event_id) || !ALLOWED_EVENTS.has(input.event_type)) throw new Error('invalid_event');
  const occurred = new Date(input.occurred_at);
  if (!Number.isFinite(occurred.getTime()) || Math.abs(receivedAt - occurred) > 7 * 86400_000) throw new Error('invalid_time');
  const sourceProps = input.properties && typeof input.properties === 'object' ? input.properties : {};
  for (const key of Object.keys(sourceProps)) if (FORBIDDEN_KEYS.test(key)) throw new Error('sensitive_property');
  const properties = Object.fromEntries(Object.entries(sourceProps)
    .filter(([key]) => SAFE_PROP_KEYS.has(key))
    .map(([key, value]) => [key, cleanText(value, 80)]));
  return {
    event_id: input.event_id,
    event_type: input.event_type,
    occurred_at: occurred.toISOString(),
    visitor_hash: hash(cleanText(input.visitor_id, 80)),
    session_hash: hash(cleanText(input.session_id, 80)),
    user_hash: input.user_id ? hash(cleanText(input.user_id, 80)) : null,
    path: safePath(input.path),
    referrer_host: cleanText(input.referrer_host, 120),
    device: ['mobile','tablet','desktop','other'].includes(input.device) ? input.device : 'other',
    browser: ['Chrome','Safari','Firefox','Edge','Other'].includes(input.browser) ? input.browser : 'Other',
    country: /^[A-Z]{2}$/.test(input.country || '') ? input.country : 'ZZ',
    duration_ms: Number.isFinite(input.duration_ms) ? Math.max(0, Math.min(120_000, Math.round(input.duration_ms))) : null,
    properties
  };
}

export class AnalyticsStore {
  constructor({ admins = [] } = {}) {
    this.admins = new Set(admins);
    this.events = new Map();
    this.dropCount = 0;
    this.rollups = new Map();
    this.tombstones = new Set();
  }

  authorize(context) {
    if (!context?.verifiedUserId || !this.admins.has(context.verifiedUserId)) throw new Error('forbidden');
    return true;
  }

  ingest(batch, now = new Date()) {
    if (!Array.isArray(batch) || batch.length > MAX_BATCH) throw new Error('invalid_batch');
    let accepted = 0, duplicate = 0, rejected = 0;
    for (const candidate of batch) {
      try {
        const event = sanitizeEvent(candidate, now);
        if (this.tombstones.has(event.visitor_hash)) { rejected++; continue; }
        if (this.events.has(event.event_id)) { duplicate++; continue; }
        this.events.set(event.event_id, event); accepted++;
      } catch { rejected++; }
    }
    return { accepted, duplicate, rejected };
  }

  recordDropped(count = 1) { this.dropCount += Math.max(0, Math.floor(count)); }

  withdraw(visitorId) {
    const visitorHash = hash(visitorId);
    this.tombstones.add(visitorHash);
    for (const [id, event] of this.events) if (event.visitor_hash === visitorHash) this.events.delete(id);
  }

  rollupAndRetain(now = new Date()) {
    const rawCutoff = now.getTime() - RAW_RETENTION_DAYS * 86400_000;
    const rollupCutoff = now.getTime() - ROLLUP_RETENTION_DAYS * 86400_000;
    for (const [id, event] of this.events) {
      const time = new Date(event.occurred_at).getTime();
      if (time >= rawCutoff) continue;
      const day = event.occurred_at.slice(0, 10);
      const key = `${day}:${event.event_type}`;
      const row = this.rollups.get(key) || { day, event_type:event.event_type, count:0, visitors:new Set(), sessions:new Set() };
      row.count++; row.visitors.add(event.visitor_hash); row.sessions.add(event.session_hash);
      this.rollups.set(key, row); this.events.delete(id);
    }
    for (const [key, row] of this.rollups) if (new Date(`${row.day}T00:00:00Z`).getTime() < rollupCutoff) this.rollups.delete(key);
  }

  queryVisitors(context, { from, to, event, source, login = 'all', cursor, limit = 25 } = {}) {
    this.authorize(context);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
    const grouped = new Map();
    const events = [...this.events.values()].sort((a,b)=>b.occurred_at.localeCompare(a.occurred_at)||b.event_id.localeCompare(a.event_id));
    for (const item of events) {
      if (from && item.occurred_at < from || to && item.occurred_at >= to) continue;
      if (event && item.event_type !== event || source && item.referrer_host !== source) continue;
      if (login === 'yes' && !item.user_hash || login === 'no' && item.user_hash) continue;
      const key = item.session_hash;
      const row = grouped.get(key) || { session_id:key.slice(0,12), visitor_id:item.visitor_hash.slice(0,12), logged_in:Boolean(item.user_hash), masked_user:item.user_hash ? `usr_${item.user_hash.slice(0,8)}` : '—', first_path:item.path, last_path:item.path, pageviews:0, actions:0, source:item.referrer_host || 'direct', device:item.device, country:item.country, first_at:item.occurred_at, last_at:item.occurred_at };
      if (item.occurred_at < row.first_at) { row.first_at=item.occurred_at; row.first_path=item.path; }
      if (item.occurred_at > row.last_at) { row.last_at=item.occurred_at; row.last_path=item.path; }
      if (item.event_type === 'page_view') row.pageviews++; else row.actions++;
      grouped.set(key,row);
    }
    let rows=[...grouped.values()].sort((a,b)=>b.last_at.localeCompare(a.last_at)||b.session_id.localeCompare(a.session_id));
    if (cursor) rows=rows.filter(row=>`${row.last_at}|${row.session_id}` < cursor);
    const page=rows.slice(0,safeLimit);
    return { rows:page, next_cursor:rows.length>safeLimit ? `${page.at(-1).last_at}|${page.at(-1).session_id}` : null, dropped:this.dropCount };
  }
}

export class BoundedOutbox {
  constructor(send, max = MAX_OUTBOX) { this.send=send; this.max=max; this.queue=[]; this.dropped=0; }
  push(event) { if (this.queue.length >= this.max) { this.queue.shift(); this.dropped++; } this.queue.push(event); }
  async flush() {
    const batch=this.queue.slice(0,MAX_BATCH); if (!batch.length) return {sent:0};
    const result=await this.send(batch);
    if (result?.ok) this.queue.splice(0,batch.length);
    return {sent:result?.ok ? batch.length : 0, queued:this.queue.length, dropped:this.dropped};
  }
}

export function rotateIdentity(state, now = Date.now()) {
  const visitorExpired=!state?.visitorId || now-(state.visitorCreatedAt||0)>=30*86400_000;
  const sessionExpired=visitorExpired || !state?.sessionId || now-(state.lastActiveAt||0)>=30*60_000 || new Date(now).toISOString().slice(0,10)!==new Date(state.lastActiveAt||0).toISOString().slice(0,10);
  return { visitorId:visitorExpired?randomUUID():state.visitorId, visitorCreatedAt:visitorExpired?now:state.visitorCreatedAt, sessionId:sessionExpired?randomUUID():state.sessionId, sessionCreatedAt:sessionExpired?now:state.sessionCreatedAt, lastActiveAt:now };
}

export function csvCell(value) { const text=String(value??'').replace(/\r?\n/g,' '); return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text; }
export function escapeHtml(value) { return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export const newEvent=(type, overrides={})=>({event_id:randomUUID(),event_type:type,occurred_at:new Date().toISOString(),visitor_id:randomUUID(),session_id:randomUUID(),path:'/',device:'desktop',browser:'Other',country:'ZZ',properties:{},...overrides});

// 스크립트 끝 — CommentBible 관리자 인사이트 오프라인 런타임 1.0.0
