// V5 diary language layer: turns the reader from a metrics app into an exchange-diary Bible room.
(()=>{
  'use strict';

  const TEXT = {
    brandSmall:'말씀 옆에 마음을 한 방울씩 남깁니다',
    searchPlaceholder:'마음이 닿은 구절 찾기',
    selectedEmpty:'아직 이 절에는 물방울이 없습니다. 첫 마음을 조용히 남겨보세요.',
    commentPlaceholder:'오늘 이 절 앞에 떠오른 작은 물방울을 남겨주세요',
    anonymousBadge:'익명 물방울로 남기기'
  };

  function $(selector, root=document){ return root.querySelector(selector); }
  function $$(selector, root=document){ return [...root.querySelectorAll(selector)]; }

  function setText(selector, text){ const node = $(selector); if(node && node.textContent !== text) node.textContent = text; }
  function setPlaceholder(selector, text){ const node = $(selector); if(node && node.placeholder !== text) node.placeholder = text; }

  function patchStaticLanguage(){
    setText('.brand small', TEXT.brandSmall);
    const nav = $$('.top-nav a');
    ['성경읽기','교환일기','마음의 물결','이어지는 말씀','설정'].forEach((label, index)=>{ if(nav[index]) nav[index].textContent = label; });
    setPlaceholder('#searchInput', TEXT.searchPlaceholder);
    setText('.insight-card .section-title h3', '이 절에 번진 물결');
    setText('.recommend-card .section-title h3', '이 마음과 이어지는 말씀');
    setText('.comments-card .section-title h3', '교환일기');
    setText('.profile-card .section-title h3', '익명 물방울 이름');
    setText('#copyVerseButton', '구절 담기');
    setPlaceholder('#commentInput', TEXT.commentPlaceholder);
    const submit = $('#commentForm button[type="submit"]');
    if(submit && submit.textContent === '등록') submit.textContent = '물방울 남기기';
    const label = $('#commentForm label[for="moodSelect"]');
    if(label) label.textContent = '오늘 마음의 빛';
    const mood = $('#moodSelect');
    if(mood && !mood.dataset.diaryLabels){
      const labels = ['위로의 물방울','감사의 물방울','믿음의 물방울','평안의 물방울','회복의 물방울'];
      [...mood.options].forEach((option, index)=>{ if(labels[index]) option.textContent = labels[index]; });
      mood.dataset.diaryLabels = 'true';
    }
  }

  function patchDynamicLanguage(){
    const top = $('#topEmotionLabel');
    if(top && top.textContent === '아직 조용해요') top.textContent = '아직 잔잔해요';
    const recommendMood = $('#recommendMoodLabel');
    if(recommendMood && recommendMood.textContent === '추천') recommendMood.textContent = '물결';
    const empty = $('.comment-empty');
    if(empty && /코멘트|묵상|서버/.test(empty.textContent)) empty.textContent = TEXT.selectedEmpty;
    const badge = $('#anonymousBadge');
    if(badge && !badge.textContent.includes('물방울')) badge.textContent = badge.textContent.replace('익명으로 작성', '익명 물방울로 남기기');
    $$('.comment-heart').forEach(button=>{
      button.textContent = button.textContent.replace('공감', '물결').replace('좋아요', '물결');
    });
    $$('.recommend-item span').forEach(span=>{
      if(!span.dataset.diaryPrefix){ span.textContent = '이어지는 말씀 · ' + span.textContent; span.dataset.diaryPrefix = 'true'; }
    });
  }

  function injectDiaryStyle(){
    if($('#v5-diary-style')) return;
    const style = document.createElement('style');
    style.id = 'v5-diary-style';
    style.textContent = `
      body.v5-reader-ready .insight-card{background:linear-gradient(180deg,rgba(255,250,241,.56),rgba(244,224,193,.54));}
      body.v5-reader-ready .emotion-bars{position:relative;padding-top:4px;}
      body.v5-reader-ready .emotion-bars:before{content:'작은 반응들이 이 절 아래 조용한 물결로 남습니다';display:block;margin:0 0 8px;color:#8a735b;font-size:.76rem;line-height:1.45;}
      body.v5-reader-ready .emotion-bar span{font-size:.70rem;color:#7a6247;}
      body.v5-reader-ready .emotion-bar strong{font-size:.68rem;color:#9a6424;}
      body.v5-reader-ready .comments-card{background:linear-gradient(180deg,rgba(255,252,245,.68),rgba(247,232,207,.55));}
      body.v5-reader-ready .comment-item{border-left:3px solid rgba(166,112,42,.34);}
      body.v5-reader-ready .comment-body:before{content:'“';color:#b98638;font-family:serif;font-size:1.2em;}
      body.v5-reader-ready .comment-body:after{content:'”';color:#b98638;font-family:serif;font-size:1.2em;}
      body.v5-reader-ready .comment-form textarea{min-height:92px;line-height:1.55;}
      body.v5-reader-ready .form-footer span{font-size:.75rem;color:#7d6246;font-weight:900;}
      body.v5-reader-ready .emotion-pill{font-size:.72rem;}
      body.v5-reader-ready .emotion-pill b:before{content:'· ';}
    `;
    document.head.appendChild(style);
  }

  function apply(){ injectDiaryStyle(); patchStaticLanguage(); patchDynamicLanguage(); }

  function boot(){
    apply();
    const observer = new MutationObserver(()=>apply());
    observer.observe(document.body, {childList:true, subtree:true, characterData:true});
    window.setInterval(apply, 1200);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot, {once:true}) : boot();
})();
