const supabaseUrl = "https://rayvvlerwxumqvmodvsy.supabase.co";
const supabaseKey = "sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ";
const db = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

const BIBLE = [
  { key:"gen", name:"창세기", english:"Genesis", chapters:[{ number:1, subtitle:"태초의 빛과 창조의 질서", pageLeft:"창세기 · 첫째 날", pageRight:"창세기 · 좋았더라", verses:[
    [1,"태초에 하나님이 천지를 창조하시니라",["시작","창조","믿음"]],
    [2,"땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라",["혼돈","위로","회복"]],
    [3,"하나님이 이르시되 빛이 있으라 하시니 빛이 있었고",["빛","희망","회복"]],
    [4,"빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사",["분별","평안","좋음"]],
    [5,"하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라",["시간","질서","평안"]],
    [6,"하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고",["공간","질서","믿음"]],
    [7,"하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라",["순종","질서","믿음"]],
    [8,"하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라",["하늘","평안","위로"]],
    [9,"하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라",["드러남","회복","용기"]],
    [10,"하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라",["좋음","감사","평안"]],
    [31,"하나님이 지으신 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라",["심히 좋음","완성","감사"]]
  ]}]},
  { key:"ps", name:"시편", english:"Psalms", chapters:[{ number:23, subtitle:"목자 되신 주님의 평안", pageLeft:"시편 · 푸른 풀밭", pageRight:"시편 · 잔이 넘치나이다", verses:[
    [1,"여호와는 나의 목자시니 내게 부족함이 없으리로다",["목자","평안","믿음"]],
    [2,"그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다",["쉼","인도","평안"]],
    [3,"내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다",["소생","회복","인도"]],
    [4,"내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라",["동행","위로","믿음"]],
    [5,"주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다",["넘침","감사","회복"]],
    [6,"내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다",["선하심","영원","평안"]]
  ]}]},
  { key:"mat", name:"마태복음", english:"Matthew", chapters:[{ number:5, subtitle:"산 위에서 들려온 복과 빛의 말씀", pageLeft:"마태복음 · 팔복", pageRight:"마태복음 · 소금과 빛", verses:[
    [3,"심령이 가난한 자는 복이 있나니 천국이 그들의 것임이요",["복","겸손","위로"]],
    [4,"애통하는 자는 복이 있나니 그들이 위로를 받을 것임이요",["애통","위로","회복"]],
    [5,"온유한 자는 복이 있나니 그들이 땅을 기업으로 받을 것임이요",["온유","복","평안"]],
    [6,"의에 주리고 목마른 자는 복이 있나니 그들이 배부를 것임이요",["의","갈망","회복"]],
    [7,"긍휼히 여기는 자는 복이 있나니 그들이 긍휼히 여김을 받을 것임이요",["긍휼","감사","위로"]],
    [8,"마음이 청결한 자는 복이 있나니 그들이 하나님을 볼 것임이요",["청결","믿음","평안"]],
    [9,"화평하게 하는 자는 복이 있나니 그들이 하나님의 아들이라 일컬음을 받을 것임이요",["화평","평안","소명"]],
    [10,"의를 위하여 박해를 받은 자는 복이 있나니 천국이 그들의 것임이라",["인내","믿음","위로"]],
    [13,"너희는 세상의 소금이니 소금이 만일 그 맛을 잃으면 무엇으로 짜게 하리요",["소금","소명","믿음"]],
    [14,"너희는 세상의 빛이라 산 위에 있는 동네가 숨겨지지 못할 것이요",["빛","소명","회복"]],
    [16,"이같이 너희 빛이 사람 앞에 비치게 하여 그들로 너희 착한 행실을 보고 하나님께 영광을 돌리게 하라",["빛","영광","감사"]]
  ]}]}
].map(book => ({...book, chapters: book.chapters.map(ch => ({...ch, verses: ch.verses.map(v => ({id:`${book.key}-${ch.number}-${v[0]}`, bookKey:book.key, bookName:book.name, english:book.english, chapter:ch.number, number:v[0], text:v[1], tags:v[2]}))}))}));

