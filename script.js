const supabaseUrl = "https://rayvvlerwxumqvmodvsy.supabase.co";
const supabaseKey = "sb_publishable_k6jRijBWjC4hcEO--pEHEg_zYI7KGUZ";

const client = supabase.createClient(supabaseUrl, supabaseKey);

let selectedVerse = null;

// 절 선택
async function selectVerse(verse) {
  selectedVerse = verse;
  document.getElementById("selectedVerse").innerText = "선택된 절: " + verse;
  loadComments();
}

// 댓글 불러오기
async function loadComments() {
  if (!selectedVerse) return;

  const { data } = await client
    .from("comments")
    .select("*")
    .eq("verse_id", selectedVerse)
    .order("created_at", { ascending: false });

  const box = document.getElementById("commentList");
  box.innerHTML = "";

  data.forEach(c => {
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <b>${c.user_name}</b><br/>
      ${c.content}
    `;
    box.appendChild(div);
  });
}

// 댓글 추가
async function addComment() {
  const input = document.getElementById("commentInput");

  if (!selectedVerse) {
    alert("절을 먼저 선택하세요");
    return;
  }

  const name = "익명" + Math.floor(Math.random() * 9999);

  await client.from("comments").insert([
    {
      verse_id: selectedVerse,
      user_name: name,
      content: input.value
    }
  ]);

  input.value = "";
  loadComments();
}
