(() => {
  const TARGET_SELECTOR = '#entry-content';

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector(TARGET_SELECTOR);
    if (!container) return;

    const cleanedFragment = cleanNode(container);
    container.replaceChildren(...cleanedFragment.childNodes);
  });

  function cleanNode(node) {
    const frag = document.createDocumentFragment();

    node.childNodes.forEach(child => {
      // TEXT NODE
      if (child.nodeType === Node.TEXT_NODE) {
        frag.appendChild(
          document.createTextNode(stripEffectSyntax(child.textContent))
        );
        return;
      }

      // ELEMENT NODE
      if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = child.cloneNode(false);
        const cleanedChildren = cleanNode(child);
        clone.appendChild(cleanedChildren);
        frag.appendChild(clone);
      }
    });

    return frag;
  }

  function stripEffectSyntax(text) {
    let result = '';
    let i = 0;

    while (i < text.length) {
      if (text[i] !== '§') {
        result += text[i];
        i++;
        continue;
      }

      // opening §
      i++;

      // effect letters
      while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) {
        i++;
      }

      // definition-ending §
      if (text[i] === '§') {
        i++;
      }

      // content
      while (i < text.length && text[i] !== '§') {
        result += text[i];
        i++;
      }

      // closing §
      if (text[i] === '§') {
        i++;
      }
    }

    return result;
  }
})();
