(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const WRITE_GATEWAY_FUNCTION = 'write-gateway-v4';
  const RUNTIME_CONFIG_URL = 'data/runtime-config.json';
  const PAGE_SIZE = 20;
  const POST_WINDOW_SIZE = 100;
  const COMMENT_WINDOW_SIZE = 100;
  const LOCAL_POSTS_KEY = 'bjt-board-posts-v1';
  const LOCAL_COMMENTS_KEY = 'bjt-board-comments-v1';
  const LOCAL_VOTES_KEY = 'bjt-board-votes-v1';
  const LOCAL_REPORTS_KEY = 'bjt-board-reports-v1';
  const LOCAL_ACTOR_KEY = 'bjt-board-anonymous-id';
  const BOARD_LABELS = {
    notice:'공지사항',
    news:'홈페이지 소식',
    community:'커뮤니티'
  };
  const CATEGORY_LABELS = {
    notice:'공지',
    update:'업데이트',
    free:'자유',
    meditation:'묵상',
    question:'질문',
    testimony:'간증',
    suggestion:'건의'
  };
  const BOARD_CATEGORIES = {
    notice:['notice'],
    news:['update'],
    community:['free','meditation','question','testimony','suggestion']
  };

  const $ = id => document.getElementById(id);
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  const els = {};
  const state = {
    backend:'local',
    user:null,
    posts:[],
    comments:[],
    votes:[],
    board:'community',
    category:'all',
    sort:'latest',
    search:'',
    searchScope:'title_content',
    page:1,
    currentPostId:null,
    editingPostId:null,
    replyTo:null,
    pendingPassword:'',
    manageAction:null,
    manageTargetId:null,
    viewed:new Set(),
    serverVoteActive:new Map(),
    postCursor:null,
    postsExhausted:false,
    postsLoading:false,
    commentCursors:new Map(),
    commentExhausted:new Map(),
    commentsLoading:new Set(),
    runtime:{mode:'normal', dynamicReads:true, writes:true, auth:true, message:''}
  };

  document.addEventListener('DOMContentLoaded', init, {once:true});

  async function init(){
    [
      'globalBoardSearch','globalBoardSearchInput','boardAuthButton','boardAccountMenu','boardProfileButton','boardPasswordButton','boardLogoutButton',
      'boardProfileDialog','boardProfileCloseButton','boardProfileUsername','boardProfileNickname','boardProfileEmail',
      'boardPasswordDialog','boardPasswordForm','boardPasswordCloseButton','boardNewPassword','boardNewPasswordConfirm','boardPasswordStatus',
      'visiblePostCount','backendMode','engineStatus',
      'boardTabs','categoryFilter','sortFilter','openWriteButton','postList','postEmpty','boardSearchForm',
      'searchScope','boardSearchInput','pagination','listView','detailView','editorView','backToListButton','backToListBottomButton',
      'editPostButton','deletePostButton','reportPostButton','detailBoardType','detailCategory','detailOfficial',
      'detailTitle','detailAuthor','detailDate','detailViews','detailVotes','detailComments','detailContent',
      'votePostButton','votePostCount','commentCountLabel','boardCommentList','boardCommentForm',
      'boardCommentInput','commentAnonymousFields','commentNickname','commentEditPassword','commentAnonymousCheck',
      'cancelEditorButton','cancelEditorSecondaryButton','postEditorForm','editorHeading','editorBoardType',
      'editorCategory','editorTitle','editorContent','postAnonymousFields','postNickname','postEditPassword',
      'postAnonymousCheck','postCommentsEnabled','manageDialog','manageForm','manageCloseButton','manageHeading',
      'manageDescription','managePassword','manageStatus','manageCancelButton','boardAdminLink','archiveButton','archiveDialog',
      'archiveCloseButton','archiveStatus','archiveList'
    ].forEach(id => els[id] = $(id));

    restoreLocalState();
    bindEvents();
    applyQueryFilter();
    await loadRuntimeConfig();
    if(state.runtime.auth) await initAuth();
    else disableDynamicControls();
    await connectBackend();
    renderList();
    openHashPost();
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
    [els.boardAuthButton, els.openWriteButton, els.votePostButton, els.boardCommentInput].forEach(element=>{
      if(element) element.disabled = true;
    });
  }

  function bindEvents(){
    els.boardTabs.addEventListener('click', async event=>{
      const button = event.target.closest('[data-board]');
      if(!button) return;
      state.board = button.dataset.board;
      state.category = 'all';
      state.page = 1;
      els.categoryFilter.value = 'all';
      updateBoardTabs();
      await refreshServerList();
    });
    els.categoryFilter.addEventListener('change', async ()=>{
      state.category = els.categoryFilter.value;
      state.page = 1;
      await refreshServerList();
    });
    els.sortFilter.addEventListener('change', async ()=>{
      state.sort = els.sortFilter.value;
      state.page = 1;
      await refreshServerList();
    });
    els.postList.addEventListener('click', event=>{
      const button = event.target.closest('[data-open-post]');
      if(button) openPost(button.dataset.openPost);
    });
    els.pagination.addEventListener('click', async event=>{
      const loadMore = event.target.closest('[data-load-more-posts]');
      if(loadMore){
        loadMore.disabled = true;
        try{
          await loadServerPosts(false);
          renderList();
        }catch(_){
          setStatus('게시글을 더 불러오지 못했습니다.', 'warning');
        }
        return;
      }
      const button = event.target.closest('[data-page]');
      if(!button) return;
      state.page = Number(button.dataset.page) || 1;
      renderList();
      window.scrollTo({top:Math.max(0, els.listView.offsetTop - 88), behavior:'smooth'});
    });
    els.boardSearchForm.addEventListener('submit', applyBoardSearch);
    els.globalBoardSearch.addEventListener('submit', event=>{
      event.preventDefault();
      els.boardSearchInput.value = els.globalBoardSearchInput.value;
      els.searchScope.value = 'title_content';
      applyBoardSearch(event);
    });
    els.openWriteButton.addEventListener('click', ()=>openEditor());
    els.backToListButton.addEventListener('click', openList);
    els.backToListBottomButton.addEventListener('click', openList);
    els.cancelEditorButton.addEventListener('click', ()=>cancelEditor());
    els.cancelEditorSecondaryButton.addEventListener('click', ()=>cancelEditor());
    els.postEditorForm.addEventListener('submit', savePost);
    els.editorBoardType.addEventListener('change', ()=>{
      syncEditorCategories();
    });
    els.postAnonymousCheck.addEventListener('change', syncPostAuthorFields);
    els.commentAnonymousCheck.addEventListener('change', syncCommentAuthorFields);
    els.boardCommentForm.addEventListener('submit', saveComment);
    els.votePostButton.addEventListener('click', toggleVote);
    els.editPostButton.addEventListener('click', requestEditPost);
    els.deletePostButton.addEventListener('click', requestDeletePost);
    els.reportPostButton.addEventListener('click', reportCurrentPost);
    els.boardCommentList.addEventListener('click', handleCommentAction);
    els.boardAuthButton.addEventListener('click', toggleBoardAccountAccess);
    els.boardProfileButton?.addEventListener('click', openBoardProfileDialog);
    els.boardPasswordButton?.addEventListener('click', openBoardPasswordDialog);
    els.boardLogoutButton?.addEventListener('click', logoutFromBoard);
    els.boardProfileCloseButton?.addEventListener('click', closeBoardProfileDialog);
    els.boardPasswordCloseButton?.addEventListener('click', closeBoardPasswordDialog);
    els.boardPasswordForm?.addEventListener('submit', updateBoardPassword);
    els.manageForm.addEventListener('submit', submitManageDialog);
    els.manageCloseButton.addEventListener('click', closeManageDialog);
    els.manageCancelButton.addEventListener('click', closeManageDialog);
    els.archiveButton?.addEventListener('click', openArchiveDialog);
    els.archiveCloseButton?.addEventListener('click', closeArchiveDialog);
    els.archiveDialog?.addEventListener('click', event=>{
      if(event.target === els.archiveDialog) closeArchiveDialog();
    });
    document.addEventListener('click', event=>{
      if(state.user && !event.target.closest('.account-control')) closeBoardAccountMenu();
    });
    window.addEventListener('popstate', openHashPost);
  }

  function applyQueryFilter(){
    const requested = new URLSearchParams(location.search).get('board');
    if(['notice','news','community'].includes(requested)){
      state.board = requested;
    }
    updateBoardTabs();
  }

  async function initAuth(){
    if(!db?.auth){
      renderAuth();
      return;
    }
    try{
      const {data} = await db.auth.getSession();
      state.user = data?.session?.user || null;
      db.auth.onAuthStateChange((_event, session)=>{
        state.user = session?.user || null;
        renderAuth();
        syncPostAuthorFields();
        syncCommentAuthorFields();
      });
    }catch(_){
      state.user = null;
    }
    renderAuth();
  }

  function renderAuth(){
    const username = state.user?.user_metadata?.username;
    const nickname = state.user?.user_metadata?.nickname;
    const displayName = nickname || username || '계정';
    els.boardAuthButton.innerHTML = state.user ? renderAuthorName(displayName, isAdmin()) : '로그인';
    els.boardAuthButton.setAttribute('aria-label', state.user ? `${displayName} 계정 메뉴` : '로그인');
    els.boardAuthButton.setAttribute('aria-expanded', String(Boolean(state.user && !els.boardAccountMenu?.hidden)));
    if(!state.user) closeBoardAccountMenu();
    els.boardAdminLink?.toggleAttribute('hidden', !isAdmin());
    els.archiveButton?.toggleAttribute('hidden', !isAdmin());
    syncPostAuthorFields();
    syncCommentAuthorFields();
  }

  function toggleBoardAccountAccess(event){
    event?.stopPropagation();
    if(!state.user){
      location.href = 'index.html?auth=1';
      return;
    }
    const opening = Boolean(els.boardAccountMenu?.hidden);
    els.boardAccountMenu?.toggleAttribute('hidden', !opening);
    els.boardAuthButton?.setAttribute('aria-expanded', String(opening));
  }

  function closeBoardAccountMenu(){
    els.boardAccountMenu?.toggleAttribute('hidden', true);
    els.boardAuthButton?.setAttribute('aria-expanded', 'false');
  }

  function openBoardProfileDialog(){
    if(!state.user || !els.boardProfileDialog) return;
    closeBoardAccountMenu();
    const metadata = state.user.user_metadata || {};
    els.boardProfileUsername.value = metadata.username || '';
    els.boardProfileNickname.value = metadata.nickname || metadata.username || '';
    els.boardProfileEmail.value = state.user.email || '';
    if(typeof els.boardProfileDialog.showModal === 'function') els.boardProfileDialog.showModal();
  }

  function closeBoardProfileDialog(){
    if(els.boardProfileDialog?.open) els.boardProfileDialog.close();
  }

  function openBoardPasswordDialog(){
    if(!state.user || !els.boardPasswordDialog) return;
    closeBoardAccountMenu();
    els.boardPasswordForm?.reset();
    if(els.boardPasswordStatus) els.boardPasswordStatus.textContent = '';
    if(typeof els.boardPasswordDialog.showModal === 'function') els.boardPasswordDialog.showModal();
  }

  function closeBoardPasswordDialog(){
    if(els.boardPasswordDialog?.open) els.boardPasswordDialog.close();
  }

  async function updateBoardPassword(event){
    event.preventDefault();
    const password = els.boardNewPassword?.value || '';
    const confirmation = els.boardNewPasswordConfirm?.value || '';
    if(password.length < 8 || password !== confirmation){
      els.boardPasswordStatus.textContent = '8자 이상의 같은 비밀번호를 두 번 입력하세요.';
      return;
    }
    try{
      const {error} = await db.auth.updateUser({password});
      if(error) throw error;
      closeBoardPasswordDialog();
      setStatus('비밀번호를 변경했습니다.', 'success');
    }catch(error){
      const message = String(error?.message || '').toLowerCase();
      els.boardPasswordStatus.textContent = message.includes('different from the old password') || message.includes('same password')
        ? '기존 비밀번호와 같은 비밀번호로 변경할 수 없습니다.'
        : '비밀번호를 변경하지 못했습니다. 다시 로그인한 뒤 시도하세요.';
    }
  }

  async function logoutFromBoard(){
    if(!db?.auth) return;
    await db.auth.signOut();
    state.user = null;
    closeBoardAccountMenu();
    renderAuth();
    renderList();
    setStatus('로그아웃했습니다.', 'success');
  }

  async function openArchiveDialog(){
    if(!isAdmin() || !els.archiveDialog) return;
    els.archiveStatus.textContent = '삭제 기록을 불러오는 중입니다.';
    els.archiveList.replaceChildren();
    if(typeof els.archiveDialog.showModal === 'function') els.archiveDialog.showModal();
    try{
      const result = await withTimeout(db.rpc('get_deleted_discussion_content'), 12000, 'deleted content select');
      if(result.error) throw result.error;
      const rows = result.data || [];
      els.archiveStatus.textContent = rows.length ? `보관된 기록 ${rows.length}건` : '';
      els.archiveList.innerHTML = rows.length
        ? rows.map(row=>`
          <article class="archive-item">
            <div class="archive-meta">
              <strong>${escapeHtml(row.source_type || '기록')}</strong>
              <span>${escapeHtml(row.author_name || '알 수 없음')}</span>
              <time>${escapeHtml(formatDate(row.deleted_at))}</time>
              <span>${escapeHtml(row.delete_reason || '삭제')}</span>
            </div>
            <pre class="archive-content">${escapeHtml(row.content || '')}</pre>
          </article>
        `).join('')
        : '<p class="archive-empty">보관된 삭제 기록이 없습니다.</p>';
    }catch(_){
      els.archiveStatus.textContent = '삭제 보관함을 불러오지 못했습니다.';
    }
  }

  function closeArchiveDialog(){
    if(els.archiveDialog?.open) els.archiveDialog.close();
  }

  async function connectBackend(){
    if(!state.runtime.dynamicReads){
      state.posts = [];
      state.comments = [];
      setBackend('surge', state.runtime.message || '현재 접속자 급증으로 읽기 전용 운영 중입니다.');
      return;
    }
    if(location.protocol === 'file:' || !db){
      setBackend('local', '서버 기능 미연결: 이 브라우저에만 저장되는 작업본 모드입니다.');
      return;
    }
    try{
      const result = await withTimeout(
        db.from('board_posts_public').select('id').limit(1),
        6000,
        'board schema check'
      );
      if(result.error) throw result.error;
      state.backend = 'supabase';
      await loadServerPosts();
      setBackend('supabase', '공통 게시판 엔진 서버에 연결되었습니다.', 'success');
    }catch(_){
      setBackend('local', '게시판 후보 SQL이 아직 적용되지 않아 이 브라우저에만 저장합니다.');
    }
  }

  function setBackend(mode, message, tone='warning'){
    state.backend = mode;
    els.backendMode.textContent = mode === 'supabase' ? '서버' : mode === 'surge' ? '읽기 전용' : '로컬 작업본';
    els.engineStatus.textContent = message;
    els.engineStatus.className = `engine-status is-${tone}`;
  }

  async function refreshServerList(){
    if(state.backend !== 'supabase'){
      renderList();
      return;
    }
    try{
      await loadServerPosts(true);
    }catch(_){
      setStatus('게시글 목록을 새로 불러오지 못했습니다.', 'warning');
    }
    renderList();
  }

  function postSortColumn(){
    return {
      recommended:'reaction_count',
      comments:'comment_count',
      views:'view_count'
    }[state.sort] || 'created_at';
  }

  async function loadServerPosts(reset=true){
    if(state.postsLoading) return;
    state.postsLoading = true;
    try{
      if(reset){
        state.postCursor = null;
        state.postsExhausted = false;
      }
      const sortColumn = postSortColumn();
      let query = db.from('board_posts_public')
        .select('id, target_key, board_type, category, title, content, author_name, author_user_id, is_anonymous, has_edit_password, can_manage, is_official, is_pinned, comments_enabled, view_count, reaction_count, comment_count, created_at, updated_at')
        .order('is_pinned', {ascending:false});
      if(state.board !== 'all') query = query.eq('board_type', state.board);
      if(state.category !== 'all') query = query.eq('category', state.category);
      const serverSearch = state.search.replace(/[,%_()."\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
      if(serverSearch){
        if(state.searchScope === 'title') query = query.ilike('title', `%${serverSearch}%`);
        else if(state.searchScope === 'author') query = query.ilike('author_name', `%${serverSearch}%`);
        else query = query.or(`title.ilike.%${serverSearch}%,content.ilike.%${serverSearch}%`);
      }
      if(sortColumn !== 'created_at') query = query.order(sortColumn, {ascending:false});
      query = query.order('created_at', {ascending:false}).order('id', {ascending:false});
      if(!reset && state.postCursor){
        const cursor = state.postCursor;
        const conditions = [`is_pinned.lt.${cursor.is_pinned}`];
        if(sortColumn === 'created_at'){
          conditions.push(
            `and(is_pinned.eq.${cursor.is_pinned},created_at.lt.${cursor.created_at})`,
            `and(is_pinned.eq.${cursor.is_pinned},created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
          );
        }else{
          conditions.push(
            `and(is_pinned.eq.${cursor.is_pinned},${sortColumn}.lt.${cursor.sort_value})`,
            `and(is_pinned.eq.${cursor.is_pinned},${sortColumn}.eq.${cursor.sort_value},created_at.lt.${cursor.created_at})`,
            `and(is_pinned.eq.${cursor.is_pinned},${sortColumn}.eq.${cursor.sort_value},created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
          );
        }
        query = query.or(conditions.join(','));
      }
      const result = await withTimeout(
        query.limit(POST_WINDOW_SIZE + 1),
        9000,
        'board posts select'
      );
      if(result.error) throw result.error;
      const fetched = result.data || [];
      const pageRows = fetched.slice(0, POST_WINDOW_SIZE).map(normalizePost);
      state.postsExhausted = fetched.length <= POST_WINDOW_SIZE;
      const last = pageRows.at(-1);
      state.postCursor = last ? {
        is_pinned:Boolean(last.is_pinned),
        sort_value:sortColumn === 'created_at' ? null : Number(last[sortColumn] || 0),
        created_at:last.created_at,
        id:last.id
      } : state.postCursor;
      if(reset){
        state.posts = pageRows;
      }else{
        const byId = new Map(state.posts.map(post=>[String(post.id), post]));
        pageRows.forEach(post=>byId.set(String(post.id), post));
        state.posts = [...byId.values()];
      }
    }finally{
      state.postsLoading = false;
    }
  }

  async function loadServerComments(targetKey, append=false){
    if(state.commentsLoading.has(targetKey)) return;
    state.commentsLoading.add(targetKey);
    try{
      let query = db.from('discussion_comments_public')
        .select('id, target_key, parent_id, author_name, content, created_at, updated_at, has_edit_password, can_manage, is_official')
        .eq('target_key', targetKey)
        .order('created_at', {ascending:false})
        .order('id', {ascending:false});
      const cursor = append ? state.commentCursors.get(targetKey) : null;
      if(cursor){
        query = query.or([
          `created_at.lt.${cursor.created_at}`,
          `and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
        ].join(','));
      }
      const result = await withTimeout(
        query.limit(COMMENT_WINDOW_SIZE + 1),
        9000,
        'discussion comments select'
      );
      if(result.error) throw result.error;
      const fetched = result.data || [];
      const pageRows = fetched.slice(0, COMMENT_WINDOW_SIZE).map(normalizeComment);
      state.commentExhausted.set(targetKey, fetched.length <= COMMENT_WINDOW_SIZE);
      const last = pageRows.at(-1);
      if(last) state.commentCursors.set(targetKey, {created_at:last.created_at, id:last.id});
      const retained = state.comments.filter(row => row.target_key !== targetKey);
      const existing = append ? state.comments.filter(row => row.target_key === targetKey) : [];
      const byId = new Map(existing.map(row=>[String(row.id), row]));
      pageRows.forEach(row=>byId.set(String(row.id), row));
      state.comments = retained.concat([...byId.values()]);
    }finally{
      state.commentsLoading.delete(targetKey);
    }
  }

  function restoreLocalState(){
    state.posts = readJson(LOCAL_POSTS_KEY, []);
    state.comments = readJson(LOCAL_COMMENTS_KEY, []);
    state.votes = readJson(LOCAL_VOTES_KEY, []);
    if(!state.posts.length){
      state.posts = seedPosts();
      persistLocalState();
    }
  }

  function seedPosts(){
    return [
      {
        id:'local-notice-welcome',
        target_key:'post:local-notice-welcome',
        board_type:'notice',
        category:'notice',
        title:'함께 읽는 게시판 후보본 안내',
        content:'이 화면은 공통 게시판 엔진의 로컬 후보본입니다. 운영 DB에는 아직 적용되지 않았으며, 공지·홈페이지 소식·커뮤니티 글이 하나의 구조를 공유하도록 설계했습니다.',
        author_name:'Comment Bible',
        author_user_id:null,
        has_edit_password:false,
        is_official:true,
        is_pinned:true,
        comments_enabled:false,
        view_count:0,
        reaction_count:0,
        comment_count:0,
        created_at:'2026-07-27T00:00:00.000Z',
        updated_at:'2026-07-27T00:00:00.000Z',
        is_seed:true
      },
      {
        id:'local-news-engine',
        target_key:'post:local-news-engine',
        board_type:'news',
        category:'update',
        title:'회원·댓글·게시판 기능 추가',
        content:'회원가입과 이메일 인증, 성경 절 코멘트, 게시글·댓글·추천·신고 기능을 추가했습니다. 공지사항, 홈페이지 소식, 자유게시판도 함께 이용할 수 있습니다.',
        author_name:'Comment Bible',
        author_user_id:null,
        has_edit_password:false,
        is_official:true,
        is_pinned:false,
        comments_enabled:true,
        view_count:0,
        reaction_count:0,
        comment_count:0,
        created_at:'2026-07-27T00:10:00.000Z',
        updated_at:'2026-07-27T00:10:00.000Z',
        is_seed:true
      },
      {
        id:'local-community-first',
        target_key:'post:local-community-first',
        board_type:'community',
        category:'meditation',
        title:'함께 읽으며 남기고 싶은 이야기를 적어보세요',
        content:'성경 절별 코멘트와 별개로 긴 묵상, 질문, 간증과 건의사항을 나눌 수 있는 공간입니다.',
        author_name:'Comment Bible',
        author_user_id:null,
        has_edit_password:false,
        is_official:true,
        is_pinned:false,
        comments_enabled:true,
        view_count:0,
        reaction_count:0,
        comment_count:0,
        created_at:'2026-07-27T00:20:00.000Z',
        updated_at:'2026-07-27T00:20:00.000Z',
        is_seed:true
      }
    ];
  }

  function persistLocalState(){
    localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(state.posts));
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(state.comments));
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(state.votes));
  }

  function filteredPosts(){
    const search = state.search.toLocaleLowerCase('ko-KR');
    const rows = state.posts.filter(post=>{
      if(post.deleted_at) return false;
      if(state.board !== 'all' && post.board_type !== state.board) return false;
      if(state.category !== 'all' && post.category !== state.category) return false;
      if(!search) return true;
      const haystack = state.searchScope === 'title'
        ? post.title
        : state.searchScope === 'author'
          ? post.author_name
          : `${post.title} ${post.content}`;
      return String(haystack || '').toLocaleLowerCase('ko-KR').includes(search);
    });
    const sorted = [...rows].sort((a,b)=>{
      if(Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1;
      if(state.sort === 'recommended') return Number(b.reaction_count || 0) - Number(a.reaction_count || 0) || dateValue(b)-dateValue(a);
      if(state.sort === 'comments') return Number(b.comment_count || 0) - Number(a.comment_count || 0) || dateValue(b)-dateValue(a);
      if(state.sort === 'views') return Number(b.view_count || 0) - Number(a.view_count || 0) || dateValue(b)-dateValue(a);
      return dateValue(b)-dateValue(a);
    });
    return sorted;
  }

  function renderList(){
    const rows = filteredPosts();
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), pageCount);
    const start = (state.page - 1) * PAGE_SIZE;
    const visible = rows.slice(start, start + PAGE_SIZE);
    els.visiblePostCount.textContent = String(rows.length);
    els.postEmpty.hidden = visible.length > 0;
    els.postList.innerHTML = visible.map((post,index)=>{
      const number = post.is_pinned && post.board_type !== 'news'
        ? '고정'
        : String(rows.length - start - index);
      return `<tr class="${post.is_pinned ? 'is-pinned' : ''}">
        <td>${number}</td>
        <td><span class="category-badge">${escapeHtml(CATEGORY_LABELS[post.category] || post.category)}</span></td>
        <td class="post-title-cell">
          <button class="post-title-button" type="button" data-open-post="${escapeHtml(post.id)}">
            <span class="title-text">${escapeHtml(post.title)}</span>
            ${Number(post.comment_count || 0) ? `<span class="comment-number">[${Number(post.comment_count)}]</span>` : ''}
          </button>
        </td>
        <td>${renderAuthorName(post.author_name || '익명', post.is_official)}</td>
        <td>${formatListDate(post.created_at)}</td>
        <td>${Number(post.view_count || 0)}</td>
        <td>${Number(post.reaction_count || 0)}</td>
      </tr>`;
    }).join('');
    renderPagination(pageCount);
    showView('list');
  }

  function renderPagination(pageCount){
    const pages = [];
    const first = Math.max(1, state.page - 2);
    const last = Math.min(pageCount, first + 4);
    if(state.page > 1) pages.push(`<button type="button" data-page="${state.page-1}">‹</button>`);
    for(let page=first; page<=last; page++){
      pages.push(`<button class="${page===state.page?'is-active':''}" type="button" data-page="${page}">${page}</button>`);
    }
    if(state.page < pageCount) pages.push(`<button type="button" data-page="${state.page+1}">›</button>`);
    if(state.backend === 'supabase' && !state.postsExhausted){
      pages.push('<button type="button" data-load-more-posts>더 불러오기</button>');
    }
    els.pagination.innerHTML = pages.join('');
  }

  async function applyBoardSearch(event){
    event.preventDefault();
    state.search = els.boardSearchInput.value.trim();
    state.searchScope = els.searchScope.value;
    state.page = 1;
    await refreshServerList();
  }

  async function openPost(postId, updateHistory=true){
    const post = findPost(postId);
    if(!post) return;
    state.currentPostId = post.id;
    state.replyTo = null;
    if(state.backend === 'supabase'){
      try{
        await loadServerComments(post.target_key);
        await invokeWrite('record_discussion_view', {
          p_target_key:post.target_key,
          p_anonymous_id:state.user ? null : anonymousId()
        });
        await loadServerPosts();
      }catch(_){
        setStatus('게시글은 표시했지만 일부 서버 집계를 불러오지 못했습니다.', 'warning');
      }
    }else if(!state.viewed.has(post.id)){
      post.view_count = Number(post.view_count || 0) + 1;
      state.viewed.add(post.id);
      persistLocalState();
    }
    if(updateHistory){
      history.pushState(
        {view:'post', postId:post.id},
        '',
        `${location.pathname}${location.search}#post=${encodeURIComponent(post.id)}`
      );
    }
    renderDetail();
  }

  function openHashPost(){
    const match = location.hash.match(/^#post=(.+)$/);
    if(match){
      const id = decodeURIComponent(match[1]);
      if(findPost(id)){
        openPost(id, false);
        return;
      }
    }
    openList(false);
  }

  function renderDetail(){
    const post = currentPost();
    if(!post) return openList();
    els.detailBoardType.textContent = BOARD_LABELS[post.board_type] || post.board_type;
    els.detailCategory.textContent = CATEGORY_LABELS[post.category] || post.category;
    els.detailOfficial.hidden = !post.is_official;
    els.detailTitle.textContent = post.title;
    els.detailAuthor.innerHTML = renderAuthorName(post.author_name || '익명', post.is_official);
    els.detailDate.textContent = formatDate(post.created_at);
    els.detailViews.textContent = String(Number(post.view_count || 0));
    els.detailVotes.textContent = String(Number(post.reaction_count || 0));
    els.detailComments.textContent = String(Number(post.comment_count || 0));
    els.detailContent.textContent = post.content;
    els.votePostCount.textContent = String(Number(post.reaction_count || 0));
    els.votePostButton.classList.toggle('is-active', hasCurrentVote(post.target_key));
    const manageable = canManagePost(post);
    els.editPostButton.hidden = !manageable;
    els.deletePostButton.hidden = !manageable;
    els.reportPostButton.hidden = Boolean(post.is_official);
    els.boardCommentForm.hidden = !post.comments_enabled;
    renderComments(post);
    showView('detail');
  }

  function renderComments(post){
    const rows = state.comments
      .filter(row => row.target_key === post.target_key && !row.deleted_at)
      .sort((a,b)=>dateValue(a)-dateValue(b));
    const roots = rows.filter(row=>!row.parent_id);
    const ordered = [];
    roots.forEach(root=>{
      ordered.push(root);
      ordered.push(...rows.filter(row=>String(row.parent_id)===String(root.id)));
    });
    const orderedIds = new Set(ordered.map(row=>String(row.id)));
    ordered.push(...rows.filter(row=>!orderedIds.has(String(row.id))));
    els.commentCountLabel.textContent = String(rows.length);
    els.detailComments.textContent = String(rows.length);
    if(!ordered.length){
      els.boardCommentList.innerHTML = '<p class="board-comment-empty">첫 댓글을 남겨보세요.</p>';
      return;
    }
    const loadOlder = state.backend === 'supabase' && !state.commentExhausted.get(post.target_key)
      ? '<div class="board-comment-actions board-comment-load-more"><button type="button" data-load-older-comments>이전 댓글 더 불러오기</button></div>'
      : '';
    els.boardCommentList.innerHTML = loadOlder + ordered.map(comment=>{
      const manageable = canManageComment(comment);
      return `<article class="board-comment ${comment.parent_id ? 'is-reply' : ''}">
        <div class="board-comment-meta">
          <strong>${renderAuthorName(comment.author_name || '익명', comment.is_official)}</strong>
          <span>${formatDate(comment.created_at)}${wasEdited(comment) ? ' · 수정됨' : ''}</span>
        </div>
        <p>${escapeHtml(comment.content)}</p>
        <div class="board-comment-actions">
          ${!comment.parent_id ? `<button type="button" data-comment-action="reply" data-comment-id="${escapeHtml(comment.id)}">답글</button>` : ''}
          ${manageable ? `<button type="button" data-comment-action="edit" data-comment-id="${escapeHtml(comment.id)}">수정</button><button type="button" data-comment-action="delete" data-comment-id="${escapeHtml(comment.id)}">삭제</button>` : ''}
          <button type="button" data-comment-action="report" data-comment-id="${escapeHtml(comment.id)}">신고</button>
        </div>
      </article>`;
    }).join('');
  }

  function openList(updateHistory=true){
    state.currentPostId = null;
    state.editingPostId = null;
    state.replyTo = null;
    if(updateHistory) history.replaceState(null, '', `${location.pathname}${location.search}`);
    renderList();
  }

  function openEditor(post=null){
    state.editingPostId = post?.id || null;
    els.postEditorForm.reset();
    els.editorHeading.textContent = post ? '게시글 수정' : '게시글 작성';
    els.editorBoardType.value = post?.board_type || (state.board === 'all' ? 'community' : state.board);
    els.editorCategory.value = post?.category || defaultCategory(els.editorBoardType.value);
    els.editorTitle.value = post?.title || '';
    els.editorContent.value = post?.content || '';
    els.postCommentsEnabled.checked = post ? Boolean(post.comments_enabled) : true;
    els.postAnonymousCheck.checked = post ? isAnonymousRow(post) : !state.user;
    els.postNickname.value = post?.author_name && isAnonymousRow(post) ? post.author_name : '';
    els.postEditPassword.value = '';
    [...els.editorBoardType.options].forEach(option=>{
      option.disabled = !isAdmin() && option.value !== 'community';
    });
    if(!isAdmin() && els.editorBoardType.value !== 'community') els.editorBoardType.value = 'community';
    syncEditorCategories(post?.category);
    syncPostAuthorFields();
    showView('editor');
    els.editorTitle.focus();
  }

  function cancelEditor(){
    const post = state.editingPostId ? findPost(state.editingPostId) : null;
    state.pendingPassword = '';
    if(post) openPost(post.id);
    else openList();
  }

  async function savePost(event){
    event.preventDefault();
    if(!state.runtime.writes){
      setStatus(state.runtime.message || '현재 접속자 급증으로 글 작성을 잠시 중단했습니다.', 'warning');
      return;
    }
    const existing = state.editingPostId ? findPost(state.editingPostId) : null;
    const boardType = els.editorBoardType.value;
    const category = els.editorCategory.value;
    const title = els.editorTitle.value.trim();
    const content = els.editorContent.value.trim();
    const anonymous = !state.user;
    const nickname = els.postNickname.value.trim();
    const password = existing ? state.pendingPassword : els.postEditPassword.value;
    if(title.length < 2 || content.length < 2){
      setStatus('제목과 내용을 입력하세요.', 'warning');
      return;
    }
    if(title.length > 120 || content.length > 10000){
      setStatus('제목은 120자, 내용은 10,000자 이하로 입력하세요.', 'warning');
      return;
    }
    if(boardType !== 'community' && !isAdmin()){
      setStatus('공지와 홈페이지 소식은 운영자만 작성할 수 있습니다.', 'warning');
      return;
    }
    if(anonymous && (!nickname || password.length < 8)){
      setStatus('익명 글에는 닉네임과 8자 이상의 수정·삭제 비밀번호가 필요합니다.', 'warning');
      return;
    }
    if(anonymous && (nickname.length > 20 || password.length > 64)){
      setStatus('닉네임은 20자, 비밀번호는 64자 이하로 입력하세요.', 'warning');
      return;
    }
    if(anonymous && isProtectedNickname(nickname)){
      setStatus('사용할 수 없는 닉네임입니다.', 'warning');
      els.postNickname.focus();
      return;
    }
    if(!anonymous && !state.user){
      location.href = 'index.html?auth=1';
      return;
    }
    try{
      let savedId;
      if(state.backend === 'supabase'){
        const functionName = existing ? 'update_board_post' : 'create_board_post';
        const payload = existing ? {
          p_post_id: existing.id,
          p_title: title,
          p_content: content,
          p_category: category,
          p_comments_enabled: els.postCommentsEnabled.checked,
          p_password: password || null
        } : {
          p_board_type: boardType,
          p_category: category,
          p_title: title,
          p_content: content,
          p_anonymous_name: anonymous ? nickname : null,
          p_password: anonymous ? password : null,
          p_anonymous_id: anonymous ? anonymousId() : null,
          p_comments_enabled: els.postCommentsEnabled.checked
        };
        const writeRequest = existing
          ? db.rpc(functionName, payload)
          : invokeWrite(functionName, payload);
        const result = await withTimeout(writeRequest, 12000, functionName);
        if(result.error) throw result.error;
        savedId = existing?.id || String(result.data);
        await loadServerPosts();
      }else if(existing){
        if(!await canMutateLocal(existing, password)) throw new Error('invalid credentials');
        existing.title = title;
        existing.content = content;
        existing.category = category;
        existing.comments_enabled = els.postCommentsEnabled.checked;
        existing.updated_at = new Date().toISOString();
        savedId = existing.id;
        persistLocalState();
      }else{
        const id = localId('post');
        const passwordRecord = anonymous ? await createPasswordRecord(password) : null;
        state.posts.push({
          id,
          target_key:`post:${id}`,
          board_type:boardType,
          category,
          title,
          content,
          author_name:anonymous ? nickname : memberName(),
          author_user_id:anonymous ? null : state.user.id,
          is_anonymous:anonymous,
          anonymous_id:anonymous ? anonymousId() : null,
          password_record:passwordRecord,
          has_edit_password:Boolean(passwordRecord),
          is_official:isAdmin(),
          is_pinned:false,
          comments_enabled:els.postCommentsEnabled.checked,
          view_count:0,
          reaction_count:0,
          comment_count:0,
          created_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        });
        savedId = id;
        persistLocalState();
      }
      state.pendingPassword = '';
      state.editingPostId = null;
      setStatus(existing ? '게시글을 수정했습니다.' : '게시글을 등록했습니다.', 'success');
      await openPost(savedId);
    }catch(_){
      setStatus('게시글을 저장하지 못했습니다. 권한 또는 비밀번호를 확인하세요.', 'warning');
    }
  }

  function syncPostAuthorFields(){
    const member = Boolean(state.user);
    els.postAnonymousCheck.checked = !member;
    els.postAnonymousCheck.disabled = member;
    els.postAnonymousCheck.closest('label')?.toggleAttribute('hidden', true);
    const anonymous = !member;
    els.postAnonymousFields.hidden = !anonymous;
    els.postNickname.required = anonymous;
    els.postEditPassword.required = anonymous && !state.editingPostId;
  }

  function syncCommentAuthorFields(){
    const member = Boolean(state.user);
    els.commentAnonymousCheck.checked = !member;
    els.commentAnonymousCheck.disabled = member;
    els.commentAnonymousCheck.closest('label')?.toggleAttribute('hidden', true);
    const anonymous = !member;
    els.commentAnonymousFields.hidden = !anonymous;
    els.commentNickname.required = anonymous;
    els.commentEditPassword.required = anonymous;
  }

  async function saveComment(event){
    event.preventDefault();
    if(!state.runtime.writes){
      setStatus(state.runtime.message || '현재 접속자 급증으로 댓글 작성을 잠시 중단했습니다.', 'warning');
      return;
    }
    const post = currentPost();
    if(!post || !post.comments_enabled) return;
    const content = els.boardCommentInput.value.trim();
    const anonymous = !state.user;
    const nickname = els.commentNickname.value.trim();
    const password = els.commentEditPassword.value;
    if(!content) return;
    if(content.length > 1000){
      setStatus('댓글은 1,000자 이하로 입력하세요.', 'warning');
      return;
    }
    if(anonymous && (!nickname || password.length < 8)){
      setStatus('익명 댓글에는 닉네임과 8자 이상의 수정·삭제 비밀번호가 필요합니다.', 'warning');
      return;
    }
    if(anonymous && (nickname.length > 20 || password.length > 64)){
      setStatus('닉네임은 20자, 비밀번호는 64자 이하로 입력하세요.', 'warning');
      return;
    }
    if(anonymous && isProtectedNickname(nickname)){
      setStatus('사용할 수 없는 닉네임입니다.', 'warning');
      els.commentNickname.focus();
      return;
    }
    if(!anonymous && !state.user){
      location.href = 'index.html?auth=1';
      return;
    }
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(invokeWrite('create_discussion_comment', {
          p_target_key:post.target_key,
          p_content:content,
          p_parent_id:state.replyTo || null,
          p_anonymous_name:anonymous ? nickname : null,
          p_password:anonymous ? password : null,
          p_anonymous_id:anonymous ? anonymousId() : null
        }), 12000, 'create discussion comment');
        if(result.error) throw result.error;
        await loadServerComments(post.target_key);
        await loadServerPosts();
      }else{
        const passwordRecord = anonymous ? await createPasswordRecord(password) : null;
        state.comments.push({
          id:localId('comment'),
          target_key:post.target_key,
          parent_id:state.replyTo || null,
          content,
          author_name:anonymous ? nickname : memberName(),
          author_user_id:anonymous ? null : state.user.id,
          is_anonymous:anonymous,
          anonymous_id:anonymous ? anonymousId() : null,
          password_record:passwordRecord,
          has_edit_password:Boolean(passwordRecord),
          is_official:isAdmin(),
          created_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        });
        refreshLocalCounts(post);
        persistLocalState();
      }
      els.boardCommentInput.value = '';
      els.boardCommentInput.placeholder = '서로를 존중하는 댓글을 남겨주세요.';
      els.commentEditPassword.value = '';
      state.replyTo = null;
      setStatus('댓글을 등록했습니다.', 'success');
      renderDetail();
    }catch(_){
      setStatus('댓글을 등록하지 못했습니다.', 'warning');
    }
  }

  async function handleCommentAction(event){
    if(!state.runtime.writes){
      setStatus(state.runtime.message || '현재 읽기 전용 운영 중입니다.', 'warning');
      return;
    }
    const loadOlder = event.target.closest('[data-load-older-comments]');
    if(loadOlder){
      const post = currentPost();
      if(!post) return;
      loadOlder.disabled = true;
      try{
        await loadServerComments(post.target_key, true);
        renderComments(post);
      }catch(_){
        loadOlder.disabled = false;
        setStatus('이전 댓글을 불러오지 못했습니다.', 'warning');
      }
      return;
    }
    const button = event.target.closest('[data-comment-action]');
    if(!button) return;
    const comment = findComment(button.dataset.commentId);
    if(!comment) return;
    const action = button.dataset.commentAction;
    if(action === 'reply'){
      state.replyTo = comment.id;
      els.boardCommentInput.placeholder = `${comment.author_name || '익명'}님에게 답글`;
      els.boardCommentInput.focus();
      return;
    }
    if(action === 'report'){
      reportComment(comment);
      return;
    }
    if(action === 'edit'){
      requestCommentManage(comment, 'edit-comment');
      return;
    }
    if(action === 'delete'){
      requestCommentManage(comment, 'delete-comment');
    }
  }

  function requestEditPost(){
    const post = currentPost();
    if(!post) return;
    if(canManagePost(post) && !isAnonymousRow(post)){
      state.pendingPassword = '';
      openEditor(post);
    }else{
      openManageDialog('edit-post', post.id, '게시글 수정', '작성할 때 설정한 비밀번호를 입력하세요.');
    }
  }

  function requestDeletePost(){
    const post = currentPost();
    if(!post) return;
    if(canManagePost(post) && !isAnonymousRow(post)){
      if(confirm('이 게시글을 삭제할까요?')) deletePost(post, '');
    }else{
      openManageDialog('delete-post', post.id, '게시글 삭제', '삭제 후에는 목록에서 사라집니다. 작성 비밀번호를 입력하세요.');
    }
  }

  function requestCommentManage(comment, action){
    if(canManageComment(comment) && !isAnonymousRow(comment)){
      if(action === 'edit-comment') editComment(comment, '');
      else if(confirm('이 댓글을 삭제할까요?')) deleteComment(comment, '');
    }else{
      openManageDialog(
        action,
        comment.id,
        action === 'edit-comment' ? '댓글 수정' : '댓글 삭제',
        '작성할 때 설정한 비밀번호를 입력하세요.'
      );
    }
  }

  function openManageDialog(action, targetId, heading, description){
    state.manageAction = action;
    state.manageTargetId = targetId;
    els.manageHeading.textContent = heading;
    els.manageDescription.textContent = description;
    els.managePassword.value = '';
    els.manageStatus.textContent = '';
    if(typeof els.manageDialog.showModal === 'function') els.manageDialog.showModal();
    els.managePassword.focus();
  }

  function closeManageDialog(){
    state.manageAction = null;
    state.manageTargetId = null;
    els.managePassword.value = '';
    els.manageStatus.textContent = '';
    if(els.manageDialog.open) els.manageDialog.close();
  }

  async function submitManageDialog(event){
    event.preventDefault();
    const action = state.manageAction;
    const targetId = state.manageTargetId;
    const password = els.managePassword.value;
    if(password.length < 8){
      els.manageStatus.textContent = '8자 이상의 작성 비밀번호를 입력하세요.';
      return;
    }
    if(action === 'edit-post'){
      const post = findPost(targetId);
      if(state.backend === 'local' && !await canMutateLocal(post, password)){
        els.manageStatus.textContent = '비밀번호가 맞지 않습니다.';
        return;
      }
      state.pendingPassword = password;
      closeManageDialog();
      openEditor(post);
      return;
    }
    closeManageDialog();
    if(action === 'delete-post'){
      const post = findPost(targetId);
      if(confirm('이 게시글을 삭제할까요?')) await deletePost(post, password);
    }else if(action === 'edit-comment'){
      await editComment(findComment(targetId), password);
    }else if(action === 'delete-comment'){
      if(confirm('이 댓글을 삭제할까요?')) await deleteComment(findComment(targetId), password);
    }
  }

  async function deletePost(post, password){
    if(!post) return;
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(db.rpc('delete_board_post', {
          p_post_id:post.id,
          p_password:password || null
        }), 12000, 'delete board post');
        if(result.error) throw result.error;
        await loadServerPosts();
      }else{
        if(!await canMutateLocal(post, password)) throw new Error('invalid credentials');
        post.deleted_at = new Date().toISOString();
        persistLocalState();
      }
      setStatus('게시글을 삭제했습니다.', 'success');
      openList();
    }catch(_){
      setStatus('게시글을 삭제하지 못했습니다. 비밀번호를 확인하세요.', 'warning');
      window.alert('비밀번호가 틀렸거나 삭제 권한이 없습니다.');
    }
  }

  async function editComment(comment, password){
    if(!comment) return;
    const next = prompt('수정할 댓글 내용', comment.content);
    if(next === null || !next.trim()) return;
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(db.rpc('update_discussion_comment', {
          p_comment_id:comment.id,
          p_content:next.trim(),
          p_password:password || null
        }), 12000, 'update discussion comment');
        if(result.error) throw result.error;
        await loadServerComments(comment.target_key);
      }else{
        if(!await canMutateLocal(comment, password)) throw new Error('invalid credentials');
        comment.content = next.trim();
        comment.updated_at = new Date().toISOString();
        persistLocalState();
      }
      setStatus('댓글을 수정했습니다.', 'success');
      renderDetail();
    }catch(_){
      setStatus('댓글을 수정하지 못했습니다. 비밀번호를 확인하세요.', 'warning');
      window.alert('비밀번호가 틀렸거나 수정 권한이 없습니다.');
    }
  }

  async function deleteComment(comment, password){
    if(!comment) return;
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(db.rpc('delete_discussion_comment', {
          p_comment_id:comment.id,
          p_password:password || null
        }), 12000, 'delete discussion comment');
        if(result.error) throw result.error;
        await loadServerComments(comment.target_key);
        await loadServerPosts();
      }else{
        if(!await canMutateLocal(comment, password)) throw new Error('invalid credentials');
        comment.deleted_at = new Date().toISOString();
        refreshLocalCounts(currentPost());
        persistLocalState();
      }
      setStatus('댓글을 삭제했습니다.', 'success');
      renderDetail();
    }catch(_){
      setStatus('댓글을 삭제하지 못했습니다. 비밀번호를 확인하세요.', 'warning');
      window.alert('비밀번호가 틀렸거나 삭제 권한이 없습니다.');
    }
  }

  async function toggleVote(){
    if(!state.runtime.writes){
      setStatus(state.runtime.message || '현재 읽기 전용 운영 중입니다.', 'warning');
      return;
    }
    const post = currentPost();
    if(!post) return;
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(invokeWrite('toggle_discussion_reaction', {
          p_target_key:post.target_key,
          p_reaction_type:'recommend',
          p_anonymous_id:state.user ? null : anonymousId()
        }), 12000, 'toggle discussion reaction');
        if(result.error) throw result.error;
        const payload = Array.isArray(result.data) ? result.data[0] : result.data;
        if(payload && typeof payload === 'object'){
          state.serverVoteActive.set(post.target_key, Boolean(payload.active));
          post.reaction_count = Number(payload.reaction_count || post.reaction_count || 0);
        }
      }else{
        const actor = actorKey();
        const index = state.votes.findIndex(row=>row.target_key===post.target_key && row.actor_key===actor && row.reaction_type==='recommend');
        if(index >= 0) state.votes.splice(index,1);
        else state.votes.push({target_key:post.target_key,actor_key:actor,reaction_type:'recommend'});
        post.reaction_count = state.votes.filter(row=>row.target_key===post.target_key && row.reaction_type==='recommend').length;
        persistLocalState();
      }
      renderDetail();
    }catch(_){
      setStatus('추천 상태를 변경하지 못했습니다.', 'warning');
    }
  }

  async function reportCurrentPost(){
    if(!state.runtime.writes){
      setStatus(state.runtime.message || '현재 읽기 전용 운영 중입니다.', 'warning');
      return;
    }
    const post = currentPost();
    if(!post || !confirm('이 게시글을 운영자에게 신고할까요?')) return;
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(invokeWrite('report_discussion_target', {
          p_target_key:post.target_key,
          p_reason:'user_report',
          p_anonymous_id:state.user ? null : anonymousId()
        }), 12000, 'report discussion target');
        if(result.error) throw result.error;
      }else{
        saveLocalReport({target_key:post.target_key, comment_id:null});
      }
      setStatus('신고를 접수했습니다.', 'success');
    }catch(_){
      setStatus('이미 신고했거나 신고를 접수하지 못했습니다.', 'warning');
    }
  }

  async function reportComment(comment){
    if(!comment || !confirm('이 댓글을 운영자에게 신고할까요?')) return;
    try{
      if(state.backend === 'supabase'){
        const result = await withTimeout(invokeWrite('report_discussion_comment', {
          p_comment_id:comment.id,
          p_reason:'user_report',
          p_anonymous_id:state.user ? null : anonymousId()
        }), 12000, 'report discussion comment');
        if(result.error) throw result.error;
      }else{
        saveLocalReport({target_key:comment.target_key, comment_id:comment.id});
      }
      setStatus('댓글 신고를 접수했습니다.', 'success');
    }catch(_){
      setStatus('이미 신고했거나 신고를 접수하지 못했습니다.', 'warning');
    }
  }

  function saveLocalReport(payload){
    const reports = readJson(LOCAL_REPORTS_KEY, []);
    const actor = actorKey();
    if(reports.some(row=>row.actor_key===actor && row.target_key===payload.target_key && row.comment_id===payload.comment_id)){
      throw new Error('duplicate report');
    }
    reports.push({...payload,actor_key:actor,created_at:new Date().toISOString()});
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  }

  function refreshLocalCounts(post){
    if(!post) return;
    post.comment_count = state.comments.filter(row=>row.target_key===post.target_key && !row.deleted_at).length;
  }

  function canManagePost(post){
    if(!post || post.is_seed) return false;
    if(post.can_manage === true) return true;
    if(isAdmin()) return true;
    if(post.author_user_id) return Boolean(state.user && String(post.author_user_id) === String(state.user.id));
    return Boolean(post.has_edit_password || post.password_record);
  }

  function canManageComment(comment){
    if(!comment) return false;
    if(comment.can_manage === true) return true;
    if(isAdmin()) return true;
    if(comment.author_user_id) return Boolean(state.user && String(comment.author_user_id) === String(state.user.id));
    return Boolean(comment.has_edit_password || comment.password_record);
  }

  async function canMutateLocal(row, password){
    if(!row || row.is_seed) return false;
    if(isAdmin()) return true;
    if(row.author_user_id) return Boolean(state.user && String(row.author_user_id) === String(state.user.id));
    return verifyPasswordRecord(password, row.password_record);
  }

  function hasCurrentVote(targetKey){
    if(state.backend === 'supabase') return Boolean(state.serverVoteActive.get(targetKey));
    const actor = actorKey();
    return state.votes.some(row=>row.target_key===targetKey && row.actor_key===actor && row.reaction_type==='recommend');
  }

  function isAdmin(){
    return state.user?.app_metadata?.role === 'admin';
  }

  function memberName(){
    return state.user?.user_metadata?.nickname || state.user?.user_metadata?.username || '회원';
  }

  function actorKey(){
    return state.user ? `member:${state.user.id}` : `anonymous:${anonymousId()}`;
  }

  function anonymousId(){
    let id = localStorage.getItem(LOCAL_ACTOR_KEY);
    if(!id){
      id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(LOCAL_ACTOR_KEY, id);
    }
    return id;
  }

  async function createPasswordRecord(password){
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derivePassword(password, salt);
    return {salt:bytesToBase64(salt),hash};
  }

  async function verifyPasswordRecord(password, record){
    if(!record?.salt || !record?.hash || !password) return false;
    const salt = base64ToBytes(record.salt);
    return timingSafeEqual(await derivePassword(password, salt), record.hash);
  }

  async function derivePassword(password, salt){
    const material = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {name:'PBKDF2',salt,iterations:120000,hash:'SHA-256'},
      material,
      256
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function timingSafeEqual(a,b){
    if(typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let result = 0;
    for(let i=0;i<a.length;i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return result === 0;
  }

  function bytesToBase64(bytes){
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  function base64ToBytes(value){
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
  }

  function updateBoardTabs(){
    els.boardTabs?.querySelectorAll('[data-board]').forEach(button=>{
      button.classList.toggle('is-active', button.dataset.board === state.board);
    });
    if(els.openWriteButton) els.openWriteButton.hidden = state.board !== 'community';
  }

  function showView(view){
    els.listView.hidden = view !== 'list';
    els.detailView.hidden = view !== 'detail';
    els.editorView.hidden = view !== 'editor';
  }

  function defaultCategory(boardType){
    if(boardType === 'notice') return 'notice';
    if(boardType === 'news') return 'update';
    return 'free';
  }

  function syncEditorCategories(preferredCategory=''){
    const boardType = els.editorBoardType.value;
    const allowed = BOARD_CATEGORIES[boardType] || BOARD_CATEGORIES.community;
    [...els.editorCategory.options].forEach(option=>{
      option.disabled = !allowed.includes(option.value);
      option.hidden = option.disabled;
    });
    els.editorCategory.value = allowed.includes(preferredCategory)
      ? preferredCategory
      : defaultCategory(boardType);
  }

  function findPost(id){ return state.posts.find(row=>String(row.id)===String(id) && !row.deleted_at); }
  function currentPost(){ return findPost(state.currentPostId); }
  function findComment(id){ return state.comments.find(row=>String(row.id)===String(id) && !row.deleted_at); }
  function dateValue(row){ return Date.parse(row?.created_at || 0) || 0; }
  function wasEdited(row){ return row.updated_at && row.created_at && row.updated_at !== row.created_at; }
  function localId(prefix){ return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }

  function normalizePost(row){
    return {
      ...row,
      id:String(row.id),
      target_key:row.target_key || `post:${row.id}`,
      is_anonymous:row.is_anonymous ?? !row.author_user_id,
      view_count:Number(row.view_count || 0),
      reaction_count:Number(row.reaction_count || 0),
      comment_count:Number(row.comment_count || 0)
    };
  }

  function normalizeComment(row){
    return {
      ...row,
      id:String(row.id),
      parent_id:row.parent_id ? String(row.parent_id) : null,
      is_anonymous:row.is_anonymous ?? !row.author_user_id
    };
  }

  function isAnonymousRow(row){
    return Boolean(row?.is_anonymous ?? !row?.author_user_id);
  }

  function formatListDate(value){
    return formatDate(value);
  }

  function formatDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    const pad = number=>String(number).padStart(2, '0');
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/ ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function setStatus(message, tone='warning'){
    els.engineStatus.textContent = message;
    els.engineStatus.className = `engine-status is-${tone}`;
  }

  function readJson(key, fallback){
    try{
      const value = JSON.parse(localStorage.getItem(key) || '');
      return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value || fallback);
    }catch(_){
      return fallback;
    }
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
    const timeout = new Promise((_,reject)=>{
      timer = setTimeout(()=>reject(new Error(`${label} timeout`)), ms);
    });
    return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
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
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }
})();
