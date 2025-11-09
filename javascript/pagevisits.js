const WORKER_URL = "https://garchive-manager.garman-gannefors.workers.dev";
const visitData = {}; // local cache

// === Page detection ===
const currentPage = {
  type: null,
  key: null,
  shouldTrack: false,
};

function detectCurrentPage() {
  const url = new URL(location.href);
  const slug = url.searchParams.get("slug") || sessionStorage.getItem("currentSlug");
  const category = url.searchParams.get("category") || sessionStorage.getItem("currentCategory");

  if (slug) {
    currentPage.type = "entry";
    currentPage.key = `entry:${slug}`;
    sessionStorage.setItem("currentSlug", slug);
  } else if (category) {
    currentPage.type = "category";
    currentPage.key = `category:${category}`;
    sessionStorage.setItem("currentCategory", category);
  } else {
let pathName = url.pathname.replace(/\/+$/, ""); // remove trailing slash
let fileName = pathName.split("/").pop() || "index";

// Normalize default pages
if (fileName === "" || fileName === "index.html") {
  fileName = "index";
}

currentPage.type = "static";
currentPage.key = `static:${fileName}`;

  }

  // --- After setting currentPage.key ---
const normalizedKey = currentPage.key; // already normalized
let visitedPages = sessionStorage.getItem("visitedPages");
visitedPages = visitedPages ? JSON.parse(visitedPages) : [];

if (visitedPages.includes(normalizedKey)) {
  currentPage.shouldTrack = false;
} else {
  visitedPages.push(normalizedKey);
  sessionStorage.setItem("visitedPages", JSON.stringify(visitedPages));
  currentPage.shouldTrack = true;
}

}

detectCurrentPage();
window.addEventListener("hashchange", detectCurrentPage);
window.addEventListener("popstate", detectCurrentPage);

// === Cloudflare Worker helpers ===
async function ensureCounterExists(pageKey) {
  if (!pageKey) return;

  try {
    const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageKey)}`);
    const data = await res.json();
    visitData[pageKey] = data.value || 0;
  } catch (err) {
    console.error("Error ensuring counter exists:", err);
  }
}

async function incrementVisit(pageKey) {
  if (!pageKey) return;

  try {
    const res = await fetch(`${WORKER_URL}?page=${encodeURIComponent(pageKey)}&increment`);
    const data = await res.json();
    visitData[pageKey] = data.value;
  } catch (err) {
    console.error("Error incrementing visit count:", err);
  }
}

// === Initialize ===
if (currentPage.shouldTrack) {
  ensureCounterExists(currentPage.key).then(() => incrementVisit(currentPage.key));
}