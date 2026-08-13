import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');

const [reader, candidateHtml, migration, headers] = await Promise.all([
  read('v6-reader.js'),
  read('index-production-candidate.html'),
  read('supabase/migrations/20260809103936_harden_comments_mvp.sql'),
  read('_headers')
]);

assert.match(reader, /\.in\('verse_id', verseIds\)/, 'comments/reactions must be scoped to visible verses');
assert.match(reader, /\.in\('comment_id', commentIds\)/, 'comment reactions must be scoped to visible comments');
assert.match(reader, /\.limit\(COMMENTS_PER_SPREAD\)/, 'comment query must be bounded');
assert.match(reader, /\.limit\(REACTIONS_PER_SPREAD\)/, 'reaction queries must be bounded');
assert.doesNotMatch(reader, /fetch\(DATA_URL, \{cache:'no-store'\}\)/, 'Bible fetch must not disable browser cache');
assert.match(reader, /serverLoadVersion/, 'stale API responses must be ignored');
assert.match(reader, /verseById = new Map/, 'verse lookup must use a prebuilt index');

assert.match(candidateHtml, /@supabase\/supabase-js@2\.49\.8/, 'Supabase client must be pinned');
assert.match(candidateHtml, /v6-reader\.js\?v=20260809-01/, 'candidate HTML must load the bounded reader');

assert.match(migration, /set search_path = ''/, 'privileged functions must use an empty search_path');
assert.match(migration, /auth\.jwt\(\) ->> 'role'.*service_role/s, 'admin function must verify the service role');
assert.match(migration, /revoke all on function public\.admin_soft_delete_comment\(uuid, text\)/, 'public admin execute must be revoked');
assert.match(migration, /revoke select on public\.comment_reports from anon, authenticated/, 'reports must be write-only for public clients');
assert.doesNotMatch(migration, /to public\b/i, 'RLS policies must target explicit API roles');

assert.match(headers, /Strict-Transport-Security: max-age=86400/, 'HSTS must begin with a staged TTL');
assert.match(headers, /max-age=31536000, immutable/, 'versioned static assets must be browser-cacheable');

const [productionReader, productionCommunity] = await Promise.all([
  read('production-candidate/reader-app.js'),
  read('production-candidate/community.js')
]);
assert.doesNotMatch(productionReader, /cache:'no-store'/, 'production Bible fetch must permit browser caching');
assert.match(productionReader, /\.limit\(241\)/, 'production comment reads must be bounded');
assert.doesNotMatch(productionReader, /get_public_comments|\.from\('comments'\)/, 'production reader must not fan out to legacy comment backends');
assert.doesNotMatch(productionCommunity, /\.select\('\*'\)/, 'community queries must select explicit columns');
assert.doesNotMatch(productionCommunity, /\.limit\(500\)/, 'community must not load 500 posts at once');
assert.match(productionCommunity, /\.limit\(POST_WINDOW_SIZE\)/, 'community post reads must be bounded');
assert.match(productionCommunity, /\.limit\(COMMENT_WINDOW_SIZE\)/, 'community comment reads must be bounded');

console.log('production upgrade static checks passed');
