const stored = sessionStorage.getItem('currentCategory');
if (!stored) {
    console.warn("No category found in sessionStorage.");
}
async function fetchCategories() {
  const URL = './content/categories.json';

  try {
    const res = await fetch(URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json(); // Array of category objects

    // Get current category slug from sessionStorage
    const currentSlug = sessionStorage.getItem('currentCategory');

    // Find the current category object
    const currentCategory = currentSlug ? data.find(cat => cat.slug === currentSlug) : null;

    if (!currentCategory) {
      console.warn("No currentCategory found in sessionStorage or invalid slug.");
    }

    return { allCategories: data, currentCategory };
  } catch (err) {
    console.error("Failed to load categories.json:", err);
    return { allCategories: [], currentCategory: null };
  }
}

function extractMetaBlock(mdText) {
  const metaRegex = /___([\s\S]*?)___/;
  const match = mdText.match(metaRegex);

  if (!match) return { body: mdText, meta: {} };

  const metaText = match[1].trim();

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

  const body = mdText.replace(metaRegex, "").trim();

  return { body, meta: { images, attributes } };
}

async function getEntryImages(entry) {
  try {
    const res = await fetch(`content/${encodeURIComponent(entry.file)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const mdText = await res.text();
    const { meta } = extractMetaBlock(mdText);

    return meta.images || [];
  } catch (err) {
    console.error(`Error fetching images for entry "${entry.slug}":`, err);
    return [];
  }
}

async function fetchIndex() {
  const URL = './content/index.json';

  try {
    const res = await fetch(URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("index.json must be an array");

    return data;
  } catch (err) {
    console.error("Failed to load index.json:", err);
    return [];
  }
}

async function renderCategory() {
  const { allCategories, currentCategory } = await fetchCategories();
  const titleEl = document.getElementById('category-title');

  if (currentCategory && titleEl) {
    titleEl.textContent = currentCategory.name || '';
  }
  if (!currentCategory) {
    console.warn("No category selected.");
    return;
  }

  // Fetch index.json
  const res = await fetch('./content/index.json', { cache: 'no-store' });
  if (!res.ok) {
    console.error("Failed to load index.json:", res.status);
    return;
  }
  const items = await res.json();

  // entry list render
  const containerul = document.getElementById('category-entries');
  if (!containerul) {
    console.error("No container element with id 'category-entries' found in HTML.");
    return;
  }
  containerul.innerHTML = ""; // clear old content

  const filtered = items.filter(item => item.categories && item.categories.includes(stored));
  if (filtered.length === 0) {
    containerul.textContent = "No entries found in this category.";
    return;
  }

  for (const item of filtered) {
    // Get images for this entry
    const images = await getEntryImages(item);

    const a = document.createElement('a');
    a.href = `entry.html?slug=${encodeURIComponent(item.slug)}`;
    a.className = 'catEntBox';

    const section = document.createElement('section');
    const dark = document.createElement('div');
    dark.className = 'catEntElements';
    const span = document.createElement('p');
    const br = document.createElement('br');
    span.textContent = item.title;

    dark.appendChild(span);
    dark.appendChild(br);
    section.appendChild(dark);
    a.appendChild(section);
    if (images.length > 0) {
      const img = document.createElement("img");
      img.src = images[0].src;
      img.alt = images[0].title || item.title;
      dark.appendChild(img);
    }

    containerul.appendChild(a);
  }

  // title render
  const title = document.getElementById('category-title');
  if (title) {
    title.textContent = currentCategory.name || '';
  }
  // description render
  const desc = document.getElementById('category-description');
  if (desc) {
    desc.textContent = currentCategory.description || '';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
renderCategory(); 
});