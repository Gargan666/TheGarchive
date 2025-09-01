// search.js
(() => {
  // Adjust this if files.json lives somewhere else (e.g. "../files.json")
  const FILES_JSON_URL = "subpages/files.json";

  // Grab elements and bail fast if missing
  const input = document.getElementById("search");
  const btn = document.getElementById("searchBtn");
  const results = document.getElementById("results");

  if (!input || !btn || !results) {
    console.error("Missing #search, #searchBtn, or #results in the HTML.");
    return;
  }

  const state = {
    pages: [],
  };

  // Load pages.json (with graceful fallback + helpful error)
  (async function loadPages() {
    try {
      const res = await fetch(FILES_JSON_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("files.json must be an array");

      state.pages = data
        .filter(p => p && p.name && p.url)
        .map(p => ({ name: String(p.name), url: String(p.url) }));

      // Show full list initially
      render(state.pages);
    } catch (err) {
      console.warn("Failed to load files.json via fetch:", err);

      // Optional fallback: if you set window.PAGES in a separate script, we’ll use it.
      if (Array.isArray(window.PAGES)) {
        state.pages = window.PAGES;
        render(state.pages);
      } else {
        renderMessage(
          "Could not load pages list. Check the files.json path and run this site from a local web server (opening the HTML file directly blocks fetch)."
        );
      }
    }
  })();

  // --- Events ---
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const filtered = !q
      ? state.pages
      : state.pages.filter(p =>
          p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
        );
    render(filtered);
  });

  input.addEventListener("focus", () => {
    if (!input.value) render(state.pages); // show all on focus if empty
  });

  btn.addEventListener("click", () => {
    const q = input.value.trim().toLowerCase();
    const match = state.pages.find(p =>
      p.name.toLowerCase().includes(q) || p.url.toLowerCase().includes(q)
    );
    if (match) window.location.href = match.url;
  });

  // --- Rendering helpers ---
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
    const li = document.createElement("li");
    li.textContent = text;
    results.appendChild(li);
  }
})();
