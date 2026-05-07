let searchInput;
let filterButtons;
let workCards;
let noteItems;
let contentSections;
let navLinks;

const themeToggle = document.querySelector("#themeToggle");
const fontToggle = document.querySelector("#fontToggle");
const aboutHeader = document.querySelector(".article-header");
const aboutHero = document.querySelector(".hero-band");
const workGrid = document.querySelector(".work-grid");
const noteList = document.querySelector(".note-list");

let activeView = "about";

function normalize(value) {
  return value.trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function searchableText(element) {
  return `${element.textContent} ${element.dataset.search || ""}`.toLowerCase();
}

function cacheElements() {
  searchInput = document.querySelector("#searchInput");
  filterButtons = document.querySelectorAll(".filter-button");
  workCards = document.querySelectorAll(".work-card");
  noteItems = document.querySelectorAll(".note-item");
  contentSections = document.querySelectorAll(".section-block");
  navLinks = document.querySelectorAll(".side-nav a, .toc-list a");
}

function renderWorks(works) {
  if (!workGrid || !Array.isArray(works)) return;

  const covers = ["cover-one", "cover-two", "cover-three"];
  workGrid.innerHTML = works
    .map((work, index) => {
      const category = work.category || "web";
      const cover = covers[index % covers.length];

      return `
        <article class="work-card" data-category="${escapeHtml(category)}" data-search="${escapeHtml(work.keywords || "")}">
          <div class="work-cover ${cover}">
            <span></span><span></span><span></span>
          </div>
          <div class="work-body">
            <p>${escapeHtml(work.type || category)}</p>
            <h3>${escapeHtml(work.title)}</h3>
            <p>${escapeHtml(work.description)}</p>
            ${work.url ? `<a class="text-link" href="${escapeHtml(work.url)}" target="_blank" rel="noreferrer">查看作品</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderNotes(notes) {
  if (!noteList || !Array.isArray(notes)) return;

  noteList.innerHTML = notes
    .map((note) => {
      const date = note.date || "";
      const shortDate = date.slice(5).replace("-", ".") || "New";

      return `
        <article class="note-item" data-search="${escapeHtml(note.keywords || "")}">
          <time datetime="${escapeHtml(date)}">${escapeHtml(shortDate)}</time>
          <div>
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadContent() {
  try {
    const response = await fetch("data/content.json", { cache: "no-store" });
    if (!response.ok) return;

    const content = await response.json();
    renderWorks(content.works);
    renderNotes(content.notes);
  } catch {
    // Opening the file directly can block fetch in some browsers; the static HTML still has fallback content.
  }
}

function setActiveLinks(viewId) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${viewId}`);
  });
}

function resetNestedFilters() {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  [...workCards, ...noteItems].forEach((item) => {
    item.classList.remove("is-hidden");
  });
}

function showView(viewId) {
  activeView = viewId;

  if (searchInput) {
    searchInput.value = "";
  }

  resetNestedFilters();
  setActiveLinks(viewId);

  const isAbout = viewId === "about";
  aboutHeader.hidden = !isAbout;
  aboutHero.hidden = !isAbout;

  contentSections.forEach((section) => {
    section.classList.toggle("is-hidden", section.id !== viewId);
  });

  document.querySelector("#main")?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function applySearch() {
  const query = normalize(searchInput?.value || "");

  if (!query) {
    showView(activeView);
    return;
  }

  aboutHeader.hidden = true;
  aboutHero.hidden = true;
  setActiveLinks("");

  [...workCards, ...noteItems].forEach((item) => {
    item.classList.toggle("is-hidden", !searchableText(item).includes(query));
  });

  contentSections.forEach((section) => {
    const directMatch = searchableText(section).includes(query);
    const hasVisibleChild = section.querySelector(".work-card:not(.is-hidden), .note-item:not(.is-hidden)");
    section.classList.toggle("is-hidden", !directMatch && !hasVisibleChild);
  });
}

function bindNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;

      const targetId = href.replace("#", "");
      if (!targetId) return;

      event.preventDefault();
      showView(targetId);
      history.replaceState(null, "", `#${targetId}`);
    });
  });
}

function bindFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      workCards.forEach((card) => {
        const shouldShow = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !shouldShow);
      });

      if (searchInput) {
        searchInput.value = "";
      }
    });
  });
}

function bindInteractions() {
  cacheElements();
  bindNavigation();
  bindFilters();
  searchInput?.addEventListener("input", applySearch);
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

fontToggle?.addEventListener("click", () => {
  document.body.classList.toggle("soft-font");
});

async function init() {
  await loadContent();
  bindInteractions();

  const initialView = location.hash.replace("#", "") || "about";
  const knownView = initialView === "about" || document.getElementById(initialView);
  showView(knownView ? initialView : "about");
}

init();
