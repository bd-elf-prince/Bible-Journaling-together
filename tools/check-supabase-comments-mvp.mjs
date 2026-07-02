const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';

const runId = `mvp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function request(path, options = {}){
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers:{...headers, ...(options.headers || {})}
  });
  const text = await response.text();
  let body = null;
  try{ body = text ? JSON.parse(text) : null; }catch(_){ body = text; }
  if(!response.ok){
    const message = body?.message || body || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return body;
}

async function insertComment(verseId, content){
  const rows = await request('comments', {
    method:'POST',
    body:JSON.stringify({
      verse_id:verseId,
      user_name:'Codex MVP Check',
      anonymous_id:runId,
      mood:'묵상',
      content
    })
  });
  return rows?.[0];
}

async function selectForVerse(verseId){
  const query = new URLSearchParams({
    verse_id:`eq.${verseId}`,
    anonymous_id:`eq.${runId}`,
    select:'id,verse_id,content,created_at',
    order:'created_at.desc'
  });
  return request(`comments?${query.toString()}`, {
    method:'GET',
    headers:{Prefer:''}
  });
}

try{
  const first = await insertComment('gen-1-1', `창세기 1:1 절별 저장 확인 ${runId}`);
  const second = await insertComment('gen-1-2', `창세기 1:2 절별 저장 확인 ${runId}`);
  const gen11 = await selectForVerse('gen-1-1');
  const gen12 = await selectForVerse('gen-1-2');

  const gen11Ok = gen11.length === 1 && gen11[0].verse_id === 'gen-1-1' && gen11[0].content.includes('1:1');
  const gen12Ok = gen12.length === 1 && gen12[0].verse_id === 'gen-1-2' && gen12[0].content.includes('1:2');
  const separated = !gen11.some(row => row.verse_id === 'gen-1-2') && !gen12.some(row => row.verse_id === 'gen-1-1');

  if(!first || !second || !gen11Ok || !gen12Ok || !separated){
    console.error(JSON.stringify({ok:false, runId, inserted:[first, second], gen11, gen12}, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok:true,
    runId,
    insertedVerseIds:[first.verse_id, second.verse_id],
    gen11Count:gen11.length,
    gen12Count:gen12.length,
    separated
  }, null, 2));
}catch(error){
  console.error(JSON.stringify({
    ok:false,
    runId,
    error:error.message,
    hint:'Run supabase/mvp-fix-comments-rls.sql first, then rerun this script.'
  }, null, 2));
  process.exit(1);
}
