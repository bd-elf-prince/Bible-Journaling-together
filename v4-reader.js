// V4 reader: single active Bible reader + Supabase-backed verse comments MVP.
(function(){
  "use strict";

  const DATA_URL = "data/bible-kor.json";
  const SUPABASE_URL = "https://rayvvlerwxumqvmodvsy.supabase.co";
  const SUPABASE_KEY = "sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ";
  const STORAGE_NAME = "bjt-anonymous-name";
  const STORAGE_ID = "bjt-anonymous-id";
  const STORAGE_LIKED = "bjt-v4-liked-comment-ids";
  const STORAGE_REPORTED = "bjt-v4-reported-comment-ids";
  const STORAGE_SUBMIT_LOG = "bjt-v4-submit-log";
  const STORAGE_REPORT_LOG = "bjt-v4-report-log";
  const PHOTO_VERSES_PER_SPREAD = 10;

  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  const FALLBACK_BIBLE = [
    {
      key:"gen", name:"창세기", english:"Genesis", startPage:3,
      chapters:[{
        number:1, subtitle:"태초의 빛과 창조의 질서", pageLeft:"창세기 · 첫째 날", pageRight:"창세기 · 좋았더라",
        verses:[
          [1,"태초에 하나님이 천지를 창조하시니라"],
          [2,"땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라"],
          [3,"하나님이 이르시되 빛이 있으라 하시니 빛이 있었고"],
          [4,"빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사"],
          [5,"하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라"],
          [6,"하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고"],
          [7,"하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라"],
          [8,"하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라"],
          [9,"하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라"],
          [10,"하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라"],
          [11,"하나님이 이르시되 땅은 풀과 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내라 하시니 그대로 되어"],
          [12,"땅이 풀과 각기 종류대로 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내니 하나님이 보시기에 좋았더라"],
          [13,"저녁이 되고 아침이 되니 이는 셋째 날이니라"],
          [14,"하나님이 이르시되 하늘의 궁창에 광명체들이 있어 낮과 밤을 나뉘게 하고 그것들로 징조와 계절과 날과 해를 이루게 하라"],
          [15,"또 광명체들이 하늘의 궁창에 있어 땅을 비추라 하시니 그대로 되니라"],
          [16,"하나님이 두 큰 광명체를 만드사 큰 광명체로 낮을 주관하게 하시고 작은 광명체로 밤을 주관하게 하시며 또 별들을 만드시고"],
          [17,"하나님이 그것들을 하늘의 궁창에 두어 땅을 비추게 하시며"],
          [18,"낮과 밤을 주관하게 하시고 빛과 어둠을 나뉘게 하시니 하나님이 보시기에 좋았더라"],
          [19,"저녁이 되고 아침이 되니 이는 넷째 날이니라"],
          [20,"하나님이 이르시되 물들은 생물을 번성하게 하라 땅 위 하늘의 궁창에는 새가 날으라 하시고"],
          [21,"하나님이 큰 바다 짐승들과 물에서 번성하여 움직이는 모든 생물을 그 종류대로, 날개 있는 모든 새를 그 종류대로 창조하시니 하나님이 보시기에 좋았더라"],
          [22,"하나님이 그들에게 복을 주시며 이르시되 생육하고 번성하여 여러 바닷물에 충만하라 새들도 땅에 번성하라 하시니라"],
          [23,"저녁이 되고 아침이 되니 이는 다섯째 날이니라"],
          [24,"하나님이 이르시되 땅은 생물을 그 종류대로 내되 가축과 기는 것과 땅의 짐승을 종류대로 내라 하시니 그대로 되니라"],
          [25,"하나님이 땅의 짐승을 그 종류대로, 가축을 그 종류대로, 땅에 기는 모든 것을 그 종류대로 만드시니 하나님이 보시기에 좋았더라"],
          [26,"하나님이 이르시되 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그들로 바다의 물고기와 하늘의 새와 가축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고"],
          [27,"하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고"],
          [28,"하나님이 그들에게 복을 주시며 이르시되 생육하고 번성하여 땅에 충만하라 땅을 정복하라 바다의 물고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라"],
          [29,"하나님이 이르시되 내가 온 지면의 씨 맺는 모든 채소와 씨 가진 열매 맺는 모든 나무를 너희에게 주노니 너희의 먹을거리가 되리라"],
          [30,"또 땅의 모든 짐승과 하늘의 모든 새와 생명이 있어 땅에 기는 모든 것에게는 모든 푸른 풀을 먹을거리로 주노라 하시니 그대로 되니라"],
          [31,"하나님이 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라"]
        ]
      }]
    },
    {
      key:"ps", name:"시편", english:"Psalms", startPage:621,
      chapters:[{number:23, subtitle:"목자 되신 주님의 평안", pageLeft:"시편 · 푸른 풀밭", pageRight:"시편 · 잔이 넘치나이다", verses:[[1,"여호와는 나의 목자시니 내게 부족함이 없으리로다"],[2,"그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다"],[3,"내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다"],[4,"내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라"],[5,"주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다"],[6,"내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다"]]}]
    },
    {
      key:"mat", name:"마태복음", english:"Matthew", startPage:1221,
      chapters:[{number:5, subtitle:"산 위에서 들려온 복과 빛의 말씀", pageLeft:"마태복음 · 팔복", pageRight:"마태복음 · 소금과 빛", verses:[[3,"심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요"],[4,"애통하는 자는 복이 있나니 그들이 위로를 받을 것임이요"],[5,"온유한 자는 복이 있나니 그들이 땅을 기업으로 받을 것임이요"],[6,"의에 주리고 목마른 자는 복이 있나니 그들이 배부를 것임이요"],[7,"긍휼히 여기는 자는 복이 있나니 그들이 긍휼히 여김을 받을 것임이요"],[8,"마음이 청결한 자는 복이 있나니 그들이 하나님을 볼 것임이요"],[9,"화평하게 하는 자는 복이 있나니 그들이 하나님의 아들이라 일컬음을 받을 것임이요"],[10,"의를 위하여 박해를 받은 자는 복이 있나니 천국이 그들의 것임이라"],[13,"너희는 세상의 소금이니 소금이 만일 그 맛을 잃으면 무엇으로 짜게 하리요"],[14,"너희는 세상의 빛이라 산 위에 있는 동네가 숨겨지지 못할 것이요"],[16,"이같이 너희 빛이 사람 앞에 비치게 하여 그들로 너희 착한 행실을 보고 하나님께 영광을 돌리게 하라"]]}]
    }
  ];

  const $ = id => document.getElementById(id);
  const el = {};
  const state = {
    bible: normalizeBible(FALLBACK_BIBLE),
    bookIndex:0,
    chapterIndex:0,
    selected:null,
    comments:[],
    commentCounts:new Map(),
    commentReactions:[],
    liked:new Set(loadJson(STORAGE_LIKED, [])),
    reported:new Set(loadJson(STORAGE_REPORTED, [])),
    photoOffset:0,
    schemaMode:"strict",
    dbOnline:false,
    adminMode:new URLSearchParams(location.search).get("admin") === "1" || localStorage.getItem("bjt-admin-mode") === "true"
  };

  function loadJson(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(error){ return fallback; }
  }
  function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function saveLiked(){ saveJson(STORAGE_LIKED, [...state.liked]); }
  function saveReported(){ saveJson(STORAGE_REPORTED, [...state.reported]); }
  function currentBook(){ return state.bible[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function allVerses(){ return state.bible.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function stop(event){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
  function setMessage(text){ if(el.message) el.message.textContent = text || ""; }
  function anonymousId(){
    let id = localStorage.getItem(STORAGE_ID);
    if(!id){ id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem(STORAGE_ID, id); }
    return id;
  }
  function anonymousName(){
    let name = localStorage.getItem(STORAGE_NAME);
    if(!name){ name = "익명" + Math.random().toString(36).slice(2,6).toUpperCase(); localStorage.setItem(STORAGE_NAME, name); }
    return name;
  }
  function formatDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "방금 전";
    return new Intl.DateTimeFormat("ko-KR", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"}).format(date);
  }

  function normalizeBible(input){
    if(!Array.isArray(input) || !input.length) return [];
    if(input[0]?.chapters) return input.map(normalizeBook).filter(book => book.chapters.length);
    return normalizeFlatRows(input);
  }
  function normalizeBook(book, bookIndex){
    const key = book.key || book.bookKey || `book-${bookIndex}`;
    const name = book.name || book.bookName || key;
    const english = book.english || book.englishName || key;
    const chapters = (book.chapters || []).map((chapter, chapterIndex) => {
      const number = Number(chapter.number || chapter.chapter || chapterIndex + 1);
      const verses = (chapter.verses || []).map(row => {
        const verseNumber = Array.isArray(row) ? row[0] : row.number || row.verse;
        const text = Array.isArray(row) ? row[1] : row.text;
        return {id:`${key}-${number}-${verseNumber}`, bookKey:key, bookName:name, english, chapter:number, number:Number(verseNumber), text:String(text || "")};
      }).filter(verse => verse.text && Number.isFinite(verse.number));
      return {number, subtitle:chapter.subtitle || "말씀", pageLeft:chapter.pageLeft || `${name} · ${number}장`, pageRight:chapter.pageRight || `${name} · 말씀`, startPage:Number(chapter.startPage || book.startPage || 1) + chapterIndex, verses};
    }).filter(chapter => chapter.verses.length);
    return {key, name, english, startPage:Number(book.startPage || 1), chapters};
  }
  function normalizeFlatRows(rows){
    const bookMap = new Map();
    rows.forEach(row => {
      const key = row.bookKey || row.book || row.key;
      const name = row.bookName || row.book_name || row.name || key;
      const chapterNumber = Number(row.chapter);
      const verseNumber = Number(row.verse || row.number);
      if(!key || !chapterNumber || !verseNumber || !row.text) return;
      if(!bookMap.has(key)) bookMap.set(key, {key, name, english:row.english || key, startPage:1, chapters:new Map()});
      const book = bookMap.get(key);
      if(!book.chapters.has(chapterNumber)) book.chapters.set(chapterNumber, {number:chapterNumber, subtitle:"말씀", pageLeft:`${name} · ${chapterNumber}장`, pageRight:`${name} · 말씀`, startPage:chapterNumber, verses:[]});
      book.chapters.get(chapterNumber).verses.push({id:`${key}-${chapterNumber}-${verseNumber}`, bookKey:key, bookName:name, english:book.english, chapter:chapterNumber, number:verseNumber, text:String(row.text)});
    });
    return [...bookMap.values()].map(book => ({...book, chapters:[...book.chapters.values()].sort((a,b)=>a.number-b.number)}));
  }

  async function loadBibleData(){
    try{
      const response = await fetch(DATA_URL, {cache:"no-store"});
      if(!response.ok) return;
      const text = await response.text();
      if(!text.trim()) return;
      const normalized = normalizeBible(JSON.parse(text));
      if(!normalized.length) return;
      state.bible = normalized;
      keepValidSelection();
      render();
    }catch(error){ }
  }

  async function loadServerData(){
    if(!db){ state.dbOnline = false; render(); setMessage("Supabase 연결을 확인해 주세요."); return; }
    setMessage("서버 댓글을 불러오는 중입니다…");
    const [comments, reactions] = await Promise.all([fetchComments(), fetchCommentReactions()]);
    state.comments = comments;
    state.commentCounts = countBy(comments, "verse_id");
    state.commentReactions = reactions;
    state.liked = new Set([...state.liked, ...reactions.filter(row => row.anonymous_id === anonymousId()).map(row => row.comment_id)]);
    saveLiked();
    state.dbOnline = true;
    render();
    setMessage("");
  }
  async function fetchComments(){
    const extendedColumns = "id, verse_id, user_name, content, created_at, anonymous_id, mood, report_count, deleted_at";
    const baseColumns = "id, verse_id, user_name, content, created_at, anonymous_id, mood";
    let result = await db.from("comments").select(extendedColumns).is("deleted_at", null).order("created_at", {ascending:false});
    if(result.error){
      state.schemaMode = "legacy";
      result = await db.from("comments").select(baseColumns).order("created_at", {ascending:false});
    }else{
      state.schemaMode = "strict";
    }
    if(result.error){ setMessage("comments 테이블 확인 필요"); return []; }
    return (result.data || []).filter(comment => !comment.deleted_at);
  }
  async function fetchCommentReactions(){
    if(!db) return [];
    const result = await db.from("comment_reactions").select("id, comment_id, anonymous_id, reaction_type, created_at").order("created_at", {ascending:false});
    if(result.error) return [];
    return result.data || [];
  }

  function countBy(rows, key){
    const map = new Map();
    rows.forEach(row => map.set(row[key], (map.get(row[key]) || 0) + 1));
    return map;
  }
  function keepValidSelection(){
    if(state.selected && findVerse(state.selected.id)){
      const found = findVerse(state.selected.id);
      state.bookIndex = state.bible.findIndex(book => book.key === found.bookKey);
      state.chapterIndex = currentBook().chapters.findIndex(chapter => chapter.number === found.chapter);
      state.selected = found;
      return;
    }
    const firstBook = state.bible[0];
    state.bookIndex = 0;
    state.chapterIndex = 0;
    const genOne = firstBook?.key === "gen" ? firstBook.chapters.find(chapter => chapter.number === 1) : null;
    state.selected = (genOne?.verses.find(verse => verse.number === 6) || currentChapter().verses[0]);
  }
  function pageOffsetForSelected(){
    const verses = currentChapter().verses;
    const index = Math.max(0, verses.findIndex(verse => verse.id === state.selected?.id));
    const maxOffset = Math.max(0, Math.floor((verses.length - 1) / PHOTO_VERSES_PER_SPREAD) * PHOTO_VERSES_PER_SPREAD);
    return Math.min(maxOffset, Math.floor(index / PHOTO_VERSES_PER_SPREAD) * PHOTO_VERSES_PER_SPREAD);
  }

  function init(){
    ["leftVerses","rightVerses","selectedReference","selectedVerseText","commentList","commentTotal","commentForm","commentInput","moodSelect","message","bookSelect","chapterSelect","readerTitleEnglish","readerTitle","readerSubtitle","pageLeftTitle","pageRightTitle","anonymousBadge","copyVerseButton"].forEach(id => el[id] = $(id));
    document.body.classList.add("v4-reader-ready");
    state.selected = currentChapter().verses.find(verse => verse.number === 6) || currentChapter().verses[0];
    ensureChrome();
    bindEvents();
    exposeReader();
    render();
    loadBibleData().then(loadServerData);
  }
  function exposeReader(){
    window.V4Reader = {state, render, openVerse, loadBibleData, reloadComments:loadServerData, reportComment, adminDeleteComment};
  }

  function ensureChrome(){ ensureTabs(); ensurePageDecor(); ensureFootbar(); ensureScopeLabel(); }
  function ensureTabs(){
    const panel = $("commentPanel");
    if(!panel || panel.querySelector(".v4-panel-tabs")) return;
    const tabs = document.createElement("div");
    tabs.className = "v4-panel-tabs";
    tabs.innerHTML = '<button class="is-active" type="button">코멘트</button><button type="button">북마크</button>';
    panel.prepend(tabs);
  }
  function ensurePageDecor(){
    const leftInner = document.querySelector(".page-left .page-inner");
    const rightInner = document.querySelector(".page-right .page-inner");
    if(leftInner && !leftInner.querySelector(".v4-page-title")){
      const title = document.createElement("h1"); title.className = "v4-page-title";
      const ornament = document.createElement("div"); ornament.className = "v4-page-ornament";
      leftInner.querySelector(".page-kicker")?.insertAdjacentElement("afterend", title);
      title.insertAdjacentElement("afterend", ornament);
    }
    [leftInner, rightInner].forEach((inner, index) => {
      if(inner && !inner.querySelector(".page-number")){
        const page = document.createElement("span"); page.className = "page-number"; page.textContent = index === 0 ? "2" : "3"; inner.appendChild(page);
      }
    });
  }
  function ensureFootbar(){
    const stage = document.querySelector(".reader-stage");
    if(stage && !stage.querySelector(".today-word-pill")) stage.insertAdjacentHTML("beforeend", '<button class="today-word-pill" type="button">☀ 오늘의 말씀</button>');
    if(stage && !stage.querySelector(".listen-pill")) stage.insertAdjacentHTML("beforeend", '<button class="listen-pill" type="button">듣기 ▷</button>');
    if(document.querySelector(".reader-footbar")) return;
    const bar = document.createElement("div");
    bar.className = "reader-footbar";
    bar.innerHTML = '<button type="button" data-v4-first>≪ 처음으로</button><button type="button" data-v4-prev>‹</button><span id="readerProgress">3 / 1502</span><button type="button" data-v4-next>›</button><button type="button" data-v4-last>마지막으로 ≫</button>';
    document.querySelector(".book-frame")?.insertAdjacentElement("afterend", bar);
  }
  function ensureScopeLabel(){
    const title = document.querySelector(".comments-card .section-title");
    if(!title || $("commentScopeLabel")) return;
    const scope = document.createElement("span"); scope.id = "commentScopeLabel"; scope.textContent = "절별";
    const total = $("commentTotal"); total ? title.insertBefore(scope, total) : title.appendChild(scope);
  }

  function bindEvents(){
    capture(el.commentForm, "submit", submitComment);
    capture($("bookSelect"), "change", event => { state.bookIndex = Number(event.target.value); state.chapterIndex = 0; state.selected = currentChapter().verses[0]; render(); });
    capture($("chapterSelect"), "change", event => { state.chapterIndex = Number(event.target.value); state.selected = currentChapter().verses[0]; render(); });
    capture($("prevChapter"), "click", () => moveChapter(-1));
    capture($("nextChapter"), "click", () => moveChapter(1));
    capture($("copyVerseButton"), "click", copyVerse);
    capture($("searchForm"), "submit", searchVerse);
    capture($("fontSizeSelect"), "change", event => {
      const sizes = {normal:".91rem", large:"1.02rem", xlarge:"1.12rem"};
      document.querySelectorAll(".verses").forEach(node => node.style.fontSize = sizes[event.target.value] || sizes.normal);
    });
    document.addEventListener("click", event => {
      if(event.target.closest("[data-v4-prev]")){ stop(event); moveChapter(-1); }
      if(event.target.closest("[data-v4-next]")){ stop(event); moveChapter(1); }
      if(event.target.closest("[data-v4-first]")){ stop(event); state.bookIndex = 0; state.chapterIndex = 0; state.selected = currentChapter().verses.find(verse => verse.number === 6) || currentChapter().verses[0]; render(); }
      if(event.target.closest("[data-v4-last]")){ stop(event); state.bookIndex = state.bible.length - 1; state.chapterIndex = currentBook().chapters.length - 1; state.selected = currentChapter().verses.at(-1); render(); }
      const report = event.target.closest("[data-report-comment]");
      if(report){ stop(event); reportComment(report.dataset.reportComment); }
      const del = event.target.closest("[data-delete-comment]");
      if(del){ stop(event); adminDeleteComment(del.dataset.deleteComment); }
      const like = event.target.closest("[data-heart]");
      if(like){ stop(event); reactToComment(like.dataset.heart); }
    }, true);
  }
  function capture(node, type, handler){ if(node) node.addEventListener(type, event => { stop(event); handler(event); }, true); }

  function render(){ ensureChrome(); renderSelectors(); renderHeader(); renderBible(); renderPanel(); renderForm(); }
  function renderSelectors(){
    if(el.bookSelect){ el.bookSelect.innerHTML = state.bible.map((book,index) => `<option value="${index}">${book.name}</option>`).join(""); el.bookSelect.value = String(state.bookIndex); }
    if(el.chapterSelect){ el.chapterSelect.innerHTML = currentBook().chapters.map((chapter,index) => `<option value="${index}">${chapter.number}장</option>`).join(""); el.chapterSelect.value = String(state.chapterIndex); }
  }
  function renderHeader(){
    const book = currentBook(); const chapter = currentChapter();
    if(el.readerTitleEnglish) el.readerTitleEnglish.textContent = book.english;
    if(el.readerTitle) el.readerTitle.textContent = `${book.name} ${chapter.number}장`;
    if(el.readerSubtitle) el.readerSubtitle.textContent = chapter.subtitle || "말씀";
    if(el.pageLeftTitle) el.pageLeftTitle.textContent = chapter.pageLeft || `${book.name} · ${chapter.number}장`;
    if(el.pageRightTitle) el.pageRightTitle.textContent = chapter.pageRight || `${book.name} · 말씀`;
    const pageTitle = document.querySelector(".v4-page-title"); if(pageTitle) pageTitle.textContent = `${book.name} ${chapter.number}장`;
    const progress = $("readerProgress"); if(progress) progress.textContent = `${(chapter.startPage || book.startPage || 1) + Math.floor(pageOffsetForSelected() / PHOTO_VERSES_PER_SPREAD)} / 1502`;
  }
  function renderBible(){
    const verses = currentChapter().verses;
    const offset = pageOffsetForSelected();
    const visible = verses.slice(offset, offset + PHOTO_VERSES_PER_SPREAD);
    const mid = Math.ceil(visible.length / 2);
    if(el.leftVerses) el.leftVerses.innerHTML = visible.slice(0, mid).map(renderVerseRow).join("");
    if(el.rightVerses) el.rightVerses.innerHTML = visible.slice(mid).map(renderVerseRow).join("");
    document.querySelectorAll("[data-verse-id]").forEach(button => button.addEventListener("click", event => { stop(event); openVerse(button.dataset.verseId); }, true));
  }
  function renderVerseRow(verse){
    const selected = state.selected?.id === verse.id ? " is-selected" : "";
    const count = state.commentCounts.get(verse.id) || 0;
    return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}"><span class="verse-number">${verse.number}</span><span class="verse-text">${escapeHtml(verse.text)}</span><span class="comment-count ${count ? "has-comments" : "is-empty"}">${count || ""}</span></button>`;
  }
  function renderPanel(){
    const selected = state.selected || currentChapter().verses[0];
    const rows = state.comments.filter(comment => comment.verse_id === selected.id).sort((a,b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
    const title = document.querySelector(".comments-card .section-title h3");
    const scope = $("commentScopeLabel");
    if(title) title.textContent = "이 절의 코멘트";
    if(scope) scope.textContent = `${selected.number}절`;
    if(el.selectedReference) el.selectedReference.textContent = `${selected.bookName} ${selected.chapter}장 ${selected.number}절`;
    if(el.selectedVerseText) el.selectedVerseText.textContent = selected.text;
    if(el.commentTotal) el.commentTotal.textContent = String(rows.length);
    if(!el.commentList) return;
    el.commentList.innerHTML = rows.length ? rows.map(renderCommentCard).join("") : `<p class="comment-empty">아직 이 절에는 서버 코멘트가 없습니다.</p>`;
  }
  function renderCommentCard(comment){
    const hearts = state.commentReactions.filter(row => row.comment_id === comment.id).length;
    const liked = state.liked.has(comment.id);
    const reported = state.reported.has(comment.id);
    const canDelete = state.adminMode;
    const adminButton = canDelete ? `<button class="comment-admin-delete" type="button" data-delete-comment="${comment.id}">삭제</button>` : "";
    return `<article class="comment-item" data-comment-id="${comment.id}"><div class="comment-meta"><span class="comment-author">${escapeHtml(comment.user_name || "익명")}</span><time>${escapeHtml(formatDate(comment.created_at))}</time><button class="comment-report" type="button" data-report-comment="${comment.id}" ${reported ? "disabled" : ""}>${reported ? "신고됨" : "신고"}</button>${adminButton}</div>${comment.mood ? `<span class="comment-mood">${escapeHtml(comment.mood)}</span>` : ""}<p class="comment-body">${escapeHtml(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${liked ? "is-active" : ""}" type="button" data-heart="${comment.id}">♡ 좋아요 ${hearts}</button></div></article>`;
  }
  function renderForm(){
    if(el.commentInput){
      el.commentInput.disabled = !state.dbOnline;
      el.commentInput.placeholder = state.dbOnline ? "이 절에 대한 코멘트를 남겨보세요." : "서버 연결 후 코멘트를 남길 수 있어요.";
    }
    const submit = document.querySelector("#commentForm button[type='submit']"); if(submit) submit.disabled = !state.dbOnline;
    const copy = $("copyVerseButton"); if(copy) copy.style.visibility = "visible";
    if(el.anonymousBadge) el.anonymousBadge.textContent = `${anonymousName()} · 익명으로 작성`;
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

  function submitAllowed(){
    const now = Date.now();
    const log = loadJson(STORAGE_SUBMIT_LOG, []).filter(time => now - time < 10 * 60 * 1000);
    if(log.length >= 5) return false;
    if(log[0] && now - log[0] < 12 * 1000) return false;
    log.unshift(now); saveJson(STORAGE_SUBMIT_LOG, log); return true;
  }
  function reportAllowed(){
    const now = Date.now();
    const log = loadJson(STORAGE_REPORT_LOG, []).filter(time => now - time < 60 * 60 * 1000);
    if(log.length >= 10) return false;
    log.unshift(now); saveJson(STORAGE_REPORT_LOG, log); return true;
  }
  async function submitComment(){
    if(!db || !state.dbOnline){ setMessage("서버 연결을 확인해 주세요."); return; }
    const content = el.commentInput.value.trim().replace(/\s+$/g, "");
    if(!content) return;
    if(content.length > 1000){ setMessage("코멘트는 1000자 이하로 남겨주세요."); return; }
    if(!submitAllowed()){ setMessage("잠시 후 다시 남겨주세요."); return; }
    const button = el.commentForm.querySelector("button[type='submit']");
    button.disabled = true; button.textContent = "저장 중…";
    const payload = {verse_id:state.selected.id, user_name:anonymousName(), anonymous_id:anonymousId(), mood:el.moodSelect?.value || "묵상", content};
    let result = await db.from("comments").insert(payload).select("id, verse_id, user_name, content, created_at, anonymous_id, mood, report_count, deleted_at").single();
    if(result.error){ result = await db.from("comments").insert(payload).select("id, verse_id, user_name, content, created_at, anonymous_id, mood").single(); }
    button.disabled = false; button.textContent = "등록";
    if(result.error){ setMessage("서버 코멘트 저장에 실패했습니다."); return; }
    el.commentInput.value = "";
    await loadServerData();
    openVerse(result.data.verse_id);
    setMessage("서버에 코멘트를 저장했습니다.");
  }
  async function reactToComment(commentId){
    if(!db || state.liked.has(commentId)) return;
    const result = await db.from("comment_reactions").insert({comment_id:commentId, anonymous_id:anonymousId(), reaction_type:"heart"}).select("id, comment_id, anonymous_id, reaction_type, created_at").single();
    if(result.error){ setMessage("좋아요 저장에 실패했습니다."); return; }
    state.commentReactions.unshift(result.data); state.liked.add(commentId); saveLiked(); renderPanel();
  }
  async function reportComment(commentId){
    if(!db || state.reported.has(commentId)) return;
    if(!reportAllowed()){ setMessage("신고는 잠시 후 다시 시도해 주세요."); return; }
    const result = await db.from("comment_reports").insert({comment_id:commentId, anonymous_id:anonymousId(), reason:"user_report"}).select("id").single();
    if(result.error){ setMessage("신고 테이블 확인이 필요합니다."); return; }
    state.reported.add(commentId); saveReported(); renderPanel(); setMessage("신고가 접수되었습니다.");
  }
  async function adminDeleteComment(commentId){
    if(!db || !state.adminMode) return;
    let result = await db.from("comments").update({deleted_at:new Date().toISOString(), deleted_by:anonymousId(), delete_reason:"admin_delete"}).eq("id", commentId);
    if(result.error){ result = await db.from("comments").delete().eq("id", commentId); }
    if(result.error){ setMessage("삭제 권한 또는 스키마 확인이 필요합니다."); return; }
    await loadServerData();
    setMessage("코멘트를 삭제했습니다.");
  }
  async function copyVerse(){
    if(!state.selected) return;
    await navigator.clipboard?.writeText(`${state.selected.bookName} ${state.selected.chapter}:${state.selected.number} ${state.selected.text}`);
    setMessage("구절을 복사했습니다.");
  }
  function searchVerse(){
    const query = $("searchInput")?.value.trim(); if(!query) return;
    const numeric = query.replace(/[^0-9]/g, "");
    const match = allVerses().find(verse => verse.text.includes(query) || `${verse.bookName} ${verse.chapter}:${verse.number}`.includes(query) || `${verse.bookName} ${verse.chapter}장 ${verse.number}절`.includes(query) || String(verse.number) === numeric);
    match ? openVerse(match.id) : setMessage(`“${query}”에 맞는 말씀을 찾지 못했습니다.`);
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, {once:true}) : init();
})();
