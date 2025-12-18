let accountMenu;
  while (!accountMenu) {
    accountMenu = document.getElementById("accountMenu");
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Wait until window.currentUser exists
  while (!window.currentUser) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const username = window.currentUser.displayName || "User";
  const pfp = window.currentUser.photoURL

  // Fetch the predesigned HTML snippet
  try {
    const response = await fetch('objects/account.html');
    if (!response.ok) throw new Error(`Failed to load HTML: ${response.status}`);
    const htmlText = await response.text();

    // Insert the HTML into the container
    accountMenu.innerHTML = htmlText;

    // After inserting, update the #name element inside it
    const nameElem = accountMenu.querySelector('#name');
    if (nameElem) {
      nameElem.textContent = username;
    } else {
      console.warn("⚠️ No element with ID 'name' found in the loaded HTML.");
    }

    const picElem = accountMenu.querySelector("#profilePic");
    if (picElem) {
    picElem.src = pfp || "default-avatar.png";
    }

  } catch (error) {
    console.error("❌ Error loading account layout:", error);
  }