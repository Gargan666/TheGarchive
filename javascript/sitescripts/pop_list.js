// index-pop.js
const POP_WORKER_URL = "https://garchive-manager.garman-gannefors.workers.dev";
const TOP_N = 3;
const INDEX_PATH = "./content/index.json";

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
    try { images = JSON.parse(imagesMatch[1].trim()); } catch {}
  }
  if (attributesMatch) {
    try { attributes = JSON.parse(attributesMatch[1].trim()); } catch {}
  }

  const body = mdText.replace(metaRegex, "").trim();
  return { body, meta: { images, attributes } };
}

async function fetchIndex() {
  try {
    const res = await fetch(INDEX_PATH, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

async function getEntryImages(entry) {
  try {
    const res = await fetch(`content/${encodeURIComponent(entry.file)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mdText = await res.text();
    const { meta } = extractMetaBlock(mdText);
    return meta.images || [];
  } catch {
    return [];
  }
}

async function displayPopularPages() {
  const container = document.getElementById("popular-pages");
  if (!container) return;

  try {
    const res = await fetch(`${POP_WORKER_URL}?list=1`);
    let allCounters = await res.json();
    if (!Array.isArray(allCounters)) return;

    // Only keep entry pages, blacklist static and categories
    allCounters = allCounters.filter(page => page.key.startsWith("entry:"));

    const topPages = allCounters.sort((a, b) => b.count - a.count).slice(0, TOP_N);
    const indexData = await fetchIndex();

    container.innerHTML = "";

    let rank = 1;
    for (const page of topPages) {
      const li = document.createElement("li");
      li.className = "popular-item";

      const slug = page.key.split(":")[1];
      const entry = indexData.find(e => e.slug === slug);

      if (entry) {
        const images = await getEntryImages(entry);
        const title = entry.title || slug;

        const a = document.createElement("a");
        a.href = `entry.html?slug=${encodeURIComponent(slug)}`;
        a.className = "pop-link";

        const wrapper = document.createElement("div");
        wrapper.className = "pop-wrapper";

        if (images.length > 0) {
          const img = document.createElement("img");
          img.src = images[0].src;
          img.alt = images[0].title || title;
          wrapper.appendChild(img);
        }

        const textDiv = document.createElement("div");
        textDiv.className = "pop-title";
        textDiv.textContent = `${title}`;
        wrapper.appendChild(textDiv);

        // Marker with ID for top 3
        const marker = document.createElement("p");
        marker.className = "pop-rank";
        if (rank <= 3) marker.id = `pop-rank-${rank}`;
        marker.textContent = rank;

        a.appendChild(marker);
        a.appendChild(wrapper);
        li.appendChild(a);
      }

      container.appendChild(li);
      rank++;
    }
  } catch {
    container.innerHTML = "<li>Error loading popular pages.</li>";
  }
}

document.addEventListener("DOMContentLoaded", displayPopularPages);