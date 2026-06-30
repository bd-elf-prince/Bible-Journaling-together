// V4 photo-match visual helper only.
// It must not create local comments, mutate verse state, or replace the Supabase comment engine.
// Emergency rule: if the main reader fails to boot, keep the homepage visible.
(()=>{
  "use strict";
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

  function verseRow(number, text){
    return `<button class="verse-row" type="button"><span class="verse-number">${number}</span><span class="verse-text">${text}</span><span class="comment-count is-empty"></span></button>`;
  }

  function emergencyFallback(reason){
    if(window.V4Reader && $("#leftVerses .verse-row")) return;
    document.body.classList.add("v4-reader-ready", "photo-match-ready");
    const left = $("#leftVerses");
    const right = $("#rightVerses");
    if($("#bookSelect")) $("#bookSelect").innerHTML = "<option>창세기</option>";
    if($("#chapterSelect")) $("#chapterSelect").innerHTML = "<option>1장</option>";
    if(left) left.innerHTML = verseRow(1,"태초에 하나님이 천지를 창조하시니라") + verseRow(2,"땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라") + verseRow(3,"하나님이 이르시되 빛이 있으라 하시니 빛이 있었고");
    if(right) right.innerHTML = verseRow(4,"빛이 하나님이 보시기에 좋았더라") + verseRow(5,"저녁이 되고 아침이 되니 이는 첫째 날이니라") + verseRow(6,"하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고");
    if($("#selectedReference")) $("#selectedReference").textContent = "창세기 1장 1절";
    if($("#selectedVerseText")) $("#selectedVerseText").textContent = "태초에 하나님이 천지를 창조하시니라";
    if($("#commentTotal")) $("#commentTotal").textContent = "0";
    if($("#commentList")) $("#commentList").innerHTML = '<p class="comment-empty">임시 복구 모드입니다. 페이지는 열렸고, 댓글 엔진은 점검 중입니다.</p>';
    if($("#message")) $("#message").textContent = `임시 복구 모드: ${reason || "reader boot timeout"}`;
  }

  function decorate(){
    document.body.classList.add("photo-match-ready");
    const brandSmall = $(".brand small");
    if(brandSmall) brandSmall.textContent = "함께 말씀을 읽고, 나누고, 기록합니다";
    const search = $("#searchInput");
    if(search) search.placeholder = "구절, 키워드 검색";
    $$(".comment-count").forEach(node => {
      const value = (node.textContent || "").trim();
      if(!value || value === "0"){
        node.textContent = "";
        node.classList.add("is-empty");
      }
    });
    $$(".comment-item").forEach((card, index) => {
      const meta = $(".comment-meta", card);
      if(meta && !$(".comment-avatar", meta)){
        const avatar = document.createElement("span");
        avatar.className = `comment-avatar tone-${index % 3}`;
        meta.prepend(avatar);
      }
      if(meta && !$(".comment-more", meta)){
        const dots = document.createElement("span");
        dots.className = "comment-more";
        dots.textContent = "•••";
        meta.append(dots);
      }
    });
  }

  function boot(){
    decorate();
    window.setTimeout(() => emergencyFallback("reader boot timeout"), 3000);
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, {childList:true, subtree:true});
  }

  window.addEventListener("error", event => window.setTimeout(() => emergencyFallback(event.message || "script error"), 0));
  window.addEventListener("unhandledrejection", () => window.setTimeout(() => emergencyFallback("promise error"), 0));
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot, {once:true}) : boot();
})();