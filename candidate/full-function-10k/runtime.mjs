// 스크립트 이름: CommentBible 무네트워크 후보 런타임
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: Auth·CRUD·격리·제한·멱등성·outbox 후보 구현
// 용도: 원격 자격 없이 전체 기능 계약 검증
// 사용자 입력 필요: 없음
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const clone = value => structuredClone(value);
const nowIso = clock => new Date(clock()).toISOString();

export class HttpError extends Error {
  constructor(status, code, retryAfter = 0) {
    super(code); this.status = status; this.code = code; this.retryAfter = retryAfter;
  }
}

export class CommentBibleCandidate {
  constructor({ clock = Date.now, id = randomUUID, limits = {} } = {}) {
    this.clock = clock; this.id = id;
    this.limits = { write: 30, report: 10, auth: 10, windowMs: 60_000, ...limits };
    for (const name of ['users','emailIndex','usernameIndex','sessions','posts','comments','marks','reports','notifications','outbox','rate','idempotency']) this[name] = new Map();
    this.available = true;
  }
  setAvailable(value) { this.available = Boolean(value); }
  requireAvailable() { if (!this.available) throw new HttpError(503, 'temporarily_unavailable', 2); }
  passwordRecord(password) { return hash(`candidate-password:${password}`); }
  verifyPassword(password, record) { const a = Buffer.from(this.passwordRecord(password)); const b = Buffer.from(String(record || '')); return a.length === b.length && timingSafeEqual(a, b); }
  consume(subject, kind = 'write') {
    const limit = this.limits[kind] ?? this.limits.write, key = `${kind}:${subject}`, now = this.clock(), current = this.rate.get(key);
    const bucket = !current || current.startedAt + this.limits.windowMs <= now ? { startedAt: now, count: 0 } : current;
    bucket.count += 1; this.rate.set(key, bucket);
    if (bucket.count > limit) throw new HttpError(429, 'too_many_requests', Math.ceil(this.limits.windowMs / 1000));
  }
  once(actor, action, key, body, operation) {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(key || '')) throw new HttpError(400, 'invalid_idempotency_key');
    const identity = hash(`${actor}:${action}:${key}`), bodyHash = hash(JSON.stringify(body)), previous = this.idempotency.get(identity);
    if (previous) { if (previous.bodyHash !== bodyHash) throw new HttpError(409, 'idempotency_payload_mismatch'); return clone(previous.response); }
    const response = operation(); this.idempotency.set(identity, { bodyHash, response: clone(response), completedAt: nowIso(this.clock) }); return response;
  }
  signup({ email, username, nickname, password }) {
    this.requireAvailable(); const normalizedEmail = String(email || '').trim().toLowerCase(), normalizedUsername = String(username || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail) || !/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) throw new HttpError(400, 'invalid_identity');
    if (String(nickname || '').trim().length < 2 || String(nickname).trim().length > 20 || String(password || '').length < 8) throw new HttpError(400, 'invalid_profile');
    if (this.emailIndex.has(normalizedEmail) || this.usernameIndex.has(normalizedUsername)) throw new HttpError(409, 'identity_conflict');
    const user = { id: this.id(), email: normalizedEmail, username: normalizedUsername, nickname: String(nickname).trim(), password: this.passwordRecord(password), confirmed: false, role: 'member' };
    this.users.set(user.id, user); this.emailIndex.set(normalizedEmail, user.id); this.usernameIndex.set(normalizedUsername, user.id);
    return { userId: user.id, confirmationRequired: true };
  }
  confirm(userId) { const user = this.users.get(userId); if (!user) throw new HttpError(404, 'user_not_found'); user.confirmed = true; }
  login({ username, password, actor = 'unknown' }) { this.requireAvailable(); this.consume(actor, 'auth'); const user = this.users.get(this.usernameIndex.get(String(username || '').trim().toLowerCase())); if (!user || !user.confirmed || !this.verifyPassword(password, user.password)) throw new HttpError(401, 'invalid_credentials'); const token = this.id(); this.sessions.set(token, { userId: user.id, expiresAt: this.clock() + 3_600_000 }); return { token, userId: user.id }; }
  refresh(token) { const session = this.session(token); session.expiresAt = this.clock() + 3_600_000; return { token, userId: session.userId }; }
  logout(token) { this.sessions.delete(token); }
  session(token) { const session = this.sessions.get(token); if (!session || session.expiresAt <= this.clock()) throw new HttpError(401, 'invalid_session'); return session; }
  actor(token, anonymousId) { if (token) { const userId = this.session(token).userId; return { key:`user:${userId}`, userId, anonymousId:null }; } if (!/^[A-Za-z0-9_-]{16,128}$/.test(anonymousId || '')) throw new HttpError(400, 'invalid_actor'); return { key:`anonymous:${anonymousId}`, userId:null, anonymousId }; }
  createPost({ token, anonymousId, password, title, content, idempotencyKey }) {
    this.requireAvailable(); const actor = this.actor(token, anonymousId); this.consume(actor.key); const body = { title:String(title || '').trim(), content:String(content || '').trim() };
    if (body.title.length < 2 || body.title.length > 120 || body.content.length < 2 || body.content.length > 10_000) throw new HttpError(400, 'invalid_post'); if (!actor.userId && String(password || '').length < 8) throw new HttpError(400, 'password_required');
    return this.once(actor.key, 'create_post', idempotencyKey, body, () => { const post = { id:this.id(), ...body, userId:actor.userId, anonymousId:actor.anonymousId, password:actor.userId ? null : this.passwordRecord(password), deletedAt:null, createdAt:nowIso(this.clock), version:1 }; this.posts.set(post.id, post); return clone(post); });
  }
  createComment({ token, anonymousId, password, postId, verseId, parentId = null, content, idempotencyKey }) {
    this.requireAvailable(); const actor = this.actor(token, anonymousId); this.consume(actor.key);
    if (postId && (!this.posts.has(postId) || this.posts.get(postId).deletedAt)) throw new HttpError(404, 'post_not_found'); if (parentId && (!this.comments.has(parentId) || this.comments.get(parentId).deletedAt)) throw new HttpError(404, 'parent_not_found'); if (!postId && !/^[a-z0-9]+-[0-9]+-[0-9]+$/.test(verseId || '')) throw new HttpError(400, 'invalid_target');
    const body = { postId:postId || null, verseId:verseId || null, parentId, content:String(content || '').trim() }; if (!body.content || body.content.length > 1_000) throw new HttpError(400, 'invalid_comment'); if (!actor.userId && String(password || '').length < 8) throw new HttpError(400, 'password_required');
    return this.once(actor.key, 'create_comment', idempotencyKey, body, () => { const row = { id:this.id(), ...body, userId:actor.userId, anonymousId:actor.anonymousId, password:actor.userId ? null : this.passwordRecord(password), deletedAt:null, createdAt:nowIso(this.clock), version:1 }; this.comments.set(row.id,row); if(postId) this.notify(this.posts.get(postId)?.userId, actor.userId, 'comment', postId); return clone(row); });
  }
  canManage(row, token, anonymousId, password) { const actor=this.actor(token,anonymousId), user=actor.userId?this.users.get(actor.userId):null; if(user?.role==='admin') return true; if(row.userId) return row.userId===actor.userId; return row.anonymousId===actor.anonymousId && this.verifyPassword(password,row.password); }
  mutate(collection,id,credentials,mutation) { this.requireAvailable(); const row=collection.get(id); if(!row||row.deletedAt) throw new HttpError(404,'not_found'); if(!this.canManage(row,credentials.token,credentials.anonymousId,credentials.password)) throw new HttpError(403,'forbidden'); mutation(row); row.version+=1; row.updatedAt=nowIso(this.clock); return clone(row); }
  updatePost(input) { return this.mutate(this.posts,input.id,input,row=>{const title=String(input.title||'').trim(),content=String(input.content||'').trim(); if(title.length<2||title.length>120||content.length<2||content.length>10_000) throw new HttpError(400,'invalid_post'); row.title=title; row.content=content;}); }
  deletePost(input) { return this.mutate(this.posts,input.id,input,row=>{row.deletedAt=nowIso(this.clock);}); }
  updateComment(input) { return this.mutate(this.comments,input.id,input,row=>{const content=String(input.content||'').trim(); if(!content||content.length>1_000) throw new HttpError(400,'invalid_comment'); row.content=content;}); }
  deleteComment(input) { return this.mutate(this.comments,input.id,input,row=>{row.deletedAt=nowIso(this.clock);}); }
  upsertMark({token,verseId,bookmark=false,highlight=false,memo=null}) { this.requireAvailable(); const userId=this.session(token).userId; if(!/^[a-z0-9]+-[0-9]+-[0-9]+$/.test(verseId||'')||String(memo||'').length>4_000) throw new HttpError(400,'invalid_mark'); const row={userId,verseId,bookmark:Boolean(bookmark),highlight:Boolean(highlight),memo:memo||null,updatedAt:nowIso(this.clock)}; this.marks.set(`${userId}:${verseId}`,row); return clone(row); }
  listMarks(token) { const userId=this.session(token).userId; return [...this.marks.values()].filter(row=>row.userId===userId).map(clone); }
  report({token,anonymousId,targetType,targetId,reason='user_report',idempotencyKey}) { this.requireAvailable(); const actor=this.actor(token,anonymousId); this.consume(actor.key,'report'); if(!['post','comment'].includes(targetType)||String(reason).length>200) throw new HttpError(400,'invalid_report'); return this.once(actor.key,'report',idempotencyKey,{targetType,targetId,reason},()=>{const unique=`${actor.key}:${targetType}:${targetId}`; if(this.reports.has(unique)) throw new HttpError(409,'already_reported'); const row={id:this.id(),actor:actor.key,targetType,targetId,reason,createdAt:nowIso(this.clock)}; this.reports.set(unique,row); return clone(row);}); }
  notify(recipientId,actorId,type,targetId) { if(!recipientId||recipientId===actorId)return; const row={id:this.id(),recipientId,type,targetId,readAt:null,createdAt:nowIso(this.clock)}; this.notifications.set(row.id,row); }
  listNotifications(token) { const userId=this.session(token).userId; return [...this.notifications.values()].filter(row=>row.recipientId===userId).map(clone); }
  enqueue(eventType,payload,maxDepth=1000) { if(this.outbox.size>=maxDepth) throw new HttpError(503,'outbox_backpressure',5); const row={id:this.id(),eventType,payload:clone(payload),attempts:0,availableAt:nowIso(this.clock),completedAt:null}; this.outbox.set(row.id,row); return clone(row); }
  drainOutbox(limit=100) { const rows=[...this.outbox.values()].filter(row=>!row.completedAt).slice(0,Math.max(1,Math.min(limit,100))); rows.forEach(row=>{row.attempts+=1;row.completedAt=nowIso(this.clock);}); return rows.map(clone); }
  page(collection,{cursor=null,limit=20,predicate=()=>true}={}) { const bounded=Math.max(1,Math.min(Number(limit)||20,100)); const rows=[...collection.values()].filter(row=>!row.deletedAt&&predicate(row)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)); const found=cursor?rows.findIndex(row=>`${row.createdAt}|${row.id}`===cursor):-1,start=cursor?(found<0?rows.length:found+1):0,data=rows.slice(start,start+bounded),last=data.at(-1); return {data:data.map(clone),nextCursor:start+bounded<rows.length&&last?`${last.createdAt}|${last.id}`:null}; }
  listPosts(options={}) { this.requireAvailable(); return this.page(this.posts,options); }
  listComments({postId=null,verseId=null,...options}={}) { this.requireAvailable(); return this.page(this.comments,{...options,predicate:row=>postId?row.postId===postId:row.verseId===verseId}); }
}
// 스크립트 끝 — CommentBible 무네트워크 후보 런타임 1.0.0
