// V5 optional Bible data loader.
// Supports either existing data/bible-kor.json or a split manifest at data/bible-index.json.
(()=>{
  'use strict';

  const MANIFEST_URL = 'data/bible-index.json';
  const POLL_LIMIT = 80;
  let pollCount = 0;

  function normalizeBook(book, bookIndex){
    const key = book.key || book.bookKey || book.abbr || `book-${bookIndex + 1}`;
    const name = book.name || book.bookName || key;
    const english = book.english || book.englishName || key;
    const chapters = (book.chapters || []).map((chapter, chapterIndex)=>{
      const number = Number(chapter.number || chapter.chapter || chapterIndex + 1);
      const verses = (chapter.verses || []).map(row=>{
        const verseNumber = Number(Array.isArray(row) ? row[0] : row.number || row.verse);
        const text = Array.isArray(row) ? row[1] : row.text;
        return {
          id:`${key}-${number}-${verseNumber}`,
          bookKey:key,
          bookName:name,
          english,
          chapter:number,
          number:verseNumber,
          text:String(text || '')
        };
      }).filter(verse => verse.text && Number.isFinite(verse.number));
      return {
        number,
        subtitle:chapter.subtitle || '말씀',
        pageLeft:chapter.pageLeft || `${name} · ${number}장`,
        pageRight:chapter.pageRight || `${name} · 말씀`,
        startPage:Number(chapter.startPage || book.startPage || 1) + chapterIndex,
        verses
      };
    }).filter(chapter => chapter.verses.length);
    return {key, name, english, startPage:Number(book.startPage || 1), chapters};
  }

  function normalizeFlatRows(rows){
    const bookMap = new Map();
    rows.forEach(row=>{
      const key = row.bookKey || row.book || row.key || row.abbr;
      const name = row.bookName || row.book_name || row.name || key;
      const chapterNumber = Number(row.chapter);
      const verseNumber = Number(row.verse || row.number);
      if(!key || !chapterNumber || !verseNumber || !row.text) return;
      if(!bookMap.has(key)) bookMap.set(key, {key, name, english:row.english || key, startPage:Number(row.startPage || 1), chapters:new Map()});
      const book = bookMap.get(key);
      if(!book.chapters.has(chapterNumber)) book.chapters.set(chapterNumber, {number:chapterNumber, subtitle:'말씀', pageLeft:`${name} · ${chapterNumber}장`, pageRight:`${name} · 말씀`, startPage:chapterNumber, verses:[]});
      book.chapters.get(chapterNumber).verses.push({id:`${key}-${chapterNumber}-${verseNumber}`, bookKey:key, bookName:name, english:book.english, chapter:chapterNumber, number:verseNumber, text:String(row.text)});
    });
    return [...bookMap.values()].map(book => ({...book, chapters:[...book.chapters.values()].sort((a,b)=>a.number-b.number)}));
  }

  function normalizeBible(input){
    if(!Array.isArray(input) || !input.length) return [];
    if(input[0]?.chapters) return input.map(normalizeBook).filter(book => book.chapters.length);
    return normalizeFlatRows(input);
  }

  async function fetchJson(url){
    const response = await fetch(url, {cache:'no-store'});
    if(!response.ok) throw new Error(`${url}: ${response.status}`);
    const text = await response.text();
    if(!text.trim()) return null;
    return JSON.parse(text);
  }

  async function loadSplitBible(){
    const manifest = await fetchJson(MANIFEST_URL);
    if(!manifest) return [];
    const entries = Array.isArray(manifest) ? manifest : manifest.books;
    if(!Array.isArray(entries) || !entries.length) return [];
    const books = await Promise.all(entries.map(async entry=>{
      const url = typeof entry === 'string' ? entry : entry.url || entry.path;
      if(!url) return null;
      const data = await fetchJson(url.startsWith('data/') ? url : `data/${url}`);
      if(!data) return null;
      return Array.isArray(data) && data[0]?.chapters ? data[0] : data;
    }));
    return normalizeBible(books.filter(Boolean));
  }

  function applyBible(bible){
    const reader = window.BJTReader;
    if(!reader || !reader.state || !Array.isArray(bible) || !bible.length) return false;
    reader.state.bible = bible;
    reader.state.bookIndex = 0;
    reader.state.chapterIndex = 0;
    reader.state.selected = bible[0].chapters[0].verses[0];
    reader.render?.();
    return true;
  }

  async function tryLoad(){
    if(!window.BJTReader){
      if(++pollCount < POLL_LIMIT) window.setTimeout(tryLoad, 100);
      return;
    }
    try{
      const bible = await loadSplitBible();
      if(applyBible(bible)) return;
    }catch(error){
      console.info('Split Bible data not loaded; using built-in or data/bible-kor.json fallback.', error.message);
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', tryLoad, {once:true})
    : tryLoad();
})();
