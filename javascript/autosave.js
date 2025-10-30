(() => {
  function getAndStoreSlugAndCategory(href) {
    if (!href) return;

    try {
      const url = new URL(href, location.href);

      // Check slug
      const slug = url.searchParams.get('slug');
      if (slug) {
        sessionStorage.setItem('currentSlug', slug);
      } else {
        const storedSlug = sessionStorage.getItem('currentSlug');
        if (storedSlug) {
          sessionStorage.removeItem('currentSlug');
        }
      }

      // Check category
      const category = url.searchParams.get('category');
      if (category) {
        sessionStorage.setItem('currentCategory', category);
      } else {
        const storedCategory = sessionStorage.getItem('currentCategory');
        if (storedCategory) {
          sessionStorage.removeItem('currentCategory');
        }
      }

    } catch (err) {
      console.warn('Could not parse href when getting slug/category:', href, err);
    }
  }

  // Run immediately for the current page load
  getAndStoreSlugAndCategory(location.href);

  // Run again whenever a link is clicked
  document.addEventListener('click', (e) => {
    const link = e.target?.closest?.('a[href]');
    if (!link) return;

    const hrefAttr = link.getAttribute('href');
    getAndStoreSlugAndCategory(hrefAttr);
    // Let browser navigate normally
  }, { capture: true });
})();
