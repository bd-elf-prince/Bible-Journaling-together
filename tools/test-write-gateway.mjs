import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../production-candidate/reader-app.js', import.meta.url), 'utf8');
const publishableKey = source.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0];
if (!publishableKey) throw new Error('publishable key not found');

const slugs = process.argv.slice(2);
if (!slugs.length) throw new Error('provide at least one function slug');

for (const slug of slugs) {
  const response = await fetch(`https://rayvvlerwxumqvmodvsy.supabase.co/functions/v1/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${publishableKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create_discussion_comment',
      idempotency_key: '0123456789abcdef',
      payload: {}
    })
  });
  const body = await response.json().catch(() => ({}));
  console.log(JSON.stringify({slug, status:response.status, error:body.error || null}));
}
