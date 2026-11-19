// GTA 6 Cover Art Studio — the cover composer.
//
// renderCover() assembles one finished cover on any canvas: the tropical
// sunset background, the illustrated photo panels (Single Hero Poster or
// Classic Multi-Panel Collage), the thick GTA-style frame, the original
// "GRAND THEFT AUTO VI" lettering with a giant gradient "VI" behind it,
// the custom caption and the optional badges. Everything is drawn with
// canvas primitives — no image files, no fonts from the network, so the
// export is identical offline.
//
// Panel geometry is in cover fractions so the same code renders the
// 1080 x 1350 portrait, the 1080 x 1080 square and the 1920 x 1080 wide
// cover. `scale` renders the illustration pipeline at a fraction of the
// final size (0.5 for the live preview, 1 for export).

import { frameSource, frameContain, illustrate, halftoneDots } from './grade.js';
import { drawSunset } from './background.js';

// Panel rectangles (fractions of the panel area, which is the top 72% of
// the cover; the bottom 28% is the title zone).
export function panelRects(layout, W, H) {
  const areaH = H * 0.72;
  if (layout === 'collage') {
    return [
      { x: 0.015, y: 0.015, w: 0.565, h: 0.335 },
      { x: 0.60, y: 0.015, w: 0.385, h: 0.335 },
      { x: 0.015, y: 0.375, w: 0.47, h: 0.325 },
      { x: 0.505, y: 0.375, w: 0.48, h: 0.325 },
    ].map(r => ({ x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H }));
  }
  return [{ x: W * 0.03, y: H * 0.03, w: W * 0.94, h: areaH - H * 0.05 }];
}

