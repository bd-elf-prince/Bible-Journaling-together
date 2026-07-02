import fs from 'node:fs';

const file = process.argv[2] || 'data/bible-kor.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function verseRows(input){
  const rows = [];
  for(const book of input){
    const bookKey = book.key || book.bookKey || book.abbr;
    const bookName = book.name || book.bookName || bookKey;
    for(const chapter of book.chapters || []){
      const chapterNumber = Number(chapter.number || chapter.chapter);
      for(const row of chapter.verses || []){
        const verseNumber = Number(Array.isArray(row) ? row[0] : row.number || row.verse);
        const text = Array.isArray(row) ? row[1] : row.text;
        rows.push({
          id:`${bookKey}-${chapterNumber}-${verseNumber}`,
          bookKey,
          bookName,
          chapter:chapterNumber,
          verse:verseNumber,
          text:String(text || '')
        });
      }
    }
  }
  return rows;
}

const rows = verseRows(data);
const ids = rows.map(row => row.id);
const uniqueIds = new Set(ids);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
const invalid = rows.filter(row => !/^[a-z0-9]+-[0-9]+-[0-9]+$/.test(row.id) || !row.text.trim());
const expected = {books:66, chapters:1189, verses:31101};
const chapterCount = data.reduce((sum, book) => sum + (book.chapters || []).length, 0);

const result = {
  ok:data.length === expected.books &&
    chapterCount === expected.chapters &&
    rows.length === expected.verses &&
    uniqueIds.size === expected.verses &&
    invalid.length === 0,
  books:data.length,
  chapters:chapterCount,
  verses:rows.length,
  uniqueVerseIds:uniqueIds.size,
  duplicateCount:duplicates.length,
  invalidCount:invalid.length,
  firstVerse:rows[0],
  requiredSamples:['gen-1-1','gen-1-2','gen-1-4','gen-1-5','gen-4-1','gen-16-1','jhn-3-16','rev-22-21'].map(id => ({
    id,
    exists:uniqueIds.has(id)
  }))
};

console.log(JSON.stringify(result, null, 2));

if(!result.ok) process.exit(1);
