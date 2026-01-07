// ======================
// entryLoad.js
// ======================

// ---------- Utilities ----------

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function saveSlug(slug) {
  if (slug) {
    sessionStorage.setItem("currentSlug", slug);
  }
}

function getStoredSlug() {
  return sessionStorage.getItem("currentSlug");
}

// ---------- Fetching ----------

async function fetchIndex() {
  const res = await fetch("./content/index.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch index.json (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("index.json must be an array");
  }

  return data;
}

async function fetchMarkdown(file) {
  const res = await fetch(`content/${encodeURIComponent(file)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch markdown file: ${file}`);
  }
  return await res.text();
}

// ---------- Markdown processing ----------

// Strip YAML frontmatter (--- ... ---)
function stripFrontmatter(mdText) {
  const lines = mdText.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    return mdText;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      return lines.slice(i + 1).join("\n").trim();
    }
  }

  return mdText;
}

// Extract custom middle matter (___ ... ___)
function extractMiddleMatter(mdText) {
  const middleRegex = /^___\s*([\s\S]*?)\s*___/m;
  const match = mdText.match(middleRegex);

  let gallery = [];
  let attributes = [];

  if (match) {
    const block = match[1];

    const imagesMatch = block.match(
      /images\s*=\s*([\s\S]*?)\s*attributes\s*=/m
    );
    const attributesMatch = block.match(
      /attributes\s*=\s*([\s\S]*)/m
    );

    if (imagesMatch) {
      try {
        gallery = JSON.parse(imagesMatch[1].trim());
      } catch (e) {
        console.error("[entryLoad] Failed to parse images block", e);
      }
    }

    if (attributesMatch) {
      try {
        attributes = JSON.parse(attributesMatch[1].trim());
      } catch (e) {
        console.error("[entryLoad] Failed to parse attributes block", e);
      }
    }
  }

  const body = mdText.replace(middleRegex, "").trim();

  return { body, gallery, attributes };
}

// ---------- Core loader ----------

async function loadEntry() {
  const slug = getQueryParam("slug") || getStoredSlug();
  if (!slug) {
    throw new Error("No slug specified");
  }

  saveSlug(slug);

  const index = await fetchIndex();
  const item = index.find(it => it.slug === slug);

  if (!item) {
    throw new Error(`Entry not found for slug: ${slug}`);
  }

  const fullMarkdown = await fetchMarkdown(item.file);
  const withoutFrontmatter = stripFrontmatter(fullMarkdown);
  const { body, gallery, attributes } =
    extractMiddleMatter(withoutFrontmatter);

  return {
    slug,

    meta: {
      title: item.title || "",
      date: item.date || "",
      author: item.author || "",
      categories: Array.isArray(item.categories)
        ? [...item.categories]
        : []
    },

    gallery: [...gallery],
    attributes: [...attributes],

    content: {
      markdown: body
    },

    file: {
      markdown: fullMarkdown
    }
  };
}

// ---------- Init + TEMP bootstrap ----------

async function initEntryLoad() {
  try {
    const entry = await loadEntry();

    console.log(
      "[entryLoad] Final exposed entry data:",
      JSON.parse(JSON.stringify(entry))
    );

window.entryData = entry;

// TEMP orchestration until a page controller exists
if (window.entryRender) {
  window.entryRender.renderEntry(entry);
}

if (window.entryUI) {
  window.entryUI.initEntryUI(entry);
}


  } catch (err) {
    console.error("[entryLoad] Failed:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", initEntryLoad);
