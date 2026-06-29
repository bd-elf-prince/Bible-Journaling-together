#!/usr/bin/env node
import fs from "node:fs";

const [, , inputPath = "data/bible-kor.json", ...flags] = process.argv;
const strict = flags.includes("--strict");

const EXPECTED_BOOKS = [
  "gen", "exo", "lev", "num", "deu", "jos", "jdg", "rut", "1sa", "2sa", "1ki", "2ki", "1ch", "2ch", "ezr", "neh", "est", "job", "ps", "pro", "ecc", "sng", "isa", "jer", "lam", "ezk", "dan", "hos", "jol", "amo", "oba", "jon", "mic", "nam", "hab", "zep", "hag", "zec", "mal",
  "mat", "mrk", "luk", "jhn", "act", "rom", "1co", "2co", "gal", "eph", "php", "col", "1th", "2th", "1ti", "2ti", "tit", "phm", "heb", "jas", "1pe", "2pe", "1jn", "2jn", "3jn", "jud", "rev"
];

if (!fs.existsSync(inputPath)) {
  console.error(`Missing file: ${inputPath}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  console.error(`Invalid JSON: ${error.message}`);
  process.exit(1);
}

const books = normalizeForValidation(data);
const errors = [];
const warnings = [];
const seenVerseIds = new Set();
let chapterCount = 0;
let verseCount = 0;

if (!books.length) errors.push("No books found.");

books.forEach((book, bookIndex) => {
  if (!book.key) errors.push(`book[${bookIndex}] is missing key.`);
  if (!book.name) errors.push(`${book.key || `book[${bookIndex}]`} is missing name.`);
  if (!Array.isArray(book.chapters) || !book.chapters.length) errors.push(`${book.key} has no chapters.`);

  const seenChapters = new Set();
  book.chapters.forEach((chapter, chapterIndex) => {
    chapterCount += 1;
    if (!Number.isInteger(chapter.number) || chapter.number <= 0) errors.push(`${book.key}.chapters[${chapterIndex}] has invalid number.`);
    if (seenChapters.has(chapter.number)) errors.push(`${book.key} has duplicate chapter ${chapter.number}.`);
    seenChapters.add(chapter.number);
    if (!Array.isArray(chapter.verses) || !chapter.verses.length) errors.push(`${book.key} ${chapter.number} has no verses.`);

    const seenVerses = new Set();
    chapter.verses.forEach((verse, verseIndex) => {
      verseCount += 1;
      if (!Number.isInteger(verse.number) || verse.number <= 0) errors.push(`${book.key} ${chapter.number}:${verseIndex + 1} has invalid verse number.`);
      if (seenVerses.has(verse.number)) errors.push(`${book.key} ${chapter.number} has duplicate verse ${verse.number}.`);
      seenVerses.add(verse.number);
      if (!verse.text || !String(verse.text).trim()) errors.push(`${book.key} ${chapter.number}:${verse.number} has empty text.`);
      const verseId = `${book.key}-${chapter.number}-${verse.number}`;
      if (seenVerseIds.has(verseId)) errors.push(`Duplicate verse id ${verseId}.`);
      seenVerseIds.add(verseId);
    });

    const ordered = [...seenVerses].sort((a, b) => a - b);
    ordered.forEach((number, index) => {
      const expected = index + 1;
      if (number !== expected) warnings.push(`${book.key} ${chapter.number} verse numbers are not continuous at ${number}; expected ${expected}.`);
    });
  });
});

if (strict) {
  const keys = books.map((book) => book.key);
  EXPECTED_BOOKS.forEach((key) => {
    if (!keys.includes(key)) errors.push(`Strict mode: missing canonical book ${key}.`);
  });
  keys.forEach((key) => {
    if (!EXPECTED_BOOKS.includes(key)) warnings.push(`Strict mode: non-canonical or unknown book key ${key}.`);
  });
}

console.log(`Bible data: ${inputPath}`);
console.log(`Books: ${books.length}`);
console.log(`Chapters: ${chapterCount}`);
console.log(`Verses: ${verseCount}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Errors: ${errors.length}`);

warnings.slice(0, 40).forEach((warning) => console.warn(`WARN ${warning}`));
if (warnings.length > 40) console.warn(`WARN ... ${warnings.length - 40} more warnings hidden`);
errors.slice(0, 80).forEach((error) => console.error(`ERROR ${error}`));
if (errors.length > 80) console.error(`ERROR ... ${errors.length - 80} more errors hidden`);

process.exit(errors.length ? 1 : 0);

function normalizeForValidation(input) {
  if (!Array.isArray(input)) return [];
  if (input[0]?.chapters) {
    return input.map((book) => ({
      key: book.key || book.bookKey || "",
      name: book.name || book.bookName || "",
      chapters: (book.chapters || []).map((chapter) => ({
        number: Number(chapter.number || chapter.chapter),
        verses: (chapter.verses || []).map((row) => ({
          number: Number(Array.isArray(row) ? row[0] : row.verse || row.number),
          text: Array.isArray(row) ? row[1] : row.text
        }))
      }))
    }));
  }
  const map = new Map();
  input.forEach((row) => {
    const key = row.bookKey || row.book || row.key || "";
    const name = row.bookName || row.book_name || row.name || key;
    const chapterNumber = Number(row.chapter);
    const verseNumber = Number(row.verse || row.number);
    if (!map.has(key)) map.set(key, { key, name, chapters: new Map() });
    const book = map.get(key);
    if (!book.chapters.has(chapterNumber)) book.chapters.set(chapterNumber, { number: chapterNumber, verses: [] });
    book.chapters.get(chapterNumber).verses.push({ number: verseNumber, text: row.text });
  });
  return [...map.values()].map((book) => ({
    key: book.key,
    name: book.name,
    chapters: [...book.chapters.values()].sort((a, b) => a.number - b.number)
  }));
}
