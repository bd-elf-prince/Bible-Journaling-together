(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const DATA_URL = 'data/bible-kor.json';
  const VERSES_PER_SPREAD = 10;
  const VERSES_PER_PAGE = VERSES_PER_SPREAD / 2;
  const ANON_ID_KEY = 'bjt-anonymous-id';
  const RECOMMENDED_VERSES = ['gen-1-1','ps-23-1','mat-5-3','jhn-3-16','rev-22-21'];

  const $ = (id)=>document.getElementById(id);
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  const els = {};
  const state = {
    bible: [],
    bookIndex: 0,
    chapterIndex: 0,
    spreadIndex: 0,
    selected: null,
    comments: [],
    counts: new Map()
  };

  document.addEventListener('DOMContentLoaded', init, {once:true});

  async function init(){
    ['bookSelect','chapterSelect','prevChapter','nextChapter','firstChapter','lastChapter','prevSpread','nextSpread','leftVerses','rightVerses','chapterTitle','chapterSubtitle','leftPageNo','rightPageNo','progressText','statusText','selectedRef','selectedText','commentCount','commentList','commentForm','commentInput','anonymousCheck','searchForm','searchInput','copyVerseButton','togetherList','commentToggle','panelClose','journal'].forEach(id => els[id] = $(id));
    bindEvents();
    await loadBible();
    render();
    loadComments().then(render).catch((error)=>{
      console.warn('[BJT] comments load skipped', error);
      setStatus('성경 읽기는 준비됐고, 댓글 연결을 다시 확인하는 중입니다.');
    });
  }

  function bindEvents(){
    els.bookSelect.addEventListener('change', ()=>{
      state.bookIndex = Number(els.bookSelect.value);
      state.chapterIndex = 0;
      state.spreadIndex = 0;
      selectFirstVerse();
      render();
    });
    els.chapterSelect.addEventListener('change', ()=>{
      state.chapterIndex = Number(els.chapterSelect.value);
      state.spreadIndex = 0;
      selectFirstVerse();
      render();
    });
    els.prevChapter.addEventListener('click', ()=>moveChapter(-1));
    els.nextChapter.addEventListener('click', ()=>moveChapter(1));
    els.prevSpread.addEventListener('click', ()=>moveSpread(-1));
    els.nextSpread.addEventListener('click', ()=>moveSpread(1));
    els.firstChapter.addEventListener('click', ()=>jumpTo(0,0));
    els.lastChapter.addEventListener('click', ()=>jumpTo(state.bible.length - 1, state.bible.at(-1).chapters.length - 1));
    els.commentForm.addEventListener('submit', submitComment);
    els.searchForm.addEventListener('submit', searchVerse);
    els.copyVerseButton.addEventListener('click', copySelected);
    els.commentToggle?.addEventListener('click', openPanel);
    els.panelClose?.addEventListener('click', closePanel);
    document.addEventListener('click', (event)=>{
      const verseButton = event.target.closest('[data-verse-id]');
      if(verseButton){
        event.preventDefault();
        openVerse(verseButton.dataset.verseId);
        const bubble = event.target.closest('.verse-bubble');
        if(bubble && Number(bubble.textContent.trim() || 0) > 0) openPanel();
        return;
      }
      const together = event.target.closest('[data-open-verse]');
      if(together){
        event.preventDefault();
        openVerse(together.dataset.openVerse);
      }
    });
  }

  async function loadBible(){
    try{
      const response = await fetch(DATA_URL, {cache:'no-store'});
      const rows = await response.json();
      state.bible = normalizeBible(rows);
      if(!state.bible.length) throw new Error('empty bible');
      selectFirstVerse();
      setStatus(`성경 ${countBooks()}권, ${countChapters()}장, ${countVerses()}절을 불러왔습니다.`);
    }catch(error){
      console.warn(error);
      state.bible = fallbackBible();
      selectFirstVerse();
      setStatus('성경 데이터를 다시 확인하는 중입니다.');
    }
  }

  async function loadComments(){
    if(!db) return;
    const result = await withTimeout(
      db.from('comments').select('id, verse_id, user_name, anonymous_id, content, created_at').order('created_at', {ascending:false}),
      9000,
      'comments select'
    );
    if(result.error){
      console.warn('[BJT] comments select failed', result.error);
      setStatus('댓글 조회 권한을 확인해주세요.');
      return;
    }
    state.comments = result.data || [];
    state.counts = countByVerse(state.comments);
  }

  function normalizeBible(input){
    if(!Array.isArray(input)) return [];
    return input.map((book, bookIndex)=>{
      const key = book.key || book.bookKey || `book-${bookIndex + 1}`;
      const name = cleanText(book.name || key);
      const chapters = (book.chapters || []).map((chapter)=>{
        const chapterNumber = Number(chapter.number || chapter.chapter);
        const verses = (chapter.verses || []).map((row)=>{
          const verseNumber = Number(Array.isArray(row) ? row[0] : row.number || row.verse);
          const text = cleanText(Array.isArray(row) ? row[1] : row.text);
          return {id:`${key}-${chapterNumber}-${verseNumber}`, bookKey:key, bookName:name, chapter:chapterNumber, number:verseNumber, text};
        }).filter(verse => verse.number && verse.text);
        return {number:chapterNumber, subtitle:cleanText(chapter.subtitle || '절마다 남겨진 작은 물방울'), verses};
      }).filter(chapter => chapter.number && chapter.verses.length);
      return {key, name, chapters};
    }).filter(book => book.chapters.length);
  }

  function cleanText(value){
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function fallbackBible(){
    return [{
      key:'gen', name:'창세기', chapters:[{
        number:1, subtitle:'절마다 남겨진 작은 물방울', verses:[
          {id:'gen-1-1', bookKey:'gen', bookName:'창세기', chapter:1, number:1, text:'태초에 하나님이 천지를 창조하시니라'},
          {id:'gen-1-2', bookKey:'gen', bookName:'창세기', chapter:1, number:2, text:'땅이 혼돈하고 공허하며 깊은 물 위에 하나님의 영이 운행하시니라'}
        ]
      }]
    }];
  }

  function render(){
    if(!state.selected) return;
    renderSelectors();
    renderChapter();
    renderSelected();
    renderComments();
    renderTogether();
  }

  function renderSelectors(){
    els.bookSelect.innerHTML = state.bible.map((book,index)=>`<option value="${index}">${escapeHtml(book.name)}</option>`).join('');
    els.bookSelect.value = String(state.bookIndex);
    els.chapterSelect.innerHTML = currentBook().chapters.map((chapter,index)=>`<option value="${index}">${chapter.number}장</option>`).join('');
    els.chapterSelect.value = String(state.chapterIndex);
  }

  function renderChapter(){
    const book = currentBook();
    const chapter = currentChapter();
    els.chapterTitle.textContent = `${book.name} ${chapter.number}장`;
    els.chapterSubtitle.textContent = chapter.subtitle || '절마다 남겨진 작은 물방울';
    const spread = visibleVerses();
    els.leftVerses.innerHTML = spread.slice(0, VERSES_PER_PAGE).map(renderVerse).join('');
    els.rightVerses.innerHTML = spread.slice(VERSES_PER_PAGE).map(renderVerse).join('');
    const chapterNo = chapterAbsoluteIndex() + 1;
    const pageBase = absoluteSpreadIndex() * 2 - 1;
    els.leftPageNo.textContent = String(pageBase);
    els.rightPageNo.textContent = String(pageBase + 1);
    els.progressText.textContent = `${absoluteSpreadIndex()} / ${totalSpreadCount()}`;
  }

  function renderVerse(verse){
    const count = state.counts.get(verse.id) || 0;
    const selected = state.selected?.id === verse.id ? ' is-selected' : '';
    return `<button class="verse-row${selected}" type="button" data-verse-id="${escapeHtml(verse.id)}">
      <span class="verse-no">${verse.number}</span>
      <span>${escapeHtml(verse.text)}</span>
      <span class="verse-bubble">${count || ''}</span>
    </button>`;
  }

  function renderSelected(){
    const verse = state.selected;
    els.selectedRef.textContent = `${verse.bookName} ${verse.chapter}장 ${verse.number}절`;
    els.selectedText.textContent = verse.text;
  }

  function renderComments(){
    const comments = selectedComments();
    els.commentCount.textContent = String(comments.length);
    if(!comments.length){
      els.commentList.innerHTML = '<p class="empty">아직 이 절에는 첫 물방울을 기다리는 빈자리가 있습니다.</p>';
      return;
    }
    els.commentList.innerHTML = comments.map(comment => `<article class="comment-item">
      <div class="comment-meta"><strong>${escapeHtml(comment.user_name || '익명')}</strong><span>${formatDate(comment.created_at)}</span></div>
      <p>${escapeHtml(comment.content)}</p>
    </article>`).join('');
  }

  function renderTogether(){
    els.togetherList.innerHTML = [...new Set(RECOMMENDED_VERSES)]
      .filter(id => id !== state.selected.id)
      .slice(0,4)
      .map(id => {
        const verse = findVerse(id);
        if(!verse) return '';
        return `<button type="button" data-open-verse="${id}">${escapeHtml(`${verse.bookName} ${verse.chapter}:${verse.number}`)} ${escapeHtml(verse.text.slice(0, 36))}</button>`;
      }).join('');
  }

  async function submitComment(event){
    event.preventDefault();
    const content = els.commentInput.value.trim();
    if(!content || !state.selected) return;
    const payload = {
      verse_id: state.selected.id,
      user_name: els.anonymousCheck.checked ? '익명' : '익명',
      anonymous_id: anonymousId(),
      content
    };
    console.log('[BJT MVP] comment payload', payload);
    if(!db){
      setStatus('Supabase 연결을 확인해주세요.');
      return;
    }
    try{
      const result = await withTimeout(
        db.from('comments').insert(payload).select('id, verse_id, user_name, anonymous_id, content, created_at').single(),
        12000,
        'comments insert'
      );
      if(result.error){
        console.warn('[BJT MVP] comment insert failed', result.error);
        setStatus('댓글 저장 권한을 확인해주세요.');
        return;
      }
      els.commentInput.value = '';
      await loadComments();
      openVerse(result.data.verse_id);
      openPanel();
      setStatus(`${state.selected.bookName} ${state.selected.chapter}:${state.selected.number}에 물방울을 남겼습니다.`);
    }catch(error){
      console.warn('[BJT MVP] comment save failed', error);
      setStatus('댓글 저장 연결을 다시 확인하는 중입니다.');
    }
  }

  function searchVerse(event){
    event.preventDefault();
    const query = els.searchInput.value.trim();
    if(!query) return;
    const reference = query.match(/^(.+?)\s*(\d+)[:장]\s*(\d+)?/);
    let match = null;
    if(reference){
      const bookQuery = reference[1].trim();
      const chapter = Number(reference[2]);
      const verse = Number(reference[3] || 1);
      match = allVerses().find(row => row.bookName.includes(bookQuery) && row.chapter === chapter && row.number === verse);
    }
    if(!match) match = allVerses().find(row => row.text.includes(query));
    if(match) openVerse(match.id);
    else setStatus('맞는 말씀을 찾지 못했습니다.');
  }

  function openVerse(id){
    const verse = findVerse(id);
    if(!verse) return;
    const bookIndex = state.bible.findIndex(book => book.key === verse.bookKey);
    const chapterIndex = state.bible[bookIndex].chapters.findIndex(chapter => chapter.number === verse.chapter);
    state.bookIndex = bookIndex;
    state.chapterIndex = chapterIndex;
    state.spreadIndex = Math.floor(currentChapter().verses.findIndex(row => row.id === verse.id) / VERSES_PER_SPREAD);
    state.selected = verse;
    render();
  }

  function moveSpread(delta){
    const next = state.spreadIndex + delta;
    if(next >= 0 && next < chapterSpreadCount(currentChapter())){
      state.spreadIndex = next;
      selectFirstVerse();
      render();
      return;
    }
    let bookIndex = state.bookIndex;
    let chapterIndex = state.chapterIndex + delta;
    if(chapterIndex < 0 && bookIndex > 0){
      bookIndex -= 1;
      chapterIndex = state.bible[bookIndex].chapters.length - 1;
    }else if(chapterIndex >= state.bible[bookIndex].chapters.length && bookIndex < state.bible.length - 1){
      bookIndex += 1;
      chapterIndex = 0;
    }else{
      return;
    }
    state.bookIndex = bookIndex;
    state.chapterIndex = chapterIndex;
    state.spreadIndex = delta < 0 ? chapterSpreadCount(currentChapter()) - 1 : 0;
    selectFirstVerse();
    render();
  }

  function moveChapter(delta){
    let bookIndex = state.bookIndex;
    let chapterIndex = state.chapterIndex + delta;
    if(chapterIndex < 0 && bookIndex > 0){
      bookIndex -= 1;
      chapterIndex = state.bible[bookIndex].chapters.length - 1;
    }else if(chapterIndex >= state.bible[bookIndex].chapters.length && bookIndex < state.bible.length - 1){
      bookIndex += 1;
      chapterIndex = 0;
    }
    jumpTo(bookIndex, chapterIndex);
  }

  function jumpTo(bookIndex, chapterIndex){
    state.bookIndex = Math.max(0, Math.min(bookIndex, state.bible.length - 1));
    state.chapterIndex = Math.max(0, Math.min(chapterIndex, currentBook().chapters.length - 1));
    state.spreadIndex = 0;
    selectFirstVerse();
    render();
  }

  async function copySelected(){
    if(!state.selected) return;
    const text = `${state.selected.bookName} ${state.selected.chapter}:${state.selected.number} ${state.selected.text}`;
    try{
      await navigator.clipboard.writeText(text);
      setStatus('선택한 절을 복사했습니다.');
    }catch(_){
      setStatus(text);
    }
  }

  function selectFirstVerse(){
    state.selected = visibleVerses()[0] || currentChapter().verses[0];
  }

  function selectedComments(){
    return state.comments.filter(comment => comment.verse_id === state.selected.id);
  }

  function countByVerse(comments){
    const map = new Map();
    comments.forEach(comment => map.set(comment.verse_id, (map.get(comment.verse_id) || 0) + 1));
    return map;
  }

  function currentBook(){ return state.bible[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function visibleVerses(){
    const start = state.spreadIndex * VERSES_PER_SPREAD;
    return currentChapter().verses.slice(start, start + VERSES_PER_SPREAD);
  }
  function allVerses(){ return state.bible.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function countBooks(){ return state.bible.length; }
  function countChapters(){ return state.bible.reduce((sum, book)=>sum + book.chapters.length, 0); }
  function countVerses(){ return allVerses().length; }
  function chapterAbsoluteIndex(){
    return state.bible.slice(0, state.bookIndex).reduce((sum, book)=>sum + book.chapters.length, 0) + state.chapterIndex;
  }
  function chapterSpreadCount(chapter){ return Math.max(1, Math.ceil(chapter.verses.length / VERSES_PER_SPREAD)); }
  function totalSpreadCount(){
    return state.bible.reduce((sum, book)=>sum + book.chapters.reduce((bookSum, chapter)=>bookSum + chapterSpreadCount(chapter), 0), 0);
  }
  function absoluteSpreadIndex(){
    let total = 1;
    for(let bookIndex = 0; bookIndex < state.bookIndex; bookIndex += 1){
      total += state.bible[bookIndex].chapters.reduce((sum, chapter)=>sum + chapterSpreadCount(chapter), 0);
    }
    for(let chapterIndex = 0; chapterIndex < state.chapterIndex; chapterIndex += 1){
      total += chapterSpreadCount(currentBook().chapters[chapterIndex]);
    }
    return total + state.spreadIndex;
  }
  function anonymousId(){
    let id = localStorage.getItem(ANON_ID_KEY);
    if(!id){
      id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  }
  function formatDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '방금 전';
    return new Intl.DateTimeFormat('ko-KR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}).format(date);
  }
  function setStatus(text){ els.statusText.textContent = text || ''; }
  function openPanel(){ els.journal?.classList.add('is-open'); }
  function closePanel(){ els.journal?.classList.remove('is-open'); }
  function withTimeout(promise, ms, label){
    let timer;
    const timeout = new Promise((_, reject)=>{
      timer = setTimeout(()=>reject(new Error(`${label} timeout`)), ms);
    });
    return Promise.race([promise, timeout]).finally(()=>clearTimeout(timer));
  }
  function escapeHtml(value){
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
})();
