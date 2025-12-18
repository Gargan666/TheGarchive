/**
 * avatarUtils.js
 * Provides image processing and avatar handling functions.
 * Exposes globally: window.processAvatar
 */

import { updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/**
 * Process an image file into a tiny avatar suitable for Firebase Auth photoURL
 * Supports resizing, compression, and optional pixelation.
 * @param {File} file - The image file
 * @param {Object} options - Configurable options
 * @param {number} options.maxSizeKB - Maximum Base64 size (default 1)
 * @param {number} options.maxWidth - Max width in pixels (default 50)
 * @param {number} options.maxHeight - Max height in pixels (default 50)
 * @param {number} options.jpegQuality - Starting JPEG quality (0–1, default 0.9)
 * @param {boolean} options.pixelate - Whether to pixelate (default true)
 * @param {number} options.pixelSize - Pixelation grid size (used if pixelate=true, default 25)
 * @returns {Promise<string>} - Base64 Data URL
 */
export async function processAvatar(file, options = {}) {
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
        let width = img.width;
        let height = img.height;

        // Scale down while keeping aspect ratio
        if (width > height && width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");

        if (pixelate) {
          canvas.width = pixelSize;
          canvas.height = pixelSize;
          ctx.drawImage(img, 0, 0, pixelSize, pixelSize);

          // Scale up
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

        // Compress to fit maxSizeKB
        let quality = jpegQuality;
        let dataUrl;
        do {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          const base64Length = dataUrl.length - "data:image/jpeg;base64,".length;
          const sizeKB = (base64Length * 3 / 4) / 1024;
          if (sizeKB <= maxSizeKB || quality <= 0.05) break;
          quality -= 0.05;
        } while (true);

        if (quality <= 0) console.warn("⚠️ Could not fit image under maxSizeKB, using lowest quality");

        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Sets the current user's profile picture using Firebase Auth
 * @param {File|string} fileOrBase64 - Either a File or Base64 string
 */
export async function setUserProfilePicture(fileOrBase64) {
  const user = window.auth.currentUser;
  if (!user) throw new Error("No logged-in user");

  let base64;
  if (typeof fileOrBase64 === "string") {
    base64 = fileOrBase64;
  } else {
    base64 = await processAvatar(fileOrBase64);
  }

  await updateProfile(user, { photoURL: base64 });
  localStorage.setItem("profilePic", base64);

  const currentPic = document.getElementById("currentProfilePic");
  if (currentPic) currentPic.src = base64;

  return base64;
}

// Expose globally so dynamically loaded scripts can use
window.processAvatar = processAvatar;
window.setUserProfilePicture = setUserProfilePicture;