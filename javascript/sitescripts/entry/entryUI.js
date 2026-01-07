// ======================
// entryUI.js
// ======================

// ---------- State ----------

let currentGalleryIndex = 0;

// ---------- Gallery UI ----------

function initGalleryUI(entry) {
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");

  const galleryLength = entry.gallery.length;

  if (!galleryLength || !prevBtn || !nextBtn) {
    return;
  }

  // Start at index 1 if possible (per your spec)
  currentGalleryIndex = 0;

  updateGallery(entry);

  prevBtn.addEventListener("click", () => {
    if (currentGalleryIndex > 0) {
      currentGalleryIndex--;
      updateGallery(entry);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentGalleryIndex < galleryLength - 1) {
      currentGalleryIndex++;
      updateGallery(entry);
    }
  });
}

function updateGallery(entry) {
  window.entryRender.renderGalleryImage(
    entry.gallery,
    currentGalleryIndex
  );

  updateGalleryButtons(entry.gallery.length);
}

function updateGalleryButtons(length) {
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");

  if (!prevBtn || !nextBtn) return;

  const atStart = currentGalleryIndex <= 0;
  const atEnd = currentGalleryIndex >= length - 1;

  // Functional state
  prevBtn.disabled = atStart;
  nextBtn.disabled = atEnd;

  // Visual state (restored UX cue)
  prevBtn.classList.toggle("gallery-btn-disabled", atStart);
  nextBtn.classList.toggle("gallery-btn-disabled", atEnd);
}

// ---------- Edit Button ----------

function initEditButton(entry) {
  const editBtn = document.getElementById("edit-button");
  if (!editBtn) return;

  editBtn.addEventListener("click", () => {
    sessionStorage.setItem("editorMarkdown", entry.file.markdown);
    sessionStorage.setItem("editorSlug", entry.slug);

    window.location.href = "entry_editor/editor.html";
  });
}

// ---------- Public Init ----------

function initEntryUI(entry) {
  if (!entry) {
    console.error("[entryUI] No entry data provided");
    return;
  }

  initGalleryUI(entry);
  initEditButton(entry);

  console.log("[entryUI] UI initialized");
}

// ---------- Public API ----------

window.entryUI = {
  initEntryUI
};
