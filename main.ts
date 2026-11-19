// GTA 6 Cover Art Studio — entry program (Node 22, standard library only).
//
// What it does: copies the finished app (app/) and the four screenshots
// (screenshots/) from this repository into the output directory and writes
// dossier.json there with the vendored make.fun library, so the scorer and
// the judge can read exactly what the app is. It runs twice in the grader
// and both runs must write identical bytes, so there is no timestamp, no
// random value and no network call anywhere in here.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory holding this file.
const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy one directory tree, refusing anything that is not a plain file or
// directory (the gate rejects symlinks), so a stray link can never slip in.
function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(source)) {
    const from = join(source, name);
    const to = join(target, name);
    const info = statSync(from);
    if (info.isDirectory()) copyTree(from, to);
    else if (info.isFile()) cpSync(from, to);
    else throw new Error(`refusing non-file entry: ${from}`);
  }
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

// Fail loudly, before writing the dossier, if a screenshot breaks the
// scorer's caps: at most 4 files, each at most 256 KiB. A silent pass
// would hand in an entry the gate refuses.
const shotDir = join(repoRoot, 'screenshots');
if (existsSync(shotDir)) {
  const shots = readdirSync(shotDir).filter((name) => !name.startsWith('.'));
  if (shots.length > 4) throw new Error(`too many screenshots: ${shots.length}`);
  for (const name of shots) {
    const bytes = statSync(join(shotDir, name)).size;
    if (bytes > 262144) throw new Error(`screenshot over 256 KiB: ${name} (${bytes} bytes)`);
  }
}

// The scorer's own caps: text_max_bytes is the only one that shapes the
// bytes of dossier.json; the rest refuse an entry the scorer would refuse
// (more than 4 screenshots or one over 256 KiB; more than 993 files in
// app/ or 48 MiB of app files in all; an app/ path over 1000 bytes).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`GTA 6 Cover Art Studio handed in to ${outputDir}`);
