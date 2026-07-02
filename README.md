# Bible Journaling Together

Bible Journaling Together is a verse-level exchange-diary Bible reader.

The core idea is simple:

> A small comment left beside a Bible verse can become a wave-like realization for another person.

This project is not an emotion-analysis or recommendation app. The reading experience should stay quiet, book-first, and comment-first. Reactions and recommendation hints can exist, but they should never sound like the app is analyzing people.

## Current Direction

- Read the Bible by book, chapter, and verse.
- Leave anonymous comments beside individual verses.
- Show each verse comment mark like a pressed speech-bubble imprint on paper.
- Make comments feel like small droplets left beside the text.
- Keep emotion and reaction data secondary and quiet.
- Phrase recommendations as verses to open together after reading a reflection.

## Current V5 Files

- `index.html`
- `v5-reader.js`
- `v5-reader.css`
- `v5-ripple.js`
- `v5-pressed-bubble.css`
- `v5-mobile.css`
- `v5-mobile-pages.css`
- `v5-2026-polish.css`
- `v5-preview.html`
- `supabase/v5-reactions.sql`

## Bible Data

The reader loads Korean Bible data from:

- `data/bible-kor.json`

If the full JSON is unavailable or fails to load, the app falls back to built-in sample passages in `v5-reader.js`.

For long-term stability, the Bible data may need to be split by book or chapter if load size becomes a problem.

## Supabase

The V5 flow uses Supabase for anonymous verse-level comments and reactions.

Expected tables include:

- verse comments
- verse reactions
- comment reactions

Comments should remain anonymous and attached to a verse, not to an emotion profile.

## Genesis 1:1 MVP Check

The first MVP is intentionally small:

1. Open Genesis 1:1.
2. Confirm the selected verse id is `gen-1-1`.
3. Save one anonymous comment with `verse_id: "gen-1-1"`.
4. Refresh the page.
5. Confirm the comment is still visible on Genesis 1:1.
6. Confirm the same comment is not visible on Genesis 1:2.

Before testing comments, run the Supabase SQL in this order:

1. `supabase/mvp-fix-comments-rls.sql`
2. `supabase/mvp-check-comments.sql`

Local data can be checked with:

```bash
node tools/check-mvp-data.mjs data/bible-kor.json
```

All verse comment slots can be checked with:

```bash
node tools/check-all-verse-independence.mjs data/bible-kor.json
```

This proves the homepage has 31,101 independent verse ids, so every verse has its own comment target.

The Supabase registry for those 31,101 comment targets is:

```text
supabase/bible-verses-registry.sql
```

Run it after the comments MVP SQL to create `public.bible_verses` and connect `comments.verse_id` to the full Bible verse id set.

After the Supabase SQL is applied, verse-level storage can be checked with:

```bash
node tools/check-supabase-comments-mvp.mjs
```

That script inserts one test comment for `gen-1-1`, one for `gen-1-2`, then confirms each query only returns its own verse.

## UX Principles

Use this language:

- "reflections beside this verse"
- "verses to open together after this reflection"
- "anonymous note"
- "small comment left beside the verse"

Avoid this language:

- "people who felt sadness liked this verse"
- "AI analyzed your emotion"
- "mood-based targeting"
- "recommended because users like you felt..."

## Development Notes

This is a static frontend project. Open `index.html` or serve the folder with a local static server.

When changing the reader, keep the first screen focused on the Bible reading experience rather than a marketing landing page.

