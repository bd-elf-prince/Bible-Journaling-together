import fs from 'node:fs';

const input = process.argv[2] || 'data/bible-kor.json';
const output = process.argv[3] || 'supabase/bible-verses-registry.sql';
const bible = JSON.parse(fs.readFileSync(input, 'utf8'));

function sql(value){
  return String(value ?? '').replaceAll("'", "''");
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
          text:String(text || ''),
          sortOrder:++sortOrder
        });
      }
    }
  }
  return rows;
}

const rows = rowsFromBible(bible);
const ids = new Set(rows.map(row => row.id));
if(rows.length !== 31101 || ids.size !== rows.length){
  throw new Error(`Expected 31,101 unique verse ids, got rows=${rows.length}, unique=${ids.size}`);
}

const chunks = [];
for(let index = 0; index < rows.length; index += 500){
  const values = rows.slice(index, index + 500).map(row =>
    `('${sql(row.id)}','${sql(row.bookKey)}','${sql(row.bookName)}',${row.chapter},${row.verse},'${sql(row.text)}',${row.sortOrder})`
  );
  chunks.push(`insert into public.bible_verses (id, book_key, book_name, chapter, verse, content, sort_order)\nvalues\n${values.join(',\n')}\non conflict (id) do update set\n  book_key = excluded.book_key,\n  book_name = excluded.book_name,\n  chapter = excluded.chapter,\n  verse = excluded.verse,\n  content = excluded.content,\n  sort_order = excluded.sort_order;`);
}

const content = `-- Bible Journaling Together: 31,101 independent verse comment targets.\n-- Generated from ${input}.\n-- Run this in Supabase SQL Editor after comments MVP SQL.\n\ncreate table if not exists public.bible_verses (\n  id text primary key,\n  book_key text not null,\n  book_name text not null,\n  chapter integer not null,\n  verse integer not null,\n  content text not null,\n  sort_order integer not null unique,\n  created_at timestamptz not null default now(),\n  unique(book_key, chapter, verse)\n);\n\ncreate index if not exists bible_verses_book_chapter_idx\n  on public.bible_verses (book_key, chapter, verse);\n\nalter table public.bible_verses enable row level security;\n\ngrant usage on schema public to anon, authenticated;\ngrant select on public.bible_verses to anon, authenticated;\n\ndrop policy if exists "public read bible verses" on public.bible_verses;\ncreate policy "public read bible verses"\n  on public.bible_verses for select\n  to public\n  using (true);\n\n${chunks.join('\n\n')}\n\nalter table public.comments\n  drop constraint if exists comments_verse_id_bible_verses_fkey;\n\nalter table public.comments\n  add constraint comments_verse_id_bible_verses_fkey\n  foreign key (verse_id)\n  references public.bible_verses(id)\n  not valid;\n\n-- Optional after old invalid test rows are removed:\n-- alter table public.comments validate constraint comments_verse_id_bible_verses_fkey;\n\nselect\n  count(*) as verse_targets,\n  count(distinct id) as unique_verse_targets,\n  min(id) filter (where id = 'gen-1-1') as has_gen_1_1,\n  min(id) filter (where id = 'gen-16-1') as has_gen_16_1,\n  min(id) filter (where id = 'jhn-3-16') as has_jhn_3_16\nfrom public.bible_verses;\n`;

fs.writeFileSync(output, content, 'utf8');
console.log(JSON.stringify({output, verseTargets:rows.length, uniqueVerseTargets:ids.size}, null, 2));
