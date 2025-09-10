// ---------------------- Helpers ----------------------
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ---------------------- Fetch index.json ----------------------
async function fetchIndex() {
  const FILES_JSON_URL = '/content/index.json';
  try {
    const res = await fetch(FILES_JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("index.json must be an array");
    return data;
  } catch (err) {
    console.error("Failed to fetch index.json:", err);
    return [];
  }
}

function stripFrontmatter(mdText) {
  const lines = mdText.split(/\r?\n/);
  if (lines[0].trim() === '---') {
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }
    if (endIndex > -1) {
      return lines.slice(endIndex + 1).join('\n');
    }
  }
  return mdText; // no frontmatter found
}


// ---------------------- Entry page rendering ----------------------
async function initEntry() {

  console.log("SessionStorage currentSlug:", sessionStorage.getItem('currentSlug')); // <--- DEBUG

  const items = await fetchIndex();
  const slug = getQueryParam('slug') || sessionStorage.getItem('currentSlug');
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

  // Remove frontmatter
  const body = stripFrontmatter(mdText);

  // Convert markdown to HTML and sanitize
  const html = marked.parse(body);
  const safe = DOMPurify.sanitize(html);

  // render page
  const thumbEl = document.getElementById('entry-thumb');
  const titleEl = document.getElementById('entry-title');
  const summaryEl = document.getElementById('entry-summary');
  const dateEl = document.getElementById('entry-date');
  const categoriesEl = document.getElementById('entry-categories');
  const contentEl = document.getElementById('entry-content');

  if (thumbEl) thumbEl.src = item.thumbnail || '';
  if (thumbEl) thumbEl.alt = item.title || '';
  if (titleEl) titleEl.textContent = item.title || '';
  if (summaryEl) summaryEl.textContent = item.summary || '';
  if (dateEl) dateEl.textContent = item.date || '';
  if (categoriesEl) categoriesEl.innerHTML = (item.categories || []).map(c => `<a href="/category.html?category=${encodeURIComponent(c)}">${c}</a>`).join(' • ');
  if (contentEl) contentEl.innerHTML = safe;
}


// ---------------------- Run ----------------------
document.addEventListener('DOMContentLoaded', initEntry);