// V4 standalone reader layer: real Bible book layout + pressed-paper comment UX.
(function(){
  const BIBLE = [
    { key:"gen", name:"창세기", english:"Genesis", chapters:[{ number:1, subtitle:"태초의 빛과 창조의 질서", pageLeft:"창세기 · 첫째 날", pageRight:"창세기 · 좋았더라", verses:[
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
    { key:"ps", name:"시편", english:"Psalms", chapters:[{ number:23, subtitle:"목자 되신 주님의 평안", pageLeft:"시편 · 푸른 풀밭", pageRight:"시편 · 잔이 넘치나이다", verses:[
      [1,"여호와는 나의 목자시니 내게 부족함이 없으리로다"],
      [2,"그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다"],
      [3,"내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다"],
      [4,"내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라"],
      [5,"주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다"],
      [6,"내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다"]
    ]}]},
    { key:"mat", name:"마태복음", english:"Matthew", chapters:[{ number:5, subtitle:"산 위에서 들려온 복과 빛의 말씀", pageLeft:"마태복음 · 팔복", pageRight:"마태복음 · 소금과 빛", verses:[
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
  ].map(book => ({
    ...book,
    chapters: book.chapters.map(chapter => ({
      ...chapter,
      verses: chapter.verses.map(row => ({
        id:`${book.key}-${chapter.number}-${row[0]}`,
        bookKey:book.key,
        bookName:book.name,
        english:book.english,
        chapter:chapter.number,
        number:row[0],
        text:row[1]
      }))
    }))
  }));

  const SEED_COMMENTS = [
    {id:"seed-1", verse_id:"gen-1-3", user_name:"익명B7Q2", mood:"회복", content:"혼돈 속에서 먼저 빛을 부르시는 장면이 마음에 오래 남아요.", likes:14, created_at:"2026-06-28T09:30:00Z"},
    {id:"seed-2", verse_id:"gen-1-1", user_name:"익명K4M9", mood:"믿음", content:"시작이 내 손에 있지 않다는 사실이 오히려 편안하게 느껴집니다.", likes:11, created_at:"2026-06-28T10:10:00Z"},
    {id:"seed-3", verse_id:"gen-1-4", user_name:"익명H2P8", mood:"평안", content:"빛과 어둠을 나누신다는 말씀이 오늘 해야 할 선택을 정리해 주는 것 같아요.", likes:8, created_at:"2026-06-28T11:42:00Z"},
    {id:"seed-4", verse_id:"ps-23-4", user_name:"익명R5D1", mood:"위로", content:"골짜기를 없애 주시는 게 아니라 함께 지나가 주신다는 말씀이 힘이 됩니다.", likes:18, created_at:"2026-06-27T13:20:00Z"},
    {id:"seed-5", verse_id:"ps-23-2", user_name:"익명N8S3", mood:"평안", content:"쉴 만한 물가라는 표현이 조용히 숨을 고르게 해요.", likes:12, created_at:"2026-06-27T15:00:00Z"},
    {id:"seed-6", verse_id:"mat-5-4", user_name:"익명T6A4", mood:"위로", content:"애통함이 끝이 아니라 위로로 이어진다는 약속이 오늘 필요했어요.", likes:16, created_at:"2026-06-26T08:15:00Z"},
    {id:"seed-7", verse_id:"mat-5-14", user_name:"익명C9F7", mood:"믿음", content:"빛은 숨기지 못한다는 말씀이 작게라도 살아내 보라고 부르는 것 같습니다.", likes:9, created_at:"2026-06-26T12:30:00Z"}
  ];

  const $ = id => document.getElementById(id);
  const state = {
    bookIndex:0,
    chapterIndex:0,
    selectedVerse:null,
    mode:"popular",
    comments:loadComments(),
    liked:new Set(JSON.parse(localStorage.getItem("bjt-v4-liked") || "[]"))
  };
  const el = {};

  function loadComments(){
    const stored = localStorage.getItem("bjt-v4-comments");
    if(stored){
      try { return JSON.parse(stored); } catch(error) { return [...SEED_COMMENTS]; }
    }
    return [...SEED_COMMENTS];
  }
  function saveComments(){ localStorage.setItem("bjt-v4-comments", JSON.stringify(state.comments)); }
  function saveLiked(){ localStorage.setItem("bjt-v4-liked", JSON.stringify([...state.liked])); }
  function currentBook(){ return BIBLE[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function allVerses(){ return BIBLE.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function esc(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function formatDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return "방금 전";
    return new Intl.DateTimeFormat("ko-KR", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"}).format(date);
  }
  function anonymousName(){
    let name = localStorage.getItem("bjt-anonymous-name");
    if(!name){
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const tail = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
      name = `익명${tail}`;
      localStorage.setItem("bjt-anonymous-name", name);
    }
    return name;
  }
  function commentCount(verseId){ return state.comments.filter(comment => comment.verse_id === verseId).length; }

  function init(){
    ["leftVerses","rightVerses","selectedReference","selectedVerseText","commentList","commentTotal","commentForm","commentInput","moodSelect","message","bookSelect","chapterSelect","readerTitleEnglish","readerTitle","readerSubtitle","pageLeftTitle","pageRightTitle","anonymousBadge"].forEach(id => el[id] = $(id));
    state.selectedVerse = currentChapter().verses[0];
    document.body.classList.add("v4-reader-ready");
    ensureChrome();
    bindEvents();
    renderAll();
  }

  function ensureChrome(){
    ensurePanelTabs();
    ensureCommentScope();
    ensurePageDecor();
    ensureReaderFootbar();
  }
  function ensurePanelTabs(){
    const panel = $("commentPanel");
    if(!panel || panel.querySelector(".v4-panel-tabs")) return;
    const tabs = document.createElement("div");
    tabs.className = "v4-panel-tabs";
    tabs.innerHTML = '<button class="is-active" type="button">코멘트</button><button type="button">북마크</button>';
    panel.prepend(tabs);
  }
  function ensureCommentScope(){
    const title = document.querySelector(".comments-card .section-title");
    if(!title || $("commentScopeLabel")) return;
    const scope = document.createElement("span");
    scope.id = "commentScopeLabel";
    scope.textContent = "인기순";
    const total = $("commentTotal");
    if(total) title.insertBefore(scope, total);
    else title.appendChild(scope);
  }
  function ensurePageDecor(){
    const leftInner = document.querySelector(".page-left .page-inner");
    const rightInner = document.querySelector(".page-right .page-inner");
    if(leftInner && !leftInner.querySelector(".v4-page-title")){
      const title = document.createElement("h1");
      title.className = "v4-page-title";
      const ornament = document.createElement("div");
      ornament.className = "v4-page-ornament";
      const kicker = leftInner.querySelector(".page-kicker");
      if(kicker) kicker.insertAdjacentElement("afterend", title);
      title.insertAdjacentElement("afterend", ornament);
    }
    [leftInner, rightInner].forEach((inner, index) => {
      if(inner && !inner.querySelector(".page-number")){
        const pageNumber = document.createElement("span");
        pageNumber.className = "page-number";
        pageNumber.textContent = index === 0 ? "2" : "3";
        inner.appendChild(pageNumber);
      }
    });
  }
  function ensureReaderFootbar(){
    if(document.querySelector(".reader-footbar")) return;
    const frame = document.querySelector(".book-frame");
    if(!frame) return;
    const footbar = document.createElement("div");
    footbar.className = "reader-footbar";
    footbar.innerHTML = '<button type="button" data-v4-first>≪ 처음으로</button><button type="button" data-v4-prev>‹</button><span id="readerProgress">3 / 1502</span><button type="button" data-v4-next>›</button><button type="button" data-v4-last>마지막으로 ≫</button><button class="listen-button" type="button">듣기 ◔</button>';
    frame.insertAdjacentElement("afterend", footbar);
    footbar.querySelector("[data-v4-first]").addEventListener("click", () => { state.bookIndex = 0; state.chapterIndex = 0; openPopular(); });
    footbar.querySelector("[data-v4-prev]").addEventListener("click", () => moveChapter(-1));
    footbar.querySelector("[data-v4-next]").addEventListener("click", () => moveChapter(1));
    footbar.querySelector("[data-v4-last]").addEventListener("click", () => { state.bookIndex = BIBLE.length - 1; state.chapterIndex = currentBook().chapters.length - 1; openPopular(); });
  }

  function bindEvents(){
    el.commentForm?.addEventListener("submit", submitComment);
    $("bookSelect")?.addEventListener("change", event => { state.bookIndex = Number(event.target.value); state.chapterIndex = 0; openPopular(); });
    $("chapterSelect")?.addEventListener("change", event => { state.chapterIndex = Number(event.target.value); openPopular(); });
    $("prevChapter")?.addEventListener("click", () => moveChapter(-1));
    $("nextChapter")?.addEventListener("click", () => moveChapter(1));
    $("copyVerseButton")?.addEventListener("click", copyVerse);
    $("searchForm")?.addEventListener("submit", searchVerse);
    $("fontSizeSelect")?.addEventListener("change", event => {
      const sizes = {normal:"1.03rem", large:"1.18rem", xlarge:"1.32rem"};
      document.querySelectorAll(".verses").forEach(node => node.style.fontSize = sizes[event.target.value] || sizes.normal);
    });
  }

  function renderAll(){
    renderSelectors();
    renderHeader();
    renderBible();
    renderPanel();
    renderFormState();
  }
  function renderSelectors(){
    if(el.bookSelect){
      el.bookSelect.innerHTML = BIBLE.map((book, index) => `<option value="${index}">${book.name}</option>`).join("");
      el.bookSelect.value = String(state.bookIndex);
    }
    if(el.chapterSelect){
      el.chapterSelect.innerHTML = currentBook().chapters.map((chapter, index) => `<option value="${index}">${chapter.number}장</option>`).join("");
      el.chapterSelect.value = String(state.chapterIndex);
    }
  }
  function renderHeader(){
    const book = currentBook();
    const chapter = currentChapter();
    if(el.readerTitleEnglish) el.readerTitleEnglish.textContent = book.english;
    if(el.readerTitle) el.readerTitle.textContent = `${book.name} ${chapter.number}장`;
    if(el.readerSubtitle) el.readerSubtitle.textContent = chapter.subtitle;
    if(el.pageLeftTitle) el.pageLeftTitle.textContent = chapter.pageLeft;
    if(el.pageRightTitle) el.pageRightTitle.textContent = chapter.pageRight;
    const pageTitle = document.querySelector(".v4-page-title");
    if(pageTitle) pageTitle.textContent = `${book.name} ${chapter.number}장`;
    const progress = $("readerProgress");
    if(progress){
      const start = book.key === "gen" ? 3 : book.key === "ps" ? 621 : 1221;
      progress.textContent = `${start + state.chapterIndex} / 1502`;
    }
  }
  function renderBible(){
    const verses = currentChapter().verses;
    const mid = Math.ceil(verses.length / 2);
    if(el.leftVerses) el.leftVerses.innerHTML = verses.slice(0, mid).map(renderVerse).join("");
    if(el.rightVerses) el.rightVerses.innerHTML = verses.slice(mid).map(renderVerse).join("");
    document.querySelectorAll("[data-verse-id]").forEach(button => {
      button.addEventListener("click", () => openVerse(button.dataset.verseId));
    });
  }
  function renderVerse(verse){
    const count = commentCount(verse.id);
    const selected = state.mode === "verse" && state.selectedVerse?.id === verse.id ? " is-selected" : "";
    return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}" aria-label="${verse.bookName} ${verse.chapter}장 ${verse.number}절, 코멘트 ${count}개"><span class="verse-number">${verse.number}</span><span class="verse-text">${esc(verse.text)}</span><span class="comment-count ${count ? "has-comments" : ""}" aria-hidden="true">${count}</span></button>`;
  }
  function renderPanel(){
    const title = document.querySelector(".comments-card .section-title h3");
    const scope = $("commentScopeLabel");
    const book = currentBook();
    const chapter = currentChapter();
    const chapterIds = new Set(chapter.verses.map(verse => verse.id));
    let rows;
    if(state.mode === "verse"){
      const verse = state.selectedVerse;
      rows = state.comments.filter(comment => comment.verse_id === verse.id).sort((a,b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      if(title) title.textContent = "이 절의 코멘트";
      if(scope) scope.textContent = `${verse.number}절`;
      if(el.selectedReference) el.selectedReference.textContent = `${verse.bookName} ${verse.chapter}장 ${verse.number}절`;
      if(el.selectedVerseText) el.selectedVerseText.textContent = verse.text;
    }else{
      rows = state.comments.filter(comment => chapterIds.has(comment.verse_id)).sort((a,b) => (b.likes || 0) - (a.likes || 0) || Date.parse(b.created_at) - Date.parse(a.created_at));
      if(title) title.textContent = "인기 코멘트";
      if(scope) scope.textContent = `${book.name} ${chapter.number}장`;
      if(el.selectedReference) el.selectedReference.textContent = `${book.name} ${chapter.number}장`;
      if(el.selectedVerseText) el.selectedVerseText.textContent = "현재 장에서 많이 공감된 코멘트가 먼저 보입니다. 절 끝의 눌린 종이 자국 같은 코멘트 표시를 누르면 해당 절 코멘트만 모아볼 수 있어요.";
    }
    if(el.commentTotal) el.commentTotal.textContent = String(rows.length);
    if(!el.commentList) return;
    if(!rows.length){
      el.commentList.innerHTML = `<p class="comment-empty">${state.mode === "verse" ? "아직 이 절에는 코멘트가 없습니다. 이 말씀 앞에 머문 첫 마음을 남겨주세요." : "아직 이 장에는 코멘트가 없습니다. 절 끝의 눌린 코멘트 자국을 눌러 첫 코멘트를 남겨보세요."}</p>`;
      return;
    }
    el.commentList.innerHTML = rows.map(comment => {
      const verse = findVerse(comment.verse_id) || state.selectedVerse || currentChapter().verses[0];
      const liked = state.liked.has(comment.id);
      return `<article class="comment-item ${state.mode === "popular" ? "is-popular" : ""}" data-open-verse="${verse.id}"><div class="comment-meta"><span class="comment-author">${esc(comment.user_name || "익명")}</span>${state.mode === "popular" ? `<span class="comment-ref">${verse.number}절</span>` : ""}<time>${esc(formatDate(comment.created_at))}</time></div>${comment.mood ? `<span class="comment-mood">${esc(comment.mood)}</span>` : ""}<p class="comment-body">${esc(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${liked ? "is-active" : ""}" type="button" data-comment-heart="${comment.id}">♡ 좋아요 ${comment.likes || 0}</button></div></article>`;
    }).join("");
    el.commentList.querySelectorAll("[data-open-verse]").forEach(card => {
      card.addEventListener("click", event => {
        if(event.target.closest("button")) return;
        openVerse(card.dataset.openVerse);
      });
    });
    el.commentList.querySelectorAll("[data-comment-heart]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        likeComment(button.dataset.commentHeart);
      });
    });
  }
  function renderFormState(){
    const isVerse = state.mode === "verse";
    if(el.commentInput){
      el.commentInput.disabled = !isVerse;
      el.commentInput.placeholder = isVerse ? "이 절에 대한 코멘트를 남겨보세요." : "절 끝의 눌린 코멘트 자국을 누르면 이곳에 코멘트를 남길 수 있어요.";
    }
    const submit = document.querySelector("#commentForm button[type='submit']");
    if(submit) submit.disabled = !isVerse;
    const copy = $("copyVerseButton");
    if(copy) copy.style.visibility = isVerse ? "visible" : "hidden";
    if(el.anonymousBadge) el.anonymousBadge.textContent = `${anonymousName()} · 익명으로 작성`;
  }

  function openPopular(){
    state.mode = "popular";
    state.selectedVerse = currentChapter().verses[0];
    renderAll();
  }
  function openVerse(id){
    const verse = findVerse(id);
    if(!verse) return;
    state.bookIndex = BIBLE.findIndex(book => book.key === verse.bookKey);
    state.chapterIndex = currentBook().chapters.findIndex(chapter => chapter.number === verse.chapter);
    state.selectedVerse = verse;
    state.mode = "verse";
    renderAll();
  }
  function moveChapter(step){
    let bookIndex = state.bookIndex;
    let chapterIndex = state.chapterIndex + step;
    if(chapterIndex < 0){ bookIndex = Math.max(0, bookIndex - 1); chapterIndex = BIBLE[bookIndex].chapters.length - 1; }
    if(chapterIndex >= BIBLE[bookIndex].chapters.length){ bookIndex = Math.min(BIBLE.length - 1, bookIndex + 1); chapterIndex = 0; }
    state.bookIndex = bookIndex;
    state.chapterIndex = chapterIndex;
    openPopular();
  }
  function submitComment(event){
    event.preventDefault();
    if(state.mode !== "verse") return;
    const content = el.commentInput.value.trim();
    if(!content) return;
    const newComment = {
      id:`local-${Date.now()}`,
      verse_id:state.selectedVerse.id,
      user_name:anonymousName(),
      mood:el.moodSelect?.value || "묵상",
      content,
      likes:0,
      created_at:new Date().toISOString()
    };
    state.comments.unshift(newComment);
    saveComments();
    el.commentInput.value = "";
    renderAll();
  }
  function likeComment(id){
    const comment = state.comments.find(item => item.id === id);
    if(!comment || state.liked.has(id)) return;
    comment.likes = (comment.likes || 0) + 1;
    state.liked.add(id);
    saveComments();
    saveLiked();
    renderPanel();
  }
  async function copyVerse(){
    if(state.mode !== "verse" || !state.selectedVerse) return;
    const verse = state.selectedVerse;
    await navigator.clipboard?.writeText(`${verse.bookName} ${verse.chapter}:${verse.number} ${verse.text}`);
    if(el.message) el.message.textContent = "구절을 복사했습니다.";
  }
  function searchVerse(event){
    event.preventDefault();
    const input = $("searchInput");
    const query = input?.value.trim();
    if(!query) return;
    const numeric = query.replace(/[^0-9]/g, "");
    const match = allVerses().find(verse => verse.text.includes(query) || `${verse.bookName} ${verse.chapter}:${verse.number}`.includes(query) || String(verse.number) === numeric);
    if(match) openVerse(match.id);
    else if(el.message) el.message.textContent = `“${query}”에 맞는 말씀을 찾지 못했습니다.`;
  }

  window.V4Reader = {openPopular, openVerse, state};
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
