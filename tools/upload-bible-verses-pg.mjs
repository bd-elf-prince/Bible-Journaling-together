import fs from 'node:fs';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const input = process.argv[2] || 'data/bible-kor.json';
const batchSize = Number(process.argv[3] || 50);

if(!connectionString){
  console.error('Missing DATABASE_URL.');
  process.exit(1);
}

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
          bookKey,
          bookName,
          chapter:chapterNumber,
          verse:verseNumber,
          content:String(text || '').replaceAll('\u0000', ''),
          sortOrder:++sortOrder
        });
      }
    }
  }
  return rows;
}

function insertBatchSql(rows){
  const cols = 7;
  const values = rows.map((_, rowIndex) => {
    const start = rowIndex * cols;
    return `($${start + 1},$${start + 2},$${start + 3},$${start + 4},$${start + 5},$${start + 6},$${start + 7})`;
  }).join(',');
  return `insert into public.bible_verses (id, book_key, book_name, chapter, verse, content, sort_order)
values ${values}
on conflict (id) do update set
  book_key = excluded.book_key,
  book_name = excluded.book_name,
  chapter = excluded.chapter,
  verse = excluded.verse,
  content = excluded.content,
  sort_order = excluded.sort_order`;
}

const bible = JSON.parse(fs.readFileSync(input, 'utf8'));
const rows = rowsFromBible(bible);
const ids = new Set(rows.map(row => row.id));
if(rows.length !== 31101 || ids.size !== rows.length){
  throw new Error(`Expected 31,101 unique verse ids, got rows=${rows.length}, unique=${ids.size}`);
}

const client = new pg.Client({
  connectionString,
  ssl:{rejectUnauthorized:false}
});

await client.connect();
try{
  await client.query(`create table if not exists public.bible_verses (
    id text primary key,
    book_key text not null,
    book_name text not null,
    chapter integer not null,
    verse integer not null,
    content text not null,
    sort_order integer not null unique,
    created_at timestamptz not null default now(),
    unique(book_key, chapter, verse)
  )`);
  await client.query('create index if not exists bible_verses_book_chapter_idx on public.bible_verses (book_key, chapter, verse)');
  await client.query('alter table public.bible_verses enable row level security');
  await client.query('grant usage on schema public to anon, authenticated');
  await client.query('grant select on public.bible_verses to anon, authenticated');
  await client.query('drop policy if exists "public read bible verses" on public.bible_verses');
  await client.query('create policy "public read bible verses" on public.bible_verses for select to public using (true)');

  for(let index = 0; index < rows.length; index += batchSize){
    const batch = rows.slice(index, index + batchSize);
    const params = batch.flatMap(row => [row.id, row.bookKey, row.bookName, row.chapter, row.verse, row.content, row.sortOrder]);
    await client.query(insertBatchSql(batch), params);
    const uploaded = Math.min(index + batch.length, rows.length);
    if(uploaded === rows.length || uploaded % 1000 === 0){
      console.log(`uploaded ${uploaded} / ${rows.length}`);
    }
  }

  await client.query('alter table public.comments drop constraint if exists comments_verse_id_bible_verses_fkey');
  await client.query(`alter table public.comments
    add constraint comments_verse_id_bible_verses_fkey
    foreign key (verse_id)
    references public.bible_verses(id)
    not valid`);

  const result = await client.query('select count(*)::int as count from public.bible_verses');
  console.log(JSON.stringify({
    ok:result.rows[0].count === 31101,
    bibleVerses:result.rows[0].count,
    expected:31101
  }, null, 2));
}finally{
  await client.end();
}
