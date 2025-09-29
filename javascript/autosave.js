(() => {
  function saveFromHref(href) {
    if (!href) return;
    try {
      const url = new URL(href, location.href);
      const slug = url.searchParams.get('slug');
      const category = url.searchParams.get('category');

      if (slug) {
        sessionStorage.setItem('currentSlug', slug);
        console.log('Saved slug from link:', slug);
      }
      if (category) {
        sessionStorage.setItem('currentCategory', category);
        console.log('Saved category from link:', category);
      }
    } catch (err) {
      console.warn('Could not parse href when saving slug/category:', href, err);
    }
  }

  // Generic handler for all link clicks
  function linkClickHandler(e) {
    const link = e.target?.closest?.('a[href]');
    if (!link) return;

    const hrefAttr = link.getAttribute('href');
    saveFromHref(hrefAttr);

    // ⚠️ Do NOT call preventDefault.
    // Let the browser navigate normally.
  }

  // Just one event listener is enough
  document.addEventListener('click', linkClickHandler, { capture: true });

  // If you still want SPA-like back/forward without reloads,
  // keep this. Otherwise you can remove it.
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
})();