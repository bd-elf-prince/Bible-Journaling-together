// V4 reader behavior layer. Keeps the existing app code, then reshapes the reader into a real-book desktop UX.
(function(){
  const V4 = {
    mode: "popular",
    installed: false,
    base: {}
  };

  function hasApp(){
    return typeof state !== "undefined" &&
      typeof currentChapter === "function" &&
      typeof currentBook === "function" &&
      typeof renderAll === "function";
  }

  function init(){
    if(!hasApp()){
      window.setTimeout(init, 40);
      return;
    }
    document.body.classList.add("v4-reader-ready");
    ensureStaticChrome();
    installPatches();
    renderAll();
  }

  function installPatches(){
    if(V4.installed) return;
    V4.installed = true;

    V4.base.renderAll = renderAll;
    V4.base.renderVerse = renderVerse;
    V4.base.renderComments = renderComments;
    V4.base.selectVerse = selectVerse;
    V4.base.moveChapter = moveChapter;
    V4.base.renderReaderHeader = renderReaderHeader;

    renderVerse = renderV4Verse;
    renderComments = renderV4Comments;

    renderReaderHeader = function(){
      V4.base.renderReaderHeader();
      updateBookChrome();
    };

    renderAll = function(){
      V4.base.renderAll();
      afterRender();
    };

    selectVerse = function(id){
      V4.mode = "verse";
      return V4.base.selectVerse(id);
    };

    moveChapter = function(step){
      V4.mode = "popular";
      return V4.base.moveChapter(step);
    };

    const bookSelect = document.getElementById("bookSelect");
    const chapterSelect = document.getElementById("chapterSelect");
    [bookSelect, chapterSelect].forEach(node => {
      node?.addEventListener("change", () => { V4.mode = "popular"; }, true);
    });
  }

  function afterRender(){
    document.body.classList.add("v4-reader-ready");
    ensureStaticChrome();
    updateBookChrome();
    updatePanelState();
  }

  function ensureStaticChrome(){
    ensurePanelTabs();
    ensureCommentTitleScope();
    ensureReaderFootbar();
    ensurePageDecor();
  }

  function ensurePanelTabs(){
    const panel = document.getElementById("commentPanel");
    if(!panel || panel.querySelector(".v4-panel-tabs")) return;
    const tabs = document.createElement("div");
    tabs.className = "v4-panel-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "코멘트 패널");
    tabs.innerHTML = '<button class="is-active" type="button">코멘트</button><button type="button">북마크</button>';
    tabs.querySelectorAll("button").forEach((button, index) => {
      button.addEventListener("click", () => {
        tabs.querySelectorAll("button").forEach(item => item.classList.remove("is-active"));
        button.classList.add("is-active");
        if(index === 1 && typeof setMessage === "function") setMessage("북마크는 뒤로 숨겨두었습니다.");
      });
    });
    panel.prepend(tabs);
  }

  function ensureCommentTitleScope(){
    const title = document.querySelector(".comments-card .section-title");
    if(!title || document.getElementById("commentScopeLabel")) return;
    const scope = document.createElement("span");
    scope.id = "commentScopeLabel";
    scope.textContent = "인기순";
    const total = document.getElementById("commentTotal");
    if(total) title.insertBefore(scope, total);
    else title.appendChild(scope);
  }

  function ensureReaderFootbar(){
    if(document.querySelector(".reader-footbar")) return;
    const stage = document.querySelector(".reader-stage");
    const frame = document.querySelector(".book-frame");
    if(!stage || !frame) return;
    const footbar = document.createElement("div");
    footbar.className = "reader-footbar";
    footbar.setAttribute("aria-label", "페이지 이동");
    footbar.innerHTML = '<button type="button" data-v4-first>≪ 처음으로</button><button type="button" data-v4-prev>‹</button><span id="readerProgress">3 / 1502</span><button type="button" data-v4-next>›</button><button type="button" data-v4-last>마지막으로 ≫</button><button class="listen-button" type="button">듣기 ◔</button>';
    frame.insertAdjacentElement("afterend", footbar);
    footbar.querySelector("[data-v4-first]")?.addEventListener("click", () => {
      V4.mode = "popular";
      state.bookIndex = 0;
      state.chapterIndex = 0;
      state.selectedVerse = currentChapter().verses[0];
      renderAll();
    });
    footbar.querySelector("[data-v4-prev]")?.addEventListener("click", () => moveChapter(-1));
    footbar.querySelector("[data-v4-next]")?.addEventListener("click", () => moveChapter(1));
    footbar.querySelector("[data-v4-last]")?.addEventListener("click", () => {
      V4.mode = "popular";
      state.bookIndex = BIBLE.length - 1;
      state.chapterIndex = currentBook().chapters.length - 1;
      state.selectedVerse = currentChapter().verses[0];
      renderAll();
    });
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

  function updateBookChrome(){
    const book = currentBook();
    const chapter = currentChapter();
    const pageTitle = document.querySelector(".v4-page-title");
    if(pageTitle) pageTitle.textContent = `${book.name} ${chapter.number}장`;
    const progress = document.getElementById("readerProgress");
    if(progress){
      const start = book.key === "gen" ? 3 : book.key === "ps" ? 621 : 1221;
      progress.textContent = `${start + state.chapterIndex} / 1502`;
    }
  }

  function updatePanelState(){
    const isVerse = V4.mode === "verse";
    const input = document.getElementById("commentInput");
    const submit = document.querySelector("#commentForm button[type='submit']");
    const copy = document.getElementById("copyVerseButton");

    if(input){
      input.disabled = !isVerse;
      input.placeholder = isVerse ? "이 절에 대한 코멘트를 남겨보세요." : "절 끝의 눌린 코멘트 자국을 누르면 이곳에 코멘트를 남길 수 있어요.";
    }
    if(submit) submit.disabled = !isVerse;
    if(copy) copy.style.visibility = isVerse ? "visible" : "hidden";
  }

  function renderV4Verse(verse){
    const comments = state.commentCounts.get(verse.id) || 0;
    const selected = V4.mode === "verse" && state.selectedVerse?.id === verse.id ? " is-selected" : "";
    const active = comments ? " has-comments" : "";
    return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}" aria-label="${verse.bookName} ${verse.chapter}장 ${verse.number}절, 코멘트 ${comments}개"><span class="verse-number">${verse.number}</span><span class="verse-text">${escapeHtml(verse.text)}</span><span class="comment-count${active}" aria-hidden="true">${comments}</span></button>`;
  }

  function renderV4Comments(){
    ensureCommentTitleScope();
    const verse = state.selectedVerse || currentChapter().verses[0];
    const chapter = currentChapter();
    const book = currentBook();
    const isVerse = V4.mode === "verse";
    const hearts = countBy(state.commentReactions, "comment_id");
    const chapterIds = new Set(chapter.verses.map(item => item.id));
    const title = document.querySelector(".comments-card .section-title h3");
    const scope = document.getElementById("commentScopeLabel");
    const copy = document.getElementById("copyVerseButton");

    let rows;
    if(isVerse){
      rows = state.comments
        .filter(comment => comment.verse_id === verse.id)
        .sort((a,b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
      if(title) title.textContent = "이 절의 코멘트";
      if(scope) scope.textContent = `${verse.number}절`;
      el.selectedReference.textContent = `${verse.bookName} ${verse.chapter}장 ${verse.number}절`;
      el.selectedVerseText.textContent = verse.text;
      if(copy) copy.textContent = "구절 복사";
    }else{
      rows = state.comments
        .filter(comment => chapterIds.has(comment.verse_id))
        .sort((a,b) => (hearts.get(b.id) || 0) - (hearts.get(a.id) || 0) || Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
      if(title) title.textContent = "인기 코멘트";
      if(scope) scope.textContent = `${book.name} ${chapter.number}장`;
      el.selectedReference.textContent = `${book.name} ${chapter.number}장`;
      el.selectedVerseText.textContent = "현재 장에서 많이 공감된 코멘트가 먼저 보입니다. 절 끝의 눌린 종이 자국 같은 코멘트 표시를 누르면 해당 절의 코멘트만 모아볼 수 있어요.";
      if(copy) copy.textContent = "구절 복사";
    }

    el.commentTotal.textContent = String(rows.length);

    if(!rows.length){
      el.commentList.innerHTML = `<p class="comment-empty">${isVerse ? "아직 이 절에는 코멘트가 없습니다. 이 말씀 앞에 머문 첫 마음을 남겨주세요." : "아직 이 장에는 코멘트가 없습니다. 절 끝의 눌린 코멘트 자국을 눌러 첫 코멘트를 남겨보세요."}</p>`;
      return;
    }

    el.commentList.innerHTML = rows.map(comment => {
      const active = state.myCommentReactions.has(comment.id);
      const commentVerse = findVerse(comment.verse_id) || verse;
      const liked = hearts.get(comment.id) || 0;
      const popularClass = !isVerse ? " is-popular" : "";
      return `<article class="comment-item${popularClass}" data-open-verse="${commentVerse.id}"><div class="comment-meta"><span class="comment-author">${escapeHtml(comment.user_name || "익명")}</span>${!isVerse ? `<span class="comment-ref">${commentVerse.number}절</span>` : ""}<time>${escapeHtml(formatDate(comment.created_at))}</time></div>${comment.mood ? `<span class="comment-mood">${escapeHtml(comment.mood)}</span>` : ""}<p class="comment-body">${escapeHtml(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${active ? "is-active" : ""}" type="button" data-comment-heart="${comment.id}">♡ 좋아요 ${liked}</button></div></article>`;
    }).join("");

    el.commentList.querySelectorAll("[data-comment-heart]").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        reactToComment(button.dataset.commentHeart);
      });
    });

    el.commentList.querySelectorAll("[data-open-verse]").forEach(card => {
      card.addEventListener("click", event => {
        if(event.target.closest("button")) return;
        selectVerse(card.dataset.openVerse);
      });
    });
  }

  function boot(){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
    else init();
  }

  window.V4Reader = V4;
  boot();
})();
