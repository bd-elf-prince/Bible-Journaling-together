import fs from 'node:fs';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rayvvlerwxumqvmodvsy.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || DEFAULT_PUBLISHABLE_KEY;
const input = process.argv[2] || 'data/bible-kor.json';
const batchSize = Number(process.argv[3] || 250);

function rowsFromBible(data){
  const rows = [];
  let sortOrder = 0;
  for(const book of data){
    const bookKey = book.key || book.bookKey || book.abbr;
    const bookName = book.name || book.bookName || bookKey;
    for(const chapter of book.chapters || []){
      const chapterNumber = Number(chapter.number || chapter.chapter);
      for(const item of chapter.verses || []){
        const verseNumber = Number(Array.isArray(item) ? item[0] : item.number || item.verse);
        const text = Array.isArray(item) ? item[1] : item.text;
        rows.push({
          id:`${bookKey}-${chapterNumber}-${verseNumber}`,
          book_key:bookKey,
          book_name:bookName,
          chapter:chapterNumber,
          verse:verseNumber,
          content:String(text || ''),
          sort_order:++sortOrder
        });
      }
    }
  }
  return rows;
}

async function supabaseFetch(path, options = {}){
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers:{
      apikey:SUPABASE_KEY,
      authorization:`Bearer ${SUPABASE_KEY}`,
      'content-type':'application/json',
      ...(options.headers || {})
    }
  });
  if(!response.ok){
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return response;
}

const bible = JSON.parse(fs.readFileSync(input, 'utf8'));
const rows = rowsFromBible(bible);
const ids = new Set(rows.map(row => row.id));

if(rows.length !== 31101 || ids.size !== rows.length){
  throw new Error(`Expected 31,101 unique verse ids, got rows=${rows.length}, unique=${ids.size}`);
}

for(let index = 0; index < rows.length; index += batchSize){
  const batch = rows.slice(index, index + batchSize);
  await supabaseFetch('/rest/v1/bible_verses?on_conflict=id', {
    method:'POST',
    headers:{prefer:'resolution=merge-duplicates'},
    body:JSON.stringify(batch)
  });
  console.log(`uploaded ${Math.min(index + batch.length, rows.length)} / ${rows.length}`);
}

const countResponse = await supabaseFetch('/rest/v1/bible_verses?select=id&limit=1', {
  headers:{prefer:'count=exact'}
});
const contentRange = countResponse.headers.get('content-range') || '';
const count = Number(contentRange.split('/')[1] || 0);

console.log(JSON.stringify({
  ok:count === 31101,
  bibleVerses:count,
  expected:31101
}, null, 2));

if(count !== 31101){
  process.exit(1);
}
