const NAMESPACE = "THEGARCHIVE"; // CountAPI namespace
const COUNT_API_LOCAL = "http://localhost:3001/countapi";
const COUNT_API_BASE = "https://api.countapi.xyz";
const visitData = {}; // Local storage for fetched counter values

async function countAPIRequest(endpoint) {
  const url = `${COUNT_API_BASE}/${endpoint}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("CountAPI request error:", err);
    return null;
  }
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
  } else if (category) {
    currentPage.type = "category";
    currentPage.key = `category:${category}`;
  } else {
    const pathName = url.pathname.replace(/\/+$/, "");
    const fileName = pathName.split("/").pop() || "index";
    currentPage.type = "static";
    currentPage.key = `static:${fileName}`;
  }

  console.log(`Detected page → Type: ${currentPage.type}, Key: ${currentPage.key}`);

  // --- Session-safe visit tracking ---
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

async function ensureCounterExists(pageKey) {
  if (!pageKey) return;

  try {
    const encodedKey = encodeURIComponent(pageKey);
    const getUrl = `${COUNT_API_BASE}/get/${encodedKey}`;
    const response = await fetch(getUrl);

    // Log raw text for debugging
    const text = await response.text();
    console.log(`Raw GET response for ${pageKey}:`, text);

    if (!response.ok) {
      // Counter doesn't exist → create it
      console.log(`Counter not found for ${pageKey}, creating...`);
      const createUrl = `${COUNT_API_BASE}/create?namespace=${NAMESPACE}&key=${encodedKey}&value=0`;
      const createResponse = await fetch(createUrl);

      // Log raw text for create
      const createText = await createResponse.text();
      console.log(`Raw CREATE response for ${pageKey}:`, createText);

      const createData = JSON.parse(createText); // now parse safely
      visitData[pageKey] = createData.value ?? 0;
      return;
    }

    // Counter exists → parse normally
    const data = JSON.parse(text);
    console.log(`Parsed JSON for ${pageKey}:`, data);
    visitData[pageKey] = data.value;
  } catch (err) {
    console.error("Error ensuring counter exists:", err);
  }
}

async function incrementVisit(pageKey) {
  if (!pageKey) return;

  try {
    const encodedKey = encodeURIComponent(pageKey);
    const hitUrl = `${COUNT_API_BASE}/hit/${encodedKey}`;
    const response = await fetch(hitUrl);

    // Log raw text for debugging
    const text = await response.text();
    console.log(`Raw HIT response for ${pageKey}:`, text);

    const data = JSON.parse(text);
    visitData[pageKey] = data.value;
    console.log(`Visit counted for ${pageKey}. Total visits: ${data.value}`);
  } catch (err) {
    console.error("Error incrementing visit count:", err);
  }
}
// Initialize counter and increment visit (if first visit this session)
if (currentPage.shouldTrack) {
  ensureCounterExists(currentPage.key).then(() => {
    incrementVisit(currentPage.key);
  });
}