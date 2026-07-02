import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || 'data/bible-kor.json';
const outputDir = process.argv[3] || 'supabase/bible-verses-registry-parts';
const partSize = Number(process.argv[4] || 4000);
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

function insertSql(rows){
  const values = rows.map(row =>
    `('${sql(row.id)}','${sql(row.bookKey)}','${sql(row.bookName)}',${row.chapter},${row.verse},'${sql(row.text)}',${row.sortOrder})`
  );
  return `insert into public.bible_verses (id, book_key, book_name, chapter, verse, content, sort_order)\nvalues\n${values.join(',\n')}\non conflict (id) do update set\n  book_key = excluded.book_key,\n  book_name = excluded.book_name,\n  chapter = excluded.chapter,\n  verse = excluded.verse,\n  content = excluded.content,\n  sort_order = excluded.sort_order;\n`;
}

const rows = rowsFromBible(bible);
const ids = new Set(rows.map(row => row.id));
if(rows.length !== 31101 || ids.size !== rows.length){
  throw new Error(`Expected 31,101 unique verse ids, got rows=${rows.length}, unique=${ids.size}`);
}

fs.mkdirSync(outputDir, {recursive:true});
for(const fileName of fs.readdirSync(outputDir)){
  if(/^part-\d+\.sql$/.test(fileName)){
    fs.unlinkSync(path.join(outputDir, fileName));
  }
}

const setup = `-- Bible Journaling Together: bible_verses setup.\n-- Run this first, then run all part files in order.\n\ncreate table if not exists public.bible_verses (\n  id text primary key,\n  book_key text not null,\n  book_name text not null,\n  chapter integer not null,\n  verse integer not null,\n  content text not null,\n  sort_order integer not null unique,\n  created_at timestamptz not null default now(),\n  unique(book_key, chapter, verse)\n);\n\ncreate index if not exists bible_verses_book_chapter_idx\n  on public.bible_verses (book_key, chapter, verse);\n\nalter table public.bible_verses enable row level security;\n\ngrant usage on schema public to anon, authenticated;\ngrant select on public.bible_verses to anon, authenticated;\n\ndrop policy if exists "public read bible verses" on public.bible_verses;\ncreate policy "public read bible verses"\n  on public.bible_verses for select\n  to public\n  using (true);\n`;

const finalize = `-- Bible Journaling Together: bible_verses verification and comments link.\n-- Run this after all part files are complete.\n\nalter table public.comments\n  drop constraint if exists comments_verse_id_bible_verses_fkey;\n\nalter table public.comments\n  add constraint comments_verse_id_bible_verses_fkey\n  foreign key (verse_id)\n  references public.bible_verses(id)\n  not valid;\n\n-- Optional after old invalid test rows are removed:\n-- alter table public.comments validate constraint comments_verse_id_bible_verses_fkey;\n\nselect\n  count(*) as verse_targets,\n  count(distinct id) as unique_verse_targets,\n  min(id) filter (where id = 'gen-1-1') as has_gen_1_1,\n  min(id) filter (where id = 'gen-16-1') as has_gen_16_1,\n  min(id) filter (where id = 'jhn-3-16') as has_jhn_3_16\nfrom public.bible_verses;\n`;

fs.writeFileSync(path.join(outputDir, '00-setup.sql'), setup, 'utf8');

const partFiles = [];
for(let index = 0; index < rows.length; index += partSize){
  const partNumber = String(partFiles.length + 1).padStart(2, '0');
  const fileName = `part-${partNumber}.sql`;
  const partRows = rows.slice(index, index + partSize);
  const content = `-- Bible Journaling Together: bible_verses registry ${fileName}.\n-- Run after 00-setup.sql.\n\n${insertSql(partRows)}`;
  fs.writeFileSync(path.join(outputDir, fileName), content, 'utf8');
  partFiles.push({fileName, rows:partRows.length});
}

fs.writeFileSync(path.join(outputDir, '99-finalize.sql'), finalize, 'utf8');

const readme = `# Bible Verses Registry Parts\n\nRun these files in Supabase SQL Editor in this order:\n\n1. \`00-setup.sql\`\n${partFiles.map((part, index) => `${index + 2}. \`${part.fileName}\` (${part.rows} verses)`).join('\n')}\n${partFiles.length + 2}. \`99-finalize.sql\`\n\nTotal verse comment targets: 31,101.\n`;
fs.writeFileSync(path.join(outputDir, 'README.md'), readme, 'utf8');

console.log(JSON.stringify({
  outputDir,
  partSize,
  verseTargets:rows.length,
  uniqueVerseTargets:ids.size,
  files:['00-setup.sql', ...partFiles.map(part => part.fileName), '99-finalize.sql']
}, null, 2));
