(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const WRITE_GATEWAY_FUNCTION = 'write-gateway-v5';
  const RUNTIME_CONFIG_URL = 'data/runtime-config.json';
  const MANIFEST_URL = 'data/manifest.json';
  const DATA_URL = 'data/bible-kor.json';
  const ANON_ID_KEY = 'bjt-anonymous-id';
  const BOOKMARKS_KEY = 'bjt-bookmarks';
  const HIGHLIGHTS_KEY = 'bjt-highlights';
  const MEMOS_KEY = 'bjt-memos';
  const SETTINGS_KEY = 'bjt-settings';
  const RECOMMENDED_VERSES = ['gen-1-1','ps-23-1','mat-5-3','jhn-3-16','rev-22-21'];

  const $ = (id)=>document.getElementById(id);
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  const els = {};
  let statusTimer = 0;
  let layoutTimer = 0;
  let pickerBookIndex = 0;
  let pickerChapterIndex = 0;
  const chapterLayoutCache = new WeakMap();
  const state = {
    bible: [],
    bibleManifest: null,
    bookLoads: new Map(),
    bookIndex: 0,
    chapterIndex: 0,
    spreadIndex: 0,
    selected: null,
    comments: [],
    counts: new Map(),
    commentRequestId: 0,
    commentBackend: 'auto',
    panelMode: 'comments',
    bookmarks: new Set(),
    highlights: new Set(),
    memos: {},
    user: null,
    settings: {fontScale: 0},
    authMode: 'login',
    passwordRecovery: false,
    managingCommentId: null
    ,runtime: {mode:'normal', dynamicReads:true, writes:true, auth:true, message:''}
  };

  document.addEventListener('DOMContentLoaded', init, {once:true});

  async function init(){
    ['bookSelect','chapterSelect','mobileBiblePickerButton','mobileBookLabel','mobileChapterLabel','biblePickerDialog','biblePickerCloseButton','biblePickerApplyButton','biblePickerBooks','biblePickerChapters','prevChapter','nextChapter','firstChapter','lastChapter','prevSpread','nextSpread','leftVerses','rightVerses','chapterTitle','chapterSubtitle','leftPageNo','rightPageNo','progressText','statusText','selectedRef','selectedText','commentSectionTitle','commentCount','commentList','commentForm','commentWriteButton','commentWriteCloseButton','commentInput','commentPasswordRow','commentAnonymousName','commentPassword','anonymousCheck','searchForm','searchInput','notesNavLink','copyVerseButton','bookmarkButton','memoButton','highlightButton','commentsTab','bookmarksTab','togetherList','commentToggle','panelClose','journal','todayButton','listenButton','settingsButton','authButton','accountMenu','profileEditButton','passwordChangeButton','adminPageLink','authDialog','authCloseButton','authModeTabs','loginModeButton','signupModeButton','loginForm','loginUsername','loginPassword','forgotPasswordButton','forgotPasswordForm','forgotPasswordEmail','forgotPasswordBackButton','signupForm','signupUsername','signupNickname','signupEmail','checkUsernameButton','checkNicknameButton','usernameAvailability','nicknameAvailability','signupPassword','signupPasswordConfirm','logoutButton','authStatus','profileDialog','profileCloseButton','profileUsername','profileNickname','profileEmail','profileStatus','passwordDialog','passwordDialogTitle','passwordForm','passwordCloseButton','newPassword','newPasswordConfirm','passwordStatus','memoDialog','memoForm','memoCloseButton','memoDialogTitle','memoInput','memoDeleteButton','memoStatus','commentManageDialog','commentManageForm','commentManageCloseButton','commentEditInput','commentEditPassword','commentDeleteButton','commentManageStatus'].forEach(id => els[id] = $(id));
    bindPrimaryViews();
    restoreLocalTools();
    restoreSettings();
    bindEvents();
    await loadRuntimeConfig();
    if(state.runtime.auth) await initAuth();
    else disableDynamicControls();
    await loadBible();
    render();
    document.fonts?.ready.then(refreshChapterLayout);
    if(new URLSearchParams(location.search).get('auth') === '1') openAuthDialog();
    if(!state.runtime.dynamicReads) setStatus(state.runtime.message || '현재 성경 읽기 전용으로 운영 중입니다.');
    else refreshComments().catch((error)=>{
      console.warn('[BJT] comments load skipped', error);
      setStatus('성경 읽기는 준비됐고, 댓글 연결을 다시 확인하는 중입니다.');
    });
  }

  async function loadRuntimeConfig(){
    try{
      const response = await fetch(RUNTIME_CONFIG_URL, {cache:'no-cache'});
      if(!response.ok) return;
      const config = await response.json();
      state.runtime = {
        mode:config?.mode === 'surge' ? 'surge' : 'normal',
        dynamicReads:config?.dynamicReads !== false,
        writes:config?.writes !== false,
        auth:config?.auth !== false,
        message:String(config?.message || '').slice(0, 240)
      };
    }catch(error){
      console.warn('[BJT] runtime config unavailable; normal mode retained', error);
    }
  }

  function disableDynamicControls(){
    [els.authButton, els.commentWriteButton, els.commentInput].forEach(element=>{
      if(element) element.disabled = true;
    });
  }

  function bindPrimaryViews(){
    const home = document.getElementById('home');
    const reader = document.getElementById('reader');
    const readerLink = document.querySelector('.main-nav a[href="#reader"]');
    if(!home || !reader) return;
    const sync = ()=>{
      const showReader = location.hash === '#reader' || location.hash === '#notes';
      const readerWasHidden = reader.hidden;
      home.hidden = showReader;
      reader.hidden = !showReader;
      document.body.classList.toggle('is-home', !showReader);
      if(readerLink) readerLink.classList.toggle('is-active', showReader);
      if(showReader && readerWasHidden){
        requestAnimationFrame(()=>requestAnimationFrame(refreshChapterLayout));
      }
    };
    window.addEventListener('hashchange', sync);
    sync();
  }

  function bindEvents(){
    els.bookSelect.addEventListener('change', ()=>jumpTo(Number(els.bookSelect.value), 0));
    els.chapterSelect.addEventListener('change', ()=>{
      state.chapterIndex = Number(els.chapterSelect.value);
      state.spreadIndex = 0;
      selectFirstVerse();
      render();
      refreshComments();
    });
    els.prevChapter.addEventListener('click', ()=>moveChapter(-1));
    els.nextChapter.addEventListener('click', ()=>moveChapter(1));
    els.mobileBiblePickerButton?.addEventListener('click', openBiblePicker);
    els.biblePickerCloseButton?.addEventListener('click', closeBiblePicker);
    els.biblePickerApplyButton?.addEventListener('click', applyBiblePicker);
    els.biblePickerBooks?.addEventListener('click', selectPickerBook);
    els.biblePickerChapters?.addEventListener('click', selectPickerChapter);
    els.prevSpread.addEventListener('click', ()=>moveSpread(-1));
    els.nextSpread.addEventListener('click', ()=>moveSpread(1));
    els.firstChapter.addEventListener('click', jumpToFirstSpread);
    els.lastChapter.addEventListener('click', jumpToLastSpread);
    els.commentForm.addEventListener('submit', submitComment);
    els.searchForm.addEventListener('submit', searchVerse);
    els.searchInput.addEventListener('keydown', (event)=>{
      if(event.key === 'Enter') searchVerse(event);
    });
    els.copyVerseButton.addEventListener('click', copySelected);
    els.bookmarkButton?.addEventListener('click', toggleBookmark);
    els.highlightButton?.addEventListener('click', toggleHighlight);
    els.memoButton?.addEventListener('click', openMemoDialog);
    els.commentsTab?.addEventListener('click', ()=>setPanelMode('comments'));
    els.bookmarksTab?.addEventListener('click', ()=>setPanelMode('bookmarks'));
    els.notesNavLink?.addEventListener('click', (event)=>{
      event.preventDefault();
      setPanelMode('notes');
      history.replaceState(null, '', '#notes');
    });
    els.todayButton?.addEventListener('click', openTodayVerse);
    els.listenButton?.addEventListener('click', listenSelected);
    els.settingsButton?.addEventListener('click', cycleFontScale);
    els.authButton?.addEventListener('click', toggleAccountAccess);
    els.authCloseButton?.addEventListener('click', closeAuthDialog);
    els.loginModeButton?.addEventListener('click', ()=>switchAuthMode('login'));
    els.signupModeButton?.addEventListener('click', ()=>switchAuthMode('signup'));
    els.loginForm?.addEventListener('submit', loginWithUsername);
    els.forgotPasswordButton?.addEventListener('click', ()=>switchAuthMode('forgot'));
    els.forgotPasswordBackButton?.addEventListener('click', ()=>switchAuthMode('login'));
    els.forgotPasswordForm?.addEventListener('submit', requestPasswordReset);
    els.signupForm?.addEventListener('submit', signupWithEmailVerification);
    els.checkUsernameButton?.addEventListener('click', ()=>checkSignupField('username'));
    els.checkNicknameButton?.addEventListener('click', ()=>checkSignupField('nickname'));
    els.signupUsername?.addEventListener('input', ()=>clearAvailabilityStatus('username'));
    els.signupNickname?.addEventListener('input', ()=>clearAvailabilityStatus('nickname'));
    els.logoutButton?.addEventListener('click', logout);
    els.profileEditButton?.addEventListener('click', openProfileDialog);
    els.passwordChangeButton?.addEventListener('click', openPasswordDialog);
    els.passwordForm?.addEventListener('submit', updatePassword);
    els.memoForm?.addEventListener('submit', saveMemo);
    els.memoCloseButton?.addEventListener('click', closeMemoDialog);
    els.memoDeleteButton?.addEventListener('click', deleteMemo);
    els.profileCloseButton?.addEventListener('click', closeProfileDialog);
    els.passwordCloseButton?.addEventListener('click', closePasswordDialog);
    els.anonymousCheck?.addEventListener('change', syncAnonymousPasswordField);
    els.commentManageForm?.addEventListener('submit', updateAnonymousComment);
    els.commentDeleteButton?.addEventListener('click', deleteAnonymousComment);
    els.commentManageCloseButton?.addEventListener('click', closeCommentManageDialog);
    els.commentToggle?.addEventListener('click', openPanel);
    els.commentWriteButton?.addEventListener('click', openCommentComposer);
    els.commentWriteCloseButton?.addEventListener('click', closeCommentComposer);
    els.panelClose?.addEventListener('click', closePanel);
    window.addEventListener('resize', ()=>{
      clearTimeout(layoutTimer);
      layoutTimer = window.setTimeout(refreshChapterLayout, 120);
    });
    document.addEventListener('click', (event)=>{
      if(state.user && els.accountMenu && !event.target.closest('.account-control')) closeAccountMenu();
      const verseButton = event.target.closest('[data-verse-id]');
      if(verseButton){
        event.preventDefault();
        openVerse(verseButton.dataset.verseId);
        const bubble = event.target.closest('.verse-bubble');
        if(window.matchMedia('(max-width: 1100px)').matches){
          state.panelMode = 'comments';
          renderComments();
          openPanel();
        }else if(bubble && Number(bubble.textContent.trim() || 0) > 0){
          openPanel();
        }
        return;
      }
      const together = event.target.closest('[data-open-verse]');
      if(together){
        event.preventDefault();
        openVerse(together.dataset.openVerse);
      }
      const manageComment = event.target.closest('[data-manage-comment]');
      if(manageComment){
        event.preventDefault();
        openCommentManageDialog(manageComment.dataset.manageComment);
      }
    });
    syncAnonymousPasswordField();
  }

  async function loadBible(){
    try{
      const manifestResponse = await fetch(MANIFEST_URL, {cache:'no-cache'});
      if(!manifestResponse.ok) throw new Error(`bible manifest ${manifestResponse.status}`);
      state.bibleManifest = await manifestResponse.json();
      state.bible = normalizeBibleManifest(state.bibleManifest);
      if(!state.bible.length) throw new Error('empty bible manifest');
      await ensureBookLoaded(0);
      selectFirstVerse();
      setStatus(`성경 ${countBooks()}권 ${countChapters()}장 ${countVerses()}절을 불러왔습니다.`);
      return;
    }catch(manifestError){
      console.warn('[BJT] bible manifest load failed; using full dataset fallback', manifestError);
      state.bibleManifest = null;
      state.bookLoads.clear();
    }
    try{
      const response = await fetch(DATA_URL, {cache:'force-cache'});
      const rows = await response.json();
      state.bible = normalizeBible(rows);
      if(!state.bible.length) throw new Error('empty bible');
      selectFirstVerse();
      setStatus(`성경 ${countBooks()}권, ${countChapters()}장, ${countVerses()}절을 불러왔습니다.`);
    }catch(error){
      console.warn(error);
      if(location.protocol === 'file:'){
        try{
          const rows = await loadFileBibleData();
          state.bible = normalizeBible(rows);
          if(!state.bible.length) throw new Error('empty file bible');
          selectFirstVerse();
          setStatus(`성경 ${countBooks()}권, ${countChapters()}장, ${countVerses()}절을 불러왔습니다.`);
          return;
        }catch(fileError){
          console.warn('[BJT] file bible load failed', fileError);
        }
      }
      state.bible = fallbackBible();
      selectFirstVerse();
      setStatus('성경 데이터를 다시 확인하는 중입니다.');
    }
  }

  function normalizeBibleManifest(manifest){
    if(!Array.isArray(manifest?.books)) return [];
    return manifest.books.map((book)=>({
      key: String(book.key || ''),
      name: cleanText(book.name || book.key),
      english: cleanText(book.english || ''),
      shardUrl: String(book.url || ''),
      shardSha256: String(book.sha256 || ''),
      loaded: false,
      chapters: (book.chapters || []).map((chapter)=>({
        number: Number(chapter.number),
        subtitle: cleanText(chapter.subtitle || ''),
        verseCount: Number(chapter.verseCount || 0),
        verses: []
      })).filter(chapter => chapter.number)
    })).filter(book => book.key && book.shardUrl && book.chapters.length);
  }

  async function sha256Hex(buffer){
    if(!globalThis.crypto?.subtle) return '';
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function ensureBookLoaded(bookIndex){
    const index = Math.max(0, Math.min(Number(bookIndex) || 0, state.bible.length - 1));
    const stub = state.bible[index];
    if(!stub || stub.loaded || !state.bibleManifest) return stub;
    if(state.bookLoads.has(stub.key)) return state.bookLoads.get(stub.key);
    const load = (async()=>{
      const response = await fetch(stub.shardUrl, {cache:'force-cache'});
      if(!response.ok) throw new Error(`bible shard ${stub.key} ${response.status}`);
      const buffer = await response.arrayBuffer();
      const actualHash = await sha256Hex(buffer);
      if(actualHash && stub.shardSha256 && actualHash !== stub.shardSha256){
        throw new Error(`bible shard integrity mismatch: ${stub.key}`);
      }
      const decoded = new TextDecoder().decode(buffer);
      const normalized = normalizeBible([JSON.parse(decoded)])[0];
      if(!normalized || normalized.key !== stub.key) throw new Error(`invalid bible shard: ${stub.key}`);
      const loaded = {...stub, ...normalized, loaded:true};
      state.bible[index] = loaded;
      prefetchAdjacentBookShards(index);
      return loaded;
    })().finally(()=>state.bookLoads.delete(stub.key));
    state.bookLoads.set(stub.key, load);
    return load;
  }

  function prefetchAdjacentBookShards(bookIndex){
    [bookIndex - 1, bookIndex + 1].forEach((index)=>{
      const book = state.bible[index];
      if(!book?.shardUrl || book.loaded || document.head.querySelector(`[data-bible-prefetch="${book.key}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'fetch';
      link.href = book.shardUrl;
      link.crossOrigin = 'anonymous';
      link.dataset.biblePrefetch = book.key;
      document.head.appendChild(link);
    });
  }

  function loadFileBibleData(){
    if(Array.isArray(window.__COMMENT_BIBLE_DATA__)) return Promise.resolve(window.__COMMENT_BIBLE_DATA__);
    return new Promise((resolve, reject)=>{
      const script = document.createElement('script');
      script.src = 'data/bible-kor-file.js';
      script.onload = ()=>Array.isArray(window.__COMMENT_BIBLE_DATA__)
        ? resolve(window.__COMMENT_BIBLE_DATA__)
        : reject(new Error('file bible data missing'));
      script.onerror = ()=>reject(new Error('file bible script failed'));
      document.head.appendChild(script);
    });
  }

  async function initAuth(){
    if(!db?.auth) return;
    try{
      db.auth.onAuthStateChange((event, session)=>{
        state.user = session?.user || null;
        renderAuth();
        loadUserMarks().then(render).catch(()=>{});
        if(event === 'PASSWORD_RECOVERY'){
          state.passwordRecovery = true;
          window.setTimeout(openPasswordDialog, 0);
        }
      });
      const {data} = await db.auth.getSession();
      state.user = data?.session?.user || null;
      renderAuth();
      await loadUserMarks();
      if(new URLSearchParams(location.search).get('password-reset') === '1'){
        if(state.user){
          state.passwordRecovery = true;
          window.setTimeout(openPasswordDialog, 0);
        }else{
          state.authMode = 'forgot';
          openAuthDialog();
          setAuthStatus('재설정 링크가 만료되었거나 이미 사용되었습니다. 인증 링크를 다시 요청하세요.');
        }
      }
    }catch(error){
      console.warn('[BJT] auth init skipped', error);
    }
  }

  async function refreshComments(){
    if(!state.selected) return;
    if(!state.runtime.dynamicReads){
      state.comments = [];
      state.counts = new Map();
      renderComments();
      renderChapter();
      return;
    }
    await loadComments(visibleVerseIds());
    renderComments();
    renderChapter();
  }

  async function loadComments(verseIds){
    if(!db) return;
    const ids = [...new Set(verseIds || [])].filter(Boolean);
    if(!ids.length) return;
    const requestId = ++state.commentRequestId;
    const targetKeys = ids.map(verseDiscussionTarget);
    const unifiedResult = await withTimeout(
      db
        .from('discussion_comments_public')
        .select('id, target_key, author_name, content, created_at, updated_at, has_edit_password, can_manage, is_official')
        .in('target_key', targetKeys)
        .order('created_at', {ascending:false})
        .limit(241),
      9000,
      'unified comments select'
    );
    if(requestId !== state.commentRequestId) return;

    if(!unifiedResult.error){
      state.commentBackend = 'unified';
      const rows = unifiedResult.data || [];
      state.comments = rows
        .slice(0, 240)
        .map(normalizeUnifiedVerseComment)
        .filter(comment => ids.includes(comment.verse_id));
      state.counts = countByVerse(state.comments);
      if(rows.length > 240) setStatus('댓글이 많은 구간입니다. 최신 240개만 표시합니다.');
      return;
    }

    console.warn('[BJT] unified comments select failed', unifiedResult.error);
    setStatus('댓글 서버 연결을 확인해주세요. 잠시 후 다시 시도해 주세요.');
  }

  function verseDiscussionTarget(verseId){
    return `verse:${verseId}`;
  }

  function normalizeUnifiedVerseComment(comment){
    const targetKey = String(comment?.target_key || '');
    return {
      id: comment?.id,
      verse_id: targetKey.startsWith('verse:') ? targetKey.slice(6) : '',
      user_name: comment?.author_name || '익명',
      content: comment?.content || '',
      created_at: comment?.created_at,
      updated_at: comment?.updated_at,
      has_edit_password: Boolean(comment?.has_edit_password),
      can_manage: Boolean(comment?.can_manage),
      is_official: Boolean(comment?.is_official),
      backend: 'unified'
    };
  }

  function normalizeBible(input){
    if(!Array.isArray(input)) return [];
    return input.map((book, bookIndex)=>{
      const key = book.key || book.bookKey || `book-${bookIndex + 1}`;
      const name = cleanText(book.name || key);
      const chapters = (book.chapters || []).map((chapter)=>{
        const chapterNumber = Number(chapter.number || chapter.chapter);
        const verses = (chapter.verses || []).map((row)=>{
          const verseNumber = Number(Array.isArray(row) ? row[0] : row.number || row.verse);
          const text = cleanText(Array.isArray(row) ? row[1] : row.text);
          return {id:`${key}-${chapterNumber}-${verseNumber}`, bookKey:key, bookName:name, chapter:chapterNumber, number:verseNumber, text};
        }).filter(verse => verse.number && verse.text);
        return {number:chapterNumber, subtitle:cleanText(chapter.subtitle || '절마다 남겨진 작은 물방울'), verses};
      }).filter(chapter => chapter.number && chapter.verses.length);
      return {key, name, chapters};
    }).filter(book => book.chapters.length);
  }

  function cleanText(value){
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function fallbackBible(){
    return [{
      key:'gen', name:'창세기', chapters:[{
        number:1, subtitle:'절마다 남겨진 작은 물방울', verses:[
          {id:'gen-1-1', bookKey:'gen', bookName:'창세기', chapter:1, number:1, text:'태초에 하나님이 천지를 창조하시니라'},
          {id:'gen-1-2', bookKey:'gen', bookName:'창세기', chapter:1, number:2, text:'땅이 혼돈하고 공허하며 깊은 물 위에 하나님의 영이 운행하시니라'}
        ]
      }]
    }];
  }

  function render(){
    if(!state.selected) return;
    renderSelectors();
    renderChapter();
    renderSelected();
    renderTools();
    renderComments();
    renderTogether();
  }

  function renderSelectors(){
    els.bookSelect.innerHTML = state.bible.map((book,index)=>`<option value="${index}">${escapeHtml(book.name)}</option>`).join('');
    els.bookSelect.value = String(state.bookIndex);
    els.chapterSelect.innerHTML = currentBook().chapters.map((chapter,index)=>`<option value="${index}">${chapter.number}장</option>`).join('');
    els.chapterSelect.value = String(state.chapterIndex);
    if(els.mobileBookLabel) els.mobileBookLabel.textContent = currentBook().name;
    if(els.mobileChapterLabel) els.mobileChapterLabel.textContent = `${currentChapter().number}장`;
  }

  function openBiblePicker(){
    if(!window.matchMedia('(max-width: 1100px)').matches) return;
    pickerBookIndex = state.bookIndex;
    pickerChapterIndex = state.chapterIndex;
    renderBiblePicker();
    els.biblePickerDialog?.showModal();
    requestAnimationFrame(()=>{
      els.biblePickerBooks?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'center'});
      els.biblePickerChapters?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'center'});
    });
  }

  function renderBiblePicker(){
    const pickerBook = state.bible[pickerBookIndex];
    if(!pickerBook) return;
    pickerChapterIndex = Math.max(0, Math.min(pickerChapterIndex, pickerBook.chapters.length - 1));
    els.biblePickerBooks.innerHTML = state.bible.map((book,index)=>
      `<button type="button" data-picker-book="${index}" aria-selected="${index === pickerBookIndex}">${escapeHtml(book.name)}</button>`
    ).join('');
    els.biblePickerChapters.innerHTML = pickerBook.chapters.map((chapter,index)=>
      `<button type="button" data-picker-chapter="${index}" aria-selected="${index === pickerChapterIndex}">${chapter.number}장</button>`
    ).join('');
  }

  function selectPickerBook(event){
    const button = event.target.closest('[data-picker-book]');
    if(!button) return;
    pickerBookIndex = Number(button.dataset.pickerBook);
    pickerChapterIndex = 0;
    renderBiblePicker();
    requestAnimationFrame(()=>els.biblePickerChapters?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'center'}));
  }

  function selectPickerChapter(event){
    const button = event.target.closest('[data-picker-chapter]');
    if(!button) return;
    pickerChapterIndex = Number(button.dataset.pickerChapter);
    renderBiblePicker();
  }

  async function applyBiblePicker(){
    closeBiblePicker();
    await jumpTo(pickerBookIndex, pickerChapterIndex);
  }

  function closeBiblePicker(){
    if(els.biblePickerDialog?.open) els.biblePickerDialog.close();
  }

  function renderChapter(){
    const book = currentBook();
    const chapter = currentChapter();
    els.chapterTitle.textContent = `${book.name} ${chapter.number}장`;
    els.chapterSubtitle.textContent = chapter.subtitle || '절마다 남겨진 작은 물방울';
    const spreads = currentChapterSpreads();
    state.spreadIndex = Math.max(0, Math.min(state.spreadIndex, spreads.length - 1));
    const spread = spreads[state.spreadIndex];
    els.leftVerses.innerHTML = spread.left.map(renderVerse).join('');
    els.rightVerses.innerHTML = spread.right.map(renderVerse).join('');
    const spreadNo = state.spreadIndex + 1;
    els.leftPageNo.textContent = String(spreadNo * 2 - 1);
    els.rightPageNo.textContent = String(spreadNo * 2);
    els.progressText.textContent = `${spreadNo} / ${spreads.length}`;
  }

  function renderVerse(verse){
    const count = state.counts.get(verse.id) || 0;
    const selected = state.selected?.id === verse.id ? ' is-selected' : '';
    const bookmarked = state.bookmarks.has(verse.id) ? ' is-bookmarked' : '';
    const highlighted = state.highlights.has(verse.id) ? ' is-highlighted' : '';
    return `<button class="verse-row${selected}${bookmarked}${highlighted}" type="button" data-verse-id="${escapeHtml(verse.id)}">
      <span class="verse-no">${verse.number}</span>
      <span>${escapeHtml(verse.text)}</span>
      <span class="verse-bubble">${count || ''}</span>
    </button>`;
  }

  function renderSelected(){
    const verse = state.selected;
    els.selectedRef.textContent = `${verse.bookName} ${verse.chapter}장 ${verse.number}절`;
    els.selectedText.textContent = verse.text;
  }

  function renderTools(){
    if(!state.selected) return;
    els.bookmarkButton?.classList.toggle('is-active', state.bookmarks.has(state.selected.id));
    els.highlightButton?.classList.toggle('is-active', state.highlights.has(state.selected.id));
    els.memoButton?.classList.toggle('is-active', Boolean(state.memos[state.selected.id]));
  }

  function memberDisplayName(){
    const metadata = state.user?.user_metadata || {};
    return String(metadata.nickname || metadata.username || state.user?.email?.split('@')[0] || '회원').trim();
  }

  function renderAuth(){
    if(!els.authButton) return;
    els.authButton.innerHTML = state.user
      ? renderAuthorName(memberDisplayName(), state.user?.app_metadata?.role === 'admin')
      : '로그인';
    els.authButton.setAttribute('aria-label', state.user ? `${memberDisplayName()} 계정 메뉴` : '로그인');
    els.authButton.setAttribute('aria-expanded', String(Boolean(state.user && !els.accountMenu?.hidden)));
    if(!state.user) closeAccountMenu();
    els.logoutButton?.toggleAttribute('hidden', !state.user);
    els.adminPageLink?.toggleAttribute('hidden', state.user?.app_metadata?.role !== 'admin');
    els.authModeTabs?.toggleAttribute('hidden', Boolean(state.user));
    if(state.user){
      els.loginForm?.toggleAttribute('hidden', true);
      els.signupForm?.toggleAttribute('hidden', true);
      els.forgotPasswordForm?.toggleAttribute('hidden', true);
    }else{
      switchAuthMode(state.authMode);
    }
    if(els.authStatus){
      els.authStatus.textContent = state.user ? memberDisplayName() : '';
    }
    if(els.anonymousCheck){
      const member = Boolean(state.user);
      els.anonymousCheck.checked = !member;
      els.anonymousCheck.disabled = member;
      els.anonymousCheck.closest('label')?.toggleAttribute('hidden', true);
    }
    syncAnonymousPasswordField();
  }

  function renderComments(){
    els.commentsTab?.classList.toggle('is-active', state.panelMode === 'comments');
    els.bookmarksTab?.classList.toggle('is-active', state.panelMode === 'bookmarks');
    els.commentForm?.toggleAttribute('hidden', state.panelMode !== 'comments');
    els.commentWriteButton?.toggleAttribute('hidden', state.panelMode !== 'comments');
    if(state.panelMode !== 'comments') closeCommentComposer();
    if(els.commentSectionTitle){
      els.commentSectionTitle.textContent = state.panelMode === 'bookmarks'
        ? '저장한 책갈피'
        : state.panelMode === 'notes'
          ? '나의 노트'
          : `${els.selectedRef?.textContent || '선택한 절'} 코멘트`;
    }
    if(state.panelMode === 'bookmarks'){
      renderBookmarks();
      return;
    }
    if(state.panelMode === 'notes'){
      renderMemos();
      return;
    }
    const comments = selectedComments();
    els.commentCount.textContent = String(comments.length);
    if(!comments.length){
      els.commentList.innerHTML = '<p class="empty">아직 작성된 코멘트가 없습니다.</p>';
      return;
    }
    els.commentList.innerHTML = comments.map(comment => `<article class="comment-item" data-comment-verse-id="${escapeHtml(comment.verse_id)}">
      <div class="comment-meta"><strong>${renderAuthorName(comment.user_name || '익명', comment.is_official)}</strong><span>${formatDate(comment.created_at)}${comment.updated_at && comment.updated_at !== comment.created_at ? ' · 수정됨' : ''}</span></div>
      <p>${escapeHtml(comment.content)}</p>
      ${comment.has_edit_password || comment.can_manage ? `<div class="comment-actions"><button type="button" data-manage-comment="${escapeHtml(comment.id)}">수정·삭제</button></div>` : ''}
    </article>`).join('');
  }

  function renderBookmarks(){
    const verses = [...state.bookmarks].map(findVerse).filter(Boolean);
    els.commentCount.textContent = String(verses.length);
    if(!verses.length){
      els.commentList.innerHTML = '<p class="empty">저장한 책갈피가 없습니다.</p>';
      return;
    }
    els.commentList.innerHTML = verses.map(verse => `<button class="bookmark-item" type="button" data-open-verse="${escapeHtml(verse.id)}">
      <strong>${escapeHtml(`${verse.bookName} ${verse.chapter}:${verse.number}`)}</strong>
      <span>${escapeHtml(verse.text.slice(0, 70))}</span>
    </button>`).join('');
  }

  function renderMemos(){
    const verses = Object.entries(state.memos)
      .map(([id, memo])=>({verse:findVerse(id), memo:String(memo || '').trim()}))
      .filter(item=>item.verse && item.memo);
    els.commentCount.textContent = String(verses.length);
    if(!verses.length){
      els.commentList.innerHTML = '<p class="empty">저장한 메모가 없습니다. 절을 선택하고 메모 버튼을 눌러 기록하세요.</p>';
      return;
    }
    els.commentList.innerHTML = verses.map(({verse, memo})=>`<button class="bookmark-item memo-list-item" type="button" data-open-verse="${escapeHtml(verse.id)}">
      <strong>${escapeHtml(`${verse.bookName} ${verse.chapter}:${verse.number}`)}</strong>
      <span>${escapeHtml(memo)}</span>
    </button>`).join('');
  }

  function renderTogether(){
    els.togetherList.innerHTML = [...new Set(RECOMMENDED_VERSES)]
      .filter(id => id !== state.selected.id)
      .slice(0,4)
      .map(id => {
        const verse = findVerse(id);
        if(!verse) return '';
        return `<button type="button" data-open-verse="${id}">${escapeHtml(`${verse.bookName} ${verse.chapter}:${verse.number}`)} ${escapeHtml(verse.text.slice(0, 36))}</button>`;
      }).join('');
  }

  async function submitComment(event){
    event.preventDefault();
    if(!state.runtime.writes){
      setStatus(state.runtime.message || '현재 접속자 급증으로 댓글 작성을 잠시 중단했습니다.');
      return;
    }
    const content = els.commentInput.value.trim();
    if(!content || !state.selected) return;
    const targetVerse = state.selected;
    if(!db){
      setStatus('Supabase 연결을 확인해주세요.');
      return;
    }
    const isAnonymous = !state.user;
    const anonymousName = (els.commentAnonymousName?.value || '').trim() || '익명';
    const password = els.commentPassword?.value || '';
    if(content.length > 1000){
      setStatus('댓글은 1,000자 이하로 입력하세요.');
      els.commentInput?.focus();
      return;
    }
    if(isAnonymous && anonymousName.length > 20){
      setStatus('익명 닉네임은 20자 이하로 입력하세요.');
      els.commentAnonymousName?.focus();
      return;
    }
    if(isAnonymous && isProtectedNickname(anonymousName)){
      setStatus('사용할 수 없는 닉네임입니다.');
      els.commentAnonymousName?.focus();
      return;
    }
    if(isAnonymous && password.length < 8){
      setStatus('익명 댓글 비밀번호를 8자 이상 입력하세요.');
      els.commentPassword?.focus();
      return;
    }
    if(isAnonymous && password.length > 64){
      setStatus('익명 댓글 비밀번호는 64자 이하로 입력하세요.');
      els.commentPassword?.focus();
      return;
    }
    if(!isAnonymous && !state.user){
      setStatus('익명이 아닌 댓글은 먼저 로그인해야 합니다.');
      openAuthDialog();
      return;
    }
    try{
      const result = await createVerseComment({
        verseId: targetVerse.id,
        content,
        isAnonymous,
        anonymousName,
        password
      });
      if(result.error){
        console.warn('[BJT] comment insert failed', result.error);
        setStatus('댓글 저장 서버 설정을 확인해주세요.');
        return;
      }
      els.commentInput.value = '';
      if(els.commentPassword) els.commentPassword.value = '';
      if(state.selected?.id === targetVerse.id){
        await loadComments([targetVerse.id]);
        renderComments();
        renderChapter();
        closeCommentComposer();
        openPanel();
      }
      setStatus(`${targetVerse.bookName} ${targetVerse.chapter}:${targetVerse.number}에 코멘트를 남겼습니다.`);
    }catch(error){
      console.warn('[BJT] comment save failed', error);
      setStatus('댓글 저장 연결을 다시 확인하는 중입니다.');
    }
  }

  async function createVerseComment({verseId, content, isAnonymous, anonymousName, password}){
    if(state.commentBackend !== 'legacy'){
      const unifiedResult = await withTimeout(
        invokeWrite('create_discussion_comment', {
          p_target_key: verseDiscussionTarget(verseId),
          p_content: content,
          p_parent_id: null,
          p_anonymous_name: isAnonymous ? anonymousName : null,
          p_password: isAnonymous ? password : null,
          p_anonymous_id: isAnonymous ? anonymousId() : null
        }),
        12000,
        'unified verse comment insert'
      );
      if(!unifiedResult.error){
        state.commentBackend = 'unified';
        return unifiedResult;
      }
      if(!isUnifiedBackendUnavailable(unifiedResult.error)) return unifiedResult;
      state.commentBackend = 'legacy';
    }

    return withTimeout(
      isAnonymous
        ? invokeWrite('create_anonymous_comment', {
          p_verse_id: verseId,
          p_content: content,
          p_user_name: anonymousName,
          p_password: password,
          p_anonymous_id: anonymousId()
        })
        : invokeWrite('create_member_comment', {
          p_verse_id: verseId,
          p_content: content
        }),
      12000,
      'legacy verse comment insert'
    );
  }

  function isUnifiedBackendUnavailable(error){
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    return ['42883', '42P01', 'PGRST202', 'PGRST205'].includes(code)
      || message.includes('discussion_target_unavailable')
      || message.includes('discussion_comments_public')
      || message.includes('create_discussion_comment')
      || message.includes('schema cache');
  }

  function syncAnonymousPasswordField(){
    const enabled = !state.user;
    els.commentPasswordRow?.toggleAttribute('hidden', !enabled);
    if(!enabled && els.commentAnonymousName) els.commentAnonymousName.value = '';
    if(els.commentPassword){
      els.commentPassword.required = enabled;
      if(!enabled) els.commentPassword.value = '';
    }
  }

  function openCommentManageDialog(commentId){
    const comment = state.comments.find(row => String(row.id) === String(commentId));
    if(!comment || !els.commentManageDialog) return;
    state.managingCommentId = comment.id;
    els.commentEditInput.value = comment.content || '';
    els.commentEditPassword.value = '';
    const memberOwned = Boolean(comment.can_manage && !comment.has_edit_password);
    els.commentEditPassword.toggleAttribute('hidden', memberOwned);
    els.commentEditPassword.required = !memberOwned;
    const heading = els.commentManageDialog.querySelector('h2');
    if(heading) heading.textContent = memberOwned ? '댓글 수정·삭제' : '익명 댓글 수정·삭제';
    setCommentManageStatus('');
    if(typeof els.commentManageDialog.showModal === 'function') els.commentManageDialog.showModal();
  }

  function closeCommentManageDialog(){
    state.managingCommentId = null;
    els.commentManageForm?.reset();
    if(els.commentManageDialog?.open) els.commentManageDialog.close();
  }

  async function updateAnonymousComment(event){
    event.preventDefault();
    const commentId = state.managingCommentId;
    const content = els.commentEditInput?.value.trim();
    const password = els.commentEditPassword?.value || '';
    const comment = state.comments.find(row => String(row.id) === String(commentId));
    const memberOwned = Boolean(comment?.can_manage && !comment?.has_edit_password);
    if(!commentId || !content || (!memberOwned && password.length < 8)){
      setCommentManageStatus(memberOwned ? '댓글 내용을 입력하세요.' : '댓글 내용과 8자 이상의 비밀번호를 입력하세요.');
      return;
    }
    try{
      const isUnified = comment?.backend === 'unified';
      const result = await withTimeout(
        invokeWrite(
          isUnified ? 'update_discussion_comment' : (memberOwned ? 'update_member_comment' : 'update_anonymous_comment'),
          {
            p_comment_id: commentId,
            p_content: content,
            ...(memberOwned ? {} : {p_password: password})
          }
        ),
        12000,
        isUnified ? 'unified comment update' : 'anonymous comment update'
      );
      if(result.error) throw result.error;
      closeCommentManageDialog();
      await refreshComments();
      setStatus('댓글을 수정했습니다.');
    }catch(error){
      console.warn('[BJT] anonymous comment update failed', error);
      setCommentManageStatus('비밀번호가 맞지 않거나 수정할 수 없는 댓글입니다.');
      window.alert('비밀번호가 틀렸거나 수정 권한이 없습니다.');
    }
  }

  async function deleteAnonymousComment(){
    const commentId = state.managingCommentId;
    const password = els.commentEditPassword?.value || '';
    const comment = state.comments.find(row => String(row.id) === String(commentId));
    const memberOwned = Boolean(comment?.can_manage && !comment?.has_edit_password);
    if(!commentId || (!memberOwned && password.length < 8)){
      setCommentManageStatus(memberOwned ? '삭제할 댓글을 확인하세요.' : '작성할 때 설정한 비밀번호를 입력하세요.');
      return;
    }
    if(!confirm('이 댓글을 삭제할까요?')) return;
    try{
      const isUnified = comment?.backend === 'unified';
      const result = await withTimeout(
        invokeWrite(
          isUnified ? 'delete_discussion_comment' : (memberOwned ? 'delete_member_comment' : 'delete_anonymous_comment'),
          {
            p_comment_id: commentId,
            ...(memberOwned ? {} : {p_password: password})
          }
        ),
        12000,
        isUnified ? 'unified comment delete' : 'anonymous comment delete'
      );
      if(result.error) throw result.error;
      closeCommentManageDialog();
      await refreshComments();
      setStatus('댓글을 삭제했습니다.');
    }catch(error){
      console.warn('[BJT] anonymous comment delete failed', error);
      setCommentManageStatus('비밀번호가 맞지 않거나 삭제할 수 없는 댓글입니다.');
      window.alert('비밀번호가 틀렸거나 삭제 권한이 없습니다.');
    }
  }

  function setCommentManageStatus(text){
    if(els.commentManageStatus) els.commentManageStatus.textContent = text || '';
  }

  async function searchVerse(event){
    event.preventDefault();
    const query = els.searchInput.value.trim();
    if(!query) return;
    let match = await findByReference(query);
    if(!match && query.length < 2){
      setStatus('본문 검색어는 두 글자 이상 입력해 주세요.');
      return;
    }
    if(!match) match = allVerses().find(row => row.text.includes(query));
    if(!match && db && state.runtime.dynamicReads){
      const safeQuery = query.replace(/[%_]/g, value => `\\${value}`);
      const {data, error} = await db
        .from('bible_verses')
        .select('id')
        .ilike('content', `%${safeQuery}%`)
        .order('sort_order', {ascending:true})
        .limit(1)
        .maybeSingle();
      if(error) console.warn('[BJT] server bible search failed', error);
      if(data?.id) match = data;
    }
    if(match) await openVerse(match.id);
    else setStatus('맞는 말씀을 찾지 못했습니다.');
  }

  async function findByReference(query){
    const normalized = query
      .replace(/[：]/g, ':')
      .replace(/\s+/g, ' ')
      .replace(/\s*절\s*$/g, '')
      .trim();
    const reference = normalized.match(/^(.+?)\s+(\d+)(?:\s*장)?(?:\s*[: ]\s*(\d+))?$/)
      || normalized.match(/^(.+?)(\d+)(?:장)?(?:\s*[: ]\s*(\d+))?$/);
    if(!reference) return null;
    const bookQuery = reference[1].trim();
    const chapter = Number(reference[2]);
    const verse = Number(reference[3] || 1);
    if(!chapter || !verse) return null;
    const bookIndex = state.bible.findIndex(book => matchesBookName(book.name, bookQuery));
    if(bookIndex < 0) return null;
    try{
      await ensureBookLoaded(bookIndex);
    }catch(error){
      console.warn('[BJT] reference book load failed', error);
      return null;
    }
    return state.bible[bookIndex].chapters
      .find(row => row.number === chapter)?.verses
      .find(row => row.number === verse) || null;
  }

  function matchesBookName(bookName, query){
    const cleanBook = compact(bookName);
    const cleanQuery = compact(query);
    const aliases = {
      '요':'요한복음',
      '요한':'요한복음',
      '계':'요한계시록',
      '계시록':'요한계시록',
      '시':'시편',
      '잠':'잠언',
      '마':'마태복음',
      '막':'마가복음',
      '눅':'누가복음',
      '창':'창세기',
      '출':'출애굽기'
    };
    if(aliases[cleanQuery]) return compact(aliases[cleanQuery]) === cleanBook;
    return cleanBook.includes(cleanQuery) || cleanQuery.includes(cleanBook);
  }

  function compact(value){
    return String(value || '').replace(/\s+/g, '').trim();
  }

  async function openVerse(id){
    const targetBookIndex = state.bible.findIndex(book => id.startsWith(`${book.key}-`));
    if(targetBookIndex >= 0){
      try{
        await ensureBookLoaded(targetBookIndex);
      }catch(error){
        console.warn('[BJT] bible book load failed', error);
        setStatus('해당 성경 본문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
    }
    const verse = findVerse(id);
    if(!verse) return;
    const bookIndex = state.bible.findIndex(book => book.key === verse.bookKey);
    const chapterIndex = state.bible[bookIndex].chapters.findIndex(chapter => chapter.number === verse.chapter);
    state.bookIndex = bookIndex;
    state.chapterIndex = chapterIndex;
    state.spreadIndex = 0;
    state.selected = verse;
    render();
    state.spreadIndex = currentChapterSpreads().findIndex(spread =>
      spread.left.some(item => item.id === id) || spread.right.some(item => item.id === id)
    );
    if(state.spreadIndex < 0) state.spreadIndex = 0;
    render();
    refreshComments();
  }

  async function moveChapter(delta){
    let bookIndex = state.bookIndex;
    let chapterIndex = state.chapterIndex + delta;
    if(chapterIndex < 0 && bookIndex > 0){
      bookIndex -= 1;
      chapterIndex = state.bible[bookIndex].chapters.length - 1;
    }else if(chapterIndex >= state.bible[bookIndex].chapters.length && bookIndex < state.bible.length - 1){
      bookIndex += 1;
      chapterIndex = 0;
    }
    await jumpTo(bookIndex, chapterIndex);
  }

  function moveSpread(delta){
    const max = spreadCountForChapter(currentChapter()) - 1;
    const nextSpread = state.spreadIndex + delta;
    if(nextSpread >= 0 && nextSpread <= max){
      state.spreadIndex = nextSpread;
      selectFirstVisibleVerse();
      render();
      refreshComments();
      return;
    }
    void moveChapterBySpread(delta);
  }

  async function jumpTo(bookIndex, chapterIndex){
    const nextBookIndex = Math.max(0, Math.min(bookIndex, state.bible.length - 1));
    try{
      await ensureBookLoaded(nextBookIndex);
    }catch(error){
      console.warn('[BJT] bible book load failed', error);
      setStatus('해당 성경 본문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    state.bookIndex = nextBookIndex;
    state.chapterIndex = Math.max(0, Math.min(chapterIndex, currentBook().chapters.length - 1));
    state.spreadIndex = 0;
    selectFirstVerse();
    render();
    refreshComments();
  }

  async function jumpToFirstSpread(){
    await jumpTo(0, 0);
  }

  async function jumpToLastSpread(){
    const lastBookIndex = state.bible.length - 1;
    try{
      await ensureBookLoaded(lastBookIndex);
    }catch(error){
      console.warn('[BJT] last bible book load failed', error);
      setStatus('마지막 성경 본문을 불러오지 못했습니다.');
      return;
    }
    state.bookIndex = lastBookIndex;
    state.chapterIndex = currentBook().chapters.length - 1;
    state.spreadIndex = spreadCountForChapter(currentChapter()) - 1;
    selectFirstVisibleVerse();
    render();
    refreshComments();
  }

  async function moveChapterBySpread(delta){
    let bookIndex = state.bookIndex;
    let chapterIndex = state.chapterIndex + delta;
    if(chapterIndex < 0 && bookIndex > 0){
      bookIndex -= 1;
      chapterIndex = state.bible[bookIndex].chapters.length - 1;
    }else if(chapterIndex >= state.bible[bookIndex].chapters.length && bookIndex < state.bible.length - 1){
      bookIndex += 1;
      chapterIndex = 0;
    }else if(chapterIndex < 0 || chapterIndex >= state.bible[bookIndex].chapters.length){
      return;
    }
    try{
      await ensureBookLoaded(bookIndex);
    }catch(error){
      console.warn('[BJT] adjacent bible book load failed', error);
      setStatus('다음 성경 본문을 불러오지 못했습니다.');
      return;
    }
    state.bookIndex = bookIndex;
    state.chapterIndex = chapterIndex;
    state.spreadIndex = delta < 0 ? spreadCountForChapter(currentChapter()) - 1 : 0;
    selectFirstVisibleVerse();
    render();
    refreshComments();
  }

  async function copySelected(){
    if(!state.selected) return;
    const text = `${state.selected.bookName} ${state.selected.chapter}:${state.selected.number} ${state.selected.text}`;
    try{
      await navigator.clipboard.writeText(text);
      setStatus('선택한 절을 복사했습니다.');
    }catch(_){
      setStatus(text);
    }
  }

  function toggleBookmark(){
    if(!state.selected) return;
    if(state.bookmarks.has(state.selected.id)){
      state.bookmarks.delete(state.selected.id);
      setStatus('책갈피를 해제했습니다.');
    }else{
      state.bookmarks.add(state.selected.id);
      setStatus('책갈피에 저장했습니다.');
    }
    saveUserMark(state.selected.id);
    render();
  }

  function toggleHighlight(){
    if(!state.selected) return;
    if(state.highlights.has(state.selected.id)){
      state.highlights.delete(state.selected.id);
      setStatus('하이라이트를 해제했습니다.');
    }else{
      state.highlights.add(state.selected.id);
      setStatus('하이라이트를 표시했습니다.');
    }
    saveUserMark(state.selected.id);
    render();
  }

  function openMemoDialog(){
    if(!state.selected) return;
    const previous = state.memos[state.selected.id] || '';
    if(els.memoDialogTitle) els.memoDialogTitle.textContent = `${state.selected.bookName} ${state.selected.chapter}:${state.selected.number} 메모`;
    if(els.memoInput) els.memoInput.value = previous;
    if(els.memoStatus) els.memoStatus.textContent = '';
    els.memoDeleteButton?.toggleAttribute('hidden', !previous);
    if(typeof els.memoDialog?.showModal === 'function') els.memoDialog.showModal();
  }

  function closeMemoDialog(){
    if(els.memoDialog?.open) els.memoDialog.close();
  }

  function saveMemo(event){
    event?.preventDefault();
    if(!state.selected) return;
    const next = String(els.memoInput?.value || '').trim();
    if(next) state.memos[state.selected.id] = next;
    else delete state.memos[state.selected.id];
    saveUserMark(state.selected.id);
    closeMemoDialog();
    setStatus(next ? '메모를 저장했습니다.' : '메모를 삭제했습니다.');
    render();
  }

  function deleteMemo(){
    if(!state.selected) return;
    delete state.memos[state.selected.id];
    saveUserMark(state.selected.id);
    closeMemoDialog();
    setStatus('메모를 삭제했습니다.');
    render();
  }

  function openTodayVerse(){
    const day = Math.floor(Date.now() / 86400000);
    void openVerse(RECOMMENDED_VERSES[day % RECOMMENDED_VERSES.length]);
  }

  function listenSelected(){
    if(!state.selected || !window.speechSynthesis) {
      setStatus('이 브라우저에서는 음성 읽기를 사용할 수 없습니다.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${state.selected.bookName} ${state.selected.chapter}장 ${state.selected.number}절. ${state.selected.text}`);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    setStatus('선택한 절을 읽는 중입니다.');
  }

  function cycleFontScale(){
    state.settings.fontScale = (state.settings.fontScale + 1) % 3;
    applySettings();
    refreshChapterLayout();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
    setStatus(['기본 글자 크기입니다.','글자를 크게 표시합니다.','글자를 더 크게 표시합니다.'][state.settings.fontScale]);
  }

  function openAuthDialog(){
    if(!els.authDialog) return;
    renderAuth();
    if(typeof els.authDialog.showModal === 'function') els.authDialog.showModal();
    else setStatus(state.user ? '로그인되어 있습니다.' : '로그인 창을 열 수 없습니다.');
  }

  function toggleAccountAccess(event){
    event?.stopPropagation();
    if(!state.user){
      openAuthDialog();
      return;
    }
    const opening = Boolean(els.accountMenu?.hidden);
    els.accountMenu?.toggleAttribute('hidden', !opening);
    els.authButton?.setAttribute('aria-expanded', String(opening));
  }

  function closeAccountMenu(){
    els.accountMenu?.toggleAttribute('hidden', true);
    els.authButton?.setAttribute('aria-expanded', 'false');
  }

  function openProfileDialog(){
    if(!state.user || !els.profileDialog) return;
    closeAccountMenu();
    els.profileUsername.value = state.user.user_metadata?.username || '';
    els.profileNickname.value = state.user.user_metadata?.nickname || state.user.user_metadata?.username || '';
    els.profileEmail.value = state.user.email || '';
    els.profileStatus.textContent = '';
    if(typeof els.profileDialog.showModal === 'function') els.profileDialog.showModal();
  }

  function closeProfileDialog(){
    if(els.profileDialog?.open) els.profileDialog.close();
  }

  function openPasswordDialog(){
    if(!state.user || !els.passwordDialog) return;
    closeAccountMenu();
    els.passwordForm?.reset();
    els.passwordStatus.textContent = '';
    if(els.passwordDialogTitle) els.passwordDialogTitle.textContent = state.passwordRecovery ? '새 비밀번호 설정' : '비밀번호 변경';
    if(typeof els.passwordDialog.showModal === 'function') els.passwordDialog.showModal();
  }

  function closePasswordDialog(){
    if(els.passwordDialog?.open) els.passwordDialog.close();
  }

  async function updatePassword(event){
    event.preventDefault();
    const password = els.newPassword?.value || '';
    const confirmation = els.newPasswordConfirm?.value || '';
    if(password.length < 8 || password !== confirmation){
      els.passwordStatus.textContent = '8자 이상의 같은 비밀번호를 두 번 입력하세요.';
      return;
    }
    try{
      const {error} = await db.auth.updateUser({password});
      if(error) throw error;
      if(state.passwordRecovery){
        state.passwordRecovery = false;
        await db.auth.signOut();
        state.user = null;
        restoreLocalTools();
        clearPasswordResetUrl();
        closePasswordDialog();
        state.authMode = 'login';
        renderAuth();
        render();
        openAuthDialog();
        setAuthStatus('비밀번호를 변경했습니다. 새 비밀번호로 로그인하세요.');
        return;
      }
      closePasswordDialog();
      setStatus('비밀번호를 변경했습니다.');
    }catch(error){
      console.warn('[BJT] password update failed', error);
      const message = String(error?.message || '').toLowerCase();
      els.passwordStatus.textContent = message.includes('different from the old password') || message.includes('same password')
        ? '기존 비밀번호와 같은 비밀번호로 변경할 수 없습니다.'
        : state.passwordRecovery
          ? '비밀번호를 변경하지 못했습니다. 인증 링크를 다시 요청하세요.'
          : '비밀번호를 변경하지 못했습니다. 다시 로그인한 뒤 시도하세요.';
    }
  }

  function closeAuthDialog(){
    if(els.authDialog?.open) els.authDialog.close();
  }

  function switchAuthMode(mode){
    if(state.user) return;
    state.authMode = mode === 'signup' || mode === 'forgot' ? mode : 'login';
    const signup = state.authMode === 'signup';
    const forgot = state.authMode === 'forgot';
    els.loginForm?.toggleAttribute('hidden', signup || forgot);
    els.signupForm?.toggleAttribute('hidden', !signup);
    els.forgotPasswordForm?.toggleAttribute('hidden', !forgot);
    els.loginModeButton?.classList.toggle('is-active', !signup && !forgot);
    els.signupModeButton?.classList.toggle('is-active', signup);
    els.loginModeButton?.setAttribute('aria-selected', String(!signup && !forgot));
    els.signupModeButton?.setAttribute('aria-selected', String(signup));
    setAuthStatus('');
    resetAvailabilityStatuses();
  }

  function passwordResetRedirectUrl(){
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('password-reset', '1');
    return url.href;
  }

  function clearPasswordResetUrl(){
    const url = new URL(location.href);
    url.searchParams.delete('password-reset');
    history.replaceState(null, '', `${url.pathname}${url.search}#reader`);
  }

  async function requestPasswordReset(event){
    event.preventDefault();
    const email = els.forgotPasswordEmail?.value.trim() || '';
    if(!email || !els.forgotPasswordEmail?.checkValidity()){
      setAuthStatus('가입할 때 사용한 이메일을 정확히 입력하세요.');
      return;
    }
    if(!db?.auth || location.protocol === 'file:'){
      setAuthStatus('비밀번호 찾기는 로컬 HTTP 주소 또는 배포 주소에서 사용할 수 있습니다.');
      return;
    }
    try{
      const {error} = await db.auth.resetPasswordForEmail(email, {redirectTo:passwordResetRedirectUrl()});
      if(error) throw error;
      els.forgotPasswordForm?.reset();
      setAuthStatus('가입된 이메일이면 비밀번호 재설정 링크가 발송됩니다. 이메일을 확인하세요.');
    }catch(error){
      console.warn('[BJT] password reset email failed', error);
      setAuthStatus('인증 링크를 보내지 못했습니다. 잠시 후 다시 시도하세요.');
    }
  }

  function availabilityElements(field){
    return {
      username:els.usernameAvailability,
      nickname:els.nicknameAvailability
    }[field] || null;
  }

  function setAvailabilityStatus(field, text, tone=''){
    const target = availabilityElements(field);
    if(!target) return;
    target.textContent = text;
    if(tone) target.dataset.tone = tone;
    else delete target.dataset.tone;
  }

  function clearAvailabilityStatus(field){
    setAvailabilityStatus(field, '');
  }

  function resetAvailabilityStatuses(){
    ['username','nickname'].forEach(clearAvailabilityStatus);
  }

  function duplicateMessage(field){
    if(field === 'username') return '이미 사용 중인 아이디입니다.';
    return '이미 사용 중인 닉네임입니다.';
  }

  function availableMessage(field){
    if(field === 'username') return '사용할 수 있는 아이디입니다.';
    return '사용할 수 있는 닉네임입니다.';
  }

  async function requestSignupAvailability(payload){
    if(!db) throw new Error('availability server unavailable');
    const {data, error} = await db.rpc('check_member_identity_availability', {
      p_username:payload?.username || null,
      p_nickname:payload?.nickname || null
    });
    if(error || !data) throw error || new Error('availability response missing');
    return data;
  }

  async function checkSignupField(field){
    const value = String({
      username:els.signupUsername?.value,
      nickname:els.signupNickname?.value
    }[field] || '').trim();
    if(field === 'username' && !/^[A-Za-z0-9_]{3,24}$/.test(value)){
      setAvailabilityStatus(field, '아이디는 영문·숫자·밑줄 3~24자로 입력하세요.', 'error');
      return false;
    }
    if(field === 'nickname' && (value.length < 2 || value.length > 20)){
      setAvailabilityStatus(field, '닉네임은 2~20자로 입력하세요.', 'error');
      return false;
    }
    setAvailabilityStatus(field, '중복 여부를 확인하는 중입니다.');
    try{
      const availability = await requestSignupAvailability({[field]:value});
      const blocked = Boolean(availability.blocked?.[field]);
      const conflict = Boolean(availability.conflicts?.[field]);
      setAvailabilityStatus(field, blocked ? '사용할 수 없는 닉네임입니다.' : (conflict ? duplicateMessage(field) : availableMessage(field)), blocked || conflict ? 'error' : 'success');
      return !blocked && !conflict;
    }catch(error){
      console.warn('[BJT] availability check failed', error);
      setAvailabilityStatus(field, '중복 확인 서버에 연결하지 못했습니다.', 'error');
      return false;
    }
  }

  async function loginWithUsername(event){
    event.preventDefault();
    const username = els.loginUsername?.value.trim();
    const password = els.loginPassword?.value || '';
    if(!/^[A-Za-z0-9_]{3,24}$/.test(username || '') || password.length < 8){
      setAuthStatus('아이디와 8자 이상의 비밀번호를 확인하세요.');
      return;
    }
    if(!db?.functions || !db?.auth){
      setAuthStatus('로그인 서버 연결을 확인할 수 없습니다.');
      return;
    }
    if(location.protocol === 'file:'){
      setAuthStatus('아이디 로그인은 로컬 HTTP 주소 또는 배포 주소에서 사용할 수 있습니다.');
      return;
    }
    try{
      const {data, error} = await db.functions.invoke('login-by-username', {
        body: {username, password}
      });
      if(error || !data?.session?.access_token || !data?.session?.refresh_token){
        throw error || new Error('missing session');
      }
      const sessionResult = await db.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      if(sessionResult.error) throw sessionResult.error;
      if(els.loginPassword) els.loginPassword.value = '';
      setAuthStatus('로그인했습니다.');
      renderAuth();
      await loadUserMarks();
      render();
      closeAuthDialog();
    }catch(error){
      console.warn('[BJT] username login failed', error);
      setAuthStatus('아이디·비밀번호가 맞지 않거나 이메일 인증이 완료되지 않았습니다.');
    }
  }

  async function signupWithEmailVerification(event){
    event.preventDefault();
    const username = els.signupUsername?.value.trim();
    const nickname = els.signupNickname?.value.trim();
    const email = els.signupEmail?.value.trim();
    const password = els.signupPassword?.value || '';
    const confirmation = els.signupPasswordConfirm?.value || '';
    if(!/^[A-Za-z0-9_]{3,24}$/.test(username || '')){
      setAuthStatus('아이디는 영문·숫자·밑줄 3~24자로 입력하세요.');
      return;
    }
    if(!nickname || nickname.length < 2 || nickname.length > 20){
      setAuthStatus('댓글에 표시할 닉네임은 2~20자로 입력하세요.');
      return;
    }
    if(!email || password.length < 8 || password !== confirmation){
      setAuthStatus('이메일과 비밀번호를 확인하세요. 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if(!db?.auth){
      setAuthStatus('회원가입 서버 연결을 확인할 수 없습니다.');
      return;
    }
    if(location.protocol === 'file:'){
      setAuthStatus('이메일 인증 가입은 로컬 HTTP 주소 또는 배포 주소에서 사용할 수 있습니다.');
      return;
    }
    try{
      const availability = await requestSignupAvailability({username, nickname});
      const conflicts = availability.conflicts || {};
      const blocked = availability.blocked || {};
      ['username','nickname'].forEach(field=>{
        const invalidNickname = field === 'nickname' && blocked.nickname;
        setAvailabilityStatus(field, invalidNickname ? '사용할 수 없는 닉네임입니다.' : (conflicts[field] ? duplicateMessage(field) : availableMessage(field)), invalidNickname || conflicts[field] ? 'error' : 'success');
      });
      const conflictField = ['username','nickname'].find(field=>conflicts[field]);
      if(blocked.nickname || conflictField || availability.available !== true){
        setAuthStatus(blocked.nickname ? '사용할 수 없는 닉네임입니다.' : (conflictField ? duplicateMessage(conflictField) : '입력한 회원정보의 중복 여부를 확인하지 못했습니다.'));
        return;
      }
      const signupOptions = {data: {username, nickname}};
      if(location.protocol === 'http:' || location.protocol === 'https:'){
        signupOptions.emailRedirectTo = `${location.origin}${location.pathname}`;
      }
      const {data, error} = await db.auth.signUp({
        email,
        password,
        options: signupOptions
      });
      if(error) throw error;
      els.signupForm?.reset();
      resetAvailabilityStatuses();
      if(data?.session){
        await db.auth.signOut();
        state.user = null;
        setAuthStatus('이메일 인증 필수 설정이 꺼져 있습니다. Supabase에서 이메일 확인을 켠 뒤 사용하세요.');
      }else{
        setAuthStatus('인증 이메일을 보냈습니다. 이메일이 오지 않으면 이미 가입되어 있거나 사용할 수 없는 이메일일 수 있습니다.');
      }
    }catch(error){
      console.warn('[BJT] signup failed', error);
      setAuthStatus('아이디·닉네임 중복 여부를 확인하세요. 이메일은 이미 가입되어 있거나 사용할 수 없는 주소일 수 있습니다.');
    }
  }

  async function logout(){
    if(!db?.auth) return;
    await db.auth.signOut();
    closeAccountMenu();
    state.user = null;
    restoreLocalTools();
    renderAuth();
    render();
    setAuthStatus('로그아웃했습니다.');
  }

  function setAuthStatus(text){
    if(els.authStatus) els.authStatus.textContent = text;
  }

  async function loadUserMarks(){
    if(!state.user){
      restoreLocalTools();
      return;
    }
    resetUserTools();
    if(!db) return;
    try{
      const result = await withTimeout(
        db.from('user_verse_marks').select('verse_id, bookmark, highlight, memo').eq('user_id', state.user.id),
        9000,
        'user marks select'
      );
      if(result.error) throw result.error;
      (result.data || []).forEach(row=>{
        if(row.bookmark) state.bookmarks.add(row.verse_id);
        if(row.highlight) state.highlights.add(row.verse_id);
        if(row.memo) state.memos[row.verse_id] = row.memo;
      });
    }catch(error){
      console.warn('[BJT] user marks unavailable', error);
      setStatus('회원 개인 기록 서버 연결을 확인해주세요.');
    }
  }

  async function saveUserMark(verseId){
    if(!verseId) return;
    if(!state.user){
      persistLocalTools();
      return;
    }
    if(!db) return;
    try{
      const payload = {
        user_id: state.user.id,
        verse_id: verseId,
        bookmark: state.bookmarks.has(verseId),
        highlight: state.highlights.has(verseId),
        memo: state.memos[verseId] || null,
        updated_at: new Date().toISOString()
      };
      const result = await withTimeout(
        invokeWrite('upsert_user_verse_mark', {
          p_verse_id: payload.verse_id,
          p_bookmark: payload.bookmark,
          p_highlight: payload.highlight,
          p_memo: payload.memo
        }),
        9000,
        'user marks upsert'
      );
      if(result.error) throw result.error;
    }catch(error){
      console.warn('[BJT] user mark save failed', error);
      setStatus('회원 개인 기록을 서버에 저장하지 못했습니다.');
    }
  }

  function setPanelMode(mode){
    state.panelMode = mode;
    renderComments();
    openPanel();
  }

  function selectFirstVerse(){
    state.spreadIndex = 0;
    state.selected = currentChapter().verses[0];
  }

  function selectFirstVisibleVerse(){
    state.selected = visibleVerses()[0] || currentChapter().verses[0];
  }

  function selectedComments(){
    return state.comments.filter(comment => comment.verse_id === state.selected.id);
  }

  function countByVerse(comments){
    const map = new Map();
    comments.forEach(comment => map.set(comment.verse_id, (map.get(comment.verse_id) || 0) + 1));
    return map;
  }
  function currentBook(){ return state.bible[state.bookIndex]; }
  function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
  function allVerses(){ return state.bible.flatMap(book => book.chapters.flatMap(chapter => chapter.verses)); }
  function findVerse(id){ return allVerses().find(verse => verse.id === id); }
  function countBooks(){ return state.bible.length; }
  function countChapters(){ return state.bible.reduce((sum, book)=>sum + book.chapters.length, 0); }
  function countVerses(){ return Number(state.bibleManifest?.totals?.verses || allVerses().length); }
  function currentChapterSpreads(){
    const chapter = currentChapter();
    const singlePage = getComputedStyle(els.rightVerses.closest('.book-page')).display === 'none';
    const signature = [
      singlePage ? 'single' : 'double',
      els.leftVerses.clientWidth,
      els.leftVerses.clientHeight,
      els.rightVerses.clientWidth,
      els.rightVerses.clientHeight,
      state.settings.fontScale
    ].join(':');
    const cached = chapterLayoutCache.get(chapter);
    if(cached?.signature === signature) return cached.spreads;

    const spreads = [];
    let start = 0;
    while(start < chapter.verses.length){
      const leftEnd = measuredPageEnd(els.leftVerses, chapter.verses, start);
      const rightEnd = singlePage ? leftEnd : measuredPageEnd(els.rightVerses, chapter.verses, leftEnd);
      spreads.push({
        left: chapter.verses.slice(start, leftEnd),
        right: singlePage ? [] : chapter.verses.slice(leftEnd, rightEnd)
      });
      start = rightEnd;
    }
    const result = spreads.length ? spreads : [{left: [], right: []}];
    chapterLayoutCache.set(chapter, {signature, spreads: result});
    return result;
  }
  function measuredPageEnd(container, verses, start){
    const containerRect = container.getBoundingClientRect();
    const allowedBottom = containerRect.bottom;
    const probe = container.cloneNode(false);
    probe.removeAttribute('id');
    Object.assign(probe.style, {
      position: 'fixed',
      left: '-100000px',
      top: `${containerRect.top}px`,
      width: `${Math.max(1, containerRect.width)}px`,
      height: `${Math.max(1, containerRect.height)}px`,
      minHeight: '0',
      maxHeight: `${Math.max(1, containerRect.height)}px`,
      overflow: 'visible',
      visibility: 'hidden',
      pointerEvents: 'none'
    });
    document.body.appendChild(probe);
    const probeRect = probe.getBoundingClientRect();
    const probeAllowedBottom = probeRect.top + (allowedBottom - containerRect.top);
    let end = start;
    while(end < verses.length){
      probe.insertAdjacentHTML('beforeend', renderVerse(verses[end]));
      const nextVerse = probe.lastElementChild;
      const nextVerseBottom = nextVerse?.getBoundingClientRect().bottom || probeRect.top;
      if(nextVerseBottom > probeAllowedBottom + 0.5){
        probe.lastElementChild?.remove();
        if(end === start) end += 1;
        break;
      }
      end += 1;
    }
    probe.remove();
    return end;
  }
  function refreshChapterLayout(){
    if(!state.selected) return;
    const selectedId = state.selected.id;
    chapterLayoutCache.delete(currentChapter());
    state.spreadIndex = 0;
    render();
    state.spreadIndex = currentChapterSpreads().findIndex(spread =>
      spread.left.some(verse => verse.id === selectedId) || spread.right.some(verse => verse.id === selectedId)
    );
    if(state.spreadIndex < 0) state.spreadIndex = 0;
    render();
  }
  function visibleVerses(){
    const spread = currentChapterSpreads()[state.spreadIndex];
    return spread ? [...spread.left, ...spread.right] : [];
  }
  function visibleVerseIds(){
    return visibleVerses().map(verse => verse.id);
  }
  function spreadCountForChapter(chapter){
    if(chapter === currentChapter()) return currentChapterSpreads().length;
    return chapterLayoutCache.get(chapter)?.spreads.length || 1;
  }
  function countSpreads(){
    return state.bible.reduce((total, book)=>total + book.chapters.reduce((sum, chapter)=>sum + spreadCountForChapter(chapter), 0), 0);
  }
  function spreadAbsoluteIndex(){
    const beforeBooks = state.bible.slice(0, state.bookIndex).reduce((total, book)=>total + book.chapters.reduce((sum, chapter)=>sum + spreadCountForChapter(chapter), 0), 0);
    const beforeChapters = currentBook().chapters.slice(0, state.chapterIndex).reduce((sum, chapter)=>sum + spreadCountForChapter(chapter), 0);
    return beforeBooks + beforeChapters + state.spreadIndex;
  }
  function chapterAbsoluteIndex(){
    return state.bible.slice(0, state.bookIndex).reduce((sum, book)=>sum + book.chapters.length, 0) + state.chapterIndex;
  }
  function anonymousId(){
    let id = localStorage.getItem(ANON_ID_KEY);
    if(!id){
      id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(ANON_ID_KEY, id);
    }
    return id;
  }
  function restoreLocalTools(){
    state.bookmarks = new Set(readArray(BOOKMARKS_KEY));
    state.highlights = new Set(readArray(HIGHLIGHTS_KEY));
    state.memos = readObject(MEMOS_KEY);
  }
  function resetUserTools(){
    state.bookmarks = new Set();
    state.highlights = new Set();
    state.memos = {};
  }
  function persistLocalTools(){
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...state.bookmarks]));
    localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify([...state.highlights]));
    localStorage.setItem(MEMOS_KEY, JSON.stringify(state.memos));
  }
  function restoreSettings(){
    state.settings = {...state.settings, ...readObject(SETTINGS_KEY)};
    applySettings();
  }
  function applySettings(){
    document.body.classList.toggle('font-large', state.settings.fontScale === 1);
    document.body.classList.toggle('font-xlarge', state.settings.fontScale === 2);
  }
  function readArray(key){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || '');
      return Array.isArray(parsed) ? parsed : [];
    }catch(_){
      return [];
    }
  }
  function readObject(key){
    try{
      const parsed = JSON.parse(localStorage.getItem(key) || '');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }catch(_){
      return {};
    }
  }
  function formatDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '방금 전';
    const pad = number=>String(number).padStart(2, '0');
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/ ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  function setStatus(text){
    if(!els.statusText) return;
    els.statusText.textContent = text || '';
    els.statusText.classList.toggle('is-visible', Boolean(text));
    clearTimeout(statusTimer);
    if(text){
      statusTimer = setTimeout(()=>{
        els.statusText.classList.remove('is-visible');
      }, 2600);
    }
  }
  function openPanel(){ els.journal?.classList.add('is-open'); }
  function openCommentComposer(){ els.journal?.classList.add('is-composing'); }
  function closeCommentComposer(){ els.journal?.classList.remove('is-composing'); }
  function closePanel(){
    closeCommentComposer();
    els.journal?.classList.remove('is-open');
  }
  async function invokeWrite(action, payload){
    if(!db?.functions) return {data:null, error:new Error('write gateway unavailable')};
    const idempotencyKey = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const result = await db.functions.invoke(WRITE_GATEWAY_FUNCTION, {
      body:{
        action,
        payload,
        idempotency_key:idempotencyKey
      }
    });
    if(result.error) return {data:null, error:result.error};
    if(result.data?.error) return {data:null, error:new Error(result.data.error)};
    return {data:result.data?.data, error:null};
  }
  function withTimeout(promise, ms, label){
    let timer;
    const timeout = new Promise((_, reject)=>{
      timer = setTimeout(()=>reject(new Error(`${label} timeout`)), ms);
    });
    return Promise.race([promise, timeout]).finally(()=>clearTimeout(timer));
  }
  function normalizeProtectedNickname(value){
    return String(value || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, '');
  }
  function nicknameEditDistance(source, target){
    const left = String(source || '');
    const right = String(target || '');
    let previous = Array.from({length:right.length + 1}, (_, index)=>index);
    for(let row=1; row<=left.length; row++){
      const current = [row];
      for(let column=1; column<=right.length; column++){
        const cost = left[row - 1] === right[column - 1] ? 0 : 1;
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + cost
        );
      }
      previous = current;
    }
    return previous[right.length];
  }
  function isProtectedNickname(value){
    const normalized = normalizeProtectedNickname(value);
    if(!normalized) return false;
    if(['운영자','관리자','어드민','공식','고객센터','고객지원','관리팀','운영팀','코멘트바이블']
      .some(term=>normalized.includes(term))) return true;
    if(['admin','administrator','moderator','official','staff','support'].includes(normalized)) return true;
    if(normalized.includes('commentbible')) return true;
    return normalized.length >= 8
      && normalized.length <= 16
      && nicknameEditDistance(normalized, 'commentbible') <= 3;
  }
  function officialAuthorIcon(){
    return '<svg class="official-author-icon" viewBox="0 0 16 16" role="img" aria-label="Comment Bible 공식 계정"><path d="M8 1.5 13 3.4v3.7c0 3.1-2 5.8-5 7.4-3-1.6-5-4.3-5-7.4V3.4L8 1.5Z"></path><polyline points="5.4,7.8 7.2,9.5 10.8,5.9"></polyline></svg>';
  }
  function renderAuthorName(name, isOfficial=false){
    return `<span class="author-name">${isOfficial ? officialAuthorIcon() : ''}${escapeHtml(name || '익명')}</span>`;
  }
  function escapeHtml(value){
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
})();
