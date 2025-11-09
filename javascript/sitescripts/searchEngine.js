// javascript/searchEngine.js
window.SearchEngine = (function () {
  let pages = [];

  async function loadPages(onRender) {
    try {
      const [mdRes, staticRes, catRes] = await Promise.all([
        fetch("content/index.json", { cache: "no-store" }),
        fetch("content/static_index.json", { cache: "no-store" }),
        fetch("content/categories.json", { cache: "no-store" }),
      ]);

      const [mdData, staticData, catData] = await Promise.all([
        mdRes.json(),
        staticRes.json(),
        catRes.json(),
      ]);

      const mdPages = mdData.map(item => ({
        type: "entry",
        name: item.title,
        url: `./entry.html?slug=${encodeURIComponent(item.slug)}`,
        slug: item.slug,
        summary: item.summary || "",
      }));

      const staticPages = staticData.map(item => ({
        type: "static",
        name: item.title,
        url: item.url,
        summary: item.summary || "",
      }));

      const catPages = catData.map(item => ({
        type: "category",
        name: item.name,
        url: `./category.html?category=${encodeURIComponent(item.slug)}`,
        slug: item.slug,
        summary: item.description || "",
      }));

      pages = [...staticPages,  ...catPages,  ...mdPages];
    } catch (err) {
      console.warn("Failed to load pages:", err);
    }
  }

  function search(query, onRender) {
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const filtered = !q
      ? pages
      : pages.filter(p => {
          const name = (p.name || "").toLowerCase();
          return terms.every(term => name.includes(term));
        });

    if (!filtered.length) onRender([], "No matches.");
    else onRender(filtered);
  }

  function findPageByHref(href) {
    return pages.find(p => p.url === href);
  }

  function getAllPages() {
    return pages;
  }

  return { loadPages, search, findPageByHref, getAllPages };
})();
