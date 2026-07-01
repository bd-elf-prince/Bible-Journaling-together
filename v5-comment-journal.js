// Comment-first journal layer for Bible Journaling Together.
// Makes verse comments feel like the core experience and provides a graceful local fallback.
(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const LOCAL_COMMENTS = 'bjt-v5-local-comments';
  const STORAGE_ID = 'bjt-v5-anonymous-id';
  const STORAGE_NAME = 'bjt-v5-anonymous-name';

  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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

  function patchLanguage(){
    document.body.classList.add('bjt-comment-first');
    const meta = document.querySelector('meta[name="description"]');
    if(meta) meta.setAttribute('content','절마다 남겨진 작은 한 줄이 누군가에게 파도 같은 깨달음으로 닿는 교환일기 성경책');
    const brandSmall = $('.brand small');
    if(brandSmall) brandSmall.textContent = '절 옆에 남긴 작은 한 줄이 누군가에게 파도처럼 닿습니다';
    const commentsTitle = $('.comments-card .section-title h3');
    if(commentsTitle) commentsTitle.textContent = '이 절의 교환일기';
    const commentTotal = $('#commentTotal');
    if(commentTotal && !commentTotal.dataset.suffix){ commentTotal.dataset.suffix='true'; }
    const formLabel = $('#commentForm label[for="moodSelect"]');
    if(formLabel) formLabel.textContent = '이 한 줄의 온도';
    const input = $('#commentInput');
    if(input){
      input.placeholder = '이 절을 읽다가 마음에 남은 작은 깨달음을 적어주세요. 누군가에게는 파도처럼 닿을 수 있어요.';
      input.setAttribute('aria-label','이 절의 교환일기 한 줄 남기기');
    }
    const submit = $('#commentForm button[type="submit"]');
    if(submit && !submit.disabled) submit.textContent = '물방울 남기기';
    const badge = $('#anonymousBadge');
    if(badge && !badge.textContent.includes('남기는 중')) badge.textContent = `${anonymousName()} · 익명으로 남김`;
    const tabs = $$('.v5-panel-tabs button');
    if(tabs[0]) tabs[0].textContent = '교환일기';
    if(tabs[1]) tabs[1].textContent = '이어읽기';
    if(tabs[2]) tabs[2].textContent = '익명';
  }

  function renderLocalHint(){
    const card = $('.comments-card');
    if(!card || $('#commentCoreStatus')) return;
    const hint = document.createElement('p');
    hint.id = 'commentCoreStatus';
    hint.className = 'comment-core-status';
    hint.textContent = '절을 누르면 이곳에 그 절 아래 남겨진 한 줄들이 모입니다.';
    card.insertBefore(hint, $('#commentList'));
  }

  function syncLocalIntoState(){
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

    if(button){ button.disabled = true; button.textContent = '종이에 스미는 중…'; }
    const payload = {verse_id:verse.id, user_name:anonymousName(), anonymous_id:anonymousId(), mood:select?.value || '묵상', content};

    let saved = null;
    if(db){
      const result = await db.from('comments').insert(payload).select('id, verse_id, user_name, content, created_at, anonymous_id, mood').single();
      if(!result.error) saved = result.data;
      else console.warn('comment insert failed; saving locally', result.error);
    }

    if(!saved){
      saved = {...payload, id:`local-${Date.now()}-${Math.random().toString(16).slice(2)}`, created_at:new Date().toISOString(), local_only:true};
      const locals = loadJson(LOCAL_COMMENTS, []);
      locals.unshift(saved);
      saveJson(LOCAL_COMMENTS, locals.slice(0,200));
      message('서버 저장은 아직 확인이 필요해서, 이 브라우저에 먼저 물방울을 남겼습니다.');
    }else{
      message('이 절 아래에 작은 물방울을 남겼습니다.');
    }

    const state = window.BJTReader?.state;
    if(state){
      state.comments = [saved, ...(state.comments || []).filter(comment => comment.id !== saved.id)];
      if(state.commentCounts instanceof Map) state.commentCounts.set(saved.verse_id, (state.commentCounts.get(saved.verse_id) || 0) + 1);
    }
    if(input) input.value = '';
    if(button){ button.disabled = false; button.textContent = '물방울 남기기'; }
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
        status.textContent = count ? `${count}개의 물방울이 이 절 아래에 남아 있습니다.` : '아직 이 절 아래에는 첫 물방울을 기다리는 빈 자리가 있습니다.';
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
