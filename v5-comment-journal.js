// Comment-first journal layer for Bible Journaling Together.
// Makes verse comments feel like the core experience and provides a graceful local fallback.
(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const LOCAL_COMMENTS = 'bjt-v5-local-comments';
  const LOCAL_FALLBACK_ENABLED = false;
  const STORAGE_ID = 'bjt-v5-anonymous-id';
  const STORAGE_NAME = 'bjt-v5-anonymous-name';

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  function setText(node,text){ if(node && node.textContent!==text) node.textContent=text; }
  function setAttr(node,name,value){ if(node && node.getAttribute(name)!==value) node.setAttribute(name,value); }

  function escapeHtml(value){
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function loadJson(key, fallback){ try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch(_){return fallback;} }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function anonymousId(){
    let id = localStorage.getItem(STORAGE_ID);
    if(!id){ id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem(STORAGE_ID, id); }
    return id;
  }
  function anonymousName(){
    let name = localStorage.getItem(STORAGE_NAME);
    if(!name){ name = '익명 물방울 ' + Math.random().toString(36).slice(2,5).toUpperCase(); localStorage.setItem(STORAGE_NAME, name); }
    return name;
  }
  function selectedVerse(){ return window.BJTReader?.state?.selected || null; }
  function allComments(){ return window.BJTReader?.state?.comments || []; }
  function verseComments(id){ return allComments().filter(comment => comment.verse_id === id); }
  function message(text){ const node = $('#message'); if(node) node.textContent = text || ''; }
  function commentInsertErrorMessage(error){
    const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
    if(text.includes('42501') || text.includes('row-level security')){
      return 'Supabase RLS 정책이 댓글 저장을 막고 있습니다. supabase/mvp-fix-comments-rls.sql을 실행해 주세요.';
    }
    return `Supabase 저장 실패: ${error?.message || 'comments insert 에러'}`;
  }

  function patchLanguage(){
    document.body.classList.add('bjt-comment-first');
    const meta = document.querySelector('meta[name="description"]');
    if(meta) meta.setAttribute('content','절마다 남겨진 작은 한 줄이 누군가에게 파도 같은 깨달음으로 닿는 교환일기 성경책');
    const brandSmall = $('.brand small');
    setText(brandSmall,'함께 말씀을 읽고, 나누고, 기록합니다');
    const commentsTitle = $('.comments-card .section-title h3');
    setText(commentsTitle,'이 절의 코멘트');
    const commentTotal = $('#commentTotal');
    if(commentTotal && !commentTotal.dataset.suffix){ commentTotal.dataset.suffix='true'; }
    const formLabel = $('#commentForm label[for="moodSelect"]');
    setText(formLabel,'코멘트 분류');
    const input = $('#commentInput');
    if(input){
      setAttr(input,'placeholder','이 절에 대한 코멘트를 남겨보세요');
      setAttr(input,'aria-label','선택한 절에 코멘트 남기기');
    }
    const submit = $('#commentForm button[type="submit"]');
    if(submit && !submit.disabled) setText(submit,'등록');
    const badge = $('#anonymousBadge');
    if(badge && !badge.textContent.includes('저장 중')) setText(badge,`${anonymousName()} · 익명으로 작성`);
    const tabs = $$('.v5-panel-tabs button');
    setText(tabs[0],'코멘트');
    setText(tabs[1],'북마크');
  }

  function renderLocalHint(){
    const card = $('.comments-card');
    if(!card || $('#commentCoreStatus')) return;
    const hint = document.createElement('p');
    hint.id = 'commentCoreStatus';
    hint.className = 'comment-core-status';
    hint.textContent = '선택한 절에 저장된 코멘트만 표시됩니다.';
    card.insertBefore(hint, $('#commentList'));
  }

  function syncLocalIntoState(){
    if(!LOCAL_FALLBACK_ENABLED) return;
    const state = window.BJTReader?.state;
    if(!state) return;
    const locals = loadJson(LOCAL_COMMENTS, []);
    const known = new Set((state.comments || []).map(comment => comment.id));
    locals.forEach(comment => { if(!known.has(comment.id)) state.comments.unshift(comment); });
    if(state.commentCounts instanceof Map){
      locals.forEach(comment => state.commentCounts.set(comment.verse_id, (state.commentCounts.get(comment.verse_id) || 0) + (known.has(comment.id) ? 0 : 1)));
    }
  }

  function rerender(){
    syncLocalIntoState();
    if(window.BJTReader?.render) window.BJTReader.render();
    patchLanguage();
    renderLocalHint();
  }

  async function submitJournal(event){
    const form = event.target.closest('#commentForm');
    if(!form) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    const verse = selectedVerse();
    const input = $('#commentInput');
    const select = $('#moodSelect');
    const button = form.querySelector('button[type="submit"]');
    const content = input?.value.trim() || '';
    if(!verse){ message('먼저 마음을 남길 절을 선택해 주세요.'); return; }
    if(!content){ input?.focus(); message('작은 한 줄을 먼저 적어주세요.'); return; }
    if(content.length > 1000){ message('한 줄 기록은 1000자 이하로 남겨주세요.'); return; }

    if(button){ button.disabled = true; button.textContent = '저장 중…'; }
    const payload = {verse_id:verse.id, user_name:anonymousName(), anonymous_id:anonymousId(), mood:select?.value || '묵상', content};
    console.log('[BJT MVP] selectedVerse before submit', {id:verse.id, reference:`${verse.bookName} ${verse.chapter}:${verse.number}`});
    console.log('[BJT MVP] comment insert payload', payload);

    let saved = null;
    if(!db){
      message('Supabase 연결 후 창세기 1:1 댓글 MVP를 확인할 수 있어요.');
      console.error('[BJT MVP] Supabase client is not available');
      if(button){ button.disabled = false; button.textContent = '등록'; }
      return;
    }

    const result = await db.from('comments').insert(payload).select('id, verse_id, user_name, content, created_at, anonymous_id, mood').single();
    if(!result.error) saved = result.data;
    else{
      console.error('[BJT MVP] comments insert failed', result.error);
      message(commentInsertErrorMessage(result.error));
      if(button){ button.disabled = false; button.textContent = '등록'; }
      return;
    }

    if(!saved){
      if(!LOCAL_FALLBACK_ENABLED){
        message('Supabase 저장이 확인되지 않아 댓글을 남기지 않았습니다.');
        if(button){ button.disabled = false; button.textContent = '등록'; }
        return;
      }
      saved = {...payload, id:`local-${Date.now()}-${Math.random().toString(16).slice(2)}`, created_at:new Date().toISOString(), local_only:true};
      const locals = loadJson(LOCAL_COMMENTS, []);
      locals.unshift(saved);
      saveJson(LOCAL_COMMENTS, locals.slice(0,200));
      message('서버 저장을 확인하지 못해 브라우저에 임시 저장했습니다.');
    }else{
      message('선택한 절에 코멘트를 저장했습니다.');
    }

    const state = window.BJTReader?.state;
    if(state){
      state.comments = [saved, ...(state.comments || []).filter(comment => comment.id !== saved.id)];
      if(state.commentCounts instanceof Map) state.commentCounts.set(saved.verse_id, (state.commentCounts.get(saved.verse_id) || 0) + 1);
    }
    if(input) input.value = '';
    if(button){ button.disabled = false; button.textContent = '등록'; }
    rerender();
    $('.comments-card')?.scrollIntoView({block:'nearest', behavior:'smooth'});
  }

  function focusJournalOnVerseClick(event){
    const verseButton = event.target.closest('[data-verse-id]');
    if(!verseButton) return;
    setTimeout(()=>{
      patchLanguage();
      const input = $('#commentInput');
      if(input) input.dataset.ready = 'true';
      const status = $('#commentCoreStatus');
      const verse = selectedVerse();
      if(status && verse){
        const count = verseComments(verse.id).length;
        status.textContent = count ? `이 절에 코멘트 ${count}개가 있습니다.` : '이 절에는 아직 코멘트가 없습니다.';
      }
    }, 80);
  }

  function boot(){
    document.addEventListener('submit', submitJournal, true);
    document.addEventListener('click', focusJournalOnVerseClick, true);
    const observer = new MutationObserver(()=>{ patchLanguage(); renderLocalHint(); });
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
    setInterval(()=>{ patchLanguage(); syncLocalIntoState(); renderLocalHint(); }, 1200);
    setTimeout(rerender, 500);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot, {once:true}) : boot();
})();
