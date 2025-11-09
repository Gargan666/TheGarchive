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
  const FILES_JSON_URL = './content/index.json';
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
function extractMetaBlock(mdText) {
  const metaRegex = /___([\s\S]*?)___/;
  const match = mdText.match(metaRegex);

  if (!match) return { body: mdText, meta: {} };

  const metaText = match[1].trim();

  // Separate out images=... and attributes=...
  const imagesMatch = metaText.match(/images\s*=\s*([\s\S]*?)attributes=/);
  const attributesMatch = metaText.match(/attributes\s*=\s*([\s\S]*)/);

  let images = [];
  let attributes = [];

  if (imagesMatch) {
    try {
      images = JSON.parse(imagesMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse images block", e);
    }
  }

  if (attributesMatch) {
    try {
      attributes = JSON.parse(attributesMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse attributes block", e);
    }
  }

  // Body without the meta block
  const body = mdText.replace(metaRegex, "").trim();

  return { body, meta: { images, attributes } };
}
// ---------------------- Entry page rendering ----------------------
async function initEntry() {
  const items = await fetchIndex();
  const app = document.getElementById('app');
  if (!app) return;

  // Try URL param first, then sessionStorage
  let slug = getQueryParam('slug') || getStoredSlug();
  if (!slug) {
    app.innerHTML = '<p id="error">No slug specified.</p>';
    return;
  }

  // Save slug to sessionStorage
  saveSlug(slug);

  // Find item in manifest
  const item = items.find(it => it.slug === slug);
  if (!item) {
    app.innerHTML = '<p id="error">Entry not found.</p>';
    return;
  }

  // Fetch the markdown file
  const mdRes = await fetch(`content/${encodeURIComponent(item.file)}`);
  if (!mdRes.ok) {
    app.innerHTML = '<p id="error">Failed to load entry content.</p>';
    return;
  }
  const mdText = await mdRes.text();

  // Remove frontmatter and extract meta block
  const bodyOnly = stripFrontmatter(mdText);
  const { body, meta } = extractMetaBlock(bodyOnly);

  // Convert markdown to HTML and sanitize
  const html = marked.parse(body);
  const safe = DOMPurify.sanitize(html);

  // Render main page content
  const thumbEl = document.getElementById('entry-thumb');
  const titleEl = document.getElementById('entry-title');
  const summaryEl = document.getElementById('entry-summary');
  const dateEl = document.getElementById('entry-date');
  const categoriesEl = document.getElementById('entry-categories');
  const contentEl = document.getElementById('entry-content');

  if (categoriesEl && item.categories) {
  categoriesEl.innerHTML = "Categories: " + item.categories
    .map(c => `<a href="category.html?category=${encodeURIComponent(c)}">${c}</a>`)
    .join(" - ");
  }


  if (thumbEl) thumbEl.alt = item.title || 'Page Title';
  if (titleEl) titleEl.textContent = item.title || '';
  if (summaryEl) summaryEl.textContent = item.summary || '';
  if (dateEl) dateEl.textContent = 'Last Updated: ' + (item.date || '');
  if (contentEl) contentEl.innerHTML = safe;

  // --- Automatically save slug for any links in markdown content ---
  if (contentEl) {
    contentEl.addEventListener('click', e => {
      const link = e.target.closest('a[href*="slug="]');
      if (!link) return;
      const url = new URL(link.href, window.location.origin);
      const linkSlug = url.searchParams.get('slug');
      if (linkSlug) {
        sessionStorage.setItem('currentSlug', linkSlug);
        console.log("Saved slug from markdown link:", linkSlug);
      }
    });
  }

  // --- Sidebar: Gallery and Attributes ---
  const galleryImageEl = document.getElementById('gallery-image');
  const galleryTitleEl = document.getElementById('gallery-title');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const attributesEl = document.getElementById('entry-attributes');

  let currentImageIndex = 0;
  const images = meta.images || [];
  const attributes = meta.attributes || [];

  function renderGallery() {
    if (!images.length) {
      if (galleryImageEl) galleryImageEl.style.display = 'none';
      if (galleryTitleEl) galleryTitleEl.textContent = '';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      return;
    }

    const img = images[currentImageIndex];
    if (galleryImageEl) {
      galleryImageEl.src = img.src || '';
      galleryImageEl.alt = img.title || '';
      galleryImageEl.style.display = 'block';
    }
    if (galleryTitleEl) galleryTitleEl.textContent = img.title || '';

    if (prevBtn) {
      prevBtn.disabled = currentImageIndex === 0;
      prevBtn.id = prevBtn.disabled ? 'gallery-prev-disabled' : 'gallery-prev';
    }
    if (nextBtn) {
      nextBtn.disabled = currentImageIndex === images.length - 1;
      nextBtn.id = nextBtn.disabled ? 'gallery-next-disabled' : 'gallery-next';
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      renderGallery();
    }
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (currentImageIndex < images.length - 1) {
      currentImageIndex++;
      renderGallery();
    }
  });

  renderGallery();

  // Render attributes
  if (attributesEl) {
    attributesEl.innerHTML = '';
    attributes.forEach(attr => {
      const li = document.createElement('li');
      const key = Object.keys(attr)[0];
      li.textContent = `${key}: ${attr[key]}`;
      attributesEl.appendChild(li);
    });
  }
}

// run the script lol
document.addEventListener('DOMContentLoaded', initEntry);
