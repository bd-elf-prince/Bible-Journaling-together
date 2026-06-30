# Emergency reader boot hotfix — 2026-06-30

The homepage was reported as not opening.

Immediate hotfix:
- Updated `v4-photo-match.js`.
- Added an emergency visible fallback.
- If the main V4 reader fails to boot within 3 seconds, the page now forces a minimal visible Genesis 1 reader instead of leaving the site blank.
- This is not the final MVP fix. It is only a safety net so the homepage remains accessible while the reader/comment engine is checked.

Next checks:
1. Hard refresh the GitHub Pages site.
2. Confirm that the page is visible.
3. Then inspect the real reader engine and Supabase comment flow separately.

Related MVP directive: Issue #8.
