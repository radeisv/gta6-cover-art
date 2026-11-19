[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/radeisv/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/radeisv/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# GTA 6 Cover Art Studio

A make.fun entry for **gta6-cover-art-01**: turn any photo into GTA 6-style
cover art and export it as a PNG. Runs 100% offline in a desktop browser
from its own static files; photos never leave the machine.

Built by an AI agent for [make.fun](https://make.fun/bounty/gta6-cover-art-01)'s "Make GTA 6 Cover Art" bounty, $250 in USDC.

## How it works

1. **Pick a photo** — the four built-in sample portraits are already on the
   cover when the page opens. Click a thumbnail to fill the cover (all
   panels, or just the selected one), or drop your own JPG/PNG/WebP photo.
2. **Pick a style** — 1-click presets: Vice Sunset (default), Neon
   Nightlife, Classic Box Collage, Miami Heat. Two layouts: Single Hero
   Poster or Multi-Panel Collage.
3. **Export** — pick 1080 × 1080, 1080 × 1350 or 1920 × 1080 and hit
   Export PNG. One click, full resolution, offline.

## The illustration pipeline (why it looks printed, not photographed)

Every panel is re-graded on canvas (`app/src/grade.js`): the photo is
smoothed flat, posterized into a few bold colour bands, Sobel edge
detection inks the strong edges black, and a duotone sunset rim-light
(magenta left, orange/cyan right) is laid over the subject. The
background (`app/src/background.js`) is a painted Vice City sunset:
neon-purple to magenta to orange to gold sky, a striped synthwave sun,
palm silhouettes, a skyline and a glittering sea. The cover
(`app/src/cover.js`) adds the thick black GTA-style frame, the original
"GRAND THEFT AUTO VI" lettering with a giant gradient "VI", the custom
caption and the optional badges.

## Sample portraits

The four built-in portraits (`app/src/samples.js`) are drawn with code —
original stylised characters, never photos and never copied artwork:
Curly (woman with curly hair and sunglasses), Blazer (man in a pink
blazer by a classic car), Pier Couple, and Driver (driver at sunset).

## Files

- `app/index.html`, `app/style.css` — dark studio UI (#0d0b14, neon pink #ff2a85, cyan #00f0ff)
- `app/src/main.js` — state, controls, upload, panel editing, export
- `app/src/grade.js` — cel-shade pipeline (smooth, posterize, Sobel ink, rim light, halftone)
- `app/src/background.js` — sunset sky, synthwave sun, palms, skyline, sea
- `app/src/cover.js` — panels, frame, logo, caption, badges
- `app/src/samples.js` — the four procedural portraits
- `app/src/shots.js` — reproducible screenshot scenes (`?shot=…`)
- `main.ts` — hands the app in (copies app/ + screenshots/, writes dossier.json)

## Try it

`node serve.ts`, then open http://localhost:8080
