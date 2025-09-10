document.addEventListener("DOMContentLoaded", () => {
    const titlebar = document.getElementById("titlebar");
    const ctx = titlebar.getContext("2d");

    // Pull values from HTML dataset
    const text = titlebar.dataset.text || "THE GARCHIVE |";
    const spacing = parseInt(titlebar.dataset.spacing) || 15;
    const fontSize = parseInt(titlebar.dataset.fontSize) || 18;
    const y = parseInt(titlebar.dataset.y) || 20;
    const speed = parseInt(titlebar.dataset.speed) || 2;
    const fontFamily = titlebar.dataset.fontFamily || "sans-serif";
    const color = titlebar.dataset.color || "white";
    const bgColor = titlebar.dataset.bgcolor || "black";

    let x = 0;

    function applyFontSettings() {
        ctx.font = fontSize + "px " + fontFamily;
        ctx.fillStyle = color;
    }

    function resizeCanvas() {
        titlebar.width = window.innerWidth - 16;
        applyFontSettings();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function animate() {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, titlebar.width, titlebar.height);

        ctx.fillStyle = color;
        const textWidth = ctx.measureText(text).width + spacing;
        const numCopies = Math.ceil(titlebar.width / textWidth) + 1;

        for (let i = 0; i < numCopies; i++) {
            ctx.fillText(text, Math.floor(x + i * textWidth), y);
        }

        x -= speed;
        if (x <= -textWidth) x += textWidth;

        requestAnimationFrame(animate);
    }

    animate();
});
