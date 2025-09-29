async function initScroll() {
const results = document.getElementById('results');
const thumb = document.getElementById('thumb');
const input = document.getElementById("search");

function updateThumb() {
    const visibleHeight = results.clientHeight + 20;
    const contentHeight = results.scrollHeight;
    const scrollTop = results.scrollTop;

    // Handle case when content fits completely
    if (contentHeight <= visibleHeight) {
        thumb.style.top = '0px';
        thumb.style.height = `${visibleHeight}px`;
        return;
    }

    const thumbHeight = Math.max((visibleHeight / contentHeight) * visibleHeight, 20);
    thumb.style.height = `${thumbHeight}px`;

    const normalizedScroll = Math.round((scrollTop / (contentHeight - visibleHeight) * 100)) / 100
    const maxThumbTop = visibleHeight - thumbHeight + (15 / (thumbHeight / 20));
    const thumbTop = normalizedScroll * maxThumbTop;

    thumb.style.top = `${thumbTop}px`;
}

// call when showing and scrolling results
results.addEventListener('scroll', updateThumb);
input.addEventListener('focus', updateThumb);

let isDragging = false;
let startY, startScroll;

thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startScroll = results.scrollTop;
    e.preventDefault();
    thumb.className = 'dragging';
    document.body.className = 'dragging';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = e.clientY - startY;
    const scrollableHeight = results.scrollHeight - results.clientHeight ;
    const thumbHeight = thumb.offsetHeight;
    results.scrollTop = startScroll + (delta * scrollableHeight) / (results.clientHeight - thumbHeight + (80 / (thumbHeight / 20)));
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    thumb.className = '';
    document.body.className = '';
});
};