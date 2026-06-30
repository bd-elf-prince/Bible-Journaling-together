// V5 ripple layer: comments first, not emotion labels.
(()=>{
  'use strict';

  function $(selector, root=document){ return root.querySelector(selector); }
  function $$(selector, root=document){ return [...root.querySelectorAll(selector)]; }
  function text(selector, value){ const node=$(selector); if(node && node.textContent!==value) node.textContent=value; }
  function placeholder(selector, value){ const node=$(selector); if(node && node.placeholder!==value) node.placeholder=value; }

  function applyWords(){
    text('.brand small','절마다 남겨진 작은 마음이 누군가에게 큰 울림이 됩니다');
    placeholder('#searchInput','구절이나 남겨진 마음 찾기');
    const nav=$$('.top-nav a');
    ['성경읽기','교환일기','물결','이어지는 말씀','설정'].forEach((label,i)=>{ if(nav[i]) nav[i].textContent=label; });
    text('.insight-card .section-title h3','이 절 아래 이어진 물방울');
    text('.recommend-card .section-title h3','이 글을 읽고 함께 펼쳐볼 말씀');
    text('.comments-card .section-title h3','교환일기');
    text('.profile-card .section-title h3','익명 이름');
    text('#copyVerseButton','구절 담기');
    const top=$('#topEmotionLabel'); if(top) top.textContent='집계보다 마음을 먼저 봅니다';
    const rec=$('#recommendMoodLabel'); if(rec) rec.textContent='이어짐';
    const label=$('#commentForm label[for="moodSelect"]'); if(label) label.textContent='내 마음 표시';
    placeholder('#commentInput','내 작은 한 줄이 누군가에게 파도처럼 닿을 수 있어요. 오늘 이 절 앞에서 깨달은 마음을 남겨주세요.');
    const submit=$('#commentForm button[type="submit"]'); if(submit) submit.textContent='한 줄 남기기';
    const empty=$('.comment-empty'); if(empty) empty.textContent='아직 이 절 아래에는 남겨진 한 줄이 없습니다. 첫 물방울을 남겨주세요.';
    const badge=$('#anonymousBadge'); if(badge) badge.textContent=badge.textContent.replace('익명으로 작성','익명으로 남기기').replace('익명 물방울로 남기기','익명으로 남기기');
    $$('.recommend-item span').forEach(node=>{
      const raw=node.textContent.replace(/^이어지는 말씀 · /,'').replace(/^같이 펼쳐볼 말씀 · /,'');
      node.textContent='같이 펼쳐볼 말씀 · '+raw;
    });
    $$('.comment-heart').forEach(button=>{
      button.textContent=button.textContent.replace('좋아요','울림').replace('공감','울림').replace('물결','울림');
    });
  }

  function injectStyle(){
    if($('#v5-ripple-style')) return;
    const style=document.createElement('style');
    style.id='v5-ripple-style';
    style.textContent=`
      body.v5-reader-ready .insight-card{display:none!important;}
      body.v5-reader-ready .emotion-row{opacity:.72;margin-top:6px;}
      body.v5-reader-ready .emotion-pill{font-size:.68rem;padding:5px 8px;background:rgba(255,248,235,.48);}
      body.v5-reader-ready .emotion-pill b{font-size:.62rem;}
      body.v5-reader-ready .comments-card{order:3;background:linear-gradient(180deg,rgba(255,252,246,.75),rgba(247,232,207,.58));}
      body.v5-reader-ready .comment-form{order:4;}
      body.v5-reader-ready .recommend-card{order:5;}
      body.v5-reader-ready .profile-card{order:6;}
      body.v5-reader-ready .comment-item{position:relative;border-left:3px solid rgba(157,106,40,.34);}
      body.v5-reader-ready .comment-item:before{content:'작은 물방울';display:block;margin-bottom:6px;color:#a06a27;font-size:.68rem;font-weight:900;letter-spacing:.06em;}
      body.v5-reader-ready .comment-body{font-family:'Noto Serif KR',serif;font-size:.95rem;line-height:1.62;}
      body.v5-reader-ready .comment-body:before{content:'“';color:#b98638;font-size:1.25em;}
      body.v5-reader-ready .comment-body:after{content:'”';color:#b98638;font-size:1.25em;}
      body.v5-reader-ready .comments-card .section-title:after{content:'누군가의 한 줄이 다음 사람의 깨달음으로 이어집니다';display:block;color:#8a735b;font-size:.72rem;font-weight:800;line-height:1.45;}
      body.v5-reader-ready .comment-form textarea{min-height:105px;line-height:1.58;}
      body.v5-reader-ready .recommend-list:before{content:'감정별 분류가 아니라, 남겨진 마음을 읽고 나서 같이 펼쳐볼 말씀입니다.';display:block;margin-bottom:4px;color:#8a735b;font-size:.73rem;line-height:1.45;}
    `;
    document.head.appendChild(style);
  }

  function apply(){ injectStyle(); applyWords(); }
  function boot(){
    apply();
    new MutationObserver(apply).observe(document.body,{childList:true,subtree:true,characterData:true});
    setInterval(apply,1000);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
