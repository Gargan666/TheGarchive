// Save slug/category from any clicked link (works for dynamically added links)
// Put this near the end of your site-wide JS (or in its own file loaded on every page)
(() => {
  function saveFromHref(href, push = true) {
    if (!href) return;
    try {
      const url = new URL(href, location.href);
      const slug = url.searchParams.get('slug');
      const category = url.searchParams.get('category');

      if (slug) {
        sessionStorage.setItem('currentSlug', slug);
        console.log('Saved slug from link:', slug);
        if (push) {
          history.pushState({ slug }, '', `entry.html?slug=${encodeURIComponent(slug)}`);
        }
      }
      if (category) {
        sessionStorage.setItem('currentCategory', category);
        console.log('Saved category from link:', category);
        if (push) {
          history.pushState({ category }, '', `category.html?category=${encodeURIComponent(category)}`);
        }
      }
    } catch (err) {
      console.warn('Could not parse href when saving slug/category:', href, err);
    }
  }

  // Generic handler for all link clicks
  function linkClickHandler(e) {
    const link = e.target && e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    const hrefAttr = link.getAttribute('href');
    saveFromHref(hrefAttr, true);
    // do not preventDefault — let navigation continue normally
  }

  // Capture phase listeners
  document.addEventListener('click', linkClickHandler, { capture: true });
  document.addEventListener('auxclick', linkClickHandler, { capture: true });
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0 || e.button === 1) linkClickHandler(e);
  }, { capture: true });

  // Handle back/forward navigation
  window.addEventListener('popstate', (event) => {
    console.log('Popstate event:', event.state);

    if (event.state?.slug) {
      sessionStorage.setItem('currentSlug', event.state.slug);
      console.log('Restored slug from history:', event.state.slug);
      if (typeof initEntry === 'function') initEntry();
    }

    if (event.state?.category) {
      sessionStorage.setItem('currentCategory', event.state.category);
      console.log('Restored category from history:', event.state.category);
      if (typeof renderCategory === 'function') renderCategory();
    }
  });

  // Optional helper for debugging in console
  window.__saveFromHref = saveFromHref;
})();
