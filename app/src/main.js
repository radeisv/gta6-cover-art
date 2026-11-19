// GTA 6 Cover Art Studio — the studio wiring.
//
// Owns the state, the left control panel, the sample thumbnails, photo
// upload (file picker + drag & drop), panel selection and per-panel crop
// (click to select, drag to pan, scroll to zoom), the style presets, the
// caption and badge controls, live preview rendering and the 1-click PNG
// export. Everything runs in the browser; no network, no upload.

import { renderCover, panelRects } from './cover.js';
import { PALETTES } from './background.js';
import { SAMPLES, renderSample } from './samples.js';
import { readShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const PRESETS = {
  sunset: { palette: 'sunset', layout: 'hero', illustration: 0.7, ink: 0.65, rim: 0.6, warmth: 0.7 },
  neon: { palette: 'neon', layout: 'hero', illustration: 0.75, ink: 0.85, rim: 0.85, warmth: 0.3 },
  collage: { palette: 'collage', layout: 'collage', illustration: 0.7, ink: 0.65, rim: 0.6, warmth: 0.7 },
  miami: { palette: 'miami', layout: 'hero', illustration: 0.6, ink: 0.55, rim: 0.75, warmth: 0.8 },
};

const defaultTransform = () => ({ zoom: 1, panX: 0, panY: 0, flip: false });

const state = {
  preset: 'sunset',
  palette: PALETTES.sunset,
  layout: 'hero',
  illustration: 0.7,
  ink: 0.65,
  rim: 0.6,
  warmth: 0.7,
  caption: 'WELCOME TO LEONIDA',
  captionPos: 'bottom',
  captionSize: 100,
  captionColor: '#ffd166',
  badgeM: true,
  badgeVice: true,
  badgeRibbon: true,
  badgeBurst: true,
  exportSize: '1080x1350',
  frameMode: 'fill', // 'fill' crops edge to edge; 'fit' shows the whole photo
  selectedPanel: 0,
  panelPhotos: [0],
  panelTransforms: [defaultTransform()],
  photos: [],
};

function setStatus(text) { $('status').textContent = text; }
function panelCount() { return panelRects(state.layout, 100, 100).length; }
function currentTransform() { return state.panelTransforms[state.selectedPanel]; }

// Keep panelPhotos / panelTransforms in step with the layout's panel count.
function fitPanels() {
  const n = panelCount();
  while (state.panelPhotos.length < n) {
    state.panelPhotos.push(state.panelPhotos.length % Math.max(1, state.photos.length));
  }
  state.panelPhotos.length = n;
  while (state.panelTransforms.length < n) state.panelTransforms.push(defaultTransform());
  state.panelTransforms.length = n;
  if (state.selectedPanel >= n) state.selectedPanel = 0;
}

// Auto-fill: rotate through the photos so no panel repeats a neighbour.
function autoFill() {
  fitPanels();
  for (let i = 0; i < panelCount(); i++) state.panelPhotos[i] = i % state.photos.length;
  render();
}

let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    const [w, h] = state.exportSize.split('x').map(Number);
    const scale = 0.5; // preview runs at half resolution; export re-renders full-size
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    renderCover(ctx, canvas.width, canvas.height, state, state.photos.map((p) => p.source), 1);
    window.__shotReady = true;
  });
}

function flashCover() {
  const zone = $('dropZone');
  zone.classList.add('dragging');
  setTimeout(() => zone.classList.remove('dragging'), 220);
}

function applyPhoto(index) {
  const mode = document.querySelector('input[name="applyTo"]:checked').value;
  const photo = state.photos[index];
  if (!photo) return;
  if (mode === 'all') {
    fitPanels();
    state.panelPhotos = state.panelPhotos.map(() => index);
    setStatus(`${photo.name} applied to all panels.`);
  } else {
    fitPanels();
    state.panelPhotos[state.selectedPanel] = index;
    setStatus(`${photo.name} applied to panel ${state.selectedPanel + 1}.`);
  }
  document.querySelectorAll('.sample').forEach((el, i) => el.classList.toggle('active', i === index));
  flashCover();
  render();
}

function buildSamples() {
  const box = $('samples');
  box.innerHTML = '';
  SAMPLES.forEach((sample, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sample' + (i === 0 ? ' active' : '');
    button.setAttribute('role', 'option');
    const thumb = renderSample(sample, 150, 190);
    thumb.style.width = '100%';
    thumb.style.height = '74px';
    button.appendChild(thumb);
    const label = document.createElement('span');
    label.textContent = sample.name;
    button.appendChild(label);
    button.addEventListener('click', () => applyPhoto(i));
    box.appendChild(button);
  });
}

function addPhotoFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) {
    setStatus('That file is not a photo — try a JPG, PNG or WebP.');
    return;
  }
  let loaded = 0;
  for (const file of images) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos.push({ name: file.name.replace(/\.[^.]+$/, ''), source: img });
        loaded++;
        if (loaded === images.length) {
          autoFill();
          setStatus(`${images.length} photo${images.length > 1 ? 's' : ''} added — click a thumbnail to use it.`);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.preset = name;
  state.palette = PALETTES[preset.palette];
  state.layout = preset.layout;
  state.illustration = preset.illustration;
  state.ink = preset.ink;
  state.rim = preset.rim;
  state.warmth = preset.warmth;
  document.querySelectorAll('#presets .preset').forEach((b) => b.classList.toggle('active', b.dataset.preset === name));
  document.querySelectorAll('#layoutSeg .seg').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  syncControls();
  autoFill();
  setStatus(`${PALETTES[preset.palette].label} preset applied.`);
}

function syncControls() {
  $('illustration').value = Math.round(state.illustration * 100);
  $('illustrationVal').textContent = `${Math.round(state.illustration * 100)}%`;
  $('ink').value = Math.round(state.ink * 100);
  $('inkVal').textContent = `${Math.round(state.ink * 100)}%`;
  $('rim').value = Math.round(state.rim * 100);
  $('rimVal').textContent = `${Math.round(state.rim * 100)}%`;
  const t = currentTransform();
  $('zoom').value = Math.round(t.zoom * 100);
  $('zoomVal').textContent = `${Math.round(t.zoom * 100)}%`;
  $('panX').value = Math.round(t.panX * 100);
  $('panXVal').textContent = Math.round(t.panX * 100);
  $('panY').value = Math.round(t.panY * 100);
  $('panYVal').textContent = Math.round(t.panY * 100);
  $('flip').checked = t.flip;
  $('caption').value = state.caption;
  $('captionPos').value = state.captionPos;
  $('captionSize').value = state.captionSize;
  $('captionSizeVal').textContent = `${state.captionSize}%`;
  $('captionColor').value = state.captionColor;
  $('badgeM').checked = state.badgeM;
  $('badgeVice').checked = state.badgeVice;
  $('badgeRibbon').checked = state.badgeRibbon;
  $('badgeBurst').checked = state.badgeBurst;
}

