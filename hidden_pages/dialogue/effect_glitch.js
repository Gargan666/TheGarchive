// --- Glitch + Text-Masked Animated Static (drop-in) ---
(() => {
  // Tweakables
  const GLITCH_INTERVAL = 100;     // ms between updates
  const GLITCH_TRANSLATE = 2;      // max pixels offset
  const GLITCH_CLIP = 30;          // max % for clip-path inset
  const GLITCH_CHANCE = 0.05;       // probability to apply glitch per tick
  const STATIC_CHANCE = 0.1;       // probability to apply static per tick
  const STATIC_DURATION = 50;     // ms duration of static overlay
  const STATIC_VARIANCE = 10;
  const STATIC_FLICKER = 40;        // ms between static redraws (flicker speed)

  // Helpers
  function parseCSSColorToRGB(css) {
    if (!css) return [255, 255, 255];
    // rgb(a)
    const rgbMatch = css.match(/rgba?\s*\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i);
    if (rgbMatch) return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    // hex #rrggbb or #rgb
    const hexMatch = css.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const h = hexMatch[1];
      if (h.length === 3) {
        return [
          parseInt(h[0] + h[0], 16),
          parseInt(h[1] + h[1], 16),
          parseInt(h[2] + h[2], 16),
        ];
      } else {
        return [
          parseInt(h.slice(0, 2), 16),
          parseInt(h.slice(2, 4), 16),
          parseInt(h.slice(4, 6), 16),
        ];
      }
    }
    // fallback white
    return [255, 255, 255];
  }

  function createTextMaskedAnimatedStatic(el) {
    // Prevent duplicate static overlays for same element
    if (el._glitchStaticActive) return;
    el._glitchStaticActive = true;

    const rectW = Math.max(1, el.clientWidth);
    const rectH = Math.max(1, el.clientHeight);
    if (rectW === 0 || rectH === 0) {
      el._glitchStaticActive = false;
      return;
    }

    const computed = getComputedStyle(el);

    // Ensure overlay is positioned over element content: prefer not to override unless needed
    const prevInlinePosition = el.style.position || '';
    const computedPos = computed.position;
    if (computedPos === 'static') el.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.width = rectW;
    canvas.height = rectH;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = rectW + 'px';
    canvas.style.height = rectH + 'px';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    el.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Prepare text drawing metrics
    const font = computed.font || `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    ctx.font = font;
    ctx.textBaseline = 'top';

    const textAlign = computed.textAlign || 'left';
    ctx.textAlign = textAlign;

    // padding to align drawn text to element content
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingRight = parseFloat(computed.paddingRight) || 0;

    // line height
    let lineHeight = computed.lineHeight;
    const fontSize = parseFloat(computed.fontSize) || 16;
    if (!lineHeight || lineHeight === 'normal') {
      lineHeight = fontSize * 1.2;
    } else {
      lineHeight = parseFloat(lineHeight);
      if (isNaN(lineHeight)) lineHeight = fontSize * 1.2;
    }

    // text color for "white" pixels
    const textRGB = parseCSSColorToRGB(computed.color);

    // get lines to draw (support multi-line)
    const rawText = el.textContent || '';
    const lines = rawText.split(/\r?\n/);

    // compute X position based on textAlign
    function textXForAlign() {
      if (textAlign === 'center') {
        return rectW / 2;
      } else if (textAlign === 'right' || textAlign === 'end') {
        return rectW - paddingRight;
      } else {
        return paddingLeft;
      }
    }
    const baseX = textXForAlign();

    // noise draw function: draws random black/textColor pixels into an ImageData then composits with text mask
    function redrawNoise() {
      // clear whole canvas
      ctx.clearRect(0, 0, rectW, rectH);

      // Draw text as mask (destination)
      ctx.fillStyle = 'black';
      ctx.font = font;
      ctx.textBaseline = 'top';
      ctx.textAlign = textAlign;

      // Draw each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const y = paddingTop + i * lineHeight;
        ctx.fillText(line, baseX, y);
      }

      // Now composite: keep source only where the text (destination) exists.
      ctx.globalCompositeOperation = 'source-in';

      // Make pixel image data
      const imageData = ctx.createImageData(rectW, rectH);
      const data = imageData.data;
      // Fill each pixel with either black or textColor
      for (let i = 0; i < data.length; i += 4) {
        const useTextColor = Math.random() > 0.7; // 50/50 flicker
        if (useTextColor) {
          data[i] = textRGB[0];     // R
          data[i + 1] = textRGB[1]; // G
          data[i + 2] = textRGB[2]; // B
          data[i + 3] = 255;        // A
        } else {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // reset composite op back to default for next frame
      ctx.globalCompositeOperation = 'source-over';
    }

    // Start animated static: update every STATIC_FLICKER ms
    const noiseInterval = setInterval(redrawNoise, STATIC_FLICKER);
    // draw immediately once
    redrawNoise();

    // Random duration around STATIC_DURATION using STATIC_VARIANCE
    const min = STATIC_DURATION * (1 - STATIC_VARIANCE);
    const max = STATIC_DURATION * (1 + STATIC_VARIANCE);
    const duration = min + Math.random() * (max - min);

    // clean up after duration
    const removalTimeout = setTimeout(() => {
      clearInterval(noiseInterval);
      try { el.removeChild(canvas); } catch (e) {}
      // restore inline position if we changed it
      el.style.position = prevInlinePosition;
      el._glitchStaticActive = false;
    }, duration);

    // Safety: if the element is removed earlier, ensure intervals cleaned (optional)
    // attach references so caller could clear if needed
    canvas._glitchCleanup = () => {
      clearInterval(noiseInterval);
      clearTimeout(removalTimeout);
      try { el.removeChild(canvas); } catch (e) {}
      el.style.position = prevInlinePosition;
      el._glitchStaticActive = false;
    };
  }

  // Main update loop (applies glitch transforms and sometimes creates static overlay)
  function updateGlitches() {
    const elements = document.querySelectorAll('.effect-glitch');

    elements.forEach(el => {
      // glitch transform/clip (unchanged feel)
      if (Math.random() < GLITCH_CHANCE) {
        const x = (Math.random() * 2 - 1) * GLITCH_TRANSLATE;
        const y = (Math.random() * 2 - 1) * GLITCH_TRANSLATE;
        const top = Math.random() * GLITCH_CLIP;
        const right = Math.random() * GLITCH_CLIP;
        const bottom = Math.random() * GLITCH_CLIP;
        const left = Math.random() * GLITCH_CLIP;

        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.clipPath = `inset(${top}% ${right}% ${bottom}% ${left}%)`;
      } else {
        el.style.transform = '';
        el.style.clipPath = '';
      }

      // static independently
      if (Math.random() < STATIC_CHANCE) {
        createTextMaskedAnimatedStatic(el);
      }
    });
  }

  setInterval(updateGlitches, GLITCH_INTERVAL);
})();
