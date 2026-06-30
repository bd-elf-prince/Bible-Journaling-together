// V4 photo-match visual helper only.
// It must not create local comments, mutate verse state, or replace the Supabase comment engine.
(()=>{
  "use strict";
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

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
    const observer = new MutationObserver(decorate);
    observer.observe(document.body, {childList:true, subtree:true});
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot, {once:true}) : boot();
})();
