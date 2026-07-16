// Bible Journaling Together candidate V6 continuity layer.
// Keeps V5 untouched while adding resilient reading-state and accessibility helpers.
(()=>{
  'use strict';

  const STORAGE_KEY = 'bjt-v6-reading-position';
  const ANNOUNCE_ID = 'v6ReaderAnnounce';
  let reader = null;
  let lastVerseId = '';

  function announce(message){
    const region = document.getElementById(ANNOUNCE_ID);
    if(region) region.textContent = message;
  }

  function ensureAccessibilityChrome(){
    if(!document.querySelector('.v6-skip-link')){
      const link = document.createElement('a');
      link.className = 'v6-skip-link';
      link.href = '#reader';
      link.textContent = '성경 본문으로 바로가기';
      document.body.prepend(link);
    }
    if(!document.getElementById(ANNOUNCE_ID)){
      const region = document.createElement('p');
      region.id = ANNOUNCE_ID;
      region.className = 'v6-sr-only';
      region.setAttribute('role','status');
      region.setAttribute('aria-live','polite');
      document.body.append(region);
    }
    document.querySelector('.book')?.setAttribute('tabindex','-1');
    document.querySelector('.reflection-panel')?.setAttribute('tabindex','-1');
  }

  function currentVerse(){ return reader?.state?.selected || null; }

  function persistPosition(){
    const verse = currentVerse();
    if(!verse || verse.id === lastVerseId) return;
    lastVerseId = verse.id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({verseId:verse.id, savedAt:new Date().toISOString()}));
    history.replaceState(null,'',`#verse=${encodeURIComponent(verse.id)}`);
    announce(`${verse.bookName} ${verse.chapter}장 ${verse.number}절을 열었습니다.`);
  }

  function requestedVerseId(){
    const hash = new URLSearchParams(location.hash.replace(/^#/,''));
    if(hash.get('verse')) return hash.get('verse');
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').verseId || '';}
    catch(_){return '';}
  }

  function restorePosition(){
    const verseId = requestedVerseId();
    if(!verseId || typeof reader?.openVerse !== 'function') return;
    reader.openVerse(verseId);
    if(currentVerse()?.id === verseId) announce('마지막으로 읽던 말씀을 다시 열었습니다.');
  }

  function moveVisibleVerse(step){
    const buttons = [...document.querySelectorAll('[data-verse-id]')];
    if(!buttons.length) return;
    const selected = currentVerse()?.id;
    const index = Math.max(0, buttons.findIndex(button => button.dataset.verseId === selected));
    const next = buttons[Math.min(buttons.length - 1, Math.max(0, index + step))];
    if(next){ next.click(); next.focus({preventScroll:true}); }
  }

  function bindKeyboard(){
    document.addEventListener('keydown', event=>{
      if(event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      if(event.key === 'ArrowDown'){ event.preventDefault(); moveVisibleVerse(1); }
      if(event.key === 'ArrowUp'){ event.preventDefault(); moveVisibleVerse(-1); }
      if(event.key === '['){ document.querySelector('#prevChapter')?.click(); }
      if(event.key === ']'){ document.querySelector('#nextChapter')?.click(); }
      if(event.key === '/'){ event.preventDefault(); document.querySelector('#searchInput')?.focus(); }
    });
  }

  function updateConnectionState(){
    document.body.classList.toggle('v6-offline', !navigator.onLine);
    if(!navigator.onLine) announce('오프라인 상태입니다. 저장된 본문은 계속 읽을 수 있습니다.');
  }

  function start(){
    ensureAccessibilityChrome();
    bindKeyboard();
    updateConnectionState();
    addEventListener('online', updateConnectionState);
    addEventListener('offline', updateConnectionState);

    const waitForReader = setInterval(()=>{
      if(!window.BJTReader) return;
      reader = window.BJTReader;
      clearInterval(waitForReader);
      restorePosition();
      persistPosition();
      new MutationObserver(persistPosition).observe(document.querySelector('#selectedReference') || document.body,{childList:true,subtree:true});
    },50);
    setTimeout(()=>clearInterval(waitForReader),10000);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',start,{once:true}) : start();
})();
