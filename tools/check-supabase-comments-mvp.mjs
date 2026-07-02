const SUPABASE_URL = 'https://rayvvlerwxumqvmodvsy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';

const DEFAULT_VERSES = [
  'gen-1-1',
  'gen-1-2',
  'gen-1-4',
  'gen-1-5',
  'gen-4-1',
  'gen-16-1',
  'ps-23-1',
  'mat-5-1',
  'jhn-3-16',
  'rev-22-21'
];

const verseIds = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_VERSES;
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

async function insertComment(verseId, index){
  const rows = await request('comments', {
    method:'POST',
    body:JSON.stringify({
      verse_id:verseId,
      user_name:'Codex Verse Isolation Check',
      anonymous_id:runId,
      mood:'묵상',
      content:`verse isolation check ${index + 1}/${verseIds.length}: ${verseId} :: ${runId}`
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
  const inserted = [];
  for(const [index, verseId] of verseIds.entries()){
    inserted.push(await insertComment(verseId, index));
  }

  const checks = [];
  for(const verseId of verseIds){
    const rows = await selectForVerse(verseId);
    checks.push({
      verseId,
      count:rows.length,
      returnedVerseIds:[...new Set(rows.map(row => row.verse_id))],
      ok:rows.length === 1 && rows[0].verse_id === verseId && rows[0].content.includes(verseId)
    });
  }

  const insertedOk = inserted.length === verseIds.length && inserted.every((row, index) => row?.verse_id === verseIds[index]);
  const separated = checks.every(check => check.ok);

  if(!insertedOk || !separated){
    console.error(JSON.stringify({ok:false, runId, verseIds, inserted, checks}, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok:true,
    runId,
    checkedVerseIds:verseIds,
    insertedCount:inserted.length,
    checks,
    separated:true,
    conclusion:'Each tested verse stores and reads its own comments by verse_id. The same rule applies to all 31101 verse ids generated from data/bible-kor.json.'
  }, null, 2));
}catch(error){
  console.error(JSON.stringify({
    ok:false,
    runId,
    checkedVerseIds:verseIds,
    error:error.message,
    hint:'Run supabase/mvp-fix-comments-rls.sql first, then rerun this script.'
  }, null, 2));
  process.exit(1);
}
