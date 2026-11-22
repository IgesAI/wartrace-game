# WARTRACE — Art Implementation Decisions

Required by `docs/25_CREATIVE_CONTENT_AGENT_DIRECTIVE.md`. Status of all art: **DEMO PLACEHOLDER — original, procedural, not final commissioned artwork, not rights-approved for release.**

## Render stack
- **One scene description, two renderers.** `src/game/art/scene-spec.ts` is a pure module that emits primitive shapes (rects, polygons, ellipses, lines) per layer. `src/game/pixi-scene.ts` draws them with PixiJS v8 for the live game; `src/game/art/scene-svg.ts` renders the identical description as SVG for the GPU-free fallback, the still frame shown while Pixi loads, the `next/og` share cards and the 9:16 replay. Visual parity between surfaces is structural, not hand-maintained.
- **HTML owns the UI.** Prompt, timer, input, score, tiers and sources are DOM (accessible, copyable, localisable). The canvas is `aria-hidden` and decorative.
- **Lazy & resilient.** Pixi is dynamically imported after first paint. If WebGL is unavailable or init fails, the SVG frame remains and a `renderer_fallback_used` event (enum reason only) is recorded. The CSP forbids `unsafe-eval`, so the `pixi.js/unsafe-eval` shim is loaded alongside Pixi.

## Scene grammar (from `assets/style_tokens.json`)
- Logical canvas **960×540**, preferred tile **32 px**; each layer is a seamless **1920 px** strip repeated by `TilingSprite`.
- Six parallax layers at the addendum speeds: sky 0.05, horizon 0.12, fog 0.20, mid 0.45, ground 1.0, foreground 1.15. Six landmarks (0, 1.1, 2.3, 3.5, 4.7, 5.6 km) give a sense of route across the full 5.6 km maximum.
- **Pixel-art look**: layer textures are generated at half resolution with nearest-neighbour sampling; the renderer runs at resolution 1 with CSS `image-rendering: pixelated`, which also keeps software-GL and low-end GPUs fast.
- Frame-rate caps from tokens: 30 FPS on small screens, 60 FPS otherwise.
- Palette usage follows the 65/22/10/3 ink/fog/brass/rust guidance; red is reserved for errors.

## Motion
- Camera travel eases over 600–1100 ms scaled by distance; walking cycle on the courier with a gentle idle bob; fog thins briefly for rare answers; drifting dust particles (28 on small screens, 64 otherwise).
- **Reduced motion** (system or in-game toggle): parallax travel becomes an instant cut, particles hidden, idle animation stopped; CSS animations collapsed globally.
- Zero-distance rounds skip travel; *Skip animation* jumps the camera immediately. Answer time never overlaps travel (next round opens only after travel or skip).

## Atlas / budget
- No bitmap assets ship today: the scene is code (≈ 10 KB gzipped geometry) plus Pixi (lazy chunk). First-interactive art transfer is far below the 1.5 MB budget in `style_tokens.json`. An atlas pipeline is planned only when commissioned bitmaps arrive (P1).
- Fonts: Barlow Condensed (display) and IBM Plex Sans (UI), both SIL OFL 1.1, self-hosted by `next/font` at build time; register status `candidate` until license notices are archived.

## Asset acquisition strategy
1. Keep procedural art as the labelled demo baseline.
2. Commission a pixel artist using the brief in `docs/22_ARTIST_AND_AGENT_CREATIVE_BRIEFS.md` (6 layers, courier idle/walk, 4 landmarks, HUD frame; editable sources; commercial game + marketing rights). **Requires owner authorization and a written agreement — not started.**
3. Archival imagery only via `docs/21` admission: item-level rights, hashes, approval; nothing scraped. None is used today.

## Provenance and rights gate
- `assets/asset-register.json` (doc-21 fields + `hashed_paths`, `runtime_path`, `scene_keys`, `marketing_use`) lists 14 assets: seven scene layers/landmarks, courier, HUD, three share surfaces and two fonts.
- `npm run assets:lint` (CI) validates schema, NC/ND/SA license rules, credits, hash drift, unregistered media files and unregistered runtime references. Demo placeholders are warnings outside production. `--production` fails until a rights reviewer approves each asset. `npm run assets:hash` re-records hashes and **revokes approval** whenever bytes change.
- The publish gate raises `ASSET_RIGHTS_UNAPPROVED` for an operation whose scene uses unapproved assets; it is demo-waivable only.
- `/credits` is generated from the register.

## QA notes
- Screenshots at 375×812, 768×1024 and 1440×900 for landing, active round, reveal and results are captured by `tests/e2e/responsive.spec.ts`; no horizontal overflow at any size.
- Owner approvals required: IP ownership of agent-authored procedural art; rights review of every register entry; font notice archival; commission budget for final art.