const reactionTypes = [
  {key:"like", label:"좋아요", icon:"♡", mood:"감사"},
  {key:"moved", label:"감동", icon:"✦", mood:"회복"},
  {key:"comforted", label:"위로", icon:"☁", mood:"위로"},
  {key:"strengthened", label:"힘", icon:"▲", mood:"믿음"},
  {key:"amen", label:"아멘", icon:"✓", mood:"믿음"}
];
const moodFallbacks = {위로:["ps-23-4","mat-5-4","gen-1-2"], 믿음:["gen-1-1","ps-23-1","mat-5-10"], 평안:["ps-23-2","gen-1-8","mat-5-9"], 회복:["ps-23-3","gen-1-3","mat-5-6"], 감사:["gen-1-31","ps-23-5","mat-5-16"]};
const $ = id => document.getElementById(id);
const state = {bookIndex:0, chapterIndex:0, selectedVerse:null, comments:[], verseReactions:[], commentReactions:[], commentCounts:new Map(), myVerseReactions:new Set(), myCommentReactions:new Set()};
const el = {};
["leftVerses","rightVerses","selectedReference","selectedVerseText","emotionRow","emotionBars","topEmotionLabel","recommendMoodLabel","recommendList","commentList","commentTotal","commentForm","commentInput","moodSelect","message","statComments","statReactions","statSelected","anonymousBadge","bookSelect","chapterSelect","readerTitleEnglish","readerTitle","readerSubtitle","pageLeftTitle","pageRightTitle","bottomDock","nicknameInput","profileStatus"].forEach(id => el[id] = $(id));

