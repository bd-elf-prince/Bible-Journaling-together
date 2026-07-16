import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [html, css, reader, account, migration] = await Promise.all([
  read('index.html'), read('v8-reference-layout.css'), read('v5-reader.js'), read('v7-complete.js'), read('supabase/v8-verse-integrity.sql')
]);

const checks = {
  v8CssLoadedLast: html.indexOf('v8-reference-layout.css') > html.indexOf('v7-complete.css'),
  v8JsLoadedLast: html.indexOf('v8-reference-layout.js') > html.indexOf('v7-complete.js'),
  fixedViewport: /height:100dvh!important/.test(css) && /overflow:hidden!important/.test(css),
  desktopTwoColumns: /grid-template-columns:minmax\(0,1fr\) var\(--v8-panel-w\)!important/.test(css),
  mobilePanelOverlay: /position:fixed!important/.test(css) && /translateX\(104%\)/.test(css),
  tenVersesPerSpread: /VERSES_PER_SPREAD = 10/.test(reader),
  selectedVerseCommentQuery: /\.eq\('verse_id', verseId\)/.test(reader),
  strictRenderFilter: /comment\.verse_id === selected\.id/.test(reader),
  commentCardCarriesVerseId: /data-comment-verse-id/.test(reader),
  personalReadsFilterUser: /from\('bookmarks'\)\.select\('\*'\)\.eq\('user_id',state\.user\.id\)/.test(account),
  commentsForeignKey: /comments_verse_id_fkey/.test(migration),
  reactionsForeignKey: /verse_reactions_verse_id_fkey/.test(migration),
  personalVerseForeignKeys: ['bookmarks_verse_id_fkey','verse_notes_verse_id_fkey','highlights_verse_id_fkey'].every(name=>migration.includes(name)),
  migrationIsNonDestructive: !/delete\s+from\s+public\./i.test(migration)
};

const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
console.log(JSON.stringify({checks,passed:failed.length===0,failed},null,2));
if(failed.length) process.exitCode=1;

