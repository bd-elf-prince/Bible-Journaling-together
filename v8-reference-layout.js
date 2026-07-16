// V8 single-viewport interaction layer. Keeps the reference layout and verse-scoped UI in sync.
(()=>{
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  let mode='comments';

  function selected(){return window.BJTReader?.state?.selected||null}
  function ensurePanelChrome(){
    const panel=$('#commentPanel');
    const tabs=$('.v5-panel-tabs',panel);
    if(!panel||!tabs)return false;
    if(!tabs.querySelector('[data-v8-panel]')) tabs.innerHTML='<button class="is-active" type="button" data-v8-panel="comments">코멘트</button><button type="button" data-v8-panel="bookmarks">북마크</button>';
    if(!$('.v8-panel-close',panel)){
      const close=document.createElement('button');close.type='button';close.className='v8-panel-close';close.setAttribute('aria-label','코멘트 패널 닫기');close.textContent='×';panel.prepend(close);
    }
    if(!$('.v8-bookmarks-card',panel)){
      const card=document.createElement('section');card.className='v8-bookmarks-card';card.setAttribute('aria-label','내 책갈피');tabs.insertAdjacentElement('afterend',card);
    }
    if(!$('.v8-mobile-panel-toggle')){
      const toggle=document.createElement('button');toggle.type='button';toggle.className='v8-mobile-panel-toggle';toggle.textContent='코멘트';toggle.setAttribute('aria-controls','commentPanel');toggle.setAttribute('aria-expanded','false');$('.reader-toolbar')?.append(toggle);
    }
    if(!$('.v8-panel-scrim')){const scrim=document.createElement('div');scrim.className='v8-panel-scrim';document.body.append(scrim)}
    return true;
  }

  function setMode(next){
    mode=next==='bookmarks'?'bookmarks':'comments';
    const panel=$('#commentPanel');
    if(!panel)return;
    panel.dataset.v8Mode=mode;
    $$('.v5-panel-tabs [data-v8-panel]',panel).forEach(button=>button.classList.toggle('is-active',button.dataset.v8Panel===mode));
    if(mode==='bookmarks')renderBookmarks();
  }

  function renderBookmarks(){
    const root=$('.v8-bookmarks-card');
    if(!root)return;
    const account=window.BJTAccount;
    if(!account?.state?.user){
      root.innerHTML='<div class="v8-bookmarks-empty"><strong>로그인 후 책갈피를 이어가세요</strong><p>선택한 절의 책갈피가 모든 기기에서 동기화됩니다.</p><button type="button" data-v8-login>로그인</button></div>';
      return;
    }
    const rows=account.state.bookmarks||[];
    root.innerHTML=rows.length?rows.map(row=>`<article class="v8-bookmark-item"><strong>${esc(row.reference)}</strong><p>${esc(row.verse_text)}</p><button type="button" data-open-saved="${esc(row.verse_id)}">본문에서 열기</button></article>`).join(''):'<p class="v8-bookmarks-empty">아직 저장한 책갈피가 없습니다.</p>';
  }

  function openMobilePanel(){
    const panel=$('#commentPanel');if(!panel)return;
    panel.classList.add('is-mobile-open');$('.v8-panel-scrim')?.classList.add('is-open');
    const toggle=$('.v8-mobile-panel-toggle');if(toggle)toggle.setAttribute('aria-expanded','true');
  }
  function closeMobilePanel(){
    $('#commentPanel')?.classList.remove('is-mobile-open');$('.v8-panel-scrim')?.classList.remove('is-open');
    const toggle=$('.v8-mobile-panel-toggle');if(toggle)toggle.setAttribute('aria-expanded','false');
  }

  function syncSelectedVerse(){
    const verse=selected();if(!verse)return;
    const select=$('#verseSelect');if(select&&select.value!==verse.id)select.value=verse.id;
    const panel=$('#commentPanel');if(panel)panel.setAttribute('aria-label',`${verse.bookName} ${verse.chapter}장 ${verse.number}절 코멘트와 책갈피`);
    const visibleIds=$$('[data-comment-verse-id]').map(node=>node.dataset.commentVerseId);
    if(visibleIds.some(id=>id!==verse.id)){
      console.error('[BJT verse scope] 선택 절과 다른 댓글이 감지되어 숨겼습니다.',{selected:verse.id,visibleIds});
      $$('[data-comment-verse-id]').filter(node=>node.dataset.commentVerseId!==verse.id).forEach(node=>node.remove());
    }
  }

  function cycleFont(){
    const select=$('#fontSizeSelect');if(!select)return;
    const sizes=['normal','large','xlarge'];select.value=sizes[(sizes.indexOf(select.value)+1)%sizes.length];select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function bind(){
    document.addEventListener('click',event=>{
      const tab=event.target.closest('[data-v8-panel]');if(tab){event.preventDefault();setMode(tab.dataset.v8Panel);return}
      if(event.target.closest('.v8-mobile-panel-toggle')){openMobilePanel();return}
      if(event.target.closest('.v8-panel-close')||event.target.closest('.v8-panel-scrim')){closeMobilePanel();return}
      if(event.target.closest('[data-v8-font]')){cycleFont();return}
      if(event.target.closest('[data-v8-settings]')){window.BJTAccount?.openDrawer('settings');return}
      if(event.target.closest('[data-v8-login]')){$('#authButton')?.click();return}
      const nav=event.target.closest('[data-panel]');if(nav){event.preventDefault();setMode('comments');openMobilePanel();return}
      const saved=event.target.closest('.v8-bookmarks-card [data-open-saved]');if(saved){window.BJTReader?.openVerse(saved.dataset.openSaved);setMode('comments');closeMobilePanel()}
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMobilePanel()});
    addEventListener('resize',()=>{if(innerWidth>900)closeMobilePanel()},{passive:true});
  }

  function layoutCheck(){
    const verse=selected();
    const body=document.body.getBoundingClientRect();
    const shell=$('.app-shell')?.getBoundingClientRect();
    const panel=$('#commentPanel')?.getBoundingClientRect();
    const visibleCommentVerseIds=[...new Set($$('[data-comment-verse-id]').map(node=>node.dataset.commentVerseId))];
    return {selectedVerseId:verse?.id||null,visibleCommentVerseIds,verseScopeClean:visibleCommentVerseIds.every(id=>id===verse?.id),bodyFitsViewport:body.height<=innerHeight+1,shellFitsViewport:!!shell&&shell.bottom<=innerHeight+1,panelFitsViewport:innerWidth<=900||!!panel&&panel.bottom<=innerHeight+1};
  }

  function boot(){
    let attempts=0;
    const timer=setInterval(()=>{
      if(ensurePanelChrome()&&window.BJTReader){clearInterval(timer);setMode('comments');syncSelectedVerse();const target=$('#selectedReference');if(target)new MutationObserver(syncSelectedVerse).observe(target,{childList:true,subtree:true,characterData:true});}
      if(++attempts>200)clearInterval(timer);
    },40);
    bind();
    window.BJTV8LayoutCheck=layoutCheck;
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
