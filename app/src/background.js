// GTA 6 Cover Art Studio — the Vice City background engine.
//
// drawSunset() paints the iconic GTA VI sky on any canvas: a neon-purple
// to magenta to sunset-orange to sun-gold gradient, a big retro synthwave
// sun cut by horizontal stripes, a dark skyline, palm-tree silhouettes
// and a glittering sea reflection. drawPalms() and drawSkyline() are the
// reusable silhouette painters; every preset is just a different palette.

export const PALETTES = {
  sunset: {
    sky: ['#2b0f54', '#7a1c6e', '#d92b6b', '#ff7b39', '#ffd166'],
    sun: '#ffd166', sunCore: '#fff3c4', sea: '#3a0f5e', seaLight: '#ff7b39',
    silhouette: '#160a2e', label: 'Vice Sunset',
  },
  neon: {
    sky: ['#0d0221', '#2b0f54', '#ff2a85', '#7b2fff', '#00f0ff'],
    sun: '#ff2a85', sunCore: '#ffb3d9', sea: '#0d0221', seaLight: '#00f0ff',
    silhouette: '#08011a', label: 'Neon Nightlife',
  },
  miami: {
    sky: ['#063a3a', '#0e6b6b', '#ff5e8a', '#ff9a3d', '#ffe08a'],
    sun: '#ffe08a', sunCore: '#fffbe0', sea: '#04303a', seaLight: '#ff9a3d',
    silhouette: '#032227', label: 'Miami Heat',
  },
  collage: {
    sky: ['#2b0f54', '#8a2470', '#e0397a', '#ff8a4c', '#ffd166'],
    sun: '#ffd166', sunCore: '#fff3c4', sea: '#2b0f54', seaLight: '#ff8a4c',
    silhouette: '#160a2e', label: 'Classic Box Collage',
  },
};

// One palm tree: a curved trunk and seven drooping fronds, all silhouette.
export function drawPalm(ctx, x, y, size, colour) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(4, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size * 0.08, y - size * 0.55, x + size * 0.02, y - size);
  ctx.stroke();
  const topX = x + size * 0.02, topY = y - size;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.92) + (i / 6) * Math.PI * 0.84;
    const len = size * (0.42 + (i % 2) * 0.1);
    const cx = topX + Math.cos(a) * len * 0.55;
    const cy = topY + Math.sin(a) * len * 0.55 + size * 0.16;
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len + size * 0.34;
    ctx.lineWidth = Math.max(3, size * 0.03);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

// A dark Ocean Drive skyline with a few lit windows.
export function drawSkyline(ctx, w, y, h, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  let x = 0;
  let seed = 7;
  const next = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w) {
    const bw = w * (0.06 + next() * 0.08);
    const bh = h * (0.35 + next() * 0.65);
    ctx.fillRect(x, y - bh, bw, bh);
    ctx.fillStyle = '#ffd166';
    for (let k = 0; k < 4; k++) {
      if (next() > 0.55) ctx.fillRect(x + bw * (0.2 + next() * 0.6), y - bh + h * 0.1 + next() * bh * 0.6, 3, 4);
    }
    ctx.fillStyle = colour;
    x += bw + w * 0.012;
  }
  ctx.restore();
}

// The full sunset scene. `sunY` is the sun's centre as a fraction of h.
export function drawSunset(ctx, w, h, palette, sunY = 0.42) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  palette.sky.forEach((stop, i) => sky.addColorStop(i / (palette.sky.length - 1), stop));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Synthwave sun: a glowing disc, cut by horizontal stripes low down.
  const sunR = w * 0.21;
  const sunX = w * 0.5, sunCy = h * sunY;
  const glow = ctx.createRadialGradient(sunX, sunCy, sunR * 0.2, sunX, sunCy, sunR * 1.7);
  glow.addColorStop(0, palette.sun);
  glow.addColorStop(1, 'rgba(255, 42, 133, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunCy, sunR, 0, Math.PI * 2);
  ctx.clip();
  const core = ctx.createLinearGradient(0, sunCy - sunR, 0, sunCy + sunR);
  core.addColorStop(0, palette.sunCore);
  core.addColorStop(1, palette.sun);
  ctx.fillStyle = core;
  ctx.fillRect(sunX - sunR, sunCy - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = palette.sky[1];
  let stripeY = sunCy + sunR * 0.05, stripeH = 3;
  while (stripeY < sunCy + sunR) {
    ctx.fillRect(sunX - sunR, stripeY, sunR * 2, stripeH);
    stripeY += stripeH + sunR * 0.13;
    stripeH += 3;
  }
  ctx.restore();

  // Sea: the bottom band, with the sun's reflection as bright dashes.
  const seaTop = h * 0.78;
  ctx.fillStyle = palette.sea;
  ctx.fillRect(0, seaTop, w, h - seaTop);
  ctx.fillStyle = palette.seaLight;
  for (let i = 0; i < 26; i++) {
    const yy = seaTop + ((i * 37) % Math.max(1, h - seaTop - 8));
    const ww = w * (0.04 + ((i * 53) % 10) / 100);
    ctx.globalAlpha = 0.25 + ((i * 29) % 10) / 22;
    ctx.fillRect(w * 0.5 - ww / 2 + ((i % 2) ? 14 : -14), yy, ww, 3);
  }
  ctx.globalAlpha = 1;

  // Skyline sits on the horizon, palms frame the sides.
  drawSkyline(ctx, w, seaTop + 2, h * 0.16, palette.silhouette);
  drawPalm(ctx, w * 0.04, seaTop + 4, h * 0.30, palette.silhouette);
  drawPalm(ctx, w * 0.96, seaTop + 4, h * 0.24, palette.silhouette);
  drawPalm(ctx, w * 0.88, seaTop + 4, h * 0.17, palette.silhouette);
}
