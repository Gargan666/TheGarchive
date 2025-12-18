function initSearchUI() {
  const input = document.getElementById("search");
  const btn = document.getElementById("searchBtn");
  const container = document.getElementById("search-container");
  const wrapper = document.getElementById("results-wrapper");

  if (!input || !btn || !wrapper) {
    console.error("Missing #search, #searchBtn, or #results-wrapper in the HTML.");
    return;
  }

  let results = null; // Will hold the dynamically created <ul>

  // --- Initial load
  window.SearchEngine.loadPages();

  // --- Events
  input.addEventListener("input", () => {
  SearchEngine.search(input.value, renderResults);
  });

  input.addEventListener("focus", () => {
  if (!input.value) renderResults(SearchEngine.getAllPages());
  });

  let isResizing = false;
  container.addEventListener("mousedown", (e) => {
  const style = window.getComputedStyle(container);
  if (style.resize == "none") {
    const tolerance = 17; // px from edge
    const nearRight = e.offsetX > wrapper.clientWidth - tolerance;
    const nearBottom = e.offsetY > wrapper.clientHeight - tolerance;

    if (nearRight && nearBottom) {
      isResizing = true;
      return; // allow blur
    }
  }

  // prevent blur for normal clicks
  if (e.target !== input) e.preventDefault();
  });

  document.addEventListener("mouseup", () => {
  isResizing = false;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const firstLink = results?.querySelector("li a");
      if (firstLink) firstLink.click();
    }
  });

  input.addEventListener("blur", () => {
    removeResults();
    wrapper.removeAttribute("style");
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const firstLink = results?.querySelector("li a");
    if (firstLink) firstLink.click();
  });

  wrapper.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName === "A") {
      e.preventDefault();
      const page = SearchEngine.findPageByHref(target.getAttribute("href"));
      navigateTo(page);
    }
  });

  // --- Rendering
  function renderResults(list, message = null) {
  if (!results) {
    results = document.createElement("ul");
    results.id = "results";
    wrapper.appendChild(results);
  }

  results.innerHTML = "";

  if (message) {
    const msg = document.createElement("p");
    msg.textContent = message;
    results.appendChild(msg);
    return;
  }

  // --- Group pages by type
  const grouped = {};
  list.forEach((p) => {
    const type = p.type || "unknown";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(p);
  });

  // --- Define your custom labels
  const labels = {
    entry: "Entries",
    static: "Information",
    category: "Categories",
    unknown: "Other Pages"
  };

  const frag = document.createDocumentFragment();

  Object.keys(grouped).forEach((type, index) => {
    // Create a <p> label between groups
    const label = document.createElement("p");
    label.textContent = labels[type] || type;
    label.classList.add("result-label");
    frag.appendChild(label);

    // Add each result under this group
    grouped[type].forEach((p) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.classList.add('nogrowlink')
      a.href = p.url;
      a.textContent = p.name;
      li.appendChild(a);
      frag.appendChild(li);
    });

    // add a little spacing between groups
    if (index < Object.keys(grouped).length - 1) {
      const spacer = document.createElement("div");
      spacer.classList.add("result-space");
      frag.appendChild(spacer);
    }
  });

  results.appendChild(frag);
  }

  function removeResults() {
    if (results) {
      wrapper.removeChild(results);
      results = null;
    }
  }

  function navigateTo(page) {
    if (!page) return;
    input.value = "";
    removeResults();

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

    window.location.href = page.url;
  }
}