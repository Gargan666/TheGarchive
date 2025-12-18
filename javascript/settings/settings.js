import { getAuth, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Get auth and storage from auth.js (assumes auth.js exposes them globally)
const auth = window.auth;
const storage = window.storage;

async function setupSettings() {
  // Wait for user to exist
  while (!window.auth.currentUser) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const user = window.auth.currentUser;
  const curName = document.getElementById("usernameDisplay");
  const currentPic = document.getElementById("currentProfilePic");
  const profilePicInput = document.getElementById("profilePicInput");
  const cropPreview = document.getElementById("cropPreview");
  const cropBtn = document.getElementById("cropBtn");

  if (user.photoURL) currentPic.src = user.photoURL;
  if (user.displayName) curName.textContent = user.displayName;

  let cropper;

  profilePicInput.addEventListener("change", () => {
    const file = profilePicInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      cropPreview.src = e.target.result;
      cropPreview.style.display = "block";

      // Destroy previous cropper if exists
      if (cropper) cropper.destroy();

      cropper = new Cropper(cropPreview, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        movable: true,
        background: false,
      });
    };
    reader.readAsDataURL(file);
  });

  cropBtn.addEventListener("click", async () => {
    if (!cropper) return;

    // Get cropped canvas
    const croppedCanvas = cropper.getCroppedCanvas({
      width: 50,  // target width
      height: 50, // target height
    });

    // Convert to Blob for processAvatar
    croppedCanvas.toBlob(async blob => {
      const file = new File([blob], "avatar.jpeg", { type: "image/jpeg" });
      const base64Avatar = await processAvatar(file);

      currentPic.src = base64Avatar;
      await updateProfile(user, { photoURL: base64Avatar });
      localStorage.setItem("profilePic", base64Avatar);

      // Hide crop preview
      cropPreview.style.display = "none";
      cropper.destroy();
    }, "image/jpeg");
  });

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", async () => {
    try {
      await window.logout(); // assumes auth.js exposes logout globally
      window.location.href = "/"; // redirect to homepage or login page
    } catch (error) {
      console.error(error);
    }
  });

  // Load stored picture if available
  const savedPic = localStorage.getItem("profilePic");
  if (savedPic) currentPic.src = savedPic;
}

/**
 * Process an image file into a tiny avatar suitable for Firebase Auth photoURL
 * Supports resizing, compression, and optional pixelation.
 * @param {File} file - The image file
 * @param {Object} options - Configurable options
 * @param {number} options.maxSizeKB - Maximum Base64 size (default 2)
 * @param {number} options.maxWidth - Max width in pixels (default 50)
 * @param {number} options.maxHeight - Max height in pixels (default 50)
 * @param {number} options.jpegQuality - Starting JPEG quality (0–1, default 0.9)
 * @param {boolean} options.pixelate - Whether to pixelate (default false)
 * @param {number} options.pixelSize - Pixelation grid size (used if pixelate=true, default 10)
 * @returns {Promise<string>} - Base64 Data URL
 */
async function processAvatar(file, options = {}) {
  const {
    maxSizeKB = 1,
    maxWidth = 50,
    maxHeight = 50,
    jpegQuality = 0.9,
    pixelate = true,
    pixelSize = 25
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Step 1: Resize image to maxWidth/maxHeight while keeping aspect ratio
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        // Step 2: Draw to canvas
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");

        if (pixelate) {
          // Pixelation mode
          canvas.width = pixelSize;
          canvas.height = pixelSize;
          ctx.drawImage(img, 0, 0, pixelSize, pixelSize);

          // Scale up to display size
          const displayCanvas = document.createElement("canvas");
          displayCanvas.width = width;
          displayCanvas.height = height;
          const displayCtx = displayCanvas.getContext("2d");
          displayCtx.imageSmoothingEnabled = false;
          displayCtx.drawImage(canvas, 0, 0, pixelSize, pixelSize, 0, 0, width, height);
          canvas = displayCanvas;
          ctx = displayCtx;
        } else {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Step 3: Iteratively compress to fit maxSizeKB
        let quality = jpegQuality;
        let dataUrl;
        do {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          const base64Length = dataUrl.length - "data:image/jpeg;base64,".length;
          const sizeKB = (base64Length * 3 / 4) / 1024;
          if (sizeKB <= maxSizeKB || quality <= 0.05) break;
          quality -= 0.05;
        } while (true);

        if (quality <= 0) {
          console.warn("⚠️ Could not fit image under maxSizeKB, using lowest quality");
        }

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

window.setupSettings = setupSettings;
setupSettings();