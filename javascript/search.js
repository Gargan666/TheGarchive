(() => {
const input = document.getElementById("search");
const btn = document.getElementById("searchBtn");
const results = document.getElementById("results");

if (!input || !btn || !results) {
console.error("Missing #search, #searchBtn, or #results in the HTML.");
return;
}
let pages = [];
  // Load content
(async function loadPages() {
  try {
    // --- Load markdown-driven entries ---
    const res1 = await fetch("content/index.json", { cache: "no-store" });
    if (!res1.ok) throw new Error(`HTTP ${res1.status}`);
    const mdData = await res1.json();

    const baseEntryPath = "./entry.html";

    const mdPages = mdData.map(item => ({
      name: item.title,
      url: `${baseEntryPath}?slug=${encodeURIComponent(item.slug)}`,
      slug: item.slug,
      summary: item.summary || "",
    }));

    // --- Load standalone static HTML pages ---
    const res2 = await fetch("content/static_index.json", { cache: "no-store" });
    if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
    const staticData = await res2.json();

    const staticPages = staticData.map(item => ({
      name: item.title,
      url: item.url, // Direct link to HTML file
      slug: null, // No slug needed for static pages
      summary: item.summary || "",
    }));

    // --- Merge them into one search list ---
    pages = [...staticPages, ...mdPages];

    results.innerHTML = "";
  } catch (err) {
    console.warn("Failed to load pages:", err);
    renderMessage(
      "Could not load pages list. Make sure you run the site from a local web server."
    );
  }
})();

  // --- Event listeners ---
input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const filtered = !q
      ? pages
      : pages.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q)
        );
    render(filtered);
});
input.addEventListener("focus", () => {
    if (!input.value) render(pages);
});
input.addEventListener("blur", (e) => {
  setTimeout(() => {
    if (!results.contains(document.activeElement)) {
      results.innerHTML = "";
    }
  }, 0);
});
btn.addEventListener("click", () => {
    const q = input.value.trim().toLowerCase();
    const match = pages.find(p =>
      p.name.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)
    );
    if (match) {
      // Save slug to sessionStorage
      sessionStorage.setItem("currentSlug", match.slug);
      console.log("Saved slug on button click:", match.slug);

      window.location.href = match.url;
    }
});
// --- Rendering ---
function render(list) {
    results.innerHTML = "";
    if (!list || list.length === 0) {
      renderMessage("No matches.");
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(p => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = p.url;
      a.textContent = p.name;

      // Save slug on click
      a.addEventListener("click", e => {
        sessionStorage.setItem("currentSlug", p.slug);
        console.log("Saved slug on link click:", p.slug);
      });

      li.appendChild(a);
      frag.appendChild(li);
    });
    results.appendChild(frag);
}
function renderMessage(text) {
    results.innerHTML = "";
    const li = document.createElement("li");
    li.textContent = text;
    results.appendChild(li);
}
})();