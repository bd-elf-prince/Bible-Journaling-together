#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , inputPath, outputPath = "data/bible-kor.json"] = process.argv;

if (!inputPath) {
  console.error("Usage: node tools/normalize-bible-data.mjs <input.json> [output.json]");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const normalized = Array.isArray(raw) && raw[0]?.chapters ? normalizeNested(raw) : normalizeFlat(raw);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);

const verseCount = normalized.reduce(
  (total, book) => total + book.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.verses.length, 0),
  0
);

console.log(`Wrote ${outputPath}`);
console.log(`Books: ${normalized.length}`);
console.log(`Verses: ${verseCount}`);

function normalizeNested(books) {
  return books.map((book, bookIndex) => {
    const key = required(book.key || book.bookKey, `book[${bookIndex}].key`);
    const name = required(book.name || book.bookName, `book[${bookIndex}].name`);
    const english = book.english || book.englishName || key;
    const startPage = Number(book.startPage || 1);
    const chapters = (book.chapters || []).map((chapter, chapterIndex) => {
      const number = Number(required(chapter.number || chapter.chapter, `${key}.chapters[${chapterIndex}].number`));
      const verses = (chapter.verses || []).map((row, rowIndex) => {
        const verse = Array.isArray(row) ? row[0] : row.verse || row.number;
        const text = Array.isArray(row) ? row[1] : row.text;
        return [Number(required(verse, `${key}.${number}.verses[${rowIndex}].verse`)), String(required(text, `${key}.${number}.${verse}.text`)).trim()];
      });
      return {
        number,
        subtitle: chapter.subtitle || "말씀",
        pageLeft: chapter.pageLeft || `${name} · ${number}장`,
        pageRight: chapter.pageRight || `${name} · 말씀`,
        verses
      };
    });
    return { key, name, english, startPage, chapters };
  });
}

function normalizeFlat(rows) {
  const books = new Map();
  for (const [index, row] of rows.entries()) {
    const key = required(row.bookKey || row.book || row.key, `row[${index}].bookKey`);
    const name = required(row.bookName || row.book_name || row.name || key, `row[${index}].bookName`);
    const english = row.english || row.englishName || key;
    const chapterNumber = Number(required(row.chapter, `row[${index}].chapter`));
    const verseNumber = Number(required(row.verse || row.number, `row[${index}].verse`));
    const text = String(required(row.text, `row[${index}].text`)).trim();

    if (!books.has(key)) books.set(key, { key, name, english, startPage: Number(row.startPage || 1), chapters: new Map() });
    const book = books.get(key);
    if (!book.chapters.has(chapterNumber)) {
      book.chapters.set(chapterNumber, {
        number: chapterNumber,
        subtitle: row.subtitle || "말씀",
        pageLeft: row.pageLeft || `${name} · ${chapterNumber}장`,
        pageRight: row.pageRight || `${name} · 말씀`,
        verses: []
      });
    }
    book.chapters.get(chapterNumber).verses.push([verseNumber, text]);
  }

  return [...books.values()].map((book) => ({
    key: book.key,
    name: book.name,
    english: book.english,
    startPage: book.startPage,
    chapters: [...book.chapters.values()].sort((a, b) => a.number - b.number).map((chapter) => ({
      ...chapter,
      verses: chapter.verses.sort((a, b) => a[0] - b[0])
    }))
  }));
}

function required(value, label) {
  if (value === undefined || value === null || value === "") throw new Error(`Missing ${label}`);
  return value;
}
