// GTA 6 Cover Art Studio — the four built-in sample portraits.
//
// Every portrait is drawn with code (vector shapes on canvas), never a
// photo and never copied artwork: four original stylised characters, each
// with a distinct scene, so the cover is finished the moment the page
// opens. Each draw function paints one full-bleed portrait on the given
// context at the given size, and the cel-shade pipeline in grade.js then
// turns it into poster art, exactly like a user photo.
//
// Faces are built from bold, high-contrast shapes — layered hair strands,
// brows, nose bridge, full lips, ears, neck shadow, clothing with folds
// and fasteners — because the posterize + Sobel pipeline flattens thin
// lines away. Every feature below is a chunky shape with its own value
// step, so it survives the pipeline and still reads at 300 px wide.

import { drawPalm } from './background.js';

function sky(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---- shared face helpers (all sizes in fractions of the face width w) ----

// Face ellipse with cheek shading on one side and a forehead highlight.
function faceBase(ctx, cx, cy, rx, ry, skin, shade, light) {
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.55, cy + ry * 0.25, rx * 0.75, ry * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.35, cy - ry * 0.55, rx * 0.55, ry * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// Ears at the sides of the face, with an inner-ear arc.
function ears(ctx, cx, cy, rx, ry, skin, shade) {
  for (const side of [-1, 1]) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(cx + side * rx * 0.98, cy + ry * 0.05, rx * 0.13, ry * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = shade;
    ctx.lineWidth = Math.max(3, rx * 0.03);
    ctx.beginPath();
    ctx.arc(cx + side * rx * 0.98, cy + ry * 0.05, rx * 0.07, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
  }
}

// Neck with a shadow band under the chin.
function neck(ctx, cx, y, w, h, skin, shade) {
  ctx.fillStyle = skin;
  ctx.fillRect(cx - w * 0.07, y, w * 0.14, h);
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(cx - w * 0.07, y, w * 0.14, h * 0.28);
  ctx.globalAlpha = 1;
}

// Thick eyebrow arcs, one per side, angled for expression.
function brows(ctx, cx, cy, w, colour, lift = 0) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(4, w * 0.035);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * w * 0.26, cy + lift, w * 0.17, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
}

// Nose: a soft bridge wedge, nostril dots and the shadow under the nose.
function nose(ctx, cx, cy, w, shade) {
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.03, cy - w * 0.16);
  ctx.lineTo(cx + w * 0.03, cy - w * 0.16);
  ctx.lineTo(cx + w * 0.05, cy + w * 0.10);
  ctx.lineTo(cx - w * 0.05, cy + w * 0.10);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#3a0f1e';
  ctx.beginPath();
  ctx.arc(cx - w * 0.045, cy + w * 0.10, w * 0.014, 0, Math.PI * 2);
  ctx.arc(cx + w * 0.045, cy + w * 0.10, w * 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(cx, cy + w * 0.14, w * 0.09, w * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Full lips: dark upper lip, lighter lower lip with a shine, smile curve.
function lips(ctx, cx, cy, w, dark = '#8a1f35', light = '#d95f6e') {
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.16, cy);
  ctx.quadraticCurveTo(cx, cy - w * 0.07, cx + w * 0.16, cy);
  ctx.quadraticCurveTo(cx, cy + w * 0.06, cx - w * 0.16, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.14, cy + w * 0.01);
  ctx.quadraticCurveTo(cx, cy + w * 0.10, cx + w * 0.14, cy + w * 0.01);
  ctx.quadraticCurveTo(cx, cy + w * 0.05, cx - w * 0.14, cy + w * 0.01);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.04, cy + w * 0.045, w * 0.045, w * 0.012, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy - w * 0.005, w * 0.10, w * 0.018, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Sunglasses with lens shine, bridge and temple arms to the ears.
function sunglasses(ctx, cx, cy, w, colour = '#160a2e') {
  ctx.fillStyle = colour;
  const lensW = w * 0.42, lensH = w * 0.30;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(cx + side * w * 0.26 - lensW / 2, cy - lensH / 2, lensW, lensH, lensH * 0.45);
    ctx.fill();
    // Temple arm to the ear.
    ctx.fillRect(cx + side * w * 0.47, cy - lensH * 0.1, w * 0.10, Math.max(4, lensH * 0.14));
  }
  ctx.fillRect(cx - w * 0.06, cy - 3, w * 0.12, 6);
  // Diagonal lens shine.
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = Math.max(3, w * 0.02);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * w * 0.26 - w * 0.10, cy + lensH * 0.16);
    ctx.lineTo(cx + side * w * 0.26 + w * 0.06, cy - lensH * 0.16);
    ctx.stroke();
  }
}

// One thick hair strand: a curved stroke from (x1,y1) to (x2,y2).
function strand(ctx, x1, y1, cx, cy, x2, y2, width, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
}

function shoulders(ctx, cx, y, w, h, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.55, y + h);
  ctx.quadraticCurveTo(cx - w * 0.5, y + h * 0.25, cx - w * 0.22, y);
  ctx.lineTo(cx + w * 0.22, y);
  ctx.quadraticCurveTo(cx + w * 0.5, y + h * 0.25, cx + w * 0.55, y + h);
  ctx.closePath();
  ctx.fill();
}

// Cloth fold: a dark curved stroke over a garment.
function fold(ctx, x1, y1, cx, cy, x2, y2, width, colour) {
  strand(ctx, x1, y1, cx, cy, x2, y2, width, colour);
}

// 1. "Curly" — a woman with big curly hair and sunglasses on a sunset street.
// Background: buildings with lit windows, a road, palms.
export function drawCurly(ctx, w, h) {
  sky(ctx, w, h, ['#ff9a3d', '#d92b6b', '#7a1c6e']);
  sunDisc(ctx, w * 0.72, h * 0.24, w * 0.13, '#ffd166');
  // Street buildings left and right, with lit windows.
  ctx.fillStyle = '#2a0f45';
  ctx.fillRect(0, h * 0.18, w * 0.16, h * 0.5);
  ctx.fillRect(w * 0.86, h * 0.14, w * 0.14, h * 0.54);
  ctx.fillStyle = '#ffd166';
  for (let k = 0; k < 4; k++) {
    ctx.fillRect(w * 0.03, h * (0.24 + k * 0.09), w * 0.035, h * 0.03);
    ctx.fillRect(w * 0.90, h * (0.20 + k * 0.09), w * 0.035, h * 0.03);
  }
  // Road with centre dashes at the bottom.
  ctx.fillStyle = '#1c0b33';
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
  ctx.fillStyle = '#ffd166';
  for (let i = 0; i < 5; i++) ctx.fillRect(w * (0.06 + i * 0.2), h * 0.935, w * 0.08, h * 0.012);
  drawPalm(ctx, w * 0.06, h * 0.9, h * 0.30, '#160a2e');
  drawPalm(ctx, w * 0.95, h * 0.9, h * 0.24, '#160a2e');

  const cx = w * 0.5, cy = h * 0.42;
  // Pink top: V-neck, gold zipper, folds, sleeve seams.
  shoulders(ctx, cx, h * 0.66, w * 0.9, h * 0.34, '#ff2a85');
  ctx.fillStyle = '#c2145e';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.09, h * 0.66);
  ctx.lineTo(cx, h * 0.76);
  ctx.lineTo(cx + w * 0.09, h * 0.66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(cx - 3, h * 0.76, 6, h * 0.24);
  fold(ctx, cx - w * 0.28, h * 0.72, cx - w * 0.32, h * 0.85, cx - w * 0.26, h * 0.99, Math.max(4, w * 0.008), 'rgba(120,10,60,0.7)');
  fold(ctx, cx + w * 0.28, h * 0.72, cx + w * 0.32, h * 0.85, cx + w * 0.26, h * 0.99, Math.max(4, w * 0.008), 'rgba(120,10,60,0.7)');
  // Neck and ears with gold hoop earrings.
  neck(ctx, cx, h * 0.52, w, h * 0.16, '#e8a06e', '#b06a3e');
  ears(ctx, cx, cy, w * 0.21, h * 0.155, '#f2b183', '#b06a3e');
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(4, w * 0.012);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + side * w * 0.215, cy + h * 0.10, w * 0.028, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Hair mass behind the face, then three rings of curls in three shades.
  ctx.fillStyle = '#241028';
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.02, w * 0.27, h * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();
  const curlShades = ['#241028', '#3a1a3a', '#54264a'];
  for (let ring = 0; ring < 3; ring++) {
    ctx.fillStyle = curlShades[ring];
    const n = 16 - ring * 3;
    const rr = w * (0.245 - ring * 0.028);
    const ry = h * (0.175 - ring * 0.02);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.35;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rr, cy - h * 0.02 + Math.sin(a) * ry,
        w * (0.052 - ring * 0.006) + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Highlight strands sweeping over the crown.
  strand(ctx, cx - w * 0.20, cy - h * 0.14, cx - w * 0.10, cy - h * 0.22, cx + w * 0.02, cy - h * 0.17, Math.max(5, w * 0.012), '#8a4a5a');
  strand(ctx, cx - w * 0.08, cy - h * 0.18, cx + w * 0.05, cy - h * 0.24, cx + w * 0.18, cy - h * 0.16, Math.max(5, w * 0.012), '#8a4a5a');
  strand(ctx, cx + w * 0.10, cy - h * 0.17, cx + w * 0.20, cy - h * 0.10, cx + w * 0.22, cy - h * 0.02, Math.max(5, w * 0.012), '#6a3048');
  // Face: shading, brows, glasses, nose, lips.
  faceBase(ctx, cx, cy, w * 0.21, h * 0.155, '#f2b183', '#c07a4e', '#ffd9b0');
  brows(ctx, cx, cy - h * 0.075, w * 0.30, '#241028', -h * 0.012);
  sunglasses(ctx, cx, cy - h * 0.015, w * 0.34);
  nose(ctx, cx, cy + h * 0.01, w * 0.30, '#c07a4e');
  lips(ctx, cx, cy + h * 0.095, w * 0.30);
}

// 2. "Blazer" — a man in a pink blazer leaning on a classic car, city behind.
// Background: skyline with lit windows, a palm, the car hood + windshield.
export function drawBlazer(ctx, w, h) {
  sky(ctx, w, h, ['#00c2d8', '#ff5e8a', '#ff9a3d']);
  sunDisc(ctx, w * 0.22, h * 0.20, w * 0.11, '#ffe08a');
  // Skyline.
  ctx.fillStyle = '#1c2a4a';
  for (let i = 0; i < 5; i++) {
    const bw = w * 0.13, bx = w * (0.04 + i * 0.19);
    ctx.fillRect(bx, h * (0.30 - (i % 3) * 0.05), bw, h * 0.42);
    ctx.fillStyle = '#ffd166';
    for (let k = 0; k < 3; k++) ctx.fillRect(bx + bw * 0.2, h * (0.34 + k * 0.07), 4, 5);
    ctx.fillStyle = '#1c2a4a';
  }
  drawPalm(ctx, w * 0.92, h * 0.72, h * 0.26, '#12303a');
  // The car: hood, windshield with reflection, headlights, grille.
  ctx.fillStyle = '#2fd6e8';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.86);
  ctx.quadraticCurveTo(w * 0.5, h * 0.70, w, h * 0.86);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d2b33';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.80, w * 0.42, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = Math.max(4, w * 0.01);
  ctx.beginPath();
  ctx.moveTo(w * 0.30, h * 0.78);
  ctx.lineTo(w * 0.70, h * 0.74);
  ctx.stroke();
  for (const hx of [0.16, 0.84]) {
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(w * hx, h * 0.90, w * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d2b33';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.fillStyle = '#0d2b33';
  for (let i = 0; i < 3; i++) ctx.fillRect(w * 0.42, h * (0.90 + i * 0.02), w * 0.16, 4);

  const cx = w * 0.5, cy = h * 0.40;
  // Blazer: lapels, white shirt + collar, buttons, pocket square, folds.
  shoulders(ctx, cx, h * 0.62, w * 0.95, h * 0.38, '#ff5e8a');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.10, h * 0.62);
  ctx.lineTo(cx, h * 0.78);
  ctx.lineTo(cx + w * 0.10, h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d13a6e';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * w * 0.02, h * 0.63);
    ctx.lineTo(cx + side * w * 0.13, h * 0.70);
    ctx.lineTo(cx + side * w * 0.05, h * 0.80);
    ctx.lineTo(cx + side * w * 0.015, h * 0.72);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.10, h * 0.62);
  ctx.lineTo(cx - w * 0.03, h * 0.67);
  ctx.lineTo(cx - w * 0.10, h * 0.70);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + w * 0.10, h * 0.62);
  ctx.lineTo(cx + w * 0.03, h * 0.67);
  ctx.lineTo(cx + w * 0.10, h * 0.70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1d1216';
  ctx.beginPath();
  ctx.arc(cx, h * 0.84, w * 0.014, 0, Math.PI * 2);
  ctx.arc(cx, h * 0.92, w * 0.014, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.24, h * 0.72);
  ctx.lineTo(cx - w * 0.16, h * 0.72);
  ctx.lineTo(cx - w * 0.20, h * 0.77);
  ctx.closePath();
  ctx.fill();
  fold(ctx, cx - w * 0.34, h * 0.70, cx - w * 0.38, h * 0.84, cx - w * 0.32, h * 0.98, Math.max(4, w * 0.008), 'rgba(120,20,70,0.7)');
  fold(ctx, cx + w * 0.34, h * 0.70, cx + w * 0.38, h * 0.84, cx + w * 0.32, h * 0.98, Math.max(4, w * 0.008), 'rgba(120,20,70,0.7)');
  // Neck, ears, face.
  neck(ctx, cx, h * 0.50, w, h * 0.14, '#d89a6a', '#a05e38');
  ears(ctx, cx, cy, w * 0.185, h * 0.14, '#e8b083', '#a05e38');
  faceBase(ctx, cx, cy, w * 0.185, h * 0.14, '#e8b083', '#b06a3e', '#ffcf9e');
  // Short side-parted hair: mass + combed strands + sideburns.
  ctx.fillStyle = '#1d1216';
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.115, w * 0.185, h * 0.075, 0, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    strand(ctx, cx - w * 0.14 + t * w * 0.10, cy - h * 0.16,
      cx - w * 0.06 + t * w * 0.12, cy - h * 0.20,
      cx + w * 0.04 + t * w * 0.12, cy - h * 0.13,
      Math.max(4, w * 0.009), i % 2 ? '#3a2428' : '#1d1216');
  }
  ctx.fillStyle = '#1d1216';
  ctx.fillRect(cx - w * 0.20, cy - h * 0.02, w * 0.025, h * 0.06);
  ctx.fillRect(cx + w * 0.175, cy - h * 0.02, w * 0.025, h * 0.06);
  brows(ctx, cx, cy - h * 0.07, w * 0.28, '#1d1216', -h * 0.01);
  sunglasses(ctx, cx, cy - h * 0.01, w * 0.30);
  nose(ctx, cx, cy + h * 0.01, w * 0.28, '#b06a3e');
  lips(ctx, cx, cy + h * 0.085, w * 0.26);
}

// 3. "Pier Couple" — a laughing couple on a pier at golden hour.
// Background: sun over the sea, gulls, pier railing, wooden planks.
export function drawPierCouple(ctx, w, h) {
  sky(ctx, w, h, ['#ffd166', '#ff7b39', '#d92b6b']);
  sunDisc(ctx, w * 0.5, h * 0.30, w * 0.15, '#fff3c4');
  // Gulls.
  ctx.strokeStyle = '#3a0f1e';
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.lineCap = 'round';
  for (const [gx, gy, gs] of [[0.18, 0.16, 1], [0.82, 0.12, 0.8], [0.68, 0.20, 0.6]]) {
    ctx.beginPath();
    ctx.arc(w * gx - w * 0.02 * gs, gy * h, w * 0.02 * gs, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w * gx + w * 0.02 * gs, gy * h, w * 0.02 * gs, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // Sea with sun reflection.
  ctx.fillStyle = '#1c4a6b';
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.fillStyle = '#ff9a3d';
  for (let i = 0; i < 12; i++) {
    ctx.globalAlpha = 0.5;
    ctx.fillRect(w * 0.42 + ((i % 2) ? 12 : -12), h * (0.65 + i * 0.025), w * 0.16, 3);
  }
  ctx.globalAlpha = 1;
  // Pier railing behind the couple: two rails + posts.
  ctx.fillStyle = '#4a2c14';
  ctx.fillRect(0, h * 0.56, w, h * 0.018);
  ctx.fillRect(0, h * 0.60, w, h * 0.014);
  for (let i = 0; i < 5; i++) ctx.fillRect(w * (0.05 + i * 0.22), h * 0.52, w * 0.02, h * 0.12);
  // Wooden planks at the bottom.
  ctx.fillStyle = '#6b4423';
  for (let i = 0; i < 6; i++) ctx.fillRect(0, h * (0.86 + i * 0.025), w, 4);

  // Woman, left: long wavy hair, white scoop-neck top, necklace.
  const wx = w * 0.34, wy = h * 0.42;
  // Long hair falling past the shoulders, in three shades.
  ctx.fillStyle = '#3a1c10';
  ctx.beginPath();
  ctx.ellipse(wx - w * 0.02, wy - h * 0.02, w * 0.20, h * 0.22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    strand(ctx, wx - w * 0.14 + i * w * 0.05, wy - h * 0.16,
      wx - w * 0.20 + i * w * 0.06, wy + h * 0.05,
      wx - w * 0.16 + i * w * 0.05, wy + h * 0.24,
      Math.max(5, w * 0.011), i % 2 ? '#5a2c16' : '#3a1c10');
  }
  strand(ctx, wx + w * 0.10, wy - h * 0.14, wx + w * 0.18, wy + h * 0.02, wx + w * 0.14, wy + h * 0.22, Math.max(5, w * 0.011), '#7a3a1e');
  shoulders(ctx, wx, h * 0.64, w * 0.62, h * 0.36, '#ffffff');
  ctx.fillStyle = '#f2b183';
  ctx.beginPath();
  ctx.ellipse(wx, h * 0.66, w * 0.09, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = Math.max(3, w * 0.007);
  ctx.beginPath();
  ctx.arc(wx, h * 0.66, w * 0.075, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(wx, h * 0.715, w * 0.012, 0, Math.PI * 2);
  ctx.fill();
  neck(ctx, wx, h * 0.52, w, h * 0.14, '#e8a06e', '#b06a3e');
  ears(ctx, wx, wy, w * 0.16, h * 0.125, '#f2b183', '#b06a3e');
  faceBase(ctx, wx, wy, w * 0.16, h * 0.125, '#f2b183', '#c07a4e', '#ffd9b0');
  // Open eyes with shine, brows, nose, open smile.
  ctx.fillStyle = '#160a2e';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(wx + side * w * 0.055, wy - h * 0.02, w * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(wx + side * w * 0.055 - w * 0.006, wy - h * 0.028, w * 0.006, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#160a2e';
  }
  brows(ctx, wx, wy - h * 0.055, w * 0.24, '#3a1c10', -h * 0.008);
  nose(ctx, wx, wy + h * 0.01, w * 0.24, '#c07a4e');
  lips(ctx, wx, wy + h * 0.07, w * 0.22);

  // Man, right, leaning in: short textured hair, teal shirt with collar.
  const mx = w * 0.68, my = h * 0.40;
  shoulders(ctx, mx, h * 0.64, w * 0.66, h * 0.36, '#2fd6e8');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(mx - w * 0.08, h * 0.64);
  ctx.lineTo(mx - w * 0.02, h * 0.68);
  ctx.lineTo(mx - w * 0.08, h * 0.71);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(mx + w * 0.08, h * 0.64);
  ctx.lineTo(mx + w * 0.02, h * 0.68);
  ctx.lineTo(mx + w * 0.08, h * 0.71);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d2b33';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(mx, h * (0.76 + i * 0.06), w * 0.011, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#0d2b33';
  ctx.fillRect(mx + w * 0.10, h * 0.74, w * 0.10, h * 0.10);
  neck(ctx, mx, h * 0.50, w, h * 0.14, '#d89a6a', '#a05e38');
  ears(ctx, mx, my, w * 0.16, h * 0.125, '#e8b083', '#a05e38');
  faceBase(ctx, mx, my, w * 0.16, h * 0.125, '#e8b083', '#b06a3e', '#ffcf9e');
  ctx.fillStyle = '#241028';
  ctx.beginPath();
  ctx.ellipse(mx, my - h * 0.10, w * 0.155, h * 0.06, 0, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    strand(ctx, mx - w * 0.12 + i * w * 0.05, my - h * 0.13,
      mx - w * 0.08 + i * w * 0.05, my - h * 0.17,
      mx - w * 0.02 + i * w * 0.05, my - h * 0.12,
      Math.max(4, w * 0.009), i % 2 ? '#3a2428' : '#241028');
  }
  ctx.fillStyle = '#160a2e';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(mx + side * w * 0.05, my - h * 0.015, w * 0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mx + side * w * 0.05 - w * 0.005, my - h * 0.022, w * 0.005, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#160a2e';
  }
  brows(ctx, mx, my - h * 0.05, w * 0.22, '#241028', -h * 0.008);
  nose(ctx, mx, my + h * 0.01, w * 0.22, '#b06a3e');
  lips(ctx, mx, my + h * 0.065, w * 0.22);
}

// 4. "Driver" — a driver in sunglasses at sunset, hands on the wheel.
// Background: sunset, rear-view mirror, dashboard with gauges.
export function drawDriver(ctx, w, h) {
  sky(ctx, w, h, ['#2b0f54', '#d92b6b', '#ff7b39']);
  sunDisc(ctx, w * 0.5, h * 0.26, w * 0.17, '#ffd166');
  // Rear-view mirror at the top.
  ctx.fillStyle = '#0d0b14';
  ctx.beginPath();
  ctx.roundRect(w * 0.36, h * 0.06, w * 0.28, h * 0.055, 8);
  ctx.fill();
  ctx.fillStyle = '#1c4a6b';
  ctx.beginPath();
  ctx.roundRect(w * 0.375, h * 0.068, w * 0.25, h * 0.04, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.10);
  ctx.lineTo(w * 0.58, h * 0.075);
  ctx.stroke();
  // Dashboard: dark band with three gauges.
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, h * 0.82, w, h * 0.18);
  for (let i = 0; i < 3; i++) {
    const gx = w * (0.28 + i * 0.22);
    ctx.strokeStyle = '#f4f0ff';
    ctx.lineWidth = Math.max(3, w * 0.008);
    ctx.beginPath();
    ctx.arc(gx, h * 0.91, w * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ff2a85';
    ctx.beginPath();
    ctx.moveTo(gx, h * 0.91);
    ctx.lineTo(gx + w * 0.03, h * 0.885);
    ctx.stroke();
  }

  const cx = w * 0.5, cy = h * 0.38;
  // Jacket: collar, zipper, shoulder seams.
  shoulders(ctx, cx, h * 0.60, w * 0.95, h * 0.40, '#123a4a');
  ctx.fillStyle = '#0a2531';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * w * 0.02, h * 0.61);
    ctx.lineTo(cx + side * w * 0.12, h * 0.68);
    ctx.lineTo(cx + side * w * 0.05, h * 0.76);
    ctx.lineTo(cx + side * w * 0.015, h * 0.69);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(cx - 2, h * 0.70, 4, h * 0.30);
  for (let i = 0; i < 6; i++) ctx.fillRect(cx - 6, h * (0.72 + i * 0.045), 12, 3);
  fold(ctx, cx - w * 0.34, h * 0.68, cx - w * 0.38, h * 0.82, cx - w * 0.32, h * 0.98, Math.max(4, w * 0.008), 'rgba(0,0,0,0.5)');
  fold(ctx, cx + w * 0.34, h * 0.68, cx + w * 0.38, h * 0.82, cx + w * 0.32, h * 0.98, Math.max(4, w * 0.008), 'rgba(0,0,0,0.5)');
  // Neck, ears, face with jaw stubble.
  neck(ctx, cx, h * 0.48, w, h * 0.14, '#e8a06e', '#b06a3e');
  ears(ctx, cx, cy, w * 0.20, h * 0.15, '#f2b183', '#b06a3e');
  faceBase(ctx, cx, cy, w * 0.20, h * 0.15, '#f2b183', '#c07a4e', '#ffd9b0');
  ctx.fillStyle = '#b06a3e';
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.115, w * 0.13, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Cap: dome, panel seams, brim, button; side hair + sideburns.
  ctx.fillStyle = '#ff2a85';
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.115, w * 0.20, h * 0.08, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#c2145e';
  ctx.lineWidth = Math.max(3, w * 0.007);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * w * 0.07, cy - h * 0.19);
    ctx.quadraticCurveTo(cx + side * w * 0.10, cy - h * 0.13, cx + side * w * 0.08, cy - h * 0.10);
    ctx.stroke();
  }
  ctx.fillStyle = '#ff2a85';
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.10, w * 0.24, h * 0.03, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.19, w * 0.015, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241028';
  ctx.fillRect(cx - w * 0.205, cy - h * 0.02, w * 0.025, h * 0.06);
  ctx.fillRect(cx + w * 0.18, cy - h * 0.02, w * 0.025, h * 0.06);
  brows(ctx, cx, cy - h * 0.07, w * 0.30, '#241028', -h * 0.01);
  sunglasses(ctx, cx, cy - h * 0.005, w * 0.32);
  nose(ctx, cx, cy + h * 0.01, w * 0.30, '#c07a4e');
  lips(ctx, cx, cy + h * 0.09, w * 0.28);
  // Steering wheel: full rim, three spokes, hub.
  ctx.strokeStyle = '#0d0b14';
  ctx.lineWidth = w * 0.035;
  ctx.beginPath();
  ctx.arc(cx, h * 0.86, w * 0.30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = w * 0.025;
  for (const a of [Math.PI * 1.5, Math.PI * 0.25, Math.PI * 0.75]) {
    ctx.beginPath();
    ctx.moveTo(cx, h * 0.86);
    ctx.lineTo(cx + Math.cos(a) * w * 0.30, h * 0.86 + Math.sin(a) * w * 0.30);
    ctx.stroke();
  }
  ctx.fillStyle = '#0d0b14';
  ctx.beginPath();
  ctx.arc(cx, h * 0.86, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff2a85';
  ctx.beginPath();
  ctx.arc(cx, h * 0.86, w * 0.02, 0, Math.PI * 2);
  ctx.fill();
}

export const SAMPLES = [
  { id: 'curly', name: 'Curly', draw: drawCurly },
  { id: 'blazer', name: 'Blazer', draw: drawBlazer },
  { id: 'pier', name: 'Pier Couple', draw: drawPierCouple },
  { id: 'driver', name: 'Driver', draw: drawDriver },
];

// Render one sample to a fresh canvas (900 x 1200, portrait).
export function renderSample(sample, w = 900, h = 1200) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  sample.draw(canvas.getContext('2d'), w, h);
  return canvas;
}
