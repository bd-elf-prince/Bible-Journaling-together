// V4 standalone reader layer: real Bible book layout + pressed-paper comment UX.
(function(){
  "use strict";

  const BIBLE = [
    { key:"gen", name:"창세기", english:"Genesis", chapters:[{ number:1, subtitle:"태초의 빛과 창조의 질서", pageLeft:"창세기 · 첫째 날", pageRight:"창세기 · 좋았더라", startPage:3, verses:[
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
      [31,"하나님이 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라"]
    ]}]},
    { key:"ps", name:"시편", english:"Psalms", chapters:[{ number:23, subtitle:"목자 되신 주님의 평안", pageLeft:"시편 · 푸른 풀밭", pageRight:"시편 · 잔이 넘치나이다", startPage:621, verses:[
      [1,"여호와는 나의 목자시니 내게 부족함이 없으리로다"],
      [2,"그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다"],
      [3,"내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다"],
      [4,"내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라"],
      [5,"주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다"],
      [6,"내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다"]
    ]}]},
    { key:"mat", name:"마태복음", english:"Matthew", chapters:[{ number:5, subtitle:"산 위에서 들려온 복과 빛의 말씀", pageLeft:"마태복음 · 팔복", pageRight:"마태복음 · 소금과 빛", startPage:1221, verses:[
      [3,"심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요"],
      [4,"애통하는 자는 복이 있나니 그들이 위로를 받을 것임이요"],
      [5,"온유한 자는 복이 있나니 그들이 땅을 기업으로 받을 것임이요"],
      [6,"의에 주리고 목마른 자는 복이 있나니 그들이 배부를 것임이요"],
      [7,"긍휼히 여기는 자는 복이 있나니 그들이 긍휼히 여김을 받을 것임이요"],
      [8,"마음이 청결한 자는 복이 있나니 그들이 하나님을 볼 것임이요"],
      [9,"화평하게 하는 자는 복이 있나니 그들이 하나님의 아들이라 일컬음을 받을 것임이요"],
      [10,"의를 위하여 박해를 받은 자는 복이 있나니 천국이 그들의 것임이라"],
      [13,"너희는 세상의 소금이니 소금이 만일 그 맛을 잃으면 무엇으로 짜게 하리요"],
      [14,"너희는 세상의 빛이라 산 위에 있는 동네가 숨겨지지 못할 것이요"],
      [16,"이같이 너희 빛이 사람 앞에 비치게 하여 그들로 너희 착한 행실을 보고 하나님께 영광을 돌리게 하라"]
    ]}]}
  ].map(book => ({...book, chapters:book.chapters.map(chapter => ({...chapter, verses:chapter.verses.map(row => ({id:`${book.key}-${chapter.number}-${row[0]}`, bookKey:book.key, bookName:book.name, english:book.english, chapter:chapter.number, number:row[0], text:row[1]}))}))}));

  const SEED_COMMENTS = [
    {id:"seed-1", verse_id:"gen-1-3", user_name:"익명B7Q2", mood:"회복", content:"혼돈 속에서 먼저 빛을 부르시는 장면이 마음에 오래 남아요.", likes:14, created_at:"2026-06-28T09:30:00Z", source:"seed"},
    {id:"seed-2", verse_id:"gen-1-1", user_name:"익명K4M9", mood:"믿음", content:"시작이 내 손에 있지 않다는 사실이 오히려 편안하게 느껴집니다.", likes:11, created_at:"2026-06-28T10:10:00Z", source:"seed"},
    {id:"seed-3", verse_id:"gen-1-4", user_name:"익명H2P8", mood:"평안", content:"빛과 어둠을 나누신다는 말씀이 오늘 해야 할 선택을 정리해 주는 것 같아요.", likes:8, created_at:"2026-06-28T11:42:00Z", source:"seed"},
    {id:"seed-4", verse_id:"ps-23-4", user_name:"익명R5D1", mood:"위로", content:"골짜기를 없애 주시는 게 아니라 함께 지나가 주신다는 말씀이 힘이 됩니다.", likes:18, created_at:"2026-06-27T13:20:00Z", source:"seed"},
    {id:"seed-5", verse_id:"ps-23-2", user_name:"익명N8S3", mood:"평안", content:"쉴 만한 물가라는 표현이 조용히 숨을 고르게 해요.", likes:12, created_at:"2026-06-27T15:00:00Z", source:"seed"},
    {id:"seed-6", verse_id:"mat-5-4", user_name:"익명T6A4", mood:"위로", content:"애통함이 끝이 아니라 위로로 이어진다는 약속이 오늘 필요했어요.", likes:16, created_at:"2026-06-26T08:15:00Z", source:"seed"},
    {id:"seed-7", verse_id:"mat-5-14", user_name:"익명C9F7", mood:"믿음", content:"빛은 숨기지 못한다는 말씀이 작게라도 살아내 보라고 부르는 것 같습니다.", likes:9, created_at:"2026-06-26T12:30:00Z", source:"seed"}
  ];

  const $ = id => document.getElementById(id);
  const STORAGE_COMMENTS = "bjt-v4-local-comments";
  const STORAGE_LIKED = "bjt-v4-liked-comments";
  const state = {bookIndex:0, chapterIndex:0, selectedVerse:null, mode:"popular", comments:mergeComments([...SEED_COMMENTS, ...loadJson(STORAGE_COMMENTS, [])]), liked:new Set(loadJson(STORAGE_LIKED, [])), busy:false};
  const el = {};

  function loadJson(key, fallback){ try{return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));}catch(error){return fallback;} }
  function saveLocal(){ localStorage.setItem(STORAGE_COMMENTS, JSON.stringify(state.comments.filter(c => c.source === "local"))); }
  function saveLiked(){ localStorage.setItem(STORAGE_LIKED, JSON.stringify([...state.liked])); }
  function mergeComments(rows){ const map = new Map(); rows.forEach(row => { if(row && row.id) map.set(row.id, {...row, likes:Number(row.likes || 0)}); }); return [...map.values()]; }
  function currentBook(){ return BIBLE[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function allVerses(){ return BIBLE.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function esc(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function formatDate(value){ const d = new Date(value); return Number.isNaN(d.getTime()) ? "방금 전" : new Intl.DateTimeFormat("ko-KR", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"}).format(d); }
  function anonymousName(){ let name = localStorage.getItem("bjt-anonymous-name"); if(!name){ const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; name = `익명${Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join("")}`; localStorage.setItem("bjt-anonymous-name", name); } return name; }
  function countFor(verseId){ return state.comments.filter(comment => comment.verse_id === verseId).length; }
  function stop(event){ event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
  function setMessage(text){ if(el.message) el.message.textContent = text || ""; }

  function init(){
    ["leftVerses","rightVerses","selectedReference","selectedVerseText","commentList","commentTotal","commentForm","commentInput","moodSelect","message","bookSelect","chapterSelect","readerTitleEnglish","readerTitle","readerSubtitle","pageLeftTitle","pageRightTitle","anonymousBadge"].forEach(id => el[id] = $(id));
    state.selectedVerse = currentChapter().verses[0];
    document.body.classList.add("v4-reader-ready");
    installPolishStyles();
    ensureChrome();
    bindEvents();
    exposeV4();
    renderAll();
    window.setTimeout(renderAll, 120);
    window.setTimeout(renderAll, 700);
    window.setTimeout(renderAll, 1600);
  }
  function exposeV4(){
    window.V4Reader = {openPopular, openVerse, renderAll, state};
    try{ window.renderAll = renderAll; window.selectVerse = openVerse; window.moveChapter = moveChapter; window.renderBible = renderBible; window.renderComments = renderPanel; }catch(error){}
  }
  function ensureChrome(){ ensurePanelTabs(); ensureCommentScope(); ensurePageDecor(); ensureReaderFootbar(); }
  function ensurePanelTabs(){
    const panel = $("commentPanel");
    if(!panel || panel.querySelector(".v4-panel-tabs")) return;
    const tabs = document.createElement("div");
    tabs.className = "v4-panel-tabs";
    tabs.innerHTML = '<button class="is-active" type="button">코멘트</button><button type="button">북마크</button>';
    panel.prepend(tabs);
    tabs.addEventListener("click", event => { const button = event.target.closest("button"); if(!button) return; tabs.querySelectorAll("button").forEach(item => item.classList.remove("is-active")); button.classList.add("is-active"); if(button.textContent.includes("북마크")) setMessage("북마크는 뒤로 숨겨두었습니다."); }, true);
  }
  function ensureCommentScope(){
    const title = document.querySelector(".comments-card .section-title");
    if(!title || $("commentScopeLabel")) return;
    const scope = document.createElement("span");
    scope.id = "commentScopeLabel";
    scope.textContent = "인기순";
    const total = $("commentTotal");
    total ? title.insertBefore(scope, total) : title.appendChild(scope);
  }
  function ensurePageDecor(){
    const leftInner = document.querySelector(".page-left .page-inner");
    const rightInner = document.querySelector(".page-right .page-inner");
    if(leftInner && !leftInner.querySelector(".v4-page-title")){
      const title = document.createElement("h1"); title.className = "v4-page-title";
      const ornament = document.createElement("div"); ornament.className = "v4-page-ornament";
      const kicker = leftInner.querySelector(".page-kicker"); if(kicker) kicker.insertAdjacentElement("afterend", title); title.insertAdjacentElement("afterend", ornament);
    }
    [leftInner,rightInner].forEach((inner,index) => { if(inner && !inner.querySelector(".page-number")){ const page = document.createElement("span"); page.className = "page-number"; page.textContent = index === 0 ? "2" : "3"; inner.appendChild(page); }});
  }
  function ensureReaderFootbar(){
    if(document.querySelector(".reader-footbar")) return;
    const frame = document.querySelector(".book-frame"); if(!frame) return;
    const footbar = document.createElement("div");
    footbar.className = "reader-footbar";
    footbar.innerHTML = '<button type="button" data-v4-first>≪ 처음으로</button><button type="button" data-v4-prev>‹</button><span id="readerProgress">3 / 1502</span><button type="button" data-v4-next>›</button><button type="button" data-v4-last>마지막으로 ≫</button><button class="listen-button" type="button" data-v4-listen>듣기 ◔</button>';
    frame.insertAdjacentElement("afterend", footbar);
  }
  function bindEvents(){
    capture(el.commentForm, "submit", submitComment);
    capture($("bookSelect"), "change", event => { state.bookIndex = Number(event.target.value); state.chapterIndex = 0; openPopular(); });
    capture($("chapterSelect"), "change", event => { state.chapterIndex = Number(event.target.value); openPopular(); });
    capture($("prevChapter"), "click", () => moveChapter(-1));
    capture($("nextChapter"), "click", () => moveChapter(1));
    capture($("copyVerseButton"), "click", copyVerse);
    capture($("searchForm"), "submit", searchVerse);
    capture($("fontSizeSelect"), "change", event => { const sizes = {normal:"1.03rem", large:"1.18rem", xlarge:"1.32rem"}; document.querySelectorAll(".verses").forEach(node => node.style.fontSize = sizes[event.target.value] || sizes.normal); });
    document.addEventListener("click", event => {
      const first = event.target.closest("[data-v4-first]"); const prev = event.target.closest("[data-v4-prev]"); const next = event.target.closest("[data-v4-next]"); const last = event.target.closest("[data-v4-last]"); const listen = event.target.closest("[data-v4-listen]");
      if(first){ stop(event); state.bookIndex = 0; state.chapterIndex = 0; openPopular(); }
      if(prev){ stop(event); moveChapter(-1); }
      if(next){ stop(event); moveChapter(1); }
      if(last){ stop(event); state.bookIndex = BIBLE.length - 1; state.chapterIndex = currentBook().chapters.length - 1; openPopular(); }
      if(listen){ stop(event); setMessage("듣기는 뒤로 숨겨두었습니다."); }
    }, true);
  }
  function capture(node, type, handler){ if(!node) return; node.addEventListener(type, event => { stop(event); handler(event); }, true); }

  function renderAll(){ ensureChrome(); renderSelectors(); renderHeader(); renderBible(); renderPanel(); renderFormState(); }
  function renderSelectors(){
    if(el.bookSelect){ el.bookSelect.innerHTML = BIBLE.map((book,index) => `<option value="${index}">${book.name}</option>`).join(""); el.bookSelect.value = String(state.bookIndex); }
    if(el.chapterSelect){ el.chapterSelect.innerHTML = currentBook().chapters.map((chapter,index) => `<option value="${index}">${chapter.number}장</option>`).join(""); el.chapterSelect.value = String(state.chapterIndex); }
  }
  function renderHeader(){
    const book = currentBook(); const chapter = currentChapter();
    if(el.readerTitleEnglish) el.readerTitleEnglish.textContent = book.english;
    if(el.readerTitle) el.readerTitle.textContent = `${book.name} ${chapter.number}장`;
    if(el.readerSubtitle) el.readerSubtitle.textContent = chapter.subtitle;
    if(el.pageLeftTitle) el.pageLeftTitle.textContent = chapter.pageLeft;
    if(el.pageRightTitle) el.pageRightTitle.textContent = chapter.pageRight;
    const pageTitle = document.querySelector(".v4-page-title"); if(pageTitle) pageTitle.textContent = `${book.name} ${chapter.number}장`;
    const progress = $("readerProgress"); if(progress) progress.textContent = `${chapter.startPage + state.chapterIndex} / 1502`;
  }
  function renderBible(){
    const verses = currentChapter().verses; const mid = Math.ceil(verses.length / 2);
    if(el.leftVerses) el.leftVerses.innerHTML = verses.slice(0, mid).map(renderVerse).join("");
    if(el.rightVerses) el.rightVerses.innerHTML = verses.slice(mid).map(renderVerse).join("");
    document.querySelectorAll("[data-verse-id]").forEach(button => button.addEventListener("click", event => { stop(event); openVerse(button.dataset.verseId); }, true));
  }
  function renderVerse(verse){
    const count = countFor(verse.id); const selected = state.mode === "verse" && state.selectedVerse?.id === verse.id ? " is-selected" : "";
    return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}" aria-label="${verse.bookName} ${verse.chapter}장 ${verse.number}절, 코멘트 ${count}개"><span class="verse-number">${verse.number}</span><span class="verse-text">${esc(verse.text)}</span><span class="comment-count ${count ? "has-comments" : ""}" aria-hidden="true">${count}</span></button>`;
  }
  function renderPanel(){
    const title = document.querySelector(".comments-card .section-title h3"); const scope = $("commentScopeLabel"); const book = currentBook(); const chapter = currentChapter(); const ids = new Set(chapter.verses.map(v => v.id));
    let rows;
    if(state.mode === "verse"){
      const verse = state.selectedVerse;
      rows = state.comments.filter(c => c.verse_id === verse.id).sort((a,b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
      if(title) title.textContent = "이 절의 코멘트"; if(scope) scope.textContent = `${verse.number}절`; if(el.selectedReference) el.selectedReference.textContent = `${verse.bookName} ${verse.chapter}장 ${verse.number}절`; if(el.selectedVerseText) el.selectedVerseText.textContent = verse.text;
    }else{
      rows = state.comments.filter(c => ids.has(c.verse_id)).sort((a,b) => (b.likes || 0) - (a.likes || 0) || Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
      if(title) title.textContent = "인기 코멘트"; if(scope) scope.textContent = `${book.name} ${chapter.number}장`; if(el.selectedReference) el.selectedReference.textContent = `${book.name} ${chapter.number}장`; if(el.selectedVerseText) el.selectedVerseText.textContent = "현재 장에서 많이 공감된 코멘트가 먼저 보입니다. 절 끝의 눌린 종이 자국 같은 코멘트 표시를 누르면 해당 절 코멘트만 모아볼 수 있어요.";
    }
    if(el.commentTotal) el.commentTotal.textContent = String(rows.length);
    if(!el.commentList) return;
    if(!rows.length){ el.commentList.innerHTML = `<p class="comment-empty">${state.mode === "verse" ? "아직 이 절에는 코멘트가 없습니다. 이 말씀 앞에 머문 첫 마음을 남겨주세요." : "아직 이 장에는 코멘트가 없습니다. 절 끝의 눌린 코멘트 자국을 눌러 첫 코멘트를 남겨보세요."}</p>`; return; }
    el.commentList.innerHTML = rows.map(comment => { const verse = findVerse(comment.verse_id) || state.selectedVerse || currentChapter().verses[0]; const liked = state.liked.has(comment.id); return `<article class="comment-item ${state.mode === "popular" ? "is-popular" : ""}" data-open-verse="${verse.id}"><div class="comment-meta"><span class="comment-author">${esc(comment.user_name || "익명")}</span>${state.mode === "popular" ? `<span class="comment-ref">${verse.number}절</span>` : ""}<time>${esc(formatDate(comment.created_at))}</time></div>${comment.mood ? `<span class="comment-mood">${esc(comment.mood)}</span>` : ""}<p class="comment-body">${esc(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${liked ? "is-active" : ""}" type="button" data-comment-heart="${comment.id}">♡ 좋아요 ${comment.likes || 0}</button></div></article>`; }).join("");
    el.commentList.querySelectorAll("[data-open-verse]").forEach(card => card.addEventListener("click", event => { if(event.target.closest("button")) return; stop(event); openVerse(card.dataset.openVerse); }, true));
    el.commentList.querySelectorAll("[data-comment-heart]").forEach(button => button.addEventListener("click", event => { stop(event); likeComment(button.dataset.commentHeart); }, true));
  }
  function renderFormState(){
    const isVerse = state.mode === "verse";
    if(el.commentInput){ el.commentInput.disabled = !isVerse; el.commentInput.placeholder = isVerse ? "이 절에 대한 코멘트를 남겨보세요." : "절 끝의 눌린 코멘트 자국을 누르면 이곳에 코멘트를 남길 수 있어요."; }
    const submit = document.querySelector("#commentForm button[type='submit']"); if(submit){ submit.disabled = !isVerse || state.busy; submit.textContent = state.busy ? "저장 중…" : "등록"; }
    const copy = $("copyVerseButton"); if(copy) copy.style.visibility = isVerse ? "visible" : "hidden";
    if(el.anonymousBadge) el.anonymousBadge.textContent = `${anonymousName()} · 익명으로 작성`;
  }
  function openPopular(){ state.mode = "popular"; state.selectedVerse = currentChapter().verses[0]; renderAll(); }
  function openVerse(id){ const verse = findVerse(id); if(!verse) return; state.bookIndex = BIBLE.findIndex(book => book.key === verse.bookKey); state.chapterIndex = currentBook().chapters.findIndex(ch => ch.number === verse.chapter); state.selectedVerse = verse; state.mode = "verse"; renderAll(); }
  function moveChapter(step){ let bi = state.bookIndex; let ci = state.chapterIndex + step; if(ci < 0){ bi = Math.max(0, bi - 1); ci = BIBLE[bi].chapters.length - 1; } if(ci >= BIBLE[bi].chapters.length){ bi = Math.min(BIBLE.length - 1, bi + 1); ci = 0; } state.bookIndex = bi; state.chapterIndex = ci; openPopular(); }
  function submitComment(event){ stop(event); if(state.mode !== "verse" || state.busy) return; const content = el.commentInput.value.trim(); if(!content) return; const comment = {id:`local-${Date.now()}`, verse_id:state.selectedVerse.id, user_name:anonymousName(), mood:el.moodSelect?.value || "묵상", content, likes:0, created_at:new Date().toISOString(), source:"local"}; state.comments.unshift(comment); saveLocal(); el.commentInput.value = ""; setMessage("코멘트를 저장했습니다."); renderAll(); }
  function likeComment(id){ if(state.liked.has(id)) return; const comment = state.comments.find(item => item.id === id); if(!comment) return; comment.likes = (comment.likes || 0) + 1; state.liked.add(id); saveLiked(); saveLocal(); renderPanel(); }
  async function copyVerse(event){ stop(event); if(state.mode !== "verse" || !state.selectedVerse) return; const verse = state.selectedVerse; await navigator.clipboard?.writeText(`${verse.bookName} ${verse.chapter}:${verse.number} ${verse.text}`); setMessage("구절을 복사했습니다."); }
  function searchVerse(event){ stop(event); const q = $("searchInput")?.value.trim(); if(!q) return; const n = q.replace(/[^0-9]/g, ""); const match = allVerses().find(v => v.text.includes(q) || `${v.bookName} ${v.chapter}:${v.number}`.includes(q) || String(v.number) === n); if(match) openVerse(match.id); else setMessage(`“${q}”에 맞는 말씀을 찾지 못했습니다.`); }

  function installPolishStyles(){
    if(document.getElementById("v4-runtime-polish")) return;
    const style = document.createElement("style");
    style.id = "v4-runtime-polish";
    style.textContent = `body.v4-reader-ready .v4-panel-tabs{display:flex;gap:8px;height:42px;align-items:center;padding:0 14px;border-bottom:1px solid rgba(181,141,88,.27);background:rgba(255,247,235,.42)}body.v4-reader-ready .v4-panel-tabs button{border:0;border-radius:999px;background:transparent;color:#85633f;padding:7px 12px;font-size:.82rem;font-weight:900;cursor:pointer}body.v4-reader-ready .v4-panel-tabs button.is-active{background:#ead3ae;color:#704c20;box-shadow:inset 1px 1px 3px rgba(85,50,16,.14),inset -1px -1px 2px rgba(255,255,255,.45)}body.v4-reader-ready .reflection-panel::before{display:none!important}body.v4-reader-ready .comment-form textarea:disabled{opacity:.62;cursor:not-allowed;background:#f4dfbf}body.v4-reader-ready .form-footer button:disabled{opacity:.55;cursor:not-allowed;background:#b79468}body.v4-reader-ready .comment-count{transition:transform .15s ease,box-shadow .15s ease}body.v4-reader-ready .verse-row:hover .comment-count{transform:translateY(1px);box-shadow:inset 3px 4px 7px rgba(74,43,14,.24),inset -2px -2px 4px rgba(255,255,255,.48)}body.v4-reader-ready .comment-item.is-popular{position:relative}body.v4-reader-ready .comment-item.is-popular::before{content:"인기";position:absolute;right:10px;top:10px;border-radius:999px;background:#ead3ae;color:#704c20;padding:2px 7px;font-size:.65rem;font-weight:900}`;
    document.head.appendChild(style);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
