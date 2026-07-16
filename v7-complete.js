// V7 account layer: Supabase Auth + user-owned bookmarks, notes, highlights and preferences.
(()=>{
  'use strict';
  const URL='https://rayvvlerwxumqvmodvsy.supabase.co';
  const KEY='sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const db=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const state={user:null,profile:null,bookmarks:[],notes:[],highlights:[],preferences:{font_size:'normal',theme:'paper'},drawerTab:'notes'};
  const verse=()=>window.BJTReader?.state?.selected;
  const ref=v=>v?`${v.bookName} ${v.chapter}:${v.number}`:'';
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  function toast(text){$('.toast')?.remove();const n=document.createElement('p');n.className='toast';n.textContent=text;document.body.append(n);setTimeout(()=>n.remove(),2600)}
  function requireUser(){if(state.user)return true;openAuth();toast('로그인 후 사용할 수 있어요.');return false}
  function openAuth(){$('#authModal').hidden=false;$('#authEmail')?.focus()}
  function closeAuth(){$('#authModal').hidden=true}
  function errorText(error){const m=error?.message||'처리하지 못했습니다.';if(/relation|table|schema cache/i.test(m))return 'V7 Supabase 스키마를 먼저 적용해 주세요.';return m}
  async function boot(){
    bind(); if(!db){toast('Supabase 라이브러리를 불러오지 못했습니다.');return}
    const {data}=await db.auth.getSession();await applySession(data.session);
    db.auth.onAuthStateChange((_event,session)=>setTimeout(()=>applySession(session),0));
    window.BJTAccount={state,openDrawer,closeDrawer,renderDrawer};
    waitReader();
  }
  function bind(){
    $('#authButton')?.addEventListener('click',()=>state.user?openDrawer('settings'):openAuth());
    $('#accountMenuButton')?.addEventListener('click',()=>openDrawer('settings'));
    $$('[data-open-account]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();openDrawer(b.dataset.openAccount)}));
    $('[data-close-auth]')?.addEventListener('click',closeAuth);$('#authModal')?.addEventListener('click',e=>{if(e.target.id==='authModal')closeAuth()});
    $('[data-close-drawer]')?.addEventListener('click',closeDrawer);$$('[data-drawer-tab]').forEach(b=>b.addEventListener('click',()=>openDrawer(b.dataset.drawerTab)));
    $('#authForm')?.addEventListener('submit',signIn);$('#signUpButton')?.addEventListener('click',signUp);$('#magicLinkButton')?.addEventListener('click',magicLink);
    $$('[data-tool]').forEach(b=>b.addEventListener('click',()=>runTool(b.dataset.tool)));
    $('#notificationButton')?.addEventListener('click',()=>toast('새 알림이 없습니다.'));
    document.addEventListener('click',e=>{const open=e.target.closest('[data-open-saved]');if(open){window.BJTReader?.openVerse(open.dataset.openSaved);closeDrawer()}});
  }
  async function applySession(session){state.user=session?.user||null;const b=$('#authButton');if(b)b.textContent=state.user?'내 기록':'로그인';if(!state.user){state.profile=null;state.bookmarks=[];state.notes=[];state.highlights=[];renderDrawer();decorateVerses();return}await Promise.all([loadProfile(),loadRecords()]);closeAuth();renderDrawer();decorateVerses()}
  async function signIn(e){e.preventDefault();setAuthStatus('로그인 중…');const {error}=await db.auth.signInWithPassword({email:$('#authEmail').value.trim(),password:$('#authPassword').value});setAuthStatus(error?errorText(error):'로그인되었습니다.',!!error)}
  async function signUp(){setAuthStatus('계정을 만드는 중…');const {error}=await db.auth.signUp({email:$('#authEmail').value.trim(),password:$('#authPassword').value,options:{emailRedirectTo:location.origin+location.pathname}});setAuthStatus(error?errorText(error):'확인 이메일을 보냈습니다.',!!error)}
  async function magicLink(){const email=$('#authEmail').value.trim();if(!email){setAuthStatus('이메일을 입력해 주세요.',true);return}const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}});setAuthStatus(error?errorText(error):'로그인 링크를 이메일로 보냈습니다.',!!error)}
  function setAuthStatus(text,error=false){const n=$('#authStatus');if(n){n.textContent=text;n.classList.toggle('is-error',error)}}
  async function loadProfile(){let {data,error}=await db.from('profiles').select('*').eq('id',state.user.id).maybeSingle();if(error){toast(errorText(error));return}if(!data){const result=await db.from('profiles').upsert({id:state.user.id,display_name:state.user.email.split('@')[0]}).select().single();data=result.data}state.profile=data}
  async function loadRecords(){const [b,n,h,p]=await Promise.all([db.from('bookmarks').select('*').eq('user_id',state.user.id).order('created_at',{ascending:false}),db.from('verse_notes').select('*').eq('user_id',state.user.id).order('updated_at',{ascending:false}),db.from('highlights').select('*').eq('user_id',state.user.id).order('created_at',{ascending:false}),db.from('user_preferences').select('*').eq('user_id',state.user.id).maybeSingle()]);if([b,n,h,p].some(x=>x.error)){toast(errorText([b,n,h,p].find(x=>x.error).error));return}state.bookmarks=b.data||[];state.notes=n.data||[];state.highlights=h.data||[];state.preferences=p.data||state.preferences}
  async function runTool(tool){if(tool==='listen'){listenVerse();return}if(!requireUser())return;const v=verse();if(!v)return;if(tool==='bookmark')await toggleBookmark(v);if(tool==='highlight')await toggleHighlight(v);if(tool==='memo')openMemo(v)}
  async function toggleBookmark(v){const old=state.bookmarks.find(x=>x.verse_id===v.id);const q=old?db.from('bookmarks').delete().eq('id',old.id).eq('user_id',state.user.id):db.from('bookmarks').insert({user_id:state.user.id,verse_id:v.id,reference:ref(v),verse_text:v.text});const {error}=await q;if(error){toast(errorText(error));return}await loadRecords();decorateVerses();toast(old?'책갈피를 해제했습니다.':'책갈피에 저장했습니다.')}
  async function toggleHighlight(v){const old=state.highlights.find(x=>x.verse_id===v.id);const q=old?db.from('highlights').delete().eq('id',old.id).eq('user_id',state.user.id):db.from('highlights').insert({user_id:state.user.id,verse_id:v.id,reference:ref(v),verse_text:v.text,color:'gold'});const {error}=await q;if(error){toast(errorText(error));return}await loadRecords();decorateVerses();toast(old?'하이라이트를 지웠습니다.':'하이라이트를 남겼습니다.')}
  function openMemo(v){openDrawer('notes');const existing=state.notes.find(x=>x.verse_id===v.id);$('#drawerContent').innerHTML=`<form class="memo-editor" id="memoEditor"><strong>${esc(ref(v))}</strong><p>${esc(v.text)}</p><textarea rows="8" maxlength="5000" placeholder="이 말씀 곁에 나만의 기록을 남겨보세요">${esc(existing?.content||'')}</textarea><button type="submit">메모 저장</button></form>`;$('#memoEditor').addEventListener('submit',e=>saveMemo(e,v,existing))}
  async function saveMemo(e,v,existing){e.preventDefault();const content=$('#memoEditor textarea').value.trim();let q;if(!content&&existing)q=db.from('verse_notes').delete().eq('id',existing.id).eq('user_id',state.user.id);else q=db.from('verse_notes').upsert({id:existing?.id,user_id:state.user.id,verse_id:v.id,reference:ref(v),verse_text:v.text,content},{onConflict:'user_id,verse_id'});const {error}=await q;if(error){toast(errorText(error));return}await loadRecords();renderDrawer();toast(content?'메모를 저장했습니다.':'메모를 삭제했습니다.')}
  function listenVerse(){const v=verse();if(!v||!('speechSynthesis'in window)){toast('이 브라우저에서는 듣기를 지원하지 않습니다.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(`${ref(v)}. ${v.text}`);u.lang='ko-KR';speechSynthesis.speak(u);toast('선택한 절을 읽습니다.')}
  function openDrawer(tab='notes'){if(!requireUser()&&tab!=='settings')return;state.drawerTab=tab;$('#accountDrawer').classList.add('is-open');$('#accountDrawer').setAttribute('aria-hidden','false');renderDrawer()}
  function closeDrawer(){$('#accountDrawer').classList.remove('is-open');$('#accountDrawer').setAttribute('aria-hidden','true')}
  function renderDrawer(){const root=$('#drawerContent');if(!root)return;$$('[data-drawer-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.drawerTab===state.drawerTab));$('#drawerTitle').textContent={notes:'나의 노트',bookmarks:'책갈피',settings:'설정'}[state.drawerTab];if(!state.user){root.innerHTML='<div class="drawer-empty"><p>로그인하면 기록을 여러 기기에서 이어갈 수 있습니다.</p><button type="button" id="drawerLogin">로그인</button></div>';$('#drawerLogin')?.addEventListener('click',openAuth);return}if(state.drawerTab==='notes')root.innerHTML=list(state.notes,'아직 저장한 메모가 없습니다.',x=>x.content);if(state.drawerTab==='bookmarks')root.innerHTML=list(state.bookmarks,'아직 책갈피가 없습니다.',()=> '');if(state.drawerTab==='settings'){root.innerHTML=`<form class="settings-grid" id="settingsForm"><label>표시 이름<input id="displayName" maxlength="40" value="${esc(state.profile?.display_name||'')}"></label><label>글자 크기<select id="prefFont"><option value="normal">보통</option><option value="large">크게</option><option value="xlarge">아주 크게</option></select></label><button type="submit">설정 저장</button><button type="button" id="signOut">로그아웃</button></form>`;$('#prefFont').value=state.preferences.font_size||'normal';$('#settingsForm').addEventListener('submit',saveSettings);$('#signOut').addEventListener('click',()=>db.auth.signOut())}}
  function list(rows,empty,body){if(!rows.length)return `<p class="drawer-empty">${empty}</p>`;return rows.map(x=>`<article class="saved-item"><strong>${esc(x.reference)}</strong><span>${esc(x.verse_text)}</span>${body(x)?`<p>${esc(body(x))}</p>`:''}<button data-open-saved="${esc(x.verse_id)}">본문에서 열기</button></article>`).join('')}
  async function saveSettings(e){e.preventDefault();const display_name=$('#displayName').value.trim();const font_size=$('#prefFont').value;const [p,u]=await Promise.all([db.from('profiles').update({display_name}).eq('id',state.user.id),db.from('user_preferences').upsert({user_id:state.user.id,font_size,theme:'paper'})]);if(p.error||u.error){toast(errorText(p.error||u.error));return}$('#fontSizeSelect').value=font_size;$('#fontSizeSelect').dispatchEvent(new Event('change',{bubbles:true}));await Promise.all([loadProfile(),loadRecords()]);toast('설정을 저장했습니다.')}
  function decorateVerses(){$$('[data-verse-id]').forEach(n=>{n.classList.toggle('is-bookmarked',state.bookmarks.some(x=>x.verse_id===n.dataset.verseId));n.classList.toggle('is-highlighted',state.highlights.some(x=>x.verse_id===n.dataset.verseId))});const v=verse();$$('[data-tool]').forEach(b=>{const active=b.dataset.tool==='bookmark'?state.bookmarks.some(x=>x.verse_id===v?.id):b.dataset.tool==='highlight'?state.highlights.some(x=>x.verse_id===v?.id):false;b.classList.toggle('is-active',active)})}
  function waitReader(){let tries=0;const t=setInterval(()=>{if(window.BJTReader){clearInterval(t);decorateVerses();new MutationObserver(decorateVerses).observe($('#leftVerses')||document.body,{childList:true,subtree:true});new MutationObserver(decorateVerses).observe($('#selectedReference')||document.body,{childList:true,subtree:true})}if(++tries>200)clearInterval(t)},50)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
