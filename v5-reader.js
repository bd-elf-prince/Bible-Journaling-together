// Bible Journaling Together V5: verse comments, emotion reactions, and recommendation reader.
(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const DATA_URL = 'data/bible-kor.json';
  const VERSES_PER_SPREAD = 12;
  const STORAGE_ID = 'bjt-v5-anonymous-id';
  const STORAGE_NAME = 'bjt-v5-anonymous-name';
  const STORAGE_REACTED_VERSES = 'bjt-v5-reacted-verses';
  const STORAGE_LIKED_COMMENTS = 'bjt-v5-liked-comments';

  const EMOTIONS = [
    {key:'like', label:'좋아요', icon:'♡', mood:'감사'},
    {key:'moved', label:'감동', icon:'✦', mood:'믿음'},
    {key:'comfort', label:'위로', icon:'☁', mood:'위로'},
    {key:'strength', label:'힘', icon:'✚', mood:'회복'},
    {key:'amen', label:'아멘', icon:'✓', mood:'평안'}
  ];

  const MOOD_RECOMMENDATIONS = {
    '위로':['psa-23-1','psa-23-4','mat-5-4','gen-1-3'],
    '믿음':['mat-5-6','gen-1-3','psa-23-3','mat-5-10'],
    '평안':['psa-23-2','psa-23-6','mat-5-9','gen-1-5'],
    '회복':['psa-23-3','mat-5-3','mat-5-5','gen-1-31'],
    '감사':['psa-23-5','psa-23-6','gen-1-31','mat-5-8']
  };

  const FALLBACK_BIBLE = [
    {key:'gen', name:'창세기', english:'Genesis', startPage:1, chapters:[
      {number:1, subtitle:'태초의 빛과 창조의 질서', pageLeft:'창세기 · 첫째 날', pageRight:'창세기 · 보시기에 좋았더라', verses:[
        [1,'태초에 하나님이 천지를 창조하시니라'],
        [2,'땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라'],
        [3,'하나님이 이르시되 빛이 있으라 하시니 빛이 있었고'],
        [4,'빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사'],
        [5,'하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라'],
        [6,'하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고'],
        [7,'하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라'],
        [8,'하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라'],
        [9,'하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라'],
        [10,'하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라'],
        [11,'하나님이 이르시되 땅은 풀과 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내라 하시니 그대로 되어'],
        [12,'땅이 풀과 각기 종류대로 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내니 하나님이 보시기에 좋았더라'],
        [13,'저녁이 되고 아침이 되니 이는 셋째 날이니라'],
        [14,'하나님이 이르시되 하늘의 궁창에 광명체들이 있어 낮과 밤을 나뉘게 하고 그것들로 징조와 계절과 날과 해를 이루게 하라'],
        [15,'또 광명체들이 하늘의 궁창에 있어 땅을 비추라 하시니 그대로 되니라'],
        [16,'하나님이 두 큰 광명체를 만드사 큰 광명체로 낮을 주관하게 하시고 작은 광명체로 밤을 주관하게 하시며 또 별들을 만드시고'],
        [17,'하나님이 그것들을 하늘의 궁창에 두어 땅을 비추게 하시며'],
        [18,'낮과 밤을 주관하게 하시고 빛과 어둠을 나뉘게 하시니 하나님이 보시기에 좋았더라'],
        [19,'저녁이 되고 아침이 되니 이는 넷째 날이니라'],
        [20,'하나님이 이르시되 물들은 생물을 번성하게 하라 땅 위 하늘의 궁창에는 새가 날으라 하시고'],
        [21,'하나님이 큰 바다 짐승들과 물에서 번성하여 움직이는 모든 생물을 그 종류대로, 날개 있는 모든 새를 그 종류대로 창조하시니 하나님이 보시기에 좋았더라'],
        [22,'하나님이 그들에게 복을 주시며 이르시되 생육하고 번성하여 여러 바닷물에 충만하라 새들도 땅에 번성하라 하시니라'],
        [23,'저녁이 되고 아침이 되니 이는 다섯째 날이니라'],
        [24,'하나님이 이르시되 땅은 생물을 그 종류대로 내되 가축과 기는 것과 땅의 짐승을 종류대로 내라 하시니 그대로 되니라'],
        [25,'하나님이 땅의 짐승을 그 종류대로, 가축을 그 종류대로, 땅에 기는 모든 것을 종류대로 만드시니 하나님이 보시기에 좋았더라'],
        [26,'하나님이 이르시되 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그들로 바다의 물고기와 하늘의 새와 가축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고'],
        [27,'하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고'],
        [28,'하나님이 그들에게 복을 주시며 이르시되 생육하고 번성하여 땅에 충만하라 땅을 정복하라 바다의 물고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라'],
        [29,'하나님이 이르시되 내가 온 지면의 씨 맺는 모든 채소와 씨 가진 열매 맺는 모든 나무를 너희에게 주노니 너희의 먹을거리가 되리라'],
        [30,'또 땅의 모든 짐승과 하늘의 모든 새와 생명이 있어 땅에 기는 모든 것에게는 모든 푸른 풀을 먹을거리로 주노라 하시니 그대로 되니라'],
        [31,'하나님이 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라']
      ]}
    ]},
    {key:'psa', name:'시편', english:'Psalms', startPage:612, chapters:[
      {number:23, subtitle:'여호와는 나의 목자', pageLeft:'시편 · 푸른 풀밭', pageRight:'시편 · 내 잔이 넘치나이다', verses:[
        [1,'여호와는 나의 목자시니 내게 부족함이 없으리로다'],
        [2,'그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다'],
        [3,'내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다'],
        [4,'내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다'],
        [5,'주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다'],
        [6,'내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다']
      ]}
    ]},
    {key:'mat', name:'마태복음', english:'Matthew', startPage:1205, chapters:[
      {number:5, subtitle:'산상수훈과 팔복', pageLeft:'마태복음 · 복이 있나니', pageRight:'마태복음 · 세상의 빛', verses:[
        [1,'예수께서 무리를 보시고 산에 올라가 앉으시니 제자들이 나아온지라'],
        [2,'입을 열어 가르쳐 이르시되'],
        [3,'심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요'],
        [4,'애통하는 자는 복이 있나니 그들이 위로를 받을 것임이요'],
        [5,'온유한 자는 복이 있나니 그들이 땅을 기업으로 받을 것임이요'],
        [6,'의에 주리고 목마른 자는 복이 있나니 그들이 배부를 것임이요'],
        [7,'긍휼히 여기는 자는 복이 있나니 그들이 긍휼히 여김을 받을 것임이요'],
        [8,'마음이 청결한 자는 복이 있나니 그들이 하나님을 볼 것임이요'],
        [9,'화평하게 하는 자는 복이 있나니 그들이 하나님의 아들이라 일컬음을 받을 것임이요'],
        [10,'의를 위하여 박해를 받은 자는 복이 있나니 천국이 그들의 것임이라'],
        [11,'나로 말미암아 너희를 욕하고 박해하고 거짓으로 너희를 거슬러 모든 악한 말을 할 때에는 너희에게 복이 있나니'],
        [12,'기뻐하고 즐거워하라 하늘에서 너희의 상이 큼이라 너희 전에 있던 선지자들도 이같이 박해하였느니라'],
        [13,'너희는 세상의 소금이니 소금이 만일 그 맛을 잃으면 무엇으로 짜게 하리요'],
        [14,'너희는 세상의 빛이라 산 위에 있는 동네가 숨겨지지 못할 것이요'],
        [15,'사람이 등불을 켜서 말 아래에 두지 아니하고 등경 위에 두나니 이러므로 집 안 모든 사람에게 비치느니라'],
        [16,'이같이 너희 빛이 사람 앞에 비치게 하여 그들로 너희 착한 행실을 보고 하늘에 계신 너희 아버지께 영광을 돌리게 하라']
      ]}
    ]}
  ];

  const $ = id => document.getElementById(id);
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  const el = {};
  const state = {
    bible: normalizeBible(FALLBACK_BIBLE), bookIndex:0, chapterIndex:0, selected:null,
    comments:[], verseReactions:[], commentReactions:[], commentCounts:new Map(),
    reactedVerses:new Set(loadJson(STORAGE_REACTED_VERSES, [])), likedComments:new Set(loadJson(STORAGE_LIKED_COMMENTS, [])),
    dbOnline:!!db, reactionTableReady:true, commentsReady:true
  };

  function loadJson(key, fallback){ try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch(_){return fallback;} }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function escapeHtml(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function setMessage(text){ if(el.message) el.message.textContent = text || ''; }
  function countBy(rows, key){ const map = new Map(); rows.forEach(row => map.set(row[key], (map.get(row[key]) || 0) + 1)); return map; }
  function currentBook(){ return state.bible[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function allVerses(){ return state.bible.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function anonymousId(){ let id = localStorage.getItem(STORAGE_ID); if(!id){ id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem(STORAGE_ID, id); } return id; }
  function anonymousName(){ let name = localStorage.getItem(STORAGE_NAME); if(!name){ name = '익명' + Math.random().toString(36).slice(2,6).toUpperCase(); localStorage.setItem(STORAGE_NAME, name); } return name; }
  function formatDate(value){ const date = new Date(value); return Number.isNaN(date.getTime()) ? '방금 전' : new Intl.DateTimeFormat('ko-KR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}).format(date); }
  function normalizeBible(input){
    if(!Array.isArray(input) || !input.length) return [];
    if(input[0]?.chapters) return input.map(normalizeBook).filter(book => book.chapters.length);
    return normalizeFlatRows(input);
  }
  function normalizeBook(book, bookIndex){
    const key = book.key || book.bookKey || book.abbr || `book-${bookIndex}`;
    const name = book.name || book.bookName || key;
    const english = book.english || book.englishName || key;
    const chapters = (book.chapters || []).map((chapter, chapterIndex)=>{
      const number = Number(chapter.number || chapter.chapter || chapterIndex + 1);
      const verses = (chapter.verses || []).map(row=>{
        const verseNumber = Number(Array.isArray(row) ? row[0] : row.number || row.verse);
        const text = Array.isArray(row) ? row[1] : row.text;
        return {id:`${key}-${number}-${verseNumber}`, bookKey:key, bookName:name, english, chapter:number, number:verseNumber, text:String(text || '')};
      }).filter(verse => verse.text && Number.isFinite(verse.number));
      return {number, subtitle:chapter.subtitle || '말씀', pageLeft:chapter.pageLeft || `${name} · ${number}장`, pageRight:chapter.pageRight || `${name} · 말씀`, startPage:Number(chapter.startPage || book.startPage || 1) + chapterIndex, verses};
    }).filter(chapter => chapter.verses.length);
    return {key, name, english, startPage:Number(book.startPage || 1), chapters};
  }
  function normalizeFlatRows(rows){
    const bookMap = new Map();
    rows.forEach(row=>{
      const key = row.bookKey || row.book || row.key || row.abbr;
      const name = row.bookName || row.book_name || row.name || key;
      const chapterNumber = Number(row.chapter);
      const verseNumber = Number(row.verse || row.number);
      if(!key || !chapterNumber || !verseNumber || !row.text) return;
      if(!bookMap.has(key)) bookMap.set(key, {key, name, english:row.english || key, startPage:1, chapters:new Map()});
      const book = bookMap.get(key);
      if(!book.chapters.has(chapterNumber)) book.chapters.set(chapterNumber, {number:chapterNumber, subtitle:'말씀', pageLeft:`${name} · ${chapterNumber}장`, pageRight:`${name} · 말씀`, startPage:chapterNumber, verses:[]});
      book.chapters.get(chapterNumber).verses.push({id:`${key}-${chapterNumber}-${verseNumber}`, bookKey:key, bookName:name, english:book.english, chapter:chapterNumber, number:verseNumber, text:String(row.text)});
    });
    return [...bookMap.values()].map(book => ({...book, chapters:[...book.chapters.values()].sort((a,b)=>a.number-b.number)}));
  }

  async function init(){
    ['leftVerses','rightVerses','selectedReference','selectedVerseText','commentList','commentTotal','commentForm','commentInput','moodSelect','message','bookSelect','chapterSelect','readerTitleEnglish','readerTitle','readerSubtitle','pageLeftTitle','pageRightTitle','anonymousBadge','copyVerseButton','emotionRow','emotionBars','topEmotionLabel','recommendMoodLabel','recommendList','bottomDock','statComments','statReactions','statSelected','nicknameInput','randomNameButton','saveNameButton','profileStatus'].forEach(id => el[id] = $(id));
    document.body.classList.add('v5-reader-ready');
    ensureChrome();
    state.selected = currentChapter().verses.find(verse => verse.number === 6) || currentChapter().verses[0];
    bindEvents();
    render();
    await loadBibleData();
    await loadServerData();
    window.BJTReader = {state, render, openVerse, loadServerData, reactToVerse, reactToComment};
  }

  async function loadBibleData(){
    try{
      const response = await fetch(DATA_URL, {cache:'no-store'});
      if(!response.ok) return;
      const text = await response.text();
      if(!text.trim()) return;
      const normalized = normalizeBible(JSON.parse(text));
      if(!normalized.length) return;
      state.bible = normalized;
      keepValidSelection();
      render();
      setMessage('성경 데이터를 불러왔습니다.');
    }catch(error){ console.warn('Bible data load skipped', error); }
  }
  async function loadServerData(){
    if(!db){ state.dbOnline = false; render(); setMessage('Supabase 연결을 확인해 주세요.'); return; }
    state.dbOnline = true;
    const [comments, verseReactions, commentReactions] = await Promise.all([fetchComments(), fetchVerseReactions(), fetchCommentReactions()]);
    state.comments = comments;
    state.verseReactions = verseReactions;
    state.commentReactions = commentReactions;
    state.commentCounts = countBy(comments, 'verse_id');
    state.reactedVerses = new Set([...state.reactedVerses, ...verseReactions.filter(row => row.anonymous_id === anonymousId()).map(row => `${row.verse_id}:${row.reaction_type}`)]);
    state.likedComments = new Set([...state.likedComments, ...commentReactions.filter(row => row.anonymous_id === anonymousId()).map(row => row.comment_id)]);
    saveJson(STORAGE_REACTED_VERSES, [...state.reactedVerses]);
    saveJson(STORAGE_LIKED_COMMENTS, [...state.likedComments]);
    render();
  }
  async function fetchComments(){
    const base = 'id, verse_id, user_name, content, created_at, anonymous_id, mood';
    const extended = `${base}, report_count, deleted_at`;
    let result = await db.from('comments').select(extended).is('deleted_at', null).order('created_at', {ascending:false});
    if(result.error) result = await db.from('comments').select(base).order('created_at', {ascending:false});
    if(result.error){ state.commentsReady = false; console.warn('comments select failed', result.error); return []; }
    state.commentsReady = true;
    return (result.data || []).filter(row => !row.deleted_at);
  }
  async function fetchVerseReactions(){
    const result = await db.from('verse_reactions').select('id, verse_id, anonymous_id, reaction_type, created_at').order('created_at', {ascending:false});
    if(result.error){ state.reactionTableReady = false; return []; }
    state.reactionTableReady = true;
    return result.data || [];
  }
  async function fetchCommentReactions(){
    const result = await db.from('comment_reactions').select('id, comment_id, anonymous_id, reaction_type, created_at').order('created_at', {ascending:false});
    return result.error ? [] : (result.data || []);
  }
  function keepValidSelection(){
    if(state.selected && findVerse(state.selected.id)){
      const found = findVerse(state.selected.id);
      state.bookIndex = state.bible.findIndex(book => book.key === found.bookKey);
      state.chapterIndex = currentBook().chapters.findIndex(chapter => chapter.number === found.chapter);
      state.selected = found;
      return;
    }
    state.bookIndex = 0; state.chapterIndex = 0; state.selected = currentChapter().verses[0];
  }
  function pageOffsetForSelected(){
    const verses = currentChapter().verses;
    const index = Math.max(0, verses.findIndex(verse => verse.id === state.selected?.id));
    const maxOffset = Math.max(0, Math.floor((verses.length - 1) / VERSES_PER_SPREAD) * VERSES_PER_SPREAD);
    return Math.min(maxOffset, Math.floor(index / VERSES_PER_SPREAD) * VERSES_PER_SPREAD);
  }
  function ensureChrome(){
    if(!document.querySelector('.reader-footbar')){
      const bar = document.createElement('div');
      bar.className = 'reader-footbar';
      bar.innerHTML = '<button type="button" data-reader-first>처음</button><button type="button" data-reader-prev>‹ 이전</button><span id="readerProgress">1 / 1502</span><button type="button" data-reader-next>다음 ›</button><button type="button" data-reader-last>마지막</button>';
      document.querySelector('.book-frame')?.insertAdjacentElement('afterend', bar);
    }
    if(!document.querySelector('.v5-panel-tabs')){
      const tabs = document.createElement('div');
      tabs.className = 'v5-panel-tabs';
      tabs.innerHTML = '<button class="is-active" type="button">묵상</button><button type="button" data-jump-recommend>추천</button><button type="button" data-jump-profile>익명</button>';
      document.querySelector('#commentPanel')?.prepend(tabs);
    }
    const copy = el.copyVerseButton || $('copyVerseButton');
    if(copy) copy.textContent = '구절 복사';
  }
  function bindEvents(){
    capture(el.commentForm, 'submit', submitComment);
    capture(el.bookSelect, 'change', event => { state.bookIndex = Number(event.target.value); state.chapterIndex = 0; state.selected = currentChapter().verses[0]; render(); });
    capture(el.chapterSelect, 'change', event => { state.chapterIndex = Number(event.target.value); state.selected = currentChapter().verses[0]; render(); });
    capture($('prevChapter'), 'click', () => moveChapter(-1));
    capture($('nextChapter'), 'click', () => moveChapter(1));
    capture(el.copyVerseButton, 'click', copyVerse);
    capture($('searchForm'), 'submit', searchVerse);
    capture(el.saveNameButton, 'click', saveNickname);
    capture(el.randomNameButton, 'click', randomNickname);
    document.addEventListener('click', event=>{
      const verse = event.target.closest('[data-verse-id]'); if(verse){ stop(event); openVerse(verse.dataset.verseId); return; }
      const emotion = event.target.closest('[data-verse-emotion]'); if(emotion){ stop(event); reactToVerse(emotion.dataset.verseEmotion); return; }
      const heart = event.target.closest('[data-heart]'); if(heart){ stop(event); reactToComment(heart.dataset.heart); return; }
      const rec = event.target.closest('[data-open-verse]'); if(rec){ stop(event); openVerse(rec.dataset.openVerse); return; }
      if(event.target.closest('[data-reader-prev]')){ stop(event); moveChapter(-1); return; }
      if(event.target.closest('[data-reader-next]')){ stop(event); moveChapter(1); return; }
      if(event.target.closest('[data-reader-first]')){ stop(event); state.bookIndex=0; state.chapterIndex=0; state.selected=currentChapter().verses[0]; render(); return; }
      if(event.target.closest('[data-reader-last]')){ stop(event); state.bookIndex=state.bible.length-1; state.chapterIndex=currentBook().chapters.length-1; state.selected=currentChapter().verses.at(-1); render(); return; }
      const moodJump = event.target.closest('[data-mood-jump]'); if(moodJump){ stop(event); showMoodRecommendations(moodJump.dataset.moodJump); return; }
      if(event.target.closest('[data-jump-recommend]')) document.querySelector('#recommendPanel')?.scrollIntoView({block:'nearest'});
      if(event.target.closest('[data-jump-profile]')) document.querySelector('.profile-card')?.scrollIntoView({block:'nearest'});
    }, true);
  }
  function stop(event){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
  function capture(node, type, handler){ if(node) node.addEventListener(type, event => { stop(event); handler(event); }, true); }

  function render(){ ensureChrome(); renderSelectors(); renderHeader(); renderBible(); renderPanel(); renderStats(); renderBottomDock(); }
  function renderSelectors(){
    if(el.bookSelect){ el.bookSelect.innerHTML = state.bible.map((book,index)=>`<option value="${index}">${book.name}</option>`).join(''); el.bookSelect.value = String(state.bookIndex); }
    if(el.chapterSelect){ el.chapterSelect.innerHTML = currentBook().chapters.map((chapter,index)=>`<option value="${index}">${chapter.number}장</option>`).join(''); el.chapterSelect.value = String(state.chapterIndex); }
  }
  function renderHeader(){
    const book = currentBook(); const chapter = currentChapter();
    if(el.readerTitleEnglish) el.readerTitleEnglish.textContent = book.english;
    if(el.readerTitle) el.readerTitle.textContent = `${book.name} ${chapter.number}장`;
    if(el.readerSubtitle) el.readerSubtitle.textContent = chapter.subtitle || '말씀';
    if(el.pageLeftTitle) el.pageLeftTitle.textContent = chapter.pageLeft || `${book.name} · ${chapter.number}장`;
    if(el.pageRightTitle) el.pageRightTitle.textContent = chapter.pageRight || `${book.name} · 말씀`;
    const progress = $('readerProgress'); if(progress) progress.textContent = `${(chapter.startPage || book.startPage || 1) + Math.floor(pageOffsetForSelected()/VERSES_PER_SPREAD)} / 1502`;
  }
  function renderBible(){
    const verses = currentChapter().verses;
    const visible = verses.slice(pageOffsetForSelected(), pageOffsetForSelected() + VERSES_PER_SPREAD);
    const mid = Math.ceil(visible.length/2);
    if(el.leftVerses) el.leftVerses.innerHTML = visible.slice(0, mid).map(renderVerseRow).join('');
    if(el.rightVerses) el.rightVerses.innerHTML = visible.slice(mid).map(renderVerseRow).join('');
  }
  function renderVerseRow(verse){
    const selected = state.selected?.id === verse.id ? ' is-selected' : '';
    const count = state.commentCounts.get(verse.id) || 0;
    const reactions = state.verseReactions.filter(row => row.verse_id === verse.id).length;
    return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}"><span class="verse-number">${verse.number}</span><span class="verse-text">${escapeHtml(verse.text)}</span><span class="comment-count ${count || reactions ? 'has-comments' : 'is-empty'}">${count ? count : reactions ? '✦'+reactions : ''}</span></button>`;
  }
  function renderPanel(){
    const selected = state.selected || currentChapter().verses[0];
    const rows = state.comments.filter(comment => comment.verse_id === selected.id).sort((a,b)=>Date.parse(b.created_at || 0)-Date.parse(a.created_at || 0));
    if(el.selectedReference) el.selectedReference.textContent = `${selected.bookName} ${selected.chapter}장 ${selected.number}절`;
    if(el.selectedVerseText) el.selectedVerseText.textContent = selected.text;
    if(el.commentTotal) el.commentTotal.textContent = String(rows.length);
    if(el.commentList) el.commentList.innerHTML = rows.length ? rows.map(renderCommentCard).join('') : `<p class="comment-empty">아직 이 절에는 묵상이 없습니다. 첫 마음을 조용히 남겨보세요.</p>`;
    renderEmotionRow(selected);
    renderEmotionBars(selected);
    renderRecommendations(selected);
    renderProfile();
  }
  function renderEmotionRow(selected){
    if(!el.emotionRow) return;
    el.emotionRow.innerHTML = EMOTIONS.map(item=>{
      const count = state.verseReactions.filter(row => row.verse_id === selected.id && row.reaction_type === item.key).length;
      const reacted = state.reactedVerses.has(`${selected.id}:${item.key}`);
      return `<button class="emotion-pill ${reacted ? 'is-active' : ''}" type="button" data-verse-emotion="${item.key}"><span>${item.icon}</span>${item.label}<b>${count}</b></button>`;
    }).join('');
  }
  function renderEmotionBars(selected){
    if(!el.emotionBars) return;
    const counts = EMOTIONS.map(item => ({...item, count:state.verseReactions.filter(row => row.verse_id === selected.id && row.reaction_type === item.key).length}));
    const max = Math.max(1, ...counts.map(item => item.count));
    const top = counts.slice().sort((a,b)=>b.count-a.count)[0];
    if(el.topEmotionLabel) el.topEmotionLabel.textContent = top.count ? `${top.label} ${top.count}` : '아직 조용해요';
    el.emotionBars.innerHTML = counts.map(item => `<div class="emotion-bar"><span>${item.icon} ${item.label}</span><i><b style="width:${Math.round(item.count/max*100)}%"></b></i><strong>${item.count}</strong></div>`).join('');
  }
  function renderRecommendations(selected, forcedMood){
    if(!el.recommendList) return;
    const mood = forcedMood || dominantMood(selected) || '위로';
    if(el.recommendMoodLabel) el.recommendMoodLabel.textContent = mood;
    const ids = smartRecommendationIds(selected, mood);
    el.recommendList.innerHTML = ids.map(id => findVerse(id)).filter(Boolean).slice(0,5).map(verse => `<button class="recommend-item" type="button" data-open-verse="${verse.id}"><span>${verse.bookName} ${verse.chapter}:${verse.number}</span><strong>${escapeHtml(verse.text)}</strong></button>`).join('') || '<p class="comment-empty">추천할 말씀이 아직 없습니다.</p>';
  }
  function dominantMood(selected){
    const top = EMOTIONS.map(item => ({...item, count:state.verseReactions.filter(row => row.verse_id === selected.id && row.reaction_type === item.key).length})).sort((a,b)=>b.count-a.count)[0];
    return top?.count ? top.mood : (state.comments.find(comment => comment.verse_id === selected.id)?.mood || null);
  }
  function smartRecommendationIds(selected, mood){
    const coReactors = new Set(state.verseReactions.filter(row => row.verse_id === selected.id).map(row => row.anonymous_id));
    const coIds = [...countBy(state.verseReactions.filter(row => coReactors.has(row.anonymous_id) && row.verse_id !== selected.id), 'verse_id').entries()].sort((a,b)=>b[1]-a[1]).map(([id])=>id);
    const moodIds = MOOD_RECOMMENDATIONS[mood] || [];
    const context = currentChapter().verses.filter(verse => verse.id !== selected.id).slice(0,4).map(verse => verse.id);
    return [...new Set([...coIds, ...moodIds, ...context])].filter(id => id !== selected.id);
  }
  function renderCommentCard(comment){
    const hearts = state.commentReactions.filter(row => row.comment_id === comment.id).length;
    const liked = state.likedComments.has(comment.id);
    return `<article class="comment-item"><div class="comment-meta"><span class="comment-avatar"></span><span class="comment-author">${escapeHtml(comment.user_name || '익명')}</span><time>${escapeHtml(formatDate(comment.created_at))}</time></div>${comment.mood ? `<span class="comment-mood">${escapeHtml(comment.mood)}</span>` : ''}<p class="comment-body">${escapeHtml(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${liked ? 'is-active' : ''}" type="button" data-heart="${comment.id}">♡ 공감 ${hearts}</button></div></article>`;
  }
  function renderProfile(){
    if(el.nicknameInput && document.activeElement !== el.nicknameInput) el.nicknameInput.value = anonymousName();
    if(el.anonymousBadge) el.anonymousBadge.textContent = `${anonymousName()} · 익명으로 작성`;
    if(el.profileStatus) el.profileStatus.textContent = state.dbOnline ? '로컬 익명 ID' : '오프라인';
  }
  function renderStats(){
    if(el.statComments) el.statComments.textContent = String(state.comments.length);
    if(el.statReactions) el.statReactions.textContent = String(state.verseReactions.length);
    if(el.statSelected) el.statSelected.textContent = `${state.selected?.number || 1}절`;
  }
  function renderBottomDock(){
    if(!el.bottomDock) return;
    const selected = state.selected || currentChapter().verses[0];
    const ids = smartRecommendationIds(selected, dominantMood(selected) || '위로').slice(0,4);
    el.bottomDock.innerHTML = ids.map(id => findVerse(id)).filter(Boolean).map(verse => `<button type="button" data-open-verse="${verse.id}">${verse.bookName} ${verse.chapter}:${verse.number}</button>`).join('');
  }
  function openVerse(id){
    const verse = findVerse(id); if(!verse) return;
    state.bookIndex = state.bible.findIndex(book => book.key === verse.bookKey);
    state.chapterIndex = currentBook().chapters.findIndex(chapter => chapter.number === verse.chapter);
    state.selected = verse;
    render();
  }
  function moveChapter(step){
    let bi = state.bookIndex, ci = state.chapterIndex + step;
    if(ci < 0){ bi = Math.max(0, bi - 1); ci = state.bible[bi].chapters.length - 1; }
    if(ci >= state.bible[bi].chapters.length){ bi = Math.min(state.bible.length - 1, bi + 1); ci = 0; }
    state.bookIndex = bi; state.chapterIndex = ci; state.selected = currentChapter().verses[0]; render();
  }
  async function reactToVerse(type){
    if(!state.selected) return;
    const localKey = `${state.selected.id}:${type}`;
    if(state.reactedVerses.has(localKey)){ setMessage('이미 이 감정으로 반응했어요.'); return; }
    if(!db || !state.reactionTableReady){
      state.reactedVerses.add(localKey); saveJson(STORAGE_REACTED_VERSES, [...state.reactedVerses]);
      state.verseReactions.unshift({id:localKey, verse_id:state.selected.id, anonymous_id:anonymousId(), reaction_type:type, created_at:new Date().toISOString()});
      render(); setMessage('로컬에 감정 반응을 남겼습니다. Supabase verse_reactions SQL 실행 후 서버 저장됩니다.'); return;
    }
    const result = await db.from('verse_reactions').insert({verse_id:state.selected.id, anonymous_id:anonymousId(), reaction_type:type}).select('id, verse_id, anonymous_id, reaction_type, created_at').single();
    if(result.error){ state.reactionTableReady = false; setMessage('verse_reactions 테이블 확인 필요. 일단 로컬 반응으로 표시합니다.'); state.reactedVerses.add(localKey); saveJson(STORAGE_REACTED_VERSES, [...state.reactedVerses]); render(); return; }
    state.verseReactions.unshift(result.data); state.reactedVerses.add(localKey); saveJson(STORAGE_REACTED_VERSES, [...state.reactedVerses]); render(); setMessage('이 절에 감정 반응을 남겼습니다.');
  }
  async function submitComment(){
    if(!db){ setMessage('Supabase 연결 후 묵상을 남길 수 있어요.'); return; }
    const content = el.commentInput.value.trim();
    if(!content) return;
    if(content.length > 1000){ setMessage('묵상은 1000자 이하로 남겨주세요.'); return; }
    const button = el.commentForm.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = '저장 중…';
    const payload = {verse_id:state.selected.id, user_name:anonymousName(), anonymous_id:anonymousId(), mood:el.moodSelect?.value || '묵상', content};
    const result = await db.from('comments').insert(payload).select('id, verse_id, user_name, content, created_at, anonymous_id, mood').single();
    button.disabled = false; button.textContent = '등록';
    if(result.error){ console.warn(result.error); setMessage(`저장 실패: ${result.error.message || 'comments 스키마 확인'}`); return; }
    el.commentInput.value = ''; await loadServerData(); openVerse(result.data.verse_id); setMessage('묵상을 저장했습니다.');
  }
  async function reactToComment(commentId){
    if(!db || state.likedComments.has(commentId)) return;
    const result = await db.from('comment_reactions').insert({comment_id:commentId, anonymous_id:anonymousId(), reaction_type:'heart'}).select('id, comment_id, anonymous_id, reaction_type, created_at').single();
    if(result.error){ setMessage('공감 저장에 실패했습니다.'); return; }
    state.commentReactions.unshift(result.data); state.likedComments.add(commentId); saveJson(STORAGE_LIKED_COMMENTS, [...state.likedComments]); renderPanel();
  }
  async function copyVerse(){
    if(!state.selected) return;
    const text = `${state.selected.bookName} ${state.selected.chapter}:${state.selected.number} ${state.selected.text}`;
    try{ await navigator.clipboard.writeText(text); setMessage('구절을 복사했습니다.'); }
    catch(_){ setMessage(text); }
  }
  function searchVerse(){
    const query = $('searchInput')?.value.trim(); if(!query) return;
    const numeric = query.replace(/[^0-9]/g, '');
    const match = allVerses().find(verse => verse.text.includes(query) || `${verse.bookName} ${verse.chapter}:${verse.number}`.includes(query) || `${verse.bookName} ${verse.chapter}장 ${verse.number}절`.includes(query) || String(verse.number) === numeric);
    match ? openVerse(match.id) : setMessage(`“${query}”에 맞는 말씀을 찾지 못했습니다.`);
  }
  function saveNickname(){
    const name = (el.nicknameInput?.value || '').trim().slice(0,24) || anonymousName();
    localStorage.setItem(STORAGE_NAME, name);
    renderProfile(); setMessage('익명 닉네임을 저장했습니다.');
  }
  function randomNickname(){
    const names = ['새벽별','은혜노트','조용한순례자','작은촛불','시냇가나무','평안한마음','말씀길손'];
    const name = names[Math.floor(Math.random()*names.length)] + Math.floor(Math.random()*90 + 10);
    localStorage.setItem(STORAGE_NAME, name);
    renderProfile(); setMessage('새 익명 닉네임을 만들었습니다.');
  }
  function showMoodRecommendations(mood){
    renderRecommendations(state.selected || currentChapter().verses[0], mood);
    document.querySelector('#recommendPanel')?.scrollIntoView({block:'nearest'});
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init, {once:true}) : init();
})();
