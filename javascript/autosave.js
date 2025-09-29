(() => {
  function getAndStoreSlugAndCategory(href) {
    if (!href) return;

    try {
      const url = new URL(href, location.href);

      // Check slug
      const slug = url.searchParams.get('slug');
      if (slug) {
        sessionStorage.setItem('currentSlug', slug);
        console.log('Using slug from URL:', slug);
      } else {
        const storedSlug = sessionStorage.getItem('currentSlug');
        if (storedSlug) {
          console.log('Using slug from storage (no URL slug):', storedSlug);
        }
      }

      // Check category
      const category = url.searchParams.get('category');
      if (category) {
        sessionStorage.setItem('currentCategory', category);
        console.log('Using category from URL:', category);
      } else {
        const storedCategory = sessionStorage.getItem('currentCategory');
        if (storedCategory) {
          console.log('Using category from storage (no URL category):', storedCategory);
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
