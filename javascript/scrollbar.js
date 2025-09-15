const results = document.getElementById('results');
const thumb = document.getElementById('thumb');

function updateThumb() {
    const contentHeight = results.scrollHeight;   // total scrollable content
    const visibleHeight = results.clientHeight;   // visible viewport height
    const scrollTop = results.scrollTop;          // current scroll position

    // Calculate thumb height proportional to visible content
    // Minimum height of 20px for usability
    const thumbHeight = Math.max((visibleHeight / contentHeight) * visibleHeight, 20);
    thumb.style.height = `${thumbHeight}px`;

    // Calculate scroll ratio (0 = top, 1 = bottom)
    const scrollRatio = scrollTop / (contentHeight - visibleHeight);

    // Calculate thumb top position
    // Ensure thumb does not go past the bottom
    const maxThumbTop = visibleHeight - thumbHeight + (visibleHeight / 3.5);
    const thumbTop = Math.min(scrollRatio * maxThumbTop, maxThumbTop);

    // Apply thumb position
    thumb.style.top = `${thumbTop}px`;
}

// thumb pos sync
results.addEventListener('scroll', updateThumb);

// initial thumb sizing
updateThumb();

let isDragging = false;
let startY, startScroll;

thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startScroll = results.scrollTop;
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = e.clientY - startY;
    const scrollableHeight = results.scrollHeight - results.clientHeight;
    const thumbHeight = thumb.offsetHeight;
    results.scrollTop = startScroll + (delta * scrollableHeight) / (results.clientHeight - thumbHeight);
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});