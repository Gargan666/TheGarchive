const JITTER_SELECTOR = '.randomize'; // CSS selector for target elements
const JITTER_INTENSITY = 1;           // Maximum pixel jitter in any direction
const JITTER_INTERVAL = 50;           // Interval in milliseconds between jitter updates

/**
 * Continuously jitters the letters of the given element(s),
 * while preserving spaces, line breaks, and the original layout.
 * @param {string} selector - CSS selector for target elements
 * @param {number} intensity - Maximum pixel jitter in any direction
 * @param {number} interval - Interval in milliseconds between updates
 */
function jitterLetters(selector, intensity, interval) {
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
        const text = el.textContent;
        el.innerHTML = ''; // Clear original text

        // Wrap each character in a span
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
                el.appendChild(span);
                spans.push(span);
            }
        }

        // Animate jitter at the specified interval
        setInterval(() => {
            spans.forEach(span => {
                const x = (Math.random() * 2 - 1) * intensity;
                const y = (Math.random() * 2 - 1) * intensity;
                span.style.transform = `translate(${x}px, ${y}px)`;
            });
        }, interval);
    });
}

// Start jitter after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    jitterLetters(JITTER_SELECTOR, JITTER_INTENSITY, JITTER_INTERVAL);
});
