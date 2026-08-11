import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const [sourceText, manifestText, readerSource, communitySource, gatewaySource, runtimeText, surgeText, normalText] = await Promise.all([
  read('data/bible-kor.json'),
  read('data/manifest.json'),
  read('production-candidate/reader-app.js'),
  read('production-candidate/community.js'),
  read('supabase/functions/write-gateway/index.ts'),
  read('data/runtime-config.json'),
  read('data/runtime-config.surge.json'),
  read('data/runtime-config.normal.json'),
]);

const source = JSON.parse(sourceText);
const manifest = JSON.parse(manifestText);
const runtime = JSON.parse(runtimeText);
const surge = JSON.parse(surgeText);
const normal = JSON.parse(normalText);
assert(manifest.sourceSha256 === sha256(sourceText), 'manifest source hash mismatch');
assert(manifest.books.length === source.length, 'manifest book count mismatch');

const reconstructed = [];
let chapterCount = 0;
let verseCount = 0;
for (const entry of manifest.books) {
  assert(/^data\/books\/[a-z0-9]+\.[a-f0-9]{12}\.json$/.test(entry.url), `invalid shard URL: ${entry.url}`);
  const shardText = await read(entry.url);
  assert(sha256(shardText) === entry.sha256, `shard hash mismatch: ${entry.key}`);
  const book = JSON.parse(shardText);
  assert(book.key === entry.key, `shard key mismatch: ${entry.key}`);
  reconstructed.push(book);
  chapterCount += book.chapters.length;
  verseCount += book.chapters.reduce((sum, chapter) => sum + chapter.verses.length, 0);
}

assert(JSON.stringify(reconstructed) === JSON.stringify(source), 'shards do not reconstruct the source Bible');
assert(manifest.totals.books === source.length, 'manifest total books mismatch');
assert(manifest.totals.chapters === chapterCount, 'manifest total chapters mismatch');
assert(manifest.totals.verses === verseCount, 'manifest total verses mismatch');

[
  ['reader manifest loader', readerSource.includes("const MANIFEST_URL = 'data/manifest.json'")],
  ['reader shard integrity check', readerSource.includes('bible shard integrity mismatch')],
  ['reader server search', readerSource.includes(".from('bible_verses')")],
  ['reader write gateway v4', readerSource.includes("const WRITE_GATEWAY_FUNCTION = 'write-gateway-v4'")],
  ['community post cursor', communitySource.includes('postCursor:null')],
  ['community comment cursor', communitySource.includes('commentCursors:new Map()')],
  ['community server search', communitySource.includes("query.ilike('title'")],
  ['community write gateway v4', communitySource.includes("const WRITE_GATEWAY_FUNCTION = 'write-gateway-v4'")],
  ['gateway rate limit', gatewaySource.includes('consume_request_rate_limit')],
  ['gateway idempotency', gatewaySource.includes('claim_request_idempotency')],
  ['gateway authenticated JWT filter', gatewaySource.includes('claims?.role === "authenticated"')],
  ['gateway emergency read-only switch', gatewaySource.includes('SURGE_READ_ONLY')],
  ['reader runtime config', readerSource.includes("const RUNTIME_CONFIG_URL = 'data/runtime-config.json'")],
  ['community runtime config', communitySource.includes("const RUNTIME_CONFIG_URL = 'data/runtime-config.json'")],
  ['deployed runtime defaults to surge', runtime.mode === 'surge' && !runtime.dynamicReads && !runtime.writes && !runtime.auth],
  ['surge runtime mode', surge.mode === 'surge' && !surge.dynamicReads && !surge.writes && !surge.auth],
  ['normal runtime template', normal.mode === 'normal' && normal.dynamicReads && normal.writes && normal.auth],
].forEach(([name, passed]) => assert(passed, `${name} missing`));

console.log(JSON.stringify({
  status: 'passed',
  books: source.length,
  chapters: chapterCount,
  verses: verseCount,
  shards: manifest.books.length,
  sourceBytes: Buffer.byteLength(sourceText),
  manifestBytes: Buffer.byteLength(manifestText),
}, null, 2));
