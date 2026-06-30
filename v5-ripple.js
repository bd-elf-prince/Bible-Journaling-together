// V5 ripple layer: comments first, never emotion-analysis first.
(()=>{
  'use strict';

  function $(selector, root=document){ return root.querySelector(selector); }
  function $$(selector, root=document){ return [...root.querySelectorAll(selector)]; }
  function text(selector, value){ const node=$(selector); if(node && node.textContent!==value) node.textContent=value; }
  function placeholder(selector, value){ const node=$(selector); if(node && node.placeholder!==value) node.placeholder=value; }

  function applyPanelTabs(){
    const panel = $('#commentPanel');
    if(!panel) return;
    let tabs = $('.v5-panel-tabs', panel);
    if(!tabs){
      tabs = document.createElement('div');
      tabs.className = 'v5-panel-tabs';
      panel.prepend(tabs);
    }
    if(tabs.dataset.bjtTabs === 'book-desk') return;
    tabs.dataset.bjtTabs = 'book-desk';
    tabs.innerHTML = '<button class="is-active" type="button">코멘트</button><button type="button">북마크</button>';
  }

  function applyWords(){
    text('.brand small','함께 말씀을 읽고, 나누고, 기록합니다');
    placeholder('#searchInput','구절, 키워드 검색');
    const nav=$$('.top-nav a');
    ['성경읽기','저널','커뮤니티','나의 노트','설정'].forEach((label,i)=>{ if(nav[i]) nav[i].textContent=label; });
    text('.comments-card .section-title h3','코멘트');
    text('.recommend-card .section-title h3','이 글을 읽고 함께 펼쳐볼 말씀');
    text('.profile-card .section-title h3','익명 이름');
    text('.insight-card .section-title h3','조용한 울림');
    text('#copyVerseButton','구절 담기');
    text('#topEmotionLabel','집계보다 마음을 먼저 봅니다');
    text('#recommendMoodLabel','이어짐');
    const label=$('#commentForm label[for="moodSelect"]'); if(label) label.textContent='조용한 표시';
    placeholder('#commentInput','이 절에 대한 코멘트를 남겨보세요');
    const submit=$('#commentForm button[type="submit"]'); if(submit) submit.textContent='등록';
    const empty=$('.comment-empty'); if(empty) empty.textContent='아직 이 절에는 코멘트가 없습니다. 첫 한 줄을 남겨보세요.';
    const badge=$('#anonymousBadge'); if(badge) badge.textContent=badge.textContent.replace('익명으로 작성','익명으로 작성').replace('익명으로 남기기','익명으로 작성');
    $$('.recommend-item span').forEach(node=>{
      const raw=node.textContent.replace(/^이어지는 말씀 · /,'').replace(/^같이 펼쳐볼 말씀 · /,'').replace(/^함께 펼쳐볼 말씀 · /,'');
      node.textContent='함께 펼쳐볼 말씀 · '+raw;
    });
    $$('.comment-heart').forEach(button=>{
      button.textContent=button.textContent.replace('좋아요','좋아요').replace('공감','좋아요').replace('물결','좋아요').replace('울림','좋아요');
    });
  }

  function injectStyle(){
    if($('#v5-ripple-style')) return;
    const style=document.createElement('style');
    style.id='v5-ripple-style';
    style.textContent=`
      body.v5-reader-ready .insight-card{display:none!important;}
      body.v5-reader-ready .emotion-row{display:none!important;}
      body.v5-reader-ready .comments-card{order:3;}
      body.v5-reader-ready .comment-form{order:4;}
      body.v5-reader-ready .recommend-card{order:5;}
      body.v5-reader-ready .profile-card{order:6;}
      body.v5-reader-ready .recommend-list:before{content:'감정별 분류가 아니라, 이 코멘트를 읽은 뒤 함께 열어볼 말씀입니다.';display:block;margin-bottom:6px;color:#8a735b;font-size:.73rem;line-height:1.45;}
    `;
    document.head.appendChild(style);
  }

  function apply(){
    injectStyle();
    applyPanelTabs();
    applyWords();
  }

  function boot(){
    apply();
    new MutationObserver(apply).observe(document.body,{childList:true,subtree:true,characterData:true});
    setInterval(apply,1200);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
