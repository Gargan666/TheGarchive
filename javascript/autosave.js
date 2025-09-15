// Run this after the DOM has loaded
document.addEventListener("DOMContentLoaded", () => {
  // Select all links that have "slug=" in their href
  const links = document.querySelectorAll('a[href*="slug="]');

  links.forEach(link => {
    link.addEventListener("click", e => {
      const url = new URL(link.href, window.location.origin);
      const slug = url.searchParams.get("slug");
      if (slug) {
        sessionStorage.setItem("currentSlug", slug);
        console.log("Saved slug from link:", slug);
      }
      // Let the link navigate normally
    });
  });
});