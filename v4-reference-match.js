(function(){
  const s=document.createElement('style');
  s.id='v4-reference-match-style';
  s.textContent=`
  body.v4-reader-ready .app-header{height:52px!important;padding:4px 22px!important;grid-template-columns:300px 1fr 300px!important;overflow:hidden!important}
  body.v4-reader-ready .top-nav{gap:38px!important;white-space:nowrap!important}
  body.v4-reader-ready .top-nav a{font-size:.84rem!important;padding-top:16px!important}
  body.v4-reader-ready .brand strong,body.v4-reader-ready .brand small{max-width:235px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
  body.v4-reader-ready .app-shell{height:calc(100vh - 52px)!important;grid-template-columns:minmax(800px,1fr) 350px!important;gap:50px!important;width:min(1810px,calc(100vw - 48px))!important;padding:7px 0 12px!important}
  body.v4-reader-ready .reader-toolbar{flex-basis:34px!important;margin-bottom:6px!important}
  body.v4-reader-ready .book-frame{padding:18px 23px 22px!important;border-radius:24px!important;background:linear-gradient(90deg,rgba(255,222,146,.28),transparent 12%,transparent 88%,rgba(255,222,146,.18)),linear-gradient(145deg,#130702,#261207 22%,#3d2414 55%,#633b1d)!important;box-shadow:0 30px 76px rgba(36,17,5,.48),inset 0 0 0 1px rgba(244,199,111,.22),inset 0 0 0 9px rgba(18,8,2,.30)!important}
  body.v4-reader-ready .book-frame:before,body.v4-reader-ready .book-frame:after{top:24px!important;bottom:24px!important;width:38px!important;opacity:.9!important;background:repeating-linear-gradient(90deg,#7e5b32 0 1px,#fff0c8 1px 3px,#c59b60 3px 5px,#8d673c 5px 6px)!important}
  body.v4-reader-ready .book{border-radius:15px!important;filter:drop-shadow(0 18px 30px rgba(18,8,3,.36))!important}
  body.v4-reader-ready .book:before{left:calc(50% - 11px)!important;width:22px!important;background:linear-gradient(90deg,rgba(34,15,3,.68),rgba(255,235,192,.46) 48%,rgba(38,17,4,.70))!important;box-shadow:0 0 28px rgba(30,12,3,.45),inset 0 0 11px rgba(52,25,6,.48)!important}
  body.v4-reader-ready .book:after{content:''!important;position:absolute!important;z-index:12!important;left:7px!important;top:50%!important;width:72px!important;height:128px!important;border-radius:0 9px 9px 0!important;background:linear-gradient(135deg,#3b2010,#805832)!important;box-shadow:inset -2px 0 10px rgba(255,224,156,.16),0 11px 21px rgba(35,16,6,.25)!important;transform:translateY(-50%)!important}
  body.v4-reader-ready .page-inner{padding:20px 38px 42px!important;background-image:linear-gradient(rgba(92,57,25,.050) 1px,transparent 1px)!important;background-size:100% 1.48rem!important}
  body.v4-reader-ready .page-right .page-inner{padding-left:48px!important}
  body.v4-reader-ready .page-curl{display:none!important}
  body.v4-reader-ready .verses{font-size:clamp(.68rem,.72vw,.86rem)!important;line-height:1.32!important;gap:2px!important}
  body.v4-reader-ready .verse-row{padding:2px 5px!important;grid-template-columns:22px minmax(0,1fr) 44px!important}
  body.v4-reader-ready .reader-stage .reader-footbar{position:absolute!important;right:34px!important;top:40px!important;bottom:auto!important;height:27px!important;margin:0!important;background:rgba(50,28,12,.46)!important;border-radius:999px!important;z-index:30!important}
  body.v4-reader-ready .reader-footbar button,body.v4-reader-ready .reader-footbar span{height:25px!important;padding:0 9px!important;font-size:.68rem!important;color:#fff0ce!important;background:transparent!important;border:0!important;border-right:1px solid rgba(255,235,190,.12)!important}
  body.v4-reader-ready .listen-button{display:none!important}
  body.v4-reader-ready .reflection-panel{border-radius:20px!important;background:linear-gradient(180deg,rgba(250,237,216,.95),rgba(240,216,183,.95))!important}`;
  document.head.appendChild(s);
})();
