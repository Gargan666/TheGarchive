// javascript/site.js
async function fetchIndex() {
  const res = await fetch('/content/index.json');
  if (!res.ok) throw new Error('Failed to load content/index.json');
  return res.json();
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function linkToEntry(slug) {
  return `/entry.html?slug=${encodeURIComponent(slug)}`;
}

function linkToCategory(cat) {
  return `/category.html?category=${encodeURIComponent(cat)}`;
}

/* ---------- index.html ---------- */
async function initIndex() {
  const items = await fetchIndex();
  const app = document.getElementById('app');
  if (!app) return;

  // Build unique categories with counts
  const catCounts = {};
  items.forEach(it => {
    (it.categories || []).forEach(c => catCounts[c] = (catCounts[c] || 0) + 1);
  });

  // render categories
  const catsEl = document.createElement('div');
  catsEl.className = 'categories';
  catsEl.innerHTML = '<h2>Categories</h2>';
  const list = document.createElement('ul');
  for (const [cat, count] of Object.entries(catCounts).sort()) {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${linkToCategory(cat)}">${cat}</a> (${count})`;
    list.appendChild(li);
  }
  catsEl.appendChild(list);
  app.appendChild(catsEl);

  // render recent entries
  const entriesEl = document.createElement('div');
  entriesEl.className = 'entries-grid';
  entriesEl.innerHTML = '<h2>Entries</h2>';
  const grid = document.createElement('div');
  grid.className = 'grid';
  items.forEach(it => {
    const card = document.createElement('article');
    card.className = 'card';
    const thumb = it.thumbnail ? `<img src="${it.thumbnail}" alt="${it.title} thumbnail">` : '';
    card.innerHTML = `
      <a class="card-link" href="${linkToEntry(it.slug)}">
        ${thumb}
        <h3>${it.title}</h3>
        <p class="summary">${it.summary || ''}</p>
      </a>
      <div class="meta"> ${it.categories.map(c=>`<a href="${linkToCategory(c)}">${c}</a>`).join(' • ')} </div>
    `;
    grid.appendChild(card);
  });
  entriesEl.appendChild(grid);
  app.appendChild(entriesEl);
}

/* ---------- category.html ---------- */
async function initCategory() {
  const items = await fetchIndex();
  const category = getQueryParam('category');
  const app = document.getElementById('app');
  if (!app) return;

  if (!category) {
    app.innerHTML = '<p>No category specified.</p>';
    return;
  }

  const filtered = items.filter(it => (it.categories || []).includes(category));
  app.innerHTML = `<h1>Category: ${category} (${filtered.length})</h1>`;
  const list = document.createElement('div');
  list.className = 'category-list';
  filtered.forEach(it => {
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `<h3><a href="${linkToEntry(it.slug)}">${it.title}</a></h3>
                    <p>${it.summary || ''}</p>`;
    list.appendChild(el);
  });
  app.appendChild(list);
}

/* ---------- entry.html ---------- */
async function initEntry() {
  const items = await fetchIndex();
  const slug = getQueryParam('slug');
  const app = document.getElementById('app');
  if (!app) return;

  if (!slug) {
    app.innerHTML = '<p>No slug specified.</p>';
    return;
  }

  // find item in manifest
  const item = items.find(it => it.slug === slug);
  if (!item) {
    app.innerHTML = '<p>Entry not found.</p>';
    return;
  }

  // fetch the markdown file
  const mdRes = await fetch(`/content/${encodeURIComponent(item.file)}`);
  if (!mdRes.ok) {
    app.innerHTML = '<p>Failed to load entry content.</p>';
    return;
  }
  const mdText = await mdRes.text();

  // parse frontmatter in-browser? (we already have frontmatter via index.json) -> so render md body only
  // If you want to support frontmatter parsing client-side, you can use a small parser. For now we assume body only.
  // Convert markdown to HTML and sanitize
  const html = marked.parse(mdText);
  const safe = DOMPurify.sanitize(html);

  // render page
  app.innerHTML = `
    <article class="entry">
      ${item.thumbnail ? `<img class="entry-thumb" src="${item.thumbnail}" alt="${item.title}">` : ''}
      <h1>${item.title}</h1>
      <div class="meta">${item.date ? item.date + ' • ' : ''}${item.categories.map(c=>`<a href="${linkToCategory(c)}">${c}</a>`).join(' • ')}</div>
      <div class="content">${safe}</div>
    </article>
  `;
}

/* Auto-expose functions (so each HTML page calls the right init) */
window.wiki = {
  initIndex,
  initCategory,
  initEntry
};
