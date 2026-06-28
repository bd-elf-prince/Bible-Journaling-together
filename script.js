const prompts = [
  "오늘 말씀에서 하나님은 어떤 성품을 보여주시나요?",
  "내가 오늘 순종으로 옮길 수 있는 작은 한 걸음은 무엇인가요?",
  "이 말씀은 내 마음의 어떤 두려움이나 걱정을 만지나요?",
  "감사로 기록하고 싶은 은혜 한 가지는 무엇인가요?",
  "누군가를 위해 기도하게 하는 구절이나 마음이 있나요?",
  "오늘 말씀을 한 문장 기도로 바꾼다면 어떻게 쓸 수 있을까요?"
];

const promptText = document.querySelector("#prompt-text");
const promptButton = document.querySelector("#prompt-button");
const year = document.querySelector("#year");
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector("#nav-links");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (promptButton && promptText) {
  promptButton.addEventListener("click", () => {
    const current = promptText.textContent;
    const nextPrompts = prompts.filter((prompt) => prompt !== current);
    const nextPrompt = nextPrompts[Math.floor(Math.random() * nextPrompts.length)];
    promptText.textContent = nextPrompt;
  });
}

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}
