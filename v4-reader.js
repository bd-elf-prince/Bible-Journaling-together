// V4 reader: photo-reference Bible reader + full-Bible data loader scaffold.
(function(){
  "use strict";

  const DATA_URL = "data/bible-kor.json";
  const STORAGE_COMMENTS = "bjt-v4-local-comments";
  const STORAGE_LIKED = "bjt-v4-liked-comments";
  const STORAGE_NAME = "bjt-anonymous-name";

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

  const SEED_COMMENTS = [
    {id:"seed-1",verse_id:"gen-1-3",user_name:"익명B7Q2",mood:"회복",content:"혼돈 속에서 먼저 빛을 부르시는 장면이 마음에 오래 남아요.",likes:14,created_at:"2026-06-28T09:30:00Z"},
    {id:"seed-2",verse_id:"gen-1-1",user_name:"익명K4M9",mood:"믿음",content:"시작이 내 손에 있지 않다는 사실이 오히려 편안하게 느껴집니다.",likes:11,created_at:"2026-06-28T10:10:00Z"},
    {id:"seed-3",verse_id:"gen-1-4",user_name:"익명H2P8",mood:"평안",content:"빛과 어둠을 나누신다는 말씀이 오늘 해야 할 선택을 정리해 주는 것 같아요.",likes:8,created_at:"2026-06-28T11:42:00Z"}
  ];

  const $ = id => document.getElementById(id);
  const el = {};
  const state = { bible: normalizeBible(FALLBACK_BIBLE), bookIndex:0, chapterIndex:0, selected:null, mode:"popular", comments:[...SEED_COMMENTS, ...loadJson(STORAGE_COMMENTS, [])], liked:new Set(loadJson(STORAGE_LIKED, [])) };

  function loadJson(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(error){ return fallback; } }
  function saveLocal(){ localStorage.setItem(STORAGE_COMMENTS, JSON.stringify(state.comments.filter(comment => comment.source === "local"))); }
  function saveLiked(){ localStorage.setItem(STORAGE_LIKED, JSON.stringify([...state.liked])); }
  function currentBook(){ return state.bible[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function allVerses(){ return state.bible.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function countFor(id){ return state.comments.filter(comment => comment.verse_id === id).length; }
  function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function stop(event){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
  function setMessage(text){ if(el.message) el.message.textContent = text || ""; }
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
      }).filter(verse => verse.text);
      return {number, subtitle:chapter.subtitle || "말씀", pageLeft:chapter.pageLeft || `${name} · ${number}장`, pageRight:chapter.pageRight || `${name} · 말씀`, startPage:Number(chapter.startPage || book.startPage || 1) + chapterIndex, verses};
    }).filter(chapter => chapter.verses.length);
    return {key, name, english, startPage:Number(book.startPage || 1), chapters};
  }
  function normalizeFlatRows(rows){
    const bookMap = new Map();
    rows.forEach(row => {
      const key = row.bookKey || row.book || row.key;
      const name = row.bookName || row.book_name || key;
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
      const data = await response.json();
      const normalized = normalizeBible(data);
      if(!normalized.length) return;
      state.bible = normalized;
      state.bookIndex = 0;
      state.chapterIndex = 0;
      state.selected = currentChapter().verses[0];
      render();
      setMessage("성경 본문 데이터를 불러왔습니다.");
    }catch(error){ }
  }

  function init(){
    ["leftVerses","rightVerses","selectedReference","selectedVerseText","commentList","commentTotal","commentForm","commentInput","moodSelect","message","bookSelect","chapterSelect","readerTitleEnglish","readerTitle","readerSubtitle","pageLeftTitle","pageRightTitle","anonymousBadge"].forEach(id => el[id] = $(id));
    document.body.classList.add("v4-reader-ready");
    state.selected = currentChapter().verses[0];
    installRuntimeStyle();
    ensureChrome();
    bindEvents();
    exposeReader();
    render();
    loadBibleData();
    window.setTimeout(render, 150);
    window.setTimeout(render, 800);
  }

  function exposeReader(){
    window.V4Reader = {state, render, openVerse, openPopular, loadBibleData};
    try{ window.renderAll = render; window.selectVerse = openVerse; window.moveChapter = moveChapter; }catch(error){}
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
    if(document.querySelector(".reader-footbar")) return;
    const bar = document.createElement("div");
    bar.className = "reader-footbar";
    bar.innerHTML = '<button type="button" data-v4-first>≪ 처음으로</button><button type="button" data-v4-prev>‹</button><span id="readerProgress">3 / 1502</span><button type="button" data-v4-next>›</button><button type="button" data-v4-last>마지막으로 ≫</button>';
    document.querySelector(".book-frame")?.insertAdjacentElement("afterend", bar);
  }
  function ensureScopeLabel(){
    const title = document.querySelector(".comments-card .section-title");
    if(!title || $("commentScopeLabel")) return;
    const scope = document.createElement("span"); scope.id = "commentScopeLabel"; scope.textContent = "인기순";
    const total = $("commentTotal"); total ? title.insertBefore(scope, total) : title.appendChild(scope);
  }
  function bindEvents(){
    capture(el.commentForm, "submit", submitComment);
    capture($("bookSelect"), "change", event => { state.bookIndex = Number(event.target.value); state.chapterIndex = 0; openPopular(); });
    capture($("chapterSelect"), "change", event => { state.chapterIndex = Number(event.target.value); openPopular(); });
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
      if(event.target.closest("[data-v4-first]")){ stop(event); state.bookIndex = 0; state.chapterIndex = 0; openPopular(); }
      if(event.target.closest("[data-v4-last]")){ stop(event); state.bookIndex = state.bible.length - 1; state.chapterIndex = currentBook().chapters.length - 1; openPopular(); }
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
    const progress = $("readerProgress"); if(progress) progress.textContent = `${chapter.startPage || book.startPage || 1} / 1502`;
  }
  function renderBible(){
    const verses = currentChapter().verses; const mid = Math.ceil(verses.length / 2);
    if(el.leftVerses) el.leftVerses.innerHTML = verses.slice(0, mid).map(renderVerseRow).join("");
    if(el.rightVerses) el.rightVerses.innerHTML = verses.slice(mid).map(renderVerseRow).join("");
    document.querySelectorAll("[data-verse-id]").forEach(button => button.addEventListener("click", event => { stop(event); openVerse(button.dataset.verseId); }, true));
  }
  function renderVerseRow(verse){
    const selected = state.mode === "verse" && state.selected?.id === verse.id ? " is-selected" : "";
    const count = countFor(verse.id);
    return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}"><span class="verse-number">${verse.number}</span><span class="verse-text">${escapeHtml(verse.text)}</span><span class="comment-count ${count ? "has-comments" : ""}">${count}</span></button>`;
  }
  function renderPanel(){
    const book = currentBook(); const chapter = currentChapter(); const ids = new Set(chapter.verses.map(verse => verse.id));
    const title = document.querySelector(".comments-card .section-title h3"); const scope = $("commentScopeLabel");
    let rows;
    if(state.mode === "verse"){
      rows = state.comments.filter(comment => comment.verse_id === state.selected.id).sort((a,b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
      if(title) title.textContent = "이 절의 코멘트"; if(scope) scope.textContent = `${state.selected.number}절`;
      if(el.selectedReference) el.selectedReference.textContent = `${state.selected.bookName} ${state.selected.chapter}장 ${state.selected.number}절`;
      if(el.selectedVerseText) el.selectedVerseText.textContent = state.selected.text;
    }else{
      rows = state.comments.filter(comment => ids.has(comment.verse_id)).sort((a,b) => (b.likes || 0) - (a.likes || 0) || Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
      if(title) title.textContent = "인기 코멘트"; if(scope) scope.textContent = `${book.name} ${chapter.number}장`;
      if(el.selectedReference) el.selectedReference.textContent = `${book.name} ${chapter.number}장`;
      if(el.selectedVerseText) el.selectedVerseText.textContent = "현재 장에서 많이 공감된 코멘트가 먼저 보입니다. 절 끝의 눌린 종이 자국 같은 코멘트 표시를 누르면 해당 절 코멘트만 모아볼 수 있어요.";
    }
    if(el.commentTotal) el.commentTotal.textContent = String(rows.length);
    if(!el.commentList) return;
    el.commentList.innerHTML = rows.length ? rows.map(renderCommentCard).join("") : `<p class="comment-empty">${state.mode === "verse" ? "아직 이 절에는 코멘트가 없습니다." : "아직 이 장에는 코멘트가 없습니다."}</p>`;
    el.commentList.querySelectorAll("[data-open-verse]").forEach(card => card.addEventListener("click", event => { if(event.target.closest("button")) return; stop(event); openVerse(card.dataset.openVerse); }, true));
    el.commentList.querySelectorAll("[data-heart]").forEach(button => button.addEventListener("click", event => { stop(event); likeComment(button.dataset.heart); }, true));
  }
  function renderCommentCard(comment){
    const verse = findVerse(comment.verse_id) || state.selected || currentChapter().verses[0];
    const liked = state.liked.has(comment.id);
    return `<article class="comment-item ${state.mode === "popular" ? "is-popular" : ""}" data-open-verse="${verse.id}"><div class="comment-meta"><span class="comment-author">${escapeHtml(comment.user_name || "익명")}</span>${state.mode === "popular" ? `<span class="comment-ref">${verse.number}절</span>` : ""}<time>${formatDate(comment.created_at)}</time></div><span class="comment-mood">${escapeHtml(comment.mood || "묵상")}</span><p class="comment-body">${escapeHtml(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${liked ? "is-active" : ""}" type="button" data-heart="${comment.id}">♡ 좋아요 ${comment.likes || 0}</button></div></article>`;
  }
  function renderForm(){
    const on = state.mode === "verse";
    if(el.commentInput){ el.commentInput.disabled = !on; el.commentInput.placeholder = on ? "이 절에 대한 코멘트를 남겨보세요." : "절 끝의 눌린 코멘트 자국을 누르면 이곳에 코멘트를 남길 수 있어요."; }
    const submit = document.querySelector("#commentForm button[type='submit']"); if(submit) submit.disabled = !on;
    const copy = $("copyVerseButton"); if(copy) copy.style.visibility = on ? "visible" : "hidden";
    if(el.anonymousBadge) el.anonymousBadge.textContent = `${anonymousName()} · 익명으로 작성`;
  }

  function openPopular(){ state.mode = "popular"; state.selected = currentChapter().verses[0]; render(); }
  function openVerse(id){
    const verse = findVerse(id); if(!verse) return;
    state.bookIndex = state.bible.findIndex(book => book.key === verse.bookKey);
    state.chapterIndex = currentBook().chapters.findIndex(chapter => chapter.number === verse.chapter);
    state.selected = verse; state.mode = "verse"; render();
  }
  function moveChapter(step){
    let bi = state.bookIndex, ci = state.chapterIndex + step;
    if(ci < 0){ bi = Math.max(0, bi - 1); ci = state.bible[bi].chapters.length - 1; }
    if(ci >= state.bible[bi].chapters.length){ bi = Math.min(state.bible.length - 1, bi + 1); ci = 0; }
    state.bookIndex = bi; state.chapterIndex = ci; openPopular();
  }
  function submitComment(){
    if(state.mode !== "verse") return;
    const content = el.commentInput.value.trim(); if(!content) return;
    const comment = {id:`local-${Date.now()}`, verse_id:state.selected.id, user_name:anonymousName(), mood:el.moodSelect?.value || "묵상", content, likes:0, created_at:new Date().toISOString(), source:"local"};
    state.comments.unshift(comment); saveLocal(); el.commentInput.value = ""; setMessage("코멘트를 저장했습니다."); render();
  }
  function likeComment(id){
    if(state.liked.has(id)) return;
    const comment = state.comments.find(item => item.id === id); if(!comment) return;
    comment.likes = (comment.likes || 0) + 1; state.liked.add(id); saveLiked(); saveLocal(); renderPanel();
  }
  async function copyVerse(){ if(state.mode !== "verse" || !state.selected) return; await navigator.clipboard?.writeText(`${state.selected.bookName} ${state.selected.chapter}:${state.selected.number} ${state.selected.text}`); setMessage("구절을 복사했습니다."); }
  function searchVerse(){
    const query = $("searchInput")?.value.trim(); if(!query) return;
    const numeric = query.replace(/[^0-9]/g, "");
    const match = allVerses().find(verse => verse.text.includes(query) || `${verse.bookName} ${verse.chapter}:${verse.number}`.includes(query) || String(verse.number) === numeric);
    match ? openVerse(match.id) : setMessage(`“${query}”에 맞는 말씀을 찾지 못했습니다.`);
  }

  function installRuntimeStyle(){
    if($("v4-exact-style")) return;
    const style = document.createElement("style");
    style.id = "v4-exact-style";
    style.textContent = `body.v4-reader-ready .app-header{height:56px!important;padding:5px 24px!important;grid-template-columns:minmax(252px,340px) minmax(260px,1fr) minmax(250px,350px)!important;gap:14px!important;overflow:hidden!important}body.v4-reader-ready .top-nav{gap:clamp(18px,3.4vw,58px)!important;overflow:hidden!important}body.v4-reader-ready .top-nav a{white-space:nowrap!important}body.v4-reader-ready .app-shell{grid-template-columns:minmax(760px,1fr) 360px!important;gap:38px!important;width:min(1790px,calc(100vw - 42px))!important;height:calc(100vh - 56px)!important;padding:8px 0 12px!important}body.v4-reader-ready .book-frame{padding:14px 18px 17px!important;border-radius:21px!important;box-shadow:0 25px 62px rgba(45,22,7,.40),inset 0 0 0 1px rgba(240,187,98,.25),inset 0 0 0 8px rgba(29,14,5,.26)!important}body.v4-reader-ready .book-frame:before,body.v4-reader-ready .book-frame:after{width:30px!important;opacity:.78!important}body.v4-reader-ready .book:before{left:calc(50% - 9px)!important;width:18px!important;box-shadow:0 0 24px rgba(35,16,5,.34),inset 0 0 9px rgba(74,39,14,.38)!important}body.v4-reader-ready .book:after{content:"";position:absolute;z-index:12;left:6px;top:48%;width:64px;height:110px;border-radius:0 8px 8px 0;background:linear-gradient(135deg,#4b2c17,#7b522d);box-shadow:inset -2px 0 8px rgba(255,219,150,.14),0 9px 19px rgba(41,20,8,.24);transform:translateY(-50%)}body.v4-reader-ready .page-inner{padding:22px 40px 42px!important;background-size:100% 1.58rem!important}body.v4-reader-ready .page-curl{width:72px!important;height:72px!important;opacity:.55!important}body.v4-reader-ready .verses{gap:3px!important;line-height:1.39!important;font-size:clamp(.70rem,.76vw,.91rem)!important}body.v4-reader-ready .verse-row{padding:3px 6px!important}body.v4-reader-ready .reader-stage .reader-footbar{position:absolute!important;left:auto!important;right:28px!important;top:43px!important;bottom:auto!important;z-index:24!important;height:29px!important;border-radius:999px!important;background:rgba(62,37,18,.42)!important;box-shadow:0 6px 16px rgba(35,18,7,.13),inset 0 1px 0 rgba(255,255,255,.12)!important}body.v4-reader-ready .reader-footbar button,body.v4-reader-ready .reader-footbar span{height:27px!important;padding:0 10px!important;border:0!important;border-right:1px solid rgba(255,235,190,.12)!important;background:transparent!important;color:#fff2d4!important;font-size:.72rem!important;font-weight:900!important;line-height:27px!important}body.v4-reader-ready .listen-button{display:none!important}body.v4-reader-ready .reflection-panel{border-radius:20px!important}.v4-panel-tabs{display:flex;gap:8px;height:42px;align-items:center;padding:0 14px;border-bottom:1px solid rgba(181,141,88,.27);background:rgba(255,247,235,.42)}.v4-panel-tabs button{border:0;border-radius:999px;background:transparent;color:#85633f;padding:7px 12px;font-size:.82rem;font-weight:900}.v4-panel-tabs button.is-active{background:#ead3ae;color:#704c20}`;
    document.head.appendChild(style);
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, {once:true}) : init();
})();
