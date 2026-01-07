// ======================
// entryRender.js
// ======================

// ---------- Markdown Rendering ----------

function renderMarkdown(markdown) {
  if (!markdown) return "";
  const html = marked.parse(markdown);
  return DOMPurify.sanitize(html);
}

// ---------- Meta Rendering ----------

function renderEntryMeta(entry) {
  const { title, date, author, categories } = entry.meta;

  const titleEl = document.getElementById("entry-title");
  const dateEl = document.getElementById("entry-date");
  const authorEl = document.getElementById("entry-author");
  const categoriesEl = document.getElementById("entry-categories");

  if (titleEl) titleEl.textContent = title;
  if (dateEl) dateEl.textContent = date ? `Last Updated: ${date}` : "";
  if (authorEl) authorEl.textContent = author ? `Written by: ${author}` : "";

  if (categoriesEl) {
    categoriesEl.innerHTML = categories.length
      ? "Categories: " +
        categories
          .map(c =>
            `<a href="category.html?category=${encodeURIComponent(c)}">${c}</a>`
          )
          .join(" - ")
      : "";
  }
}

// ---------- Content Rendering ----------

function renderEntryContent(entry) {
  const contentEl = document.getElementById("entry-content");
  if (!contentEl) return;

  contentEl.innerHTML = renderMarkdown(entry.content.markdown);
}

// ---------- Attributes Rendering ----------

function renderAttributes(attributes) {
  const el = document.getElementById("entry-attributes");
  if (!el) return;

  el.innerHTML = "";

  attributes.forEach(attr => {
    const li = document.createElement("li");
    const key = Object.keys(attr)[0];
    li.textContent = `${key}: ${attr[key]}`;
    el.appendChild(li);
  });
}

// ---------- Gallery Rendering ----------

function renderGalleryImage(gallery, index) {
  const imageEl = document.getElementById("gallery-image");
  const titleEl = document.getElementById("gallery-title");

  if (!imageEl || !titleEl) return;

  if (!gallery.length) {
    imageEl.style.display = "none";
    titleEl.textContent = "";
    return;
  }

  const i = Math.max(0, Math.min(index, gallery.length - 1));
  const img = gallery[i];

  imageEl.src = img.src || "";
  imageEl.alt = img.title || "";
  imageEl.style.display = "block";
  titleEl.textContent = img.title || "";
}

// ---------- Full Render ----------

function renderEntry(entry) {
  renderEntryMeta(entry);
  renderEntryContent(entry);
  renderAttributes(entry.attributes);
  renderGalleryImage(entry.gallery, 0);
}

// ---------- Public API ----------

window.entryRender = {
  renderEntry,
  renderGalleryImage
};
