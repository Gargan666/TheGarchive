async function initSearch() {
  const input = document.getElementById("search");
  const btn = document.getElementById("searchBtn");
  const results = document.getElementById("results");
  const container = document.getElementById("search-container");

  if (!input || !btn || !results) {
    console.error("Missing #search, #searchBtn, or #results in the HTML.");
    return;
  }

  let pages = [];

  // --- Load content
(async function loadPages() {
    try {
      // --- Load markdown-driven entries ---
      const res1 = await fetch("content/index.json", { cache: "no-store" });
      if (!res1.ok) throw new Error(`HTTP ${res1.status}`);
      const mdData = await res1.json();

      const baseEntryPath = "./entry.html";

      const mdPages = mdData.map(item => ({
        type: "entry",
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
        type: "static",
        name: item.title,
        url: item.url,
        slug: null,
        summary: item.summary || "",
      }));

      // --- Load categories ---
      const res3 = await fetch("content/categories.json", { cache: "no-store" });
      if (!res3.ok) throw new Error(`HTTP ${res3.status}`);
      const catData = await res3.json();

      const CatBaseEntryPath = "./category.html";

      const catPages = catData.map(item => ({
        type: "category",
        name: item.name,
        url: `${CatBaseEntryPath}?category=${encodeURIComponent(item.slug)}`,
        slug: item.slug,
        summary: item.description || "",
      }));

      // --- Merge them into one search list ---
      pages = [...staticPages, ...catPages, ...mdPages];

      results.innerHTML = "";
    } catch (err) {
      console.warn("Failed to load pages:", err);
      renderMessage(
        "Could not load pages list. Make sure you run the site from a local web server."
      );
    }
})();

  // --- Navigation logic
function navigateToPage(page) {
  // Clear before leaving
  input.value = "";
  results.innerHTML = "";

  // Save type-specific session storage
  if (page.type === "entry" && page.slug) {
    sessionStorage.setItem("currentSlug", page.slug);
    sessionStorage.removeItem("currentCategory");
  } else if (page.type === "category" && page.slug) {
    sessionStorage.setItem("currentCategory", page.slug);
    sessionStorage.removeItem("currentSlug");
  } else {
    sessionStorage.removeItem("currentSlug");
    sessionStorage.removeItem("currentCategory");
  }

  // Navigate
  window.location.href = page.url;
}

  // --- Event listeners ---
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const filtered = !q
      ? pages
      : pages.filter(p => {
          const name = (p.name || "").toLowerCase();

          return terms.every(term =>
            name.includes(term)
          );
        });

    render(filtered);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const firstLink = results.querySelector("li a");
      if (firstLink) {
        const page = pages.find(p => p.name === firstLink.textContent);
        navigateToPage(page);
      }
    }
  });

  input.addEventListener("focus", () => {
    if (!input.value) render(pages);
  });

  input.addEventListener("blur", (e) => {
    e.preventDefault();
    setTimeout(() => {
      if (!container.contains(document.activeElement)) {
        results.innerHTML = "";
      }
    }, 0);
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const firstLink = results.querySelector("li a");
    if (firstLink) {
      const page = pages.find(p => p.name === firstLink.textContent);
      navigateToPage(page);
    }
  });

  results.addEventListener("click", e => {
    const target = e.target;
    if (target.tagName === "A") {
      e.preventDefault();
      const page = pages.find(p => p.url === target.getAttribute("href"));
      navigateToPage(page);
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

      li.appendChild(a);
      frag.appendChild(li);
    });
    results.appendChild(frag);
  }

  function renderMessage(text) {
    results.innerHTML = "";
    const li = document.createElement("p");
    li.textContent = text;
    results.appendChild(li);
  }
};