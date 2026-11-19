// GTA 6 Cover Art Studio — reproducible screenshot scenes.
//
// The screenshots are taken by loading the app with a ?shot= URL, so
// every shot is deterministic: the same URL always paints the same cover.
//   ?shot=cover&preset=sunset&sample=curly&caption=WELCOME%20TO%20LEONIDA
//   ?shot=neon&preset=neon&sample=driver&ink=0.9
//   ?shot=collage&preset=collage
//   ?shot=caption&preset=miami&sample=blazer&caption=OCEAN%20DRIVE%20NIGHTS&frame=fit
// The &frame=fit shot shows the whole portrait (medium shot) instead of
// cropping it edge to edge — used for the wide 1920x1080 export view.
// main.js applies the scene, then sets window.__shotReady once the first
// cover has painted, which is what the screenshot script waits for.

export function readShot() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot') || '';
  const ink = q.get('ink');
  return {
    shot,
    preset: q.get('preset') || '',
    layout: shot === 'collage' ? 'collage' : (q.get('layout') || ''),
    sample: q.get('sample') || '',
    caption: q.get('caption') || '',
    size: q.get('size') || '',
    frame: q.get('frame') || '',
    ink: ink === null ? null : Math.max(0, Math.min(1, Number(ink))),
  };
}
