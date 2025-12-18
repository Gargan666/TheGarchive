// profilepicture.js
(function() {
  /**
   * Initialize the profile picture setting UI
   * @param {HTMLElement} root - The root element of this setting
   */
  async function init(root) {
    const input = root.querySelector("[data-input]");
    const preview = root.querySelector("[data-preview]");
    const cropBtn = root.querySelector("[data-crop]");
    if (!input || !preview || !cropBtn) return;

    let cropper = null;

    // Define UI states for easier visibility management
    const uiStates = {
      idle: () => {
        preview.style.display = localStorage.getItem("profilePic") ? "block" : "none";
        cropBtn.style.display = "none";
      },
      editing: () => {
        preview.style.display = "block";
        cropBtn.style.display = "inline-block";
      },
      saved: () => {
        preview.style.display = "block";
        cropBtn.style.display = "none";
      }
    };

    // Apply a given state
    function setUIState(state) {
      if (uiStates[state]) uiStates[state]();
    }

    // Load previously saved picture
    const savedPic = localStorage.getItem("profilePic");
    if (savedPic) {
      preview.src = savedPic;
      setUIState("idle");
    } else {
      setUIState("idle");
    }

    // File selection
    input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;

        // Destroy previous cropper if exists
        if (cropper) cropper.destroy();

cropper = new Cropper(preview, {
  aspectRatio: 1,
  viewMode: 1,
  background: false,

  dragMode: "move",          // Move IMAGE, not crop box
  cropBoxMovable: false,      // Disable moving crop box
  cropBoxResizable: false,    // Disable resizing crop box
  guides: false,              // Remove overlay lines
  center: true,
  highlight: false,
  autoCropArea: 1,            // Crop box fills container

  ready() {
  // Wait a microtask so CropperJS finishes its internal layout
  Promise.resolve().then(() => {
    const container = cropper.getContainerData();

    cropper.setCropBoxData({
      left: 0,
      top: 0,
      width: container.width,
      height: container.height
    });
  });
}
});

        setUIState("editing");
      };
      reader.readAsDataURL(file);
    });

    // Crop & Save
    cropBtn.addEventListener("click", async () => {
      if (!cropper) return;

      const canvas = cropper.getCroppedCanvas({ width: 150, height: 150 });
      canvas.toBlob(async blob => {
        const file = new File([blob], "avatar.jpeg", { type: "image/jpeg" });

        const base64 = await window.processAvatar(file);

        if (window.auth?.currentUser) {
          await window.setUserProfilePicture(base64);
        }

        localStorage.setItem("profilePic", base64);
        preview.src = base64;

        cropper.destroy();
        cropper = null;

        setUIState("saved");
      }, "image/jpeg");
    });
  }

  // Expose init function globally
  window["profilepicture.js"] = { init };
})();