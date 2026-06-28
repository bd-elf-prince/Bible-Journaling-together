const bibleData = [
  {
    book: "창세기",
    aliases: ["창", "genesis", "gen"],
    chapters: {
      1: [
        "태초에 하나님이 천지를 창조하시니라",
        "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라",
        "하나님이 이르시되 빛이 있으라 하시니 빛이 있었고",
        "빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사"
      ]
    }
  },
  {
    book: "시편",
    aliases: ["시", "psalm", "psalms", "ps"],
    chapters: {
      23: [
        "여호와는 나의 목자시니 내게 부족함이 없으리로다",
        "그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다",
        "내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다",
        "내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라"
      ]
    }
  },
  {
    book: "요한복음",
    aliases: ["요", "요한", "john", "jn"],
    chapters: {
      3: [
        "그런데 바리새인 중에 니고데모라 하는 사람이 있으니 유대인의 지도자라",
        "그가 밤에 예수께 와서 이르되 랍비여 우리가 당신은 하나님께로부터 오신 선생인 줄 아나이다",
        "예수께서 대답하여 이르시되 진실로 진실로 네게 이르노니 사람이 거듭나지 아니하면 하나님의 나라를 볼 수 없느니라",
        "니고데모가 이르되 사람이 늙으면 어떻게 날 수 있사옵나이까",
        "예수께서 대답하시되 진실로 진실로 네게 이르노니 사람이 물과 성령으로 나지 아니하면 하나님의 나라에 들어갈 수 없느니라",
        "육으로 난 것은 육이요 영으로 난 것은 영이니",
        "내가 네게 거듭나야 하겠다 하는 말을 놀랍게 여기지 말라",
        "바람이 임의로 불매 네가 그 소리는 들어도 어디서 와서 어디로 가는지 알지 못하나니 성령으로 난 사람도 다 그러하니라",
        "니고데모가 대답하여 이르되 어찌 그러한 일이 있을 수 있나이까",
        "예수께서 그에게 대답하여 이르시되 너는 이스라엘의 선생으로서 이러한 것들을 알지 못하느냐",
        "진실로 진실로 네게 이르노니 우리는 아는 것을 말하고 본 것을 증언하노라 그러나 너희가 우리의 증언을 받지 아니하는도다",
        "내가 땅의 일을 말하여도 너희가 믿지 아니하거든 하물며 하늘의 일을 말하면 어떻게 믿겠느냐",
        "하늘에서 내려온 자 곧 인자 외에는 하늘에 올라간 자가 없느니라",
        "모세가 광야에서 뱀을 든 것 같이 인자도 들려야 하리니",
        "이는 그를 믿는 자마다 영생을 얻게 하려 하심이니라",
        "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라",
        "하나님이 그 아들을 세상에 보내신 것은 세상을 심판하려 하심이 아니요 그로 말미암아 세상이 구원을 받게 하려 하심이라"
      ]
    }
  },
  {
    book: "로마서",
    aliases: ["롬", "romans", "rom"],
    chapters: {
      8: [
        "그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니",
        "이는 그리스도 예수 안에 있는 생명의 성령의 법이 죄와 사망의 법에서 너를 해방하였음이라",
        "율법이 육신으로 말미암아 연약하여 할 수 없는 그것을 하나님은 하시나니",
        "육신을 따르지 않고 그 영을 따라 행하는 우리에게 율법의 요구가 이루어지게 하려 하심이니라",
        "육신을 따르는 자는 육신의 일을 영을 따르는 자는 영의 일을 생각하나니",
        "육신의 생각은 사망이요 영의 생각은 생명과 평안이니라",
        "육신의 생각은 하나님과 원수가 되나니 이는 하나님의 법에 굴복하지 아니할 뿐 아니라 할 수도 없음이라",
        "육신에 있는 자들은 하나님을 기쁘시게 할 수 없느니라",
        "만일 너희 속에 하나님의 영이 거하시면 너희가 육신에 있지 아니하고 영에 있나니",
        "또 그리스도께서 너희 안에 계시면 몸은 죄로 말미암아 죽은 것이나 영은 의로 말미암아 살아 있는 것이니라",
        "예수를 죽은 자 가운데서 살리신 이의 영이 너희 안에 거하시면 너희 죽을 몸도 살리시리라",
        "그러므로 형제들아 우리가 빚진 자로되 육신에게 져서 육신대로 살 것이 아니니라",
        "너희가 육신대로 살면 반드시 죽을 것이로되 영으로써 몸의 행실을 죽이면 살리니",
        "무릇 하나님의 영으로 인도함을 받는 사람은 곧 하나님의 아들이라",
        "너희는 다시 무서워하는 종의 영을 받지 아니하고 양자의 영을 받았으므로",
        "성령이 친히 우리의 영과 더불어 우리가 하나님의 자녀인 것을 증언하시나니",
        "자녀이면 또한 상속자 곧 하나님의 상속자요 그리스도와 함께 한 상속자니",
        "생각하건대 현재의 고난은 장차 우리에게 나타날 영광과 비교할 수 없도다",
        "피조물이 고대하는 바는 하나님의 아들들이 나타나는 것이니",
        "피조물이 허무한 데 굴복하는 것은 자기 뜻이 아니요 오직 굴복하게 하시는 이로 말미암음이라",
        "그 바라는 것은 피조물도 썩어짐의 종 노릇 한 데서 해방되어 하나님의 자녀들의 영광의 자유에 이르는 것이니라",
        "피조물이 다 이제까지 함께 탄식하며 함께 고통을 겪고 있는 것을 우리가 아느니라",
        "그뿐 아니라 또한 우리 곧 성령의 처음 익은 열매를 받은 우리까지도 속으로 탄식하여 양자 될 것 곧 우리 몸의 속량을 기다리느니라",
        "우리가 소망으로 구원을 얻었으매 보이는 소망이 소망이 아니니 보는 것을 누가 바라리요",
        "만일 우리가 보지 못하는 것을 바라면 참음으로 기다릴지니라",
        "이와 같이 성령도 우리의 연약함을 도우시나니 우리는 마땅히 기도할 바를 알지 못하나",
        "마음을 살피시는 이가 성령의 생각을 아시나니 이는 성령이 하나님의 뜻대로 성도를 위하여 간구하심이니라",
        "우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라"
      ]
    }
  }
];

