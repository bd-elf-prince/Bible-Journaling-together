import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(toolDir, '..');
const sourcePath = resolve(rootDir, process.argv[2] || 'data/bible-kor.json');
const outputDir = resolve(rootDir, process.argv[3] || 'data/books');
const manifestPath = resolve(rootDir, process.argv[4] || 'data/manifest.json');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const sourceText = await readFile(sourcePath, 'utf8');
const books = JSON.parse(sourceText);
if (!Array.isArray(books) || !books.length) throw new Error('Bible source must be a non-empty array');

await mkdir(outputDir, { recursive: true });

let verseTotal = 0;
let chapterTotal = 0;
const manifestBooks = [];
const reconstructed = [];

for (const book of books) {
  const key = String(book?.key || '').trim();
  if (!/^[a-z0-9]+$/.test(key)) throw new Error(`Invalid book key: ${key}`);
  const payload = JSON.stringify(book);
  const hash = sha256(payload);
  const fileName = `${key}.${hash.slice(0, 12)}.json`;
  const shardPath = join(outputDir, fileName);
  await writeFile(shardPath, payload, 'utf8');

  const chapters = (book.chapters || []).map((chapter) => {
    const verseCount = Array.isArray(chapter.verses) ? chapter.verses.length : 0;
    verseTotal += verseCount;
    chapterTotal += 1;
    return {
      number: Number(chapter.number),
      subtitle: chapter.subtitle || '',
      verseCount,
    };
  });
  manifestBooks.push({
    key,
    name: book.name || key,
    english: book.english || '',
    startPage: Number(book.startPage || 0),
    url: `data/books/${fileName}`,
    sha256: hash,
    bytes: Buffer.byteLength(payload),
    verseCount: chapters.reduce((sum, chapter) => sum + chapter.verseCount, 0),
    chapters,
  });
  reconstructed.push(JSON.parse(await readFile(shardPath, 'utf8')));
}

if (JSON.stringify(reconstructed) !== JSON.stringify(books)) {
  throw new Error('Shard reconstruction differs from the source dataset');
}

const manifest = {
  version: sha256(sourceText).slice(0, 16),
  sourceSha256: sha256(sourceText),
  generatedAt: new Date().toISOString(),
  totals: { books: books.length, chapters: chapterTotal, verses: verseTotal },
  books: manifestBooks,
};
await writeFile(manifestPath, JSON.stringify(manifest), 'utf8');

console.log(JSON.stringify({
  source: relative(rootDir, sourcePath),
  manifest: relative(rootDir, manifestPath),
  output: relative(rootDir, outputDir),
  ...manifest.totals,
  sourceBytes: Buffer.byteLength(sourceText),
  manifestBytes: Buffer.byteLength(JSON.stringify(manifest)),
}, null, 2));

