// GTA 6 Cover Art Studio — the illustration pipeline.
//
// illustrate() turns ANY photo (or a procedural portrait canvas) into
// GTA-style poster art: it smooths skin texture flat, flattens colours
// into a few bold poster bands, inks the strong edges black, and lays a
// duotone sunset rim-light over the subject — magenta on the left, warm
// orange/cyan on the right. The result is an illustration, never a photo
// with a tint.
//
// Everything runs on ImageData in plain JavaScript, so it works offline.
// Preview renders run at half resolution for speed; export re-runs the
// same pipeline at full resolution.

// One 3x3 box-blur pass over raw RGBA bytes. Two passes are enough to
// flatten skin texture while keeping the big shapes.
function boxBlurOnce(data, w, h) {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const i = (yy * w + xx) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
      }
      const i = (y * w + x) * 4;
      out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n; out[i + 3] = data[i + 3];
    }
  }
  return out;
}

// Sobel edge magnitude (0..255) from a luminance array.
function sobelEdges(lum, w, h) {
  const edge = new Float32Array(w * h);
  const gxK = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gyK = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0;
      for (let k = 0; k < 9; k++) {
        const xx = x + (k % 3) - 1, yy = y + ((k / 3) | 0) - 1;
        const v = lum[yy * w + xx];
        gx += v * gxK[k]; gy += v * gyK[k];
      }
      edge[y * w + x] = Math.min(255, Math.hypot(gx, gy) / 4);
    }
  }
  return edge;
}

// Crop + scale a source image/canvas into a fresh canvas of w x h, with
// zoom (1 = fit), pan (-1..1) and an optional horizontal mirror.
export function frameSource(source, w, h, zoom, panX, panY, flip) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale, dh = sh * scale;
  let dx = (w - dw) / 2 + panX * w * 0.25;
  let dy = (h - dh) / 2 + panY * h * 0.25;
  // Clamp so the crop can never leave a gap at an edge.
  dx = Math.min(0, Math.max(w - dw, dx));
  dy = Math.min(0, Math.max(h - dh, dy));
  ctx.save();
  if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(source, dx, dy, dw, dh);
  ctx.restore();
  return canvas;
}

// Fit the WHOLE source inside w x h (letterboxed, transparent margins),
// so a tall portrait is never decapitated by a wide panel. Zoom, pan and
// flip still apply, around the fitted position: zoom 1 shows the whole
// portrait, zoom 2 crops into it.
export function frameContain(source, w, h, zoom = 1, panX = 0, panY = 0, flip = false) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const scale = Math.min(w / sw, h / sh) * zoom;
  const dw = sw * scale, dh = sh * scale;
  const dx = (w - dw) / 2 + panX * w * 0.25;
  const dy = (h - dh) / 2 + panY * h * 0.25;
  ctx.save();
  if (flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(source, dx, dy, dw, dh);
  ctx.restore();
  return canvas;
}

// The full poster-art pipeline. opts:
//   illustration 0..1 (posterize depth + smoothing), ink 0..1 (edge black),
//   rim 0..1 (sunset rim-light), warmth 0..1 (extra warm saturation).
export function illustrate(sourceCanvas, opts) {
  const w = sourceCanvas.width, h = sourceCanvas.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);
  const image = ctx.getImageData(0, 0, w, h);
  let data = image.data;

  // 1. Smooth: flatten texture into flat colour fields.
  const passes = opts.illustration > 0.5 ? 2 : 1;
  for (let p = 0; p < passes; p++) data = boxBlurOnce(data, w, h);

  // 2. Luminance + Sobel edges (computed on the smoothed image).
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  const edge = sobelEdges(lum, w, h);

  // 3. Posterize: few flat bands, more bands when illustration is low.
  const levels = Math.max(3, Math.round(9 - opts.illustration * 5));
  const step = 255 / (levels - 1);
  const inkCut = 255 - opts.ink * 170; // edge strength needed to become ink
  const rimMagenta = [255, 42, 133];
  const rimOrange = [255, 123, 57];
  const rimCyan = [0, 240, 255];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const p = i;
      let r = data[p], g = data[p + 1], b = data[p + 2];
      // Posterize each channel.
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
      // Warmth: push reds and golds, pull blues down a touch.
      r = Math.min(255, r * (1 + 0.12 * opts.warmth));
      b = Math.max(0, b * (1 - 0.10 * opts.warmth));
      // Saturation lift so the bands read as print ink, not mud.
      const avg = (r + g + b) / 3;
      const sat = 1.18;
      r = Math.max(0, Math.min(255, avg + (r - avg) * sat));
      g = Math.max(0, Math.min(255, avg + (g - avg) * sat));
      b = Math.max(0, Math.min(255, avg + (b - avg) * sat));
      // 4. Ink: strong edges go near-black, scaled by the Ink slider.
      const e = edge[y * w + x];
      if (e > inkCut) {
        const k = Math.min(1, (e - inkCut) / 60) * opts.ink;
        r *= 1 - 0.92 * k; g *= 1 - 0.92 * k; b *= 1 - 0.92 * k;
      }
      // 5. Duotone sunset rim-light: magenta on the left third, warm
      // orange on the right third, a cyan kiss at the far right edge.
      // It follows brightness, so it reads as light on the subject.
      const bright = lum[y * w + x] / 255;
      const side = x / w;
      let rim = null, amount = 0;
      if (side < 0.34) { rim = rimMagenta; amount = (0.34 - side) / 0.34; }
      else if (side > 0.66) { rim = side > 0.9 ? rimCyan : rimOrange; amount = (side - 0.66) / 0.34; }
      if (rim && opts.rim > 0) {
        const a = amount * opts.rim * (0.25 + 0.75 * bright);
        r = r * (1 - a) + rim[0] * a;
        g = g * (1 - a) + rim[1] * a;
        b = b * (1 - a) + rim[2] * a;
      }
      data[p] = r; data[p + 1] = g; data[p + 2] = b;
    }
  }
  ctx.putImageData(new ImageData(data, w, h), 0, 0);
  return canvas;
}

// Halftone dots over a canvas: small dark dots whose size grows in the
// shadows, the print texture of a comic-book cover.
export function halftoneDots(ctx, w, h, cell, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#1a0b2e';
  for (let y = cell; y < h; y += cell) {
    for (let x = cell; x < w; x += cell) {
      const shade = 0.5 + 0.5 * Math.sin(x * 0.013 + y * 0.017);
      const r = cell * 0.16 * shade + cell * 0.08;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
