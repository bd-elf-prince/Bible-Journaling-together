(()=>{
  'use strict';

  const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
  const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  const status = document.getElementById('adminStatus');
  const list = document.getElementById('adminArchiveList');
  const refresh = document.getElementById('adminRefreshButton');
  const loginLink = document.getElementById('adminLoginLink');
  let user = null;

  document.addEventListener('DOMContentLoaded', init, {once:true});

  async function init(){
    refresh?.addEventListener('click', loadArchive);
    if(!db?.auth){
      setStatus('관리자 서버에 연결하지 못했습니다.');
      return;
    }
    const {data} = await db.auth.getSession();
    user = data?.session?.user || null;
    await loadArchive();
  }

  async function loadArchive(){
    list.replaceChildren();
    loginLink.hidden = Boolean(user);
    if(!user){
      setStatus('관리자 계정으로 로그인해야 합니다.');
      return;
    }
    if(user.app_metadata?.role !== 'admin'){
      setStatus('이 계정에는 관리자 페이지 접근 권한이 없습니다.');
      return;
    }
    setStatus('삭제 기록을 불러오는 중입니다.');
    try{
      const result = await db.rpc('get_deleted_discussion_content');
      if(result.error) throw result.error;
      const rows = result.data || [];
      setStatus(rows.length ? `보관된 삭제 기록 ${rows.length}건` : '보관된 삭제 기록이 없습니다.');
      list.innerHTML = rows.length ? rows.map(renderRow).join('') : '<p class="admin-empty">보관된 삭제 기록이 없습니다.</p>';
    }catch(error){
      console.warn('[Comment Bible Admin] archive load failed', error);
      setStatus('삭제 보관함을 불러오지 못했습니다. 다시 로그인한 뒤 확인하세요.');
    }
  }

  function renderRow(row){
    return `<article class="admin-archive-item">
      <div class="admin-archive-meta">
        <strong>${escapeHtml(row.source_type || '기록')}</strong>
        <span>${escapeHtml(row.author_name || '알 수 없음')}</span>
        <time>${escapeHtml(formatDate(row.deleted_at))}</time>
        <span>${escapeHtml(row.delete_reason || '삭제')}</span>
      </div>
      <pre class="admin-archive-content">${escapeHtml(row.content || '')}</pre>
    </article>`;
  }

  function formatDate(value){
    const date = new Date(value);
    if(Number.isNaN(date.getTime())) return '';
    const pad = number=>String(number).padStart(2, '0');
    return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/ ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  function setStatus(text){
    if(status) status.textContent = text;
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, character=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[character]));
  }
})();

