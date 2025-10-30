// Include CountAPI-JS via CDN in HTML:
// <script src="https://cdn.jsdelivr.net/npm/countapi-js/dist/index.umd.js"></script>

const NAMESPACE = "THEGARCHIVE"; // CountAPI namespace
const visitData = {}; // Local storage for fetched counter values

// Detect hosting environment
const host = window.location.hostname;
let isLocalhost = false;
if (host === "localhost" || host === "127.0.0.1") {
  console.log("Running on localhost");
  isLocalhost = true;
} else if (host.endsWith("github.io")) {
  console.log("Running on GitHub Pages");
} else {
  console.log("Running on another host:", host);
}

console.log("THEGARCHIVE storage initialized.");

const currentPage = {
  type: null,    // "static" | "entry" | "category"
  key: null,     // e.g. "static:index", "entry:slug", "category:name"
  shouldTrack: false // true only if first visit this session
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
    const pathName = url.pathname.replace(/\/+$/, "");
    const fileName = pathName.split("/").pop() || "index";
    currentPage.type = "static";
    currentPage.key = `static:${fileName}`;
  }

  console.log(`Detected page → Type: ${currentPage.type}, Key: ${currentPage.key}`);

  // Session-safe visit tracking
  const alreadyVisited = sessionStorage.getItem("visitedPageKey");
  if (alreadyVisited === currentPage.key) {
    console.log("Page already registered this session; will not count again.");
    currentPage.shouldTrack = false;
  } else {
    sessionStorage.setItem("visitedPageKey", currentPage.key);
    currentPage.shouldTrack = true;
  }
}

detectCurrentPage();
window.addEventListener("hashchange", detectCurrentPage);
window.addEventListener("popstate", detectCurrentPage);

// --- CountAPI helpers ---
async function ensureCounterExists(pageKey) {
  if (!pageKey) return;
  if (isLocalhost) {
    // Mock counter locally for testing
    visitData[pageKey] = visitData[pageKey] || 0;
    return;
  }

  try {
    const exists = await countapi.get(NAMESPACE, pageKey).catch(() => null);
    if (!exists) {
      const created = await countapi.create(NAMESPACE, pageKey, 0);
      visitData[pageKey] = created.value;
      console.log(`Counter created for ${pageKey}:`, created.value);
    } else {
      visitData[pageKey] = exists.value;
      console.log(`Counter exists for ${pageKey}:`, exists.value);
    }
  } catch (err) {
    console.error("Error ensuring counter exists:", err);
  }
}

async function incrementVisit(pageKey) {
  if (!pageKey) return;

  if (isLocalhost) {
    // Local increment
    visitData[pageKey] = (visitData[pageKey] || 0) + 1;
    console.log(`Local visit counted for ${pageKey}. Total: ${visitData[pageKey]}`);
    return;
  }

  try {
    const result = await countapi.hit(NAMESPACE, pageKey);
    visitData[pageKey] = result.value;
    console.log(`Visit counted for ${pageKey}. Total visits: ${result.value}`);
  } catch (err) {
    console.error("Error incrementing visit count:", err);
  }
}

// Initialize counter and increment visit (if first visit this session)
if (currentPage.shouldTrack) {
  ensureCounterExists(currentPage.key).then(() => incrementVisit(currentPage.key));
}
console.log();