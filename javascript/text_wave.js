const WAVE_SELECTOR = '.wave';
const WAVE_AMPLITUDE = 5; // how far letters move up/down in px
const WAVE_SPEED = 0.002; // smaller = slower wave
const TRANSITION_DURATION = 0.1; // seconds

const processed = new WeakSet();

function waveElement(el, amplitude, speed) {
    if (processed.has(el)) return;
    processed.add(el);

    const text = el.textContent;
    el.innerHTML = '';

    const spans = [];
    let index = 0;
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
        for (const mutation of mutations) {
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
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});