const STORAGE_KEY = "bjt-reflections-v1";
let state = { bookIndex: 0, chapter: 1, verse: 1, selectedKey: null };

const $ = (selector) => document.querySelector(selector);
const bookSelect = $("#book-select");
const chapterSelect = $("#chapter-select");
const verseSelect = $("#verse-select");
const leftPage = $("#left-page-content");
const rightPage = $("#right-page-content");
const currentBook = $("#current-book");
const currentTitle = $("#current-title");
const message = $("#message");
const dialog = $("#comment-dialog");
const dialogReference = $("#dialog-reference");
const dialogVerse = $("#dialog-verse");
const dialogCount = $("#dialog-count");
const commentList = $("#comment-list");
const commentForm = $("#comment-form");
const commentAuthor = $("#comment-author");
const commentBody = $("#comment-body");

function loadComments() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveComments(comments) { localStorage.setItem(STORAGE_KEY, JSON.stringify(comments)); }
function getCurrentBook() { return bibleData[state.bookIndex]; }
function getVerses() { return getCurrentBook().chapters[state.chapter] || []; }
function makeKey(book = getCurrentBook().book, chapter = state.chapter, verse = state.verse) { return `${book} ${chapter}:${verse}`; }
function getCommentCount(key) { return (loadComments()[key] || []).length; }
function setMessage(text) { message.textContent = text; if (text) setTimeout(() => { if (message.textContent === text) message.textContent = ""; }, 2600); }

function populateBooks() { bookSelect.innerHTML = bibleData.map((book, index) => `<option value="${index}">${book.book}</option>`).join(""); }
function populateChapters() {
  const chapters = Object.keys(getCurrentBook().chapters).map(Number).sort((a, b) => a - b);
  chapterSelect.innerHTML = chapters.map((chapter) => `<option value="${chapter}">${chapter}장</option>`).join("");
  if (!chapters.includes(state.chapter)) state.chapter = chapters[0];
  chapterSelect.value = state.chapter;
}
function populateVerses() {
  const verses = getVerses();
  verseSelect.innerHTML = verses.map((_, index) => `<option value="${index + 1}">${index + 1}절</option>`).join("");
  if (state.verse > verses.length) state.verse = 1;
  verseSelect.value = state.verse;
}

function render() {
  const book = getCurrentBook();
  const verses = getVerses();
  bookSelect.value = state.bookIndex;
  chapterSelect.value = state.chapter;
  verseSelect.value = state.verse;
  currentBook.textContent = book.book;
  currentTitle.textContent = `${book.book} ${state.chapter}장`;
  const midpoint = Math.ceil(verses.length / 2);
  leftPage.innerHTML = verses.slice(0, midpoint).map((text, index) => renderVerse(text, index + 1)).join("");
  rightPage.innerHTML = verses.slice(midpoint).map((text, index) => renderVerse(text, midpoint + index + 1)).join("");
}

function renderVerse(text, verse) {
  const key = makeKey(getCurrentBook().book, state.chapter, verse);
  const count = getCommentCount(key);
  const selected = key === state.selectedKey ? " is-selected" : "";
  const countClass = count > 0 ? "comment-count has-comments" : "comment-count";
  return `<button class="verse-row${selected}" type="button" data-verse="${verse}" aria-label="${key} 묵상 열기, 코멘트 ${count}개"><span class="verse-number">${verse}</span><span class="verse-text">${text}</span><span class="${countClass}">${count}</span></button>`;
}

