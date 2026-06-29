// V4 reader entrypoint. Main app logic lives in v4-reader.js and v4-reader.css.
(function(){
  function addCss(){
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'v4-reader.css';
    document.head.appendChild(link);
  }
  function addReader(){
    var script = document.createElement('script');
    script.src = 'v4-reader.js';
    document.body.appendChild(script);
  }
  addCss();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addReader, {once:true});
  else addReader();
})();
