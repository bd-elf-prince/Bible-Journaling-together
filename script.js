const supabaseUrl = "https://rayvvlerwxumqvmodvsy.supabase.co";
const supabaseKey = "sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ";
const db = supabase.createClient(supabaseUrl, supabaseKey);

const verses = [
  { id: "gen-1-1", number: 1, text: "태초에 하나님이 천지를 창조하시니라" },
  { id: "gen-1-2", number: 2, text: "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라" },
  { id: "gen-1-3", number: 3, text: "하나님이 이르시되 빛이 있으라 하시니 빛이 있었고" },
  { id: "gen-1-4", number: 4, text: "빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사" },
  { id: "gen-1-5", number: 5, text: "하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라" },
  { id: "gen-1-6", number: 6, text: "하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고" },
  { id: "gen-1-7", number: 7, text: "하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라" },
  { id: "gen-1-8", number: 8, text: "하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라" },
  { id: "gen-1-9", number: 9, text: "하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라" },
  { id: "gen-1-10", number: 10, text: "하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니 하나님이 보시기에 좋았더라" }
];

const state = {
  selectedVerse: null,
  commentCounts: new Map()
};

const elements = {
  leftVerses: document.getElementById("leftVerses"),
  rightVerses: document.getElementById("rightVerses"),
  dialog: document.getElementById("commentDialog"),
  dialogReference: document.getElementById("dialogReference"),
  dialogVerse: document.getElementById("dialogVerse"),
  commentList: document.getElementById("commentList"),
  commentTotal: document.getElementById("commentTotal"),
  commentForm: document.getElementById("commentForm"),
  commentInput: document.getElementById("commentInput"),
  message: document.getElementById("message")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function anonymousName() {
  let name = localStorage.getItem("bjt-anonymous-name");
  if (!name) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    name = `익명${suffix}`;
    localStorage.setItem("bjt-anonymous-name", name);
  }
  return name;
}

function renderVerse(verse) {
  const count = state.commentCounts.get(verse.id) ?? 0;
  const selectedClass = state.selectedVerse?.id === verse.id ? " is-selected" : "";
  return `
    <button class="verse-row${selectedClass}" type="button" data-verse-id="${verse.id}">
      <span class="verse-number">${verse.number}</span>
      <span class="verse-text">${escapeHtml(verse.text)}</span>
      <span class="comment-count${count ? " has-comments" : ""}" aria-label="댓글 ${count}개">${count}</span>
    </button>`;
}

function renderBible() {
  elements.leftVerses.innerHTML = verses.slice(0, 5).map(renderVerse).join("");
  elements.rightVerses.innerHTML = verses.slice(5).map(renderVerse).join("");
  document.querySelectorAll("[data-verse-id]").forEach(button => {
    button.addEventListener("click", () => openVerse(button.dataset.verseId));
  });
}

async function loadCommentCounts() {
  const { data, error } = await db.from("comments").select("verse_id");
  if (error) {
    elements.message.textContent = "댓글 저장소 연결을 확인하고 있습니다.";
    return;
  }
  state.commentCounts.clear();
  for (const row of data ?? []) {
    state.commentCounts.set(row.verse_id, (state.commentCounts.get(row.verse_id) ?? 0) + 1);
  }
  elements.message.textContent = "";
  renderBible();
}

async function openVerse(verseId) {
  const verse = verses.find(item => item.id === verseId);
  if (!verse) return;
  state.selectedVerse = verse;
  renderBible();
  elements.dialogReference.textContent = `창세기 1장 ${verse.number}절`;
  elements.dialogVerse.textContent = verse.text;
  elements.commentInput.value = "";
  if (!elements.dialog.open) elements.dialog.showModal();
  await loadComments();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function loadComments() {
  if (!state.selectedVerse) return;
  elements.commentList.innerHTML = '<p class="comment-empty">묵상을 불러오는 중입니다…</p>';

  const { data, error } = await db
    .from("comments")
    .select("id, verse_id, user_name, content, created_at")
    .eq("verse_id", state.selectedVerse.id)
    .order("created_at", { ascending: false });

  if (error) {
    elements.commentTotal.textContent = "0";
    elements.commentList.innerHTML = '<p class="comment-empty">댓글 테이블 또는 공개 읽기 정책이 아직 설정되지 않았습니다.</p>';
    return;
  }

  elements.commentTotal.textContent = String(data?.length ?? 0);
  elements.commentList.innerHTML = data?.length
    ? data.map(comment => `
      <article class="comment-item">
        <div class="comment-meta">
          <span class="comment-author">${escapeHtml(comment.user_name || "익명")}</span>
          <time>${escapeHtml(formatDate(comment.created_at))}</time>
        </div>
        <p class="comment-body">${escapeHtml(comment.content)}</p>
      </article>`).join("")
    : '<p class="comment-empty">아직 남겨진 묵상이 없습니다. 이 말씀 앞에 머문 첫 마음을 남겨주세요.</p>';
}

async function submitComment(event) {
  event.preventDefault();
  if (!state.selectedVerse) return;
  const content = elements.commentInput.value.trim();
  if (!content) return;

  const submitButton = elements.commentForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "저장 중…";

  const { error } = await db.from("comments").insert({
    verse_id: state.selectedVerse.id,
    user_name: anonymousName(),
    content
  });

  submitButton.disabled = false;
  submitButton.textContent = "묵상 남기기";

  if (error) {
    alert("댓글을 저장하지 못했습니다. Supabase의 comments 테이블과 INSERT 정책을 확인해 주세요.");
    return;
  }

  elements.commentInput.value = "";
  state.commentCounts.set(state.selectedVerse.id, (state.commentCounts.get(state.selectedVerse.id) ?? 0) + 1);
  renderBible();
  await loadComments();
}

function setupEvents() {
  document.getElementById("closeDialog").addEventListener("click", () => elements.dialog.close());
  elements.dialog.addEventListener("click", event => {
    if (event.target === elements.dialog) elements.dialog.close();
  });
  elements.commentForm.addEventListener("submit", submitComment);

  document.querySelectorAll("[data-verse]").forEach(button => {
    button.addEventListener("click", () => openVerse(button.dataset.verse));
  });

  document.getElementById("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;
    const match = verses.find(verse => verse.text.includes(query) || String(verse.number) === query.replace(/[^0-9]/g, ""));
    if (match) openVerse(match.id);
    else elements.message.textContent = `“${query}”에 해당하는 구절을 현재 장에서 찾지 못했습니다.`;
  });

  document.getElementById("fontSizeSelect").addEventListener("change", event => {
    const sizes = { normal: "1.08rem", large: "1.22rem", xlarge: "1.38rem" };
    document.querySelectorAll(".verses").forEach(node => { node.style.fontSize = sizes[event.target.value]; });
  });

  ["prevChapter", "nextChapter"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => {
      elements.message.textContent = "다음 단계에서 성경 전체 장 데이터를 연결합니다.";
    });
  });
}

renderBible();
setupEvents();
loadCommentCounts();
