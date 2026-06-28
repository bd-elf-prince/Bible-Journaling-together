const supabaseUrl = "https://rayvvlerwxumqvmodvsy.supabase.co";
const supabaseKey = "sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ";
const db = supabase.createClient(supabaseUrl, supabaseKey);

const verses = [
  { id: "gen-1-1", number: 1, text: "태초에 하나님이 천지를 창조하시니라", tags: ["시작", "창조", "믿음"] },
  { id: "gen-1-2", number: 2, text: "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라", tags: ["혼돈", "위로", "회복"] },
  { id: "gen-1-3", number: 3, text: "하나님이 이르시되 빛이 있으라 하시니 빛이 있었고", tags: ["빛", "희망", "회복"] },
  { id: "gen-1-4", number: 4, text: "빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사", tags: ["분별", "평안", "좋음"] },
  { id: "gen-1-5", number: 5, text: "하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라", tags: ["시간", "질서", "평안"] },
  { id: "gen-1-6", number: 6, text: "하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고", tags: ["공간", "질서", "믿음"] },
  { id: "gen-1-7", number: 7, text: "하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라", tags: ["순종", "질서", "믿음"] },
  { id: "gen-1-8", number: 8, text: "하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라", tags: ["하늘", "평안", "위로"] },
  { id: "gen-1-9", number: 9, text: "하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라", tags: ["드러남", "회복", "용기"] },
  { id: "gen-1-10", number: 10, text: "하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라", tags: ["좋음", "감사", "평안"] }
];

const reactionTypes = [
  { key: "like", label: "좋아요", icon: "♡", mood: "감사" },
  { key: "moved", label: "감동", icon: "✦", mood: "회복" },
  { key: "comforted", label: "위로", icon: "☁", mood: "위로" },
  { key: "strengthened", label: "힘", icon: "▲", mood: "믿음" },
  { key: "amen", label: "아멘", icon: "✓", mood: "믿음" }
];

const state = { selectedVerse: verses[0], comments: [], verseReactions: [], commentReactions: [], commentCounts: new Map(), myVerseReactions: new Set(), myCommentReactions: new Set() };
const $ = (id) => document.getElementById(id);
const elements = {
  leftVerses: $("leftVerses"), rightVerses: $("rightVerses"), selectedReference: $("selectedReference"),
  selectedVerseText: $("selectedVerseText"), emotionRow: $("emotionRow"), emotionBars: $("emotionBars"),
  topEmotionLabel: $("topEmotionLabel"), recommendList: $("recommendList"), commentList: $("commentList"),
  commentTotal: $("commentTotal"), commentForm: $("commentForm"), commentInput: $("commentInput"),
  moodSelect: $("moodSelect"), message: $("message"), statComments: $("statComments"),
  statReactions: $("statReactions"), statSelected: $("statSelected"), anonymousBadge: $("anonymousBadge")
};

function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function anonymousId(){let id=localStorage.getItem("bjt-anonymous-id");if(!id){id=crypto.randomUUID?crypto.randomUUID():`anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;localStorage.setItem("bjt-anonymous-id",id)}return id}
function anonymousName(){let name=localStorage.getItem("bjt-anonymous-name");if(!name){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const suffix=Array.from({length:4},()=>chars[Math.floor(Math.random()*chars.length)]).join("");name=`익명${suffix}`;localStorage.setItem("bjt-anonymous-name",name)}return name}
function formatDate(value){const date=new Date(value);if(Number.isNaN(date.getTime()))return"방금 전";return new Intl.DateTimeFormat("ko-KR",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(date)}
function countBy(items,key){const map=new Map();for(const item of items)map.set(item[key],(map.get(item[key])??0)+1);return map}

function renderBible(){
  elements.leftVerses.innerHTML=verses.slice(0,5).map(renderVerse).join("");
  elements.rightVerses.innerHTML=verses.slice(5).map(renderVerse).join("");
  document.querySelectorAll("[data-verse-id]").forEach((button)=>button.addEventListener("click",()=>selectVerse(button.dataset.verseId)));
}
function renderVerse(verse){
  const commentCount=state.commentCounts.get(verse.id)??0;
  const reactionCount=state.verseReactions.filter((r)=>r.verse_id===verse.id).length;
  const selected=state.selectedVerse.id===verse.id?" is-selected":"";
  return `<button class="verse-row${selected}" type="button" data-verse-id="${verse.id}"><span class="verse-number">${verse.number}</span><span class="verse-text">${escapeHtml(verse.text)}</span><span class="comment-count ${commentCount||reactionCount?"has-comments":""}">${commentCount+reactionCount}</span></button>`;
}
function renderSelectedVerse(){
  const verse=state.selectedVerse;
  elements.selectedReference.textContent=`창세기 1장 ${verse.number}절`;
  elements.selectedVerseText.textContent=verse.text;
  elements.statSelected.textContent=`${verse.number}절`;
  elements.anonymousBadge.textContent=`${anonymousName()} · 익명으로 작성`;
}
function renderEmotionButtons(){
  const verseId=state.selectedVerse.id;
  const counts=countBy(state.verseReactions.filter((r)=>r.verse_id===verseId),"reaction_type");
  elements.emotionRow.innerHTML=reactionTypes.map((type)=>{
    const active=state.myVerseReactions.has(`${verseId}:${type.key}`);
    return `<button class="emotion-button ${active?"is-active":""}" type="button" data-reaction="${type.key}"><span>${type.icon}</span>${type.label}<br>${counts.get(type.key)??0}</button>`;
  }).join("");
  elements.emotionRow.querySelectorAll("[data-reaction]").forEach((button)=>button.addEventListener("click",()=>toggleVerseReaction(button.dataset.reaction)));
}
function renderEmotionBars(){
  const verseId=state.selectedVerse.id;
  const rows=state.verseReactions.filter((r)=>r.verse_id===verseId);
  const counts=countBy(rows,"reaction_type");
  const max=Math.max(1,...reactionTypes.map((type)=>counts.get(type.key)??0));
  const top=reactionTypes.map((type)=>({...type,count:counts.get(type.key)??0})).sort((a,b)=>b.count-a.count)[0];
  elements.topEmotionLabel.textContent=top.count?`${top.label} ${top.count}`:"아직 조용해요";
  elements.emotionBars.innerHTML=reactionTypes.map((type)=>{
    const count=counts.get(type.key)??0; const width=Math.max(4,Math.round((count/max)*100));
    return `<div class="emotion-bar"><span>${type.icon} ${type.label}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${count}</strong></div>`;
  }).join("");
}
function renderRecommendations(){
  const selected=state.selectedVerse;
  const selectedUsers=new Set(state.verseReactions.filter((r)=>r.verse_id===selected.id).map((r)=>r.anonymous_id));
  const scored=verses.filter((v)=>v.id!==selected.id).map((verse)=>{
    const shared=state.verseReactions.filter((r)=>r.verse_id===verse.id&&selectedUsers.has(r.anonymous_id)).length;
    const tagScore=verse.tags.filter((tag)=>selected.tags.includes(tag)).length;
    const moodScore=state.comments.filter((c)=>c.verse_id===verse.id&&selected.tags.includes(c.mood)).length;
    return {verse,score:shared*4+tagScore*2+moodScore};
  }).sort((a,b)=>b.score-a.score||a.verse.number-b.verse.number).slice(0,3);
  const fallback={위로:"gen-1-8",감사:"gen-1-10",믿음:"gen-1-7",평안:"gen-1-5",회복:"gen-1-3"};
  const mood=elements.moodSelect.value;
  const list=scored.length?scored:[{verse:verses.find((v)=>v.id===fallback[mood])??verses[2],score:0}];
  elements.recommendList.innerHTML=list.map(({verse,score})=>`<article class="recommend-item"><strong>창세기 1장 ${verse.number}절</strong><p>${escapeHtml(verse.text)}</p><small>${score?"비슷한 마음들이 함께 반응한 절":`${mood}의 마음에 어울리는 절`}</small><button type="button" data-recommend="${verse.id}">이 말씀으로 이동</button></article>`).join("");
  elements.recommendList.querySelectorAll("[data-recommend]").forEach((button)=>button.addEventListener("click",()=>selectVerse(button.dataset.recommend)));
}
function renderComments(){
  const rows=state.comments.filter((c)=>c.verse_id===state.selectedVerse.id);
  const hearts=countBy(state.commentReactions,"comment_id");
  elements.commentTotal.textContent=String(rows.length);
  elements.commentList.innerHTML=rows.length?rows.map((comment)=>{
    const active=state.myCommentReactions.has(comment.id);
    return `<article class="comment-item"><div class="comment-meta"><span class="comment-author">${escapeHtml(comment.user_name||"익명")}</span><time>${escapeHtml(formatDate(comment.created_at))}</time></div>${comment.mood?`<span class="comment-mood">${escapeHtml(comment.mood)}</span>`:""}<p class="comment-body">${escapeHtml(comment.content)}</p><div class="comment-actions"><button class="comment-heart ${active?"is-active":""}" type="button" data-comment-heart="${comment.id}">♡ 공감 ${hearts.get(comment.id)??0}</button></div></article>`;
  }).join(""):`<p class="comment-empty">아직 남겨진 묵상이 없습니다. 이 말씀 앞에 머문 첫 마음을 남겨주세요.</p>`;
  elements.commentList.querySelectorAll("[data-comment-heart]").forEach((button)=>button.addEventListener("click",()=>reactToComment(button.dataset.commentHeart)));
}
function updateStats(){elements.statComments.textContent=String(state.comments.length);elements.statReactions.textContent=String(state.verseReactions.length+state.commentReactions.length)}
function renderAll(){renderSelectedVerse();renderBible();renderEmotionButtons();renderEmotionBars();renderRecommendations();renderComments();updateStats()}

async function loadData(){
  elements.message.textContent="묵상 데이터를 불러오는 중입니다…";
  const [commentsRes,verseReactionsRes,commentReactionsRes]=await Promise.all([
    db.from("comments").select("id, verse_id, user_name, content, created_at, anonymous_id, mood").order("created_at",{ascending:false}),
    db.from("verse_reactions").select("id, verse_id, anonymous_id, reaction_type, created_at"),
    db.from("comment_reactions").select("id, comment_id, anonymous_id, reaction_type, created_at")
  ]);
  if(!commentsRes.error){state.comments=commentsRes.data??[];state.commentCounts=countBy(state.comments,"verse_id")}else elements.message.textContent="comments 테이블/컬럼/정책을 확인해 주세요.";
  if(!verseReactionsRes.error){state.verseReactions=verseReactionsRes.data??[];state.myVerseReactions=new Set(state.verseReactions.filter((r)=>r.anonymous_id===anonymousId()).map((r)=>`${r.verse_id}:${r.reaction_type}`))}else elements.message.textContent="verse_reactions 테이블/정책을 확인해 주세요.";
  if(!commentReactionsRes.error){state.commentReactions=commentReactionsRes.data??[];state.myCommentReactions=new Set(state.commentReactions.filter((r)=>r.anonymous_id===anonymousId()).map((r)=>r.comment_id))}else elements.message.textContent="comment_reactions 테이블/정책을 확인해 주세요.";
  if(!commentsRes.error&&!verseReactionsRes.error&&!commentReactionsRes.error)elements.message.textContent="";
  renderAll();
}
function selectVerse(verseId){const verse=verses.find((v)=>v.id===verseId);if(!verse)return;state.selectedVerse=verse;renderAll();document.getElementById("commentPanel")?.scrollIntoView({behavior:"smooth",block:"nearest"})}
async function toggleVerseReaction(reactionType){
  const verseId=state.selectedVerse.id, anon=anonymousId(), key=`${verseId}:${reactionType}`;
  if(state.myVerseReactions.has(key)){elements.message.textContent="이미 이 감정을 남겼습니다.";return}
  const {data,error}=await db.from("verse_reactions").insert({verse_id:verseId,anonymous_id:anon,reaction_type:reactionType}).select("id, verse_id, anonymous_id, reaction_type, created_at").single();
  if(error){elements.message.textContent="감정 표현 저장에 실패했습니다. Supabase 정책을 확인해 주세요.";return}
  state.verseReactions.push(data);state.myVerseReactions.add(key);elements.message.textContent="";renderAll();
}
async function reactToComment(commentId){
  if(state.myCommentReactions.has(commentId)){elements.message.textContent="이미 이 묵상에 공감했습니다.";return}
  const {data,error}=await db.from("comment_reactions").insert({comment_id:commentId,anonymous_id:anonymousId(),reaction_type:"heart"}).select("id, comment_id, anonymous_id, reaction_type, created_at").single();
  if(error){elements.message.textContent="공감 저장에 실패했습니다. Supabase 정책을 확인해 주세요.";return}
  state.commentReactions.push(data);state.myCommentReactions.add(commentId);elements.message.textContent="";renderAll();
}
async function submitComment(event){
  event.preventDefault();
  const content=elements.commentInput.value.trim();if(!content)return;
  const button=elements.commentForm.querySelector("button[type='submit']");button.disabled=true;button.textContent="저장 중…";
  const {data,error}=await db.from("comments").insert({verse_id:state.selectedVerse.id,user_name:anonymousName(),anonymous_id:anonymousId(),mood:elements.moodSelect.value,content}).select("id, verse_id, user_name, content, created_at, anonymous_id, mood").single();
  button.disabled=false;button.textContent="등록";
  if(error){elements.message.textContent="묵상 저장에 실패했습니다. comments 컬럼과 INSERT 정책을 확인해 주세요.";return}
  state.comments.unshift(data);state.commentCounts=countBy(state.comments,"verse_id");elements.commentInput.value="";elements.message.textContent="";renderAll();
}
function setupEvents(){
  elements.commentForm.addEventListener("submit",submitComment);elements.moodSelect.addEventListener("change",renderRecommendations);
  document.querySelectorAll("[data-verse]").forEach((button)=>button.addEventListener("click",()=>selectVerse(button.dataset.verse)));
  document.querySelectorAll("[data-mood-jump]").forEach((button)=>button.addEventListener("click",()=>{elements.moodSelect.value=button.dataset.moodJump;renderRecommendations();document.getElementById("recommendPanel").scrollIntoView({behavior:"smooth",block:"nearest"})}));
  $("searchForm").addEventListener("submit",(event)=>{event.preventDefault();const q=$("searchInput").value.trim();if(!q)return;const n=q.replace(/[^0-9]/g,"");const match=verses.find((v)=>v.text.includes(q)||v.tags.some((tag)=>tag.includes(q))||String(v.number)===n);if(match)selectVerse(match.id);else elements.message.textContent=`“${q}”에 맞는 말씀을 현재 장에서 찾지 못했습니다.`});
  $("fontSizeSelect").addEventListener("change",(event)=>{const sizes={normal:"1.08rem",large:"1.22rem",xlarge:"1.38rem"};document.querySelectorAll(".verses").forEach((node)=>node.style.fontSize=sizes[event.target.value]??sizes.normal)});
  ["prevChapter","nextChapter"].forEach((id)=>$(id).addEventListener("click",()=>elements.message.textContent="다음 단계에서 성경 전체 장 데이터를 연결합니다."));
}
renderBible();setupEvents();loadData();
