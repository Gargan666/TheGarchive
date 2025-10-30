// ==============================
// THEGARCHIVE — Full Visit Tracking Script
// ==============================

// --- Step 1: Storage setup ---
const NAMESPACE = "THEGARCHIVE"; // CountAPI namespace
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

// --- Step 2: Page detection ---
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

// Run detection on page load
detectCurrentPage();

// Optional: re-detect on SPA navigation if needed
window.addEventListener("hashchange", detectCurrentPage);
window.addEventListener("popstate", detectCurrentPage);

// --- Step 3: Ensure counters exist ---
async function ensureCounterExists(pageKey) {
  if (!pageKey) {
    console.warn("No page key provided for counter initialization.");
    return;
  }

  try {
    // Check if counter already exists
    const getUrl = `${COUNT_API_BASE}/get/${NAMESPACE}/${pageKey}`;
    const response = await fetch(getUrl);
    const data = await response.json();

    if (data?.value !== undefined) {
      console.log(`Counter already exists for ${pageKey}: ${data.value}`);
      visitData[pageKey] = data.value;
      return;
    }

    // If it doesn't exist, create a new one
    console.log(`Creating new counter for ${pageKey}...`);
    const createUrl = `${COUNT_API_BASE}/create?namespace=${NAMESPACE}&key=${pageKey}&value=0`;
    const createResponse = await fetch(createUrl);
    const createData = await createResponse.json();

    console.log(`Counter created for ${pageKey}:`, createData);
    visitData[pageKey] = createData.value ?? 0;
  } catch (err) {
    console.error("Error ensuring counter exists:", err);
  }
}

// --- Step 4: Increment visit count ---
async function incrementVisit(pageKey) {
  if (!pageKey) return;
  
  try {
    const hitUrl = `${COUNT_API_BASE}/hit/${NAMESPACE}/${pageKey}`;
    const res = await fetch(hitUrl);
    const data = await res.json();

    console.log(data.value);

    if (data?.value !== undefined) {
      visitData[pageKey] = data.value;
      console.log(`Visit counted for ${pageKey}. Total visits: ${data.value}`);
    }
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