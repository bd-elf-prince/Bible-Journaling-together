// Extra enhancements layer (non-invasive)
// Adds keyboard navigation + accessibility shortcuts

(function () {
  const prev = document.querySelector('#prev-button');
  const next = document.querySelector('#next-button');
  const dialog = document.querySelector('#comment-dialog');

  function click(el) { if (el) el.click(); }

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowLeft':
        click(prev);
        break;
      case 'ArrowRight':
        click(next);
        break;
      case 'Escape':
        if (dialog?.open) dialog.close();
        break;
    }
  });

  window.addEventListener('load', () => {
    const book = document.querySelector('#book');
    if (book) book.focus();
  });
})();