function currentBook(){ return BIBLE[state.bookIndex]; }
function currentChapter(){ return currentBook().chapters[state.chapterIndex]; }
function allVerses(){ return BIBLE.flatMap(b => b.chapters.flatMap(c => c.verses)); }
function escapeHtml(v){ return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function countBy(rows, key){ const m = new Map(); rows.forEach(r => m.set(r[key], (m.get(r[key]) || 0) + 1)); return m; }
function anonymousId(){ let id = localStorage.getItem("bjt-anonymous-id"); if(!id){ id = crypto.randomUUID ? crypto.randomUUID() : `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`; localStorage.setItem("bjt-anonymous-id", id); } return id; }
function randomName(){ const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; const tail = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join(""); return `익명${tail}`; }
function anonymousName(){ let name = localStorage.getItem("bjt-anonymous-name"); if(!name){ name = randomName(); localStorage.setItem("bjt-anonymous-name", name); } return name; }
function setMessage(text){ el.message.textContent = text || ""; }
function formatDate(value){ const d = new Date(value); if(Number.isNaN(d.getTime())) return "방금 전"; return new Intl.DateTimeFormat("ko-KR", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"}).format(d); }

function renderSelectors(){
  el.bookSelect.innerHTML = BIBLE.map((b,i) => `<option value="${i}">${b.name}</option>`).join("");
  el.bookSelect.value = String(state.bookIndex);
  el.chapterSelect.innerHTML = currentBook().chapters.map((c,i) => `<option value="${i}">${c.number}장</option>`).join("");
  el.chapterSelect.value = String(state.chapterIndex);
}
function renderReaderHeader(){
  const b = currentBook(), ch = currentChapter();
  el.readerTitleEnglish.textContent = b.english;
  el.readerTitle.textContent = `${b.name} ${ch.number}장`;
  el.readerSubtitle.textContent = ch.subtitle;
  el.pageLeftTitle.textContent = ch.pageLeft;
  el.pageRightTitle.textContent = ch.pageRight;
}
function renderBible(){
  const verses = currentChapter().verses;
  const mid = Math.ceil(verses.length / 2);
  el.leftVerses.innerHTML = verses.slice(0, mid).map(renderVerse).join("");
  el.rightVerses.innerHTML = verses.slice(mid).map(renderVerse).join("");
  document.querySelectorAll("[data-verse-id]").forEach(btn => btn.addEventListener("click", () => selectVerse(btn.dataset.verseId)));
}
function renderVerse(verse){
  const comments = state.commentCounts.get(verse.id) || 0;
  const reactions = state.verseReactions.filter(r => r.verse_id === verse.id).length;
  const selected = state.selectedVerse?.id === verse.id ? " is-selected" : "";
  return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}"><span class="verse-number">${verse.number}</span><span class="verse-text">${escapeHtml(verse.text)}</span><span class="comment-count ${comments || reactions ? "has-comments" : ""}">${comments + reactions}</span></button>`;
}
function renderSelectedVerse(){
  const v = state.selectedVerse;
  el.selectedReference.textContent = `${v.bookName} ${v.chapter}장 ${v.number}절`;
  el.selectedVerseText.textContent = v.text;
  el.statSelected.textContent = `${v.number}절`;
  el.anonymousBadge.textContent = `${anonymousName()} · 익명으로 작성`;
  if(el.nicknameInput) el.nicknameInput.value = anonymousName();
}
function renderEmotionButtons(){
  const id = state.selectedVerse.id;
  const counts = countBy(state.verseReactions.filter(r => r.verse_id === id), "reaction_type");
  el.emotionRow.innerHTML = reactionTypes.map(type => {
    const active = state.myVerseReactions.has(`${id}:${type.key}`);
    return `<button class="emotion-button ${active ? "is-active" : ""}" type="button" data-reaction="${type.key}"><span>${type.icon}</span>${type.label}<br>${counts.get(type.key) || 0}</button>`;
  }).join("");
  el.emotionRow.querySelectorAll("[data-reaction]").forEach(btn => btn.addEventListener("click", () => toggleVerseReaction(btn.dataset.reaction)));
}
function renderEmotionBars(){
  const rows = state.verseReactions.filter(r => r.verse_id === state.selectedVerse.id);
  const counts = countBy(rows, "reaction_type");
  const max = Math.max(1, ...reactionTypes.map(t => counts.get(t.key) || 0));
  const top = reactionTypes.map(t => ({...t, count:counts.get(t.key) || 0})).sort((a,b) => b.count - a.count)[0];
  el.topEmotionLabel.textContent = top.count ? `${top.label} ${top.count}` : "아직 조용해요";
  el.emotionBars.innerHTML = reactionTypes.map(type => {
    const count = counts.get(type.key) || 0;
    const width = Math.max(4, Math.round(count / max * 100));
    return `<div class="emotion-bar"><span>${type.icon} ${type.label}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${count}</strong></div>`;
  }).join("");
}
function scoreRecommendations(){
  const selected = state.selectedVerse;
  const mood = el.moodSelect.value;
  const selectedUsers = new Set(state.verseReactions.filter(r => r.verse_id === selected.id).map(r => r.anonymous_id));
  const rows = allVerses().filter(v => v.id !== selected.id).map(verse => {
    const shared = state.verseReactions.filter(r => r.verse_id === verse.id && selectedUsers.has(r.anonymous_id)).length;
    const tagScore = verse.tags.filter(tag => selected.tags.includes(tag) || tag === mood).length;
    const moodScore = state.comments.filter(c => c.verse_id === verse.id && (c.mood === mood || selected.tags.includes(c.mood))).length;
    return {verse, score:shared * 4 + tagScore * 2 + moodScore};
  }).sort((a,b) => b.score - a.score || a.verse.bookName.localeCompare(b.verse.bookName) || a.verse.number - b.verse.number);
  const picked = rows.filter(r => r.score > 0).slice(0,3);
  if(picked.length) return picked;
  return (moodFallbacks[mood] || moodFallbacks.위로).map(id => ({verse:allVerses().find(v => v.id === id)})).filter(x => x.verse).slice(0,3);
}
function renderRecommendations(){
  const mood = el.moodSelect.value;
  el.recommendMoodLabel.textContent = mood;
  el.recommendList.innerHTML = scoreRecommendations().map(({verse, score}) => `<article class="recommend-item"><strong>${verse.bookName} ${verse.chapter}장 ${verse.number}절</strong><p>${escapeHtml(verse.text)}</p><small>${score ? "비슷한 마음들이 함께 반응한 말씀" : `${mood}의 마음에 어울리는 말씀`}</small><button type="button" data-recommend="${verse.id}">이 말씀으로 이동</button></article>`).join("");
  el.recommendList.querySelectorAll("[data-recommend]").forEach(btn => btn.addEventListener("click", () => selectVerse(btn.dataset.recommend)));
}
function renderComments(){
  const rows = state.comments.filter(c => c.verse_id === state.selectedVerse.id);
  const hearts = countBy(state.commentReactions, "comment_id");
  el.commentTotal.textContent = String(rows.length);
  el.commentList.innerHTML = rows.length ? rows.map(comment => {
    const active = state.myCommentReactions.has(comment.id);
    return `<article class="comment-item"><div class="comment-meta"><span class="comment-author">${escapeHtml(comment.user_name || "익명")}</span><time>${escapeHtml(formatDate(comment.created_at))}</time></div>${comment.mood ? `<span class="comment-mood">${escapeHtml(comment.mood)}</span>` : ""}<p class="comment-body">${escapeHtml(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${active ? "is-active" : ""}" type="button" data-comment-heart="${comment.id}">♡ 공감 ${hearts.get(comment.id) || 0}</button></div></article>`;
  }).join("") : `<p class="comment-empty">아직 남겨진 묵상이 없습니다. 이 말씀 앞에 머문 첫 마음을 남겨주세요.</p>`;
  el.commentList.querySelectorAll("[data-comment-heart]").forEach(btn => btn.addEventListener("click", () => reactToComment(btn.dataset.commentHeart)));
}
function renderDock(){
  const items = ["gen-1-1","gen-1-3","ps-23-4","mat-5-14"].map(id => allVerses().find(v => v.id === id)).filter(Boolean);
  el.bottomDock.innerHTML = items.map(v => `<button type="button" data-dock-verse="${v.id}">${v.bookName} ${v.chapter}:${v.number}</button>`).join("");
  el.bottomDock.querySelectorAll("[data-dock-verse]").forEach(btn => btn.addEventListener("click", () => selectVerse(btn.dataset.dockVerse)));
}
function updateStats(){ el.statComments.textContent = String(state.comments.length); el.statReactions.textContent = String(state.verseReactions.length + state.commentReactions.length); }
function renderAll(){ renderSelectors(); renderReaderHeader(); renderBible(); renderSelectedVerse(); renderEmotionButtons(); renderEmotionBars(); renderRecommendations(); renderComments(); renderDock(); updateStats(); }
function findVerse(id){ return allVerses().find(v => v.id === id); }
function setChapterByVerse(verse){ state.bookIndex = BIBLE.findIndex(b => b.key === verse.bookKey); state.chapterIndex = currentBook().chapters.findIndex(c => c.number === verse.chapter); }
function selectVerse(id){ const verse = findVerse(id); if(!verse) return; setChapterByVerse(verse); state.selectedVerse = verse; renderAll(); document.getElementById("commentPanel")?.scrollIntoView({behavior:"smooth", block:"nearest"}); }

async function loadData(){
  state.selectedVerse = currentChapter().verses[0];
  if(!db){ setMessage("Supabase 연결을 확인해 주세요."); renderAll(); return; }
  setMessage("묵상 데이터를 불러오는 중입니다…");
  const [commentsRes, verseReactionsRes, commentReactionsRes] = await Promise.all([
    db.from("comments").select("id, verse_id, user_name, content, created_at, anonymous_id, mood").order("created_at", {ascending:false}),
    db.from("verse_reactions").select("id, verse_id, anonymous_id, reaction_type, created_at"),
    db.from("comment_reactions").select("id, comment_id, anonymous_id, reaction_type, created_at")
  ]);
  if(!commentsRes.error){ state.comments = commentsRes.data || []; state.commentCounts = countBy(state.comments, "verse_id"); } else setMessage("comments table check needed.");
  if(!verseReactionsRes.error){ state.verseReactions = verseReactionsRes.data || []; state.myVerseReactions = new Set(state.verseReactions.filter(r => r.anonymous_id === anonymousId()).map(r => `${r.verse_id}:${r.reaction_type}`)); } else setMessage("verse reactions check needed.");
  if(!commentReactionsRes.error){ state.commentReactions = commentReactionsRes.data || []; state.myCommentReactions = new Set(state.commentReactions.filter(r => r.anonymous_id === anonymousId()).map(r => r.comment_id)); } else setMessage("comment reactions check needed.");
  if(!commentsRes.error && !verseReactionsRes.error && !commentReactionsRes.error) setMessage("");
  renderAll();
}
async function toggleVerseReaction(reactionType){
  const verseId = state.selectedVerse.id, anon = anonymousId(), key = `${verseId}:${reactionType}`;
  if(state.myVerseReactions.has(key)){ setMessage("이미 이 감정을 남겼습니다."); return; }
  const {data, error} = await db.from("verse_reactions").insert({verse_id:verseId, anonymous_id:anon, reaction_type:reactionType}).select("id, verse_id, anonymous_id, reaction_type, created_at").single();
  if(error){ setMessage("감정 표현 저장에 실패했습니다."); return; }
  state.verseReactions.push(data); state.myVerseReactions.add(key); setMessage(""); renderAll();
}
async function reactToComment(commentId){
  if(state.myCommentReactions.has(commentId)){ setMessage("이미 이 묵상에 공감했습니다."); return; }
  const {data, error} = await db.from("comment_reactions").insert({comment_id:commentId, anonymous_id:anonymousId(), reaction_type:"heart"}).select("id, comment_id, anonymous_id, reaction_type, created_at").single();
  if(error){ setMessage("공감 저장에 실패했습니다."); return; }
  state.commentReactions.push(data); state.myCommentReactions.add(commentId); setMessage(""); renderAll();
}
async function submitComment(event){
  event.preventDefault();
  const content = el.commentInput.value.trim();
  if(!content) return;
  const button = el.commentForm.querySelector("button[type='submit']");
  button.disabled = true; button.textContent = "저장 중…";
  const payload = {verse_id:state.selectedVerse.id, user_name:anonymousName(), anonymous_id:anonymousId(), mood:el.moodSelect.value, content};
  const {data, error} = await db.from("comments").insert(payload).select("id, verse_id, user_name, content, created_at, anonymous_id, mood").single();
  button.disabled = false; button.textContent = "등록";
  if(error){ setMessage("묵상 저장에 실패했습니다."); return; }
  state.comments.unshift(data); state.commentCounts = countBy(state.comments, "verse_id"); el.commentInput.value = ""; setMessage(""); renderAll();
}
function setupEvents(){
  el.commentForm.addEventListener("submit", submitComment);
  el.moodSelect.addEventListener("change", renderRecommendations);
  el.bookSelect.addEventListener("change", e => { state.bookIndex = Number(e.target.value); state.chapterIndex = 0; state.selectedVerse = currentChapter().verses[0]; renderAll(); });
  el.chapterSelect.addEventListener("change", e => { state.chapterIndex = Number(e.target.value); state.selectedVerse = currentChapter().verses[0]; renderAll(); });
  $("prevChapter").addEventListener("click", () => moveChapter(-1));
  $("nextChapter").addEventListener("click", () => moveChapter(1));
  $("copyVerseButton")?.addEventListener("click", async () => { const v = state.selectedVerse; await navigator.clipboard?.writeText(`${v.bookName} ${v.chapter}:${v.number} ${v.text}`); setMessage("구절을 복사했습니다."); });
  $("randomNameButton")?.addEventListener("click", () => { const name = randomName(); el.nicknameInput.value = name; localStorage.setItem("bjt-anonymous-name", name); renderSelectedVerse(); });
  $("saveNameButton")?.addEventListener("click", () => { const name = el.nicknameInput.value.trim().slice(0,24) || randomName(); localStorage.setItem("bjt-anonymous-name", name); el.profileStatus.textContent = "저장됨"; renderSelectedVerse(); });
  document.querySelectorAll("[data-mood-jump]").forEach(btn => btn.addEventListener("click", () => { el.moodSelect.value = btn.dataset.moodJump; renderRecommendations(); document.getElementById("recommendPanel")?.scrollIntoView({behavior:"smooth", block:"nearest"}); }));
  $("searchForm").addEventListener("submit", event => { event.preventDefault(); const q = $("searchInput").value.trim(); if(!q) return; const n = q.replace(/[^0-9]/g, ""); const match = allVerses().find(v => v.text.includes(q) || v.tags.some(tag => tag.includes(q)) || `${v.bookName} ${v.chapter}:${v.number}`.includes(q) || String(v.number) === n); if(match) selectVerse(match.id); else setMessage(`“${q}”에 맞는 말씀을 찾지 못했습니다.`); });
  $("fontSizeSelect").addEventListener("change", e => { const sizes = {normal:"1.08rem", large:"1.22rem", xlarge:"1.38rem"}; document.querySelectorAll(".verses").forEach(node => node.style.fontSize = sizes[e.target.value] || sizes.normal); });
}
function moveChapter(step){
  let bi = state.bookIndex, ci = state.chapterIndex + step;
  if(ci < 0){ bi = Math.max(0, bi - 1); ci = BIBLE[bi].chapters.length - 1; }
  if(ci >= BIBLE[bi].chapters.length){ bi = Math.min(BIBLE.length - 1, bi + 1); ci = 0; }
  state.bookIndex = bi; state.chapterIndex = ci; state.selectedVerse = currentChapter().verses[0]; renderAll();
}

state.selectedVerse = currentChapter().verses[0];
setupEvents();
renderAll();
loadData();