// Draw one illustrated panel: crop the photo into the rect with that
// panel's own zoom/pan/flip, run the cel-shade pipeline, then frame it
// with a thick black border. The hero panel fits the whole portrait
// (letterboxed over the sunset) when it is near-square, so a tall
// portrait is never decapitated; a very wide hero panel fills edge to
// edge instead, or the portrait would drown in sunset bars. Collage
// panels always fill their rects edge to edge.
function drawPanel(ctx, rect, photo, state, scale, transform, contain) {
  const t = transform || { zoom: 1, panX: 0, panY: 0, flip: false };
  const pw = Math.max(120, Math.round(rect.w * scale));
  const ph = Math.max(120, Math.round(rect.h * scale));
  const letterbox = (contain && rect.w / rect.h < 1.2)
    || (state.frameMode === 'fit' && state.layout === 'hero');
  // Wide cover-fit panels bias the crop toward the top of the photo, so
  // a portrait's head is framed instead of decapitated (the crop window
  // is much shorter than the photo, so centring it cuts the hair off).
  const wide = !letterbox && rect.w / rect.h >= 1.2;
  const effective = wide ? { ...t, panY: t.panY + 1.5 } : t;
  const framed = letterbox
    ? frameContain(photo, pw, ph, t.zoom, t.panX, t.panY, t.flip)
    : frameSource(photo, pw, ph, effective.zoom, effective.panX, effective.panY, effective.flip);
  const art = illustrate(framed, {
    illustration: state.illustration,
    ink: state.ink,
    rim: state.rim,
    warmth: state.warmth,
  });
  if (letterbox) {
    // Sunset behind the letterboxed portrait, inside the panel.
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    state.palette.sky.forEach((stop, i) => g.addColorStop(i / (state.palette.sky.length - 1), stop));
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.drawImage(art, rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.strokeStyle = '#0d0b14';
  ctx.lineWidth = Math.max(4, rect.w * 0.012);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function outlinedText(ctx, text, x, y, font, fill, strokeWidth) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0d0b14';
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

// The original "GRAND THEFT AUTO VI" lettering: white condensed capitals
// with a thick black outline, over a giant gradient "VI" (neon palm
// gradient: magenta -> orange -> gold) with palm silhouettes inside it.
function drawLogo(ctx, W, H, palette) {
  const zoneY = H * 0.72, zoneH = H * 0.28;
  const cx = W / 2;
  // Giant VI in the middle of the title zone, small enough that the
  // words above it and the caption below it never touch it.
  const viSize = zoneH * 0.46;
  const viCanvas = document.createElement('canvas');
  viCanvas.width = Math.ceil(viSize * 1.5);
  viCanvas.height = Math.ceil(viSize * 1.15);
  const vctx = viCanvas.getContext('2d');
  const viGrad = vctx.createLinearGradient(0, 0, viCanvas.width, viCanvas.height);
  viGrad.addColorStop(0, '#ff2a85');
  viGrad.addColorStop(0.55, '#ff7b39');
  viGrad.addColorStop(1, '#ffd166');
  vctx.font = `900 ${viSize}px "Arial Black", Impact, sans-serif`;
  vctx.textAlign = 'center';
  vctx.textBaseline = 'middle';
  vctx.lineJoin = 'round';
  vctx.strokeStyle = '#0d0b14';
  vctx.lineWidth = viSize * 0.07;
  vctx.strokeText('VI', viCanvas.width / 2, viCanvas.height / 2);
  vctx.fillStyle = viGrad;
  vctx.fillText('VI', viCanvas.width / 2, viCanvas.height / 2);
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.drawImage(viCanvas, cx - viCanvas.width / 2, zoneY + zoneH * 0.50 - viCanvas.height / 2);
  ctx.restore();
  // The words over the top of the zone, clear of the VI.
  const wordSize = Math.min(W * 0.075, zoneH * 0.20);
  outlinedText(ctx, 'GRAND THEFT AUTO', cx, zoneY + zoneH * 0.11,
    `900 ${wordSize}px "Arial Black", Impact, sans-serif`, '#ffffff', wordSize * 0.16);
}

// The custom caption, in poster style, at the chosen position.
function drawCaption(ctx, W, H, state) {
  const text = (state.caption || 'WELCOME TO LEONIDA').toUpperCase();
  const base = Math.min(W * 0.062, H * 0.042) * (state.captionSize / 100);
  const font = `900 ${base}px "Arial Black", Impact, sans-serif`;
  let x = W / 2, y = H * 0.955;
  if (state.captionPos === 'top') { x = W / 2; y = H * 0.035; }
  if (state.captionPos === 'corner') { x = W * 0.74; y = H * 0.955; }
  ctx.save();
  ctx.shadowColor = 'rgba(13, 11, 20, 0.9)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = base * 0.12;
  outlinedText(ctx, text, x, y, font, state.captionColor, base * 0.16);
  ctx.restore();
}

// Optional badges: M rating, VICE CITY emblem, LEONIDA EDITION ribbon,
// NEW starburst.
function drawBadges(ctx, W, H, state) {
  if (state.badgeM) {
    const s = W * 0.085;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0d0b14';
    ctx.lineWidth = 4;
    ctx.fillRect(W * 0.03, H * 0.815, s, s * 1.18);
    ctx.strokeRect(W * 0.03, H * 0.815, s, s * 1.18);
    ctx.fillStyle = '#0d0b14';
    ctx.font = `900 ${s * 0.62}px "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', W * 0.03 + s / 2, H * 0.815 + s * 0.48);
    ctx.font = `700 ${s * 0.11}px Arial, sans-serif`;
    ctx.fillText('MATURE 17+', W * 0.03 + s / 2, H * 0.815 + s * 1.02);
    ctx.restore();
  }
  if (state.badgeVice) {
    // Top-left, clear of the ribbon and the starburst.
    const bw = W * 0.30, bh = H * 0.032;
    ctx.save();
    ctx.fillStyle = 'rgba(13, 11, 20, 0.85)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W * 0.03, H * 0.028, bw, bh, bh / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.font = `900 ${bh * 0.58}px "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VICE CITY', W * 0.03 + bw / 2, H * 0.028 + bh / 2 + 1);
    ctx.restore();
  }
  if (state.badgeRibbon) {
    // Diagonal corner ribbon, anchored so the whole text stays on-canvas:
    // a shorter band centred inside the corner, small type.
    ctx.save();
    ctx.translate(W * 0.88, H * 0.12);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ff2a85';
    ctx.fillRect(-W * 0.18, -H * 0.015, W * 0.36, H * 0.03);
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${H * 0.0145}px "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEONIDA EDITION', 0, 1);
    ctx.restore();
  }
  if (state.badgeBurst) {
    // Lower on the right edge, clear of the ribbon and the emblem.
    const cx = W * 0.90, cy = H * 0.32, r = W * 0.055;
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#0d0b14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.72;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0d0b14';
    ctx.font = `900 ${r * 0.34}px "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW', cx, cy - r * 0.12);
    ctx.font = `900 ${r * 0.24}px "Arial Black", sans-serif`;
    ctx.fillText('2026', cx, cy + r * 0.22);
    ctx.restore();
  }
}

// Assemble the whole cover. `photos` is an array of image/canvas sources;
// state.panelPhotos maps each panel index to a photo index.
export function renderCover(ctx, W, H, state, photos, scale = 1) {
  const palette = state.palette;
  drawSunset(ctx, W, H, palette, 0.40);
  const rects = panelRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    const photo = photos[state.panelPhotos[i % state.panelPhotos.length] ?? 0] ?? photos[0];
    if (photo) drawPanel(ctx, rect, photo, state, scale, state.panelTransforms[i], state.layout === 'hero');
  });
  // A light halftone print texture over the whole cover.
  halftoneDots(ctx, W, H, Math.max(6, W * 0.008), 0.10);
  // A subtle dark scrim over the title zone: it quiets the sea
  // reflection behind the logo and keeps the lettering high-contrast.
  const scrim = ctx.createLinearGradient(0, H * 0.72, 0, H);
  scrim.addColorStop(0, 'rgba(13, 11, 20, 0)');
  scrim.addColorStop(1, 'rgba(13, 11, 20, 0.5)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.72, W, H * 0.28);
  // Thick GTA-style box frame with a thin gold inner line.
  ctx.save();
  ctx.strokeStyle = '#0d0b14';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(5, 5, W - 10, H - 10, 26);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(16, 16, W - 32, H - 32, 20);
  ctx.stroke();
  ctx.restore();
  drawLogo(ctx, W, H, palette);
  drawCaption(ctx, W, H, state);
  drawBadges(ctx, W, H, state);
}
