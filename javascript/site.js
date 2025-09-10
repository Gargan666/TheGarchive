// ---------------------- Helpers ----------------------
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function saveSlug(slug) {
  if (slug) {
    sessionStorage.setItem('currentSlug', slug);
    console.log("Saved slug to sessionStorage:", slug);
  }
}

function getStoredSlug() {
  const stored = sessionStorage.getItem('currentSlug');
  console.log("Stored slug from sessionStorage:", stored);
  return stored;
}

// ---------------------- Fetch index.json ----------------------
async function fetchIndex() {
  const isGitHub = window.location.hostname.includes('github.io');
  const FILES_JSON_URL = isGitHub ? './content/index.json' : './content/index.json';
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
  const items = await fetchIndex();
  const app = document.getElementById('app');
  if (!app) return;

  // Try URL param first, then sessionStorage
  let slug = getQueryParam('slug');
  console.log("Slug from URL:", slug);

  if (!slug) {
    console.warn("No slug in URL, checking sessionStorage...");
    slug = getStoredSlug();
  }

  if (!slug) {
    app.innerHTML = '<p>No slug specified.</p>';
    return;
  }

  // Save slug to sessionStorage
  saveSlug(slug);

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

  if (thumbEl) thumbEl.alt = item.title || 'Page Title';
  if (titleEl) titleEl.textContent = item.title || '';
  if (summaryEl) summaryEl.textContent = item.summary || '';
  if (dateEl) dateEl.textContent = 'Last Updated: ' + (item.date || '');
  //if (categoriesEl) categoriesEl.innerHTML = (item.categories || []).map(c => `<a href="/category.html?category=${encodeURIComponent(c)}">${c}</a>`).join(' • ');
  if (contentEl) contentEl.innerHTML = safe;
}

// ---------------------- Run ----------------------
document.addEventListener('DOMContentLoaded', initEntry);