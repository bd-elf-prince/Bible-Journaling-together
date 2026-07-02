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

