const WAVE_SELECTOR = '.wave';
const WAVE_AMPLITUDE = 5; // how far letters move up/down in px
const WAVE_SPEED = 0.002; // smaller = slower wave
const TRANSITION_DURATION = 0.1; // seconds

const processed = new WeakMap(); // store original text for updates

function waveElement(el, amplitude, speed) {
    const originalText = el.textContent;
    if (processed.has(el) && processed.get(el) === originalText) return; // already processed
    processed.set(el, originalText);

    // Clear current content
    el.innerHTML = '';

    const spans = [];
    let index = 0;
    for (let char of originalText) {
        if (char === '\n') {
            el.appendChild(document.createElement('br'));
        } else if (char === ' ') {
            el.appendChild(document.createTextNode(' '));
        } else {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.display = 'inline-block';
            span.style.transition = `transform ${TRANSITION_DURATION}s ease`;
            el.appendChild(span);
            spans.push({ span, index });
            index++;
        }
    }

    function animateWave(time) {
        spans.forEach(({ span, index }) => {
            const y = Math.sin(time * speed + index * 0.3) * amplitude;
            span.style.transform = `translateY(${y}px)`;
        });
        requestAnimationFrame(animateWave);
    }

    requestAnimationFrame(animateWave);
}

function waveLetters(selector, amplitude, speed) {
    document.querySelectorAll(selector).forEach(el =>
        waveElement(el, amplitude, speed)
    );
}

document.addEventListener('DOMContentLoaded', () => {
    waveLetters(WAVE_SELECTOR, WAVE_AMPLITUDE, WAVE_SPEED);

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.matches(WAVE_SELECTOR)) {
                            waveElement(node, WAVE_AMPLITUDE, WAVE_SPEED);
                        }
                        node.querySelectorAll(WAVE_SELECTOR).forEach(el =>
                            waveElement(el, WAVE_AMPLITUDE, WAVE_SPEED)
                        );
                    }
                });
            } else if (mutation.type === 'characterData') {
                const parent = mutation.target.parentNode;
                if (parent && parent.matches && parent.matches(WAVE_SELECTOR)) {
                    waveElement(parent, WAVE_AMPLITUDE, WAVE_SPEED);
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: true
    });
});