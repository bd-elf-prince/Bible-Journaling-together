// 스크립트 이름: CommentBible 전체 기능 후보 정적 게이트
// 버전: 1.0.0
// 작성일: 2026-08-14
// 변경사항: gateway 우회·runtime·RLS·outbox 검사
// 용도: PR candidate 정적 검증
// 사용자 입력 필요: 없음
import { readFile } from 'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const [reader,community,gateway,runtime,sql]=await Promise.all([read('production-candidate/reader-app.js'),read('production-candidate/community.js'),read('supabase/functions/write-gateway-v5/index.ts'),read('data/runtime-config.json'),read('supabase/candidates/full_function_10k_candidate.sql')]);const config=JSON.parse(runtime);
assert(config.mode==='normal'&&config.auth&&config.dynamicReads&&config.writes,'candidate runtime must open normal features');
for(const [source,token,message] of [[reader,"db.rpc('update_discussion_comment'",'reader update bypasses gateway'],[reader,"db.rpc('delete_discussion_comment'",'reader delete bypasses gateway'],[reader,".from('user_verse_marks').upsert",'marks bypass gateway'],[community,"db.rpc('update_board_post'",'post update bypasses gateway'],[community,"db.rpc('delete_board_post'",'post delete bypasses gateway'],[community,"db.rpc('update_discussion_comment'",'comment update bypasses gateway'],[community,"db.rpc('delete_discussion_comment'",'comment delete bypasses gateway'],[community,"setBackend('local', '게시판 후보 SQL",'server failure masquerades as local success']])assert(!source.includes(token),message);
for(const action of ['update_board_post','delete_board_post','update_discussion_comment','delete_discussion_comment','upsert_user_verse_mark'])assert(gateway.includes(`${action}:`),`gateway action missing: ${action}`);
assert(reader.includes("const WRITE_GATEWAY_FUNCTION = 'write-gateway-v5'"),'reader must call additive gateway v5');assert(community.includes("const WRITE_GATEWAY_FUNCTION = 'write-gateway-v5'"),'community must call additive gateway v5');
for(const token of ['enable row level security','auth.uid()','with check','idempotency','created_at desc, id desc','cb_outbox','where completed_at is null'])assert(sql.toLowerCase().includes(token),`candidate SQL contract missing: ${token}`);
console.log(JSON.stringify({status:'passed',runtime:config.mode,gateway:'centralized',rls:'candidate-static-verified'},null,2));
// 스크립트 끝 — CommentBible 전체 기능 후보 정적 게이트 1.0.0
