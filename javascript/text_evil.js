const JITTER_SELECTOR = '.obfuscated';
const JITTER_INTENSITY = 2;
const JITTER_INTERVAL = 100;
const TRANSITION_DURATION = 0.1; // seconds

const processed = new WeakSet();

function jitterElement(el, intensity, interval) {
    if (processed.has(el)) return;
    processed.add(el);

    const text = el.textContent;
    el.innerHTML = '';

    const spans = [];
    for (let char of text) {
        if (char === '\n') {
            el.appendChild(document.createElement('br'));
        } else if (char === ' ') {
            el.appendChild(document.createTextNode(' '));
        } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            span.style.transition = `transform ${TRANSITION_DURATION}s ease`; // smooth transition
            el.appendChild(span);
            spans.push(span);
        }
    }

    setInterval(() => {
        spans.forEach(span => {
            const x = (Math.random() * 2 - 1) * intensity;
            const y = (Math.random() * 2 - 1) * intensity;
            span.style.transform = `translate(${x}px, ${y}px)`;
        });
    }, interval);
}

function jitterLetters(selector, intensity, interval) {
    document.querySelectorAll(selector).forEach(el =>
        jitterElement(el, intensity, interval)
    );
}

document.addEventListener('DOMContentLoaded', () => {
    jitterLetters(JITTER_SELECTOR, JITTER_INTENSITY, JITTER_INTERVAL);

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches(JITTER_SELECTOR)) {
                        jitterElement(node, JITTER_INTENSITY, JITTER_INTERVAL);
                    }
                    node.querySelectorAll(JITTER_SELECTOR).forEach(el =>
                        jitterElement(el, JITTER_INTENSITY, JITTER_INTERVAL)
                    );
                }
            });
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});