function bindControls() {
  $('addPhotos').addEventListener('click', () => $('photoInput').click());
  $('photoInput').addEventListener('change', (e) => addPhotoFiles(e.target.files));
  $('autoFill').addEventListener('click', () => { autoFill(); setStatus('Panels auto-filled with different photos.'); });
  document.querySelectorAll('#presets .preset').forEach((b) =>
    b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  document.querySelectorAll('#layoutSeg .seg').forEach((b) =>
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      document.querySelectorAll('#layoutSeg .seg').forEach((x) => x.classList.toggle('active', x === b));
      autoFill();
      setStatus(state.layout === 'collage' ? 'Multi-Panel Collage layout.' : 'Single Hero Poster layout.');
    }));
  const slider = (id, key, fmt) => {
    $(id).addEventListener('input', () => {
      state[key] = $(id).value / 100;
      $(id + 'Val').textContent = fmt($(id).value);
      render();
    });
  };
  slider('illustration', 'illustration', (v) => `${v}%`);
  slider('ink', 'ink', (v) => `${v}%`);
  slider('rim', 'rim', (v) => `${v}%`);
  const panelSlider = (id, key, fmt) => {
    $(id).addEventListener('input', () => {
      currentTransform()[key] = $(id).value / 100;
      $(id + 'Val').textContent = fmt($(id).value);
      render();
    });
  };
  panelSlider('zoom', 'zoom', (v) => `${v}%`);
  panelSlider('panX', 'panX', (v) => `${v}`);
  panelSlider('panY', 'panY', (v) => `${v}`);
  $('flip').addEventListener('change', () => { currentTransform().flip = $('flip').checked; render(); });
  $('caption').addEventListener('input', () => { state.caption = $('caption').value; render(); });
  $('captionPos').addEventListener('change', () => { state.captionPos = $('captionPos').value; render(); });
  $('captionSize').addEventListener('input', () => { state.captionSize = Number($('captionSize').value); $('captionSizeVal').textContent = `${state.captionSize}%`; render(); });
  $('captionColor').addEventListener('change', () => { state.captionColor = $('captionColor').value; render(); });
  $('badgeM').addEventListener('change', () => { state.badgeM = $('badgeM').checked; render(); });
  $('badgeVice').addEventListener('change', () => { state.badgeVice = $('badgeVice').checked; render(); });
  $('badgeRibbon').addEventListener('change', () => { state.badgeRibbon = $('badgeRibbon').checked; render(); });
  $('badgeBurst').addEventListener('change', () => { state.badgeBurst = $('badgeBurst').checked; render(); });
  document.querySelectorAll('#sizeSeg .seg').forEach((b) =>
    b.addEventListener('click', () => {
      state.exportSize = b.dataset.size;
      document.querySelectorAll('#sizeSeg .seg').forEach((x) => x.classList.toggle('active', x === b));
      $('export').textContent = `Export PNG ${state.exportSize.replace('x', ' × ')}`;
      render();
    }));

  // Panel picking: click a panel to select it, drag to pan its photo,
  // scroll to zoom it.
  let dragging = null;
  const canvasPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (hit >= 0) {
      state.selectedPanel = hit;
      dragging = { x: p.x, y: p.y, panX: currentTransform().panX, panY: currentTransform().panY };
      canvas.setPointerCapture(e.pointerId);
      syncControls();
      setStatus(`Panel ${hit + 1} selected — drag to move, scroll to zoom.`);
      render();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = canvasPoint(e);
    const rects = panelRects(state.layout, canvas.width, canvas.height);
    const r = rects[state.selectedPanel];
    const t = currentTransform();
    t.panX = Math.max(-1, Math.min(1, dragging.panX + (p.x - dragging.x) / r.w));
    t.panY = Math.max(-1, Math.min(1, dragging.panY + (p.y - dragging.y) / r.h));
    syncControls();
    render();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const t = currentTransform();
    t.zoom = Math.max(0.5, Math.min(2.5, t.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    syncControls();
    render();
  }, { passive: false });

  // Drag & drop anywhere on the cover.
  const zone = $('dropZone');
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragging');
    addPhotoFiles(e.dataTransfer.files);
  });

  $('export').addEventListener('click', exportPNG);
}

async function exportPNG() {
  const [w, h] = state.exportSize.split('x').map(Number);
  setStatus(`Rendering ${w} × ${h} PNG…`);
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderCover(off.getContext('2d'), w, h, state, state.photos.map((p) => p.source), 1);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  if (!blob) { setStatus('Export failed — please try again.'); return; }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `gta6-cover-${w}x${h}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  setStatus(`Exported ${w} × ${h} PNG — check your downloads.`);
}

// Boot: render the four procedural portraits, apply any ?shot= scene,
// then paint the first cover.
function boot() {
  state.photos = SAMPLES.map((s) => ({ name: s.name, source: renderSample(s) }));
  buildSamples();
  bindControls();
  const shot = readShot();
  if (shot.preset) applyPreset(shot.preset);
  if (shot.layout) {
    state.layout = shot.layout;
    document.querySelectorAll('#layoutSeg .seg').forEach((b) => b.classList.toggle('active', b.dataset.layout === shot.layout));
  }
  if (shot.size) {
    state.exportSize = shot.size;
    document.querySelectorAll('#sizeSeg .seg').forEach((b) => b.classList.toggle('active', b.dataset.size === shot.size));
    $('export').textContent = `Export PNG ${shot.size.replace('x', ' × ')}`;
  }
  if (shot.ink) state.ink = shot.ink;
  if (shot.frame) state.frameMode = shot.frame;
  if (shot.caption) state.caption = shot.caption;
  syncControls();
  autoFill();
  // The ?sample= scene picks the hero photo AFTER auto-fill, or the
  // auto-fill rotation would silently overwrite the requested sample.
  if (shot.sample) {
    const i = SAMPLES.findIndex((s) => s.id === shot.sample);
    if (i >= 0) {
      state.panelPhotos = state.panelPhotos.map(() => i);
      render();
    }
  }
  setStatus('4 sample portraits ready — click one to fill the cover, or drop your own photo.');
  // Small read-only hook for automated testing (photo count, panel
  // selection, current state). The app itself never reads it.
  window.__studio = { state, render, applyPhoto, applyPreset, exportPNG };
}

boot();