function findBook(queryBook) {
  const normalized = queryBook.toLowerCase().replace(/\s/g, "");
  return bibleData.findIndex((book) => {
    const names = [book.book, ...book.aliases].map((name) => name.toLowerCase().replace(/\s/g, ""));
    return names.includes(normalized) || names.some((name) => normalized.startsWith(name));
  });
}
function parseReference(raw) {
  const value = raw.trim().replace(/장/g, ":").replace(/절/g, "").replace(/편/g, "").replace(/：/g, ":");
  const match = value.match(/^(.+?)\s*(\d+)(?::\s*(\d+))?$/);
  if (!match) return null;
  const bookIndex = findBook(match[1].trim());
  if (bookIndex < 0) return null;
  return { bookIndex, chapter: Number(match[2]), verse: Number(match[3] || 1) };
}
function goToReference(raw) {
  const parsed = parseReference(raw);
  if (!parsed) return setMessage("구절을 찾지 못했습니다. 예: 요한복음 3:16");
  const book = bibleData[parsed.bookIndex];
  if (!book.chapters[parsed.chapter]) return setMessage("아직 이 장의 본문 데이터가 없습니다.");
  const verses = book.chapters[parsed.chapter];
  if (parsed.verse < 1 || parsed.verse > verses.length) return setMessage("해당 절을 찾지 못했습니다.");
  state = { ...state, ...parsed, selectedKey: makeKey(book.book, parsed.chapter, parsed.verse) };
  populateChapters(); populateVerses(); render();
  setMessage(`${book.book} ${parsed.chapter}:${parsed.verse}을 펼쳤습니다.`);
  setTimeout(() => openCommentDialog(parsed.verse), 120);
}
function moveChapter(direction) {
  const chapters = Object.keys(getCurrentBook().chapters).map(Number).sort((a, b) => a - b);
  const nextChapter = chapters[chapters.indexOf(state.chapter) + direction];
  if (!nextChapter) return setMessage(direction > 0 ? "다음 장 데이터가 아직 없습니다." : "이전 장 데이터가 아직 없습니다.");
  state.chapter = nextChapter; state.verse = 1; state.selectedKey = null;
  populateVerses(); render();
}
function openCommentDialog(verse) {
  state.verse = verse; state.selectedKey = makeKey(); verseSelect.value = verse; render();
  dialogReference.textContent = state.selectedKey;
  dialogVerse.textContent = getVerses()[verse - 1];
  commentBody.value = "";
  renderComments();
  dialog.showModal();
  setTimeout(() => commentBody.focus(), 80);
}
function renderComments() {
  const comments = loadComments()[state.selectedKey] || [];
  dialogCount.textContent = `${comments.length}개`;
  if (!comments.length) {
    commentList.innerHTML = `<p class="comment-empty">아직 이 절에 남겨진 묵상이 없습니다. 첫 기록을 조용히 남겨보세요.</p>`;
    return;
  }
  commentList.innerHTML = comments.map((comment) => `<article class="comment-item"><div class="comment-meta"><span class="comment-author">${escapeHTML(comment.author || "익명 묵상자")}</span><time>${comment.createdAt}</time></div><p class="comment-body">${escapeHTML(comment.body)}</p></article>`).join("");
}
function escapeHTML(value) { return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char])); }

bookSelect.addEventListener("change", () => { state.bookIndex = Number(bookSelect.value); state.chapter = Number(Object.keys(getCurrentBook().chapters)[0]); state.verse = 1; state.selectedKey = null; populateChapters(); populateVerses(); render(); });
chapterSelect.addEventListener("change", () => { state.chapter = Number(chapterSelect.value); state.verse = 1; state.selectedKey = null; populateVerses(); render(); });
verseSelect.addEventListener("change", () => openCommentDialog(Number(verseSelect.value)));
$("#search-form").addEventListener("submit", (event) => { event.preventDefault(); goToReference($("#passage-search").value); });
$("#prev-button").addEventListener("click", () => moveChapter(-1));
$("#next-button").addEventListener("click", () => moveChapter(1));
$("#page-left").addEventListener("click", () => moveChapter(-1));
$("#page-right").addEventListener("click", () => moveChapter(1));
$("#dialog-close").addEventListener("click", () => dialog.close());

document.addEventListener("click", (event) => {
  const verseButton = event.target.closest(".verse-row");
  if (verseButton) openCommentDialog(Number(verseButton.dataset.verse));
  const quick = event.target.closest("[data-ref]");
  if (quick) goToReference(quick.dataset.ref);
});
commentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const body = commentBody.value.trim();
  if (!body) return;
  const comments = loadComments();
  const item = {
    author: commentAuthor.value.trim() || "익명 묵상자",
    body,
    createdAt: new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date())
  };
  comments[state.selectedKey] = [...(comments[state.selectedKey] || []), item];
  saveComments(comments);
  commentBody.value = "";
  renderComments(); render();
});

populateBooks(); populateChapters(); populateVerses(); render();
