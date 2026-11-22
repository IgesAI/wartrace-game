# 18 — WARTRACE Art Direction, Experience System & Production Specifications
**Version:** 1.0 | **Status:** Prescriptive creative specification for MVP | **Creative director:** WARTRACE team

## Creative thesis
**A living history book you can move through.** Hybrid aesthetic: museum-grade archival typography + tactile expedition instruments + high-quality limited-palette pixel art. The result must be differentiated from a WWII shooter, WWI military recruitment poster, stock-photo quiz, and Krillion's ocean imagery. History provides atmosphere; *knowledge* produces progression.

## Core keywords and anti-keywords
**Use:** atmospheric, tactile, intelligent, weathered, poetic, precise, quietly dramatic, collectible, cinematic, responsive, credible.
**Avoid:** blood-and-glory, photoreal shooter, garish army green, camouflage UI, generic battle explosions, unreadable tiny type, faux classified-document clichés, cheap glows, mock medals/ranks as historical endorsements.

## House art direction: THE DUSK ARCHIVE
- **Perspective:** 2D side-scrolling, multi-plane 2.5D parallax, not top-down. Player moves symbolically as a historical explorer/courier. Battlefields are environmental context, never real-time violence simulation.
- **Time:** twilight/pre-dawn; low-contrast fog but crisp playable silhouettes.
- **Texture:** sparse high-frequency paper/grain near menus; **no JPEG film grain laid across every pixel frame**.
- **Silhouettes:** irregular broken trees, horizon roofs, duckboards, aged timber, collapsed fence, gentle smoke/fog. Reject recognizable propaganda symbols and no fake photographic archive imagery.
- **Pixel density:** choose 16x16 or 32x32 tile design grammar; prefer 32x32 for cinematic landscapes. Use consistent pixel edges for same-depth layers; use gentle subpixel camera easing but clamp final raster positions to avoid shimmering on integer-rendered sprites.
- **Reference canvas:** world layers authored at 960x540 or 640x360 logical resolution, scaled for desktop and cropped/panned for mobile. This is a proposed baseline; benchmark actual assets before locking.

## Foundation tokens (canonical)
| Purpose | Hex | Notes |
|---|---|---|
| Ink / page | `#111715` | Primary dark UI surface |
| Raised ink | `#1B241F` | Dialog/panel |
| Aged canvas | `#D6CAB0` | Background of document-like panels |
| Paper white | `#EFE9DA` | Primary text on dark |
| Weathered brass | `#C4A46D` | Success/progress focus; accessible states must be contrast tested |
| Fog olive | `#75806F` | Terrain and subdued secondary surfaces |
| Signal rust | `#C57B4B` | Interactive highlight, limited 5–10% area |
| Slate | `#4A5A56` | Neutral contours |
| Deep cloud | `#2C3735` | Parallax midtone |
| Pale horizon | `#AAB4A4` | Background luminance and light |

Usage ratio target: **65% neutral ink/slate, 22% fog/olive/canvas, 10% brass/paper accents, 3% signal rust**. Treat as creative guidance, not a literal screenshot analyzer. Do not use hue alone to encode correct/incorrect answers.

### Typography system
- Display: Barlow Condensed 600–800 (source: https://github.com/google/fonts/blob/main/ofl/barlowcondensed/OFL.txt ); set `font-display: swap` and preserve license notice with the app. Use restrained uppercase and letter-spacing +0.02em.
- Functional UI: a high-legibility licensed sans (candidate IBM Plex Sans / system UI) with body at **16px+ mobile**. Validate actual family license before bundling.
- Numeric HUD: tabular figures, stable width; `font-variant-numeric: tabular-nums`.
- Archival captions: 13–14px minimum on mobile with good contrast, never microtext as the only factual explanation.
- Avoid entire game in pixel font. Pixel fonts may be decorative for 'Operation 014' but not for questions, timers, source citations or appeals.

## Signature screen composition
**Mobile 375×812:** top 42–50% world canvas, bottom 50–58% accessible HTML question panel; primary action and response near thumb reach; keyboard focus must not cover answer. On phone keyboard appearance, temporarily reduce scene display rather than hiding the timer. Respect safe areas.

**Desktop 1440×900:** 66% horizon/expedition, anchored readable card ~520px max width. The scene remains visually visible even during a long question. Keep first contentful meaningful render as a strong still image while PixiJS initializes.

### Screen state design inventory
1. Landing, 2. Intro, 3. Ready, 4. Timed question, 5. Submitting, 6. Accepted/common, 7. Accepted/rare, 8. Invalid, 9. Timeout, 10. Traverse, 11. Evidence, 12. Final results, 13. Shared preview, 14. Replay export, 15. Network failure, 16. Reduced-motion, 17. Admin editorial. All require focus/hover/keyboard/mobile states.

## World scene layer specifications
| Layer | Target content | Animation | Production handoff |
|---|---|---|---|
| 00 sky | Dawn gradient, distant thin cloud bands | 0.05x camera | seamless background or procedural |
| 01 horizon | Far village, rolling landscape, broken trees | 0.12x camera | transparent tile strip |
| 02 fog | low thin translucent wisps | 0.2x + gentle cyclic drift | alpha strips; disable with reduced motion |
| 03 middle | timber structures, distant outposts | 0.45x camera | atlas, mask/culling bounds |
| 04 ground | duckboards/earth/worn path, traversal marker | 1.0x camera | modular seam-safe collision-free strips |
| 05 foreground | sparse grasses/rails/branches | 1.15x camera | atlas, crop masks |
| 06 interface | score, tier, timer, accessible answer box | static screen space | HTML/CSS/SVG, not Pixi text-only |

**Camera rule:** the player never gains combat advantage or inflicts damage. Score advances a nonliteral journey route; never show a historical casualty map as an actual result of player skill. For 7 rounds, the total distance maps continuously to 4–6 scenic landmarks, not 7 teleport cuts.

## Motion, animation and sound grammar
- Warm-up: 600–900ms eye-catching scene reveal once, then controls ready. No forced cinematic before answering.
- Correctness feedback: 150–220ms card reaction → tier banner 450–650ms → travel 600–1100ms; user can skip.
- Uncommon/Obscure answers: **qualitatively better landmark reveal**, never louder combat sounds. Camera may ease deeper, fog may open, distant historical artifact vignette appears.
- Idle: slow flags/clouds/foliage 6–18s loops; no rapid flashing or bright screen shakes.
- Sound: off by default; 4 buses `ui`, `wind`, `paper`, `ambience`; accessible equal alternatives. Peak and levels must be normalized; first interaction permits opt-in audio.
- Reduce motion: no parallax/particle drift; replace camera animation with immediate still frame and textual distance status.

## Design production system
### Export rules
- Prefer transparent PNG sprites/atlases and optimized WebP/AVIF static layers when sharpness survives testing. For pixel sprites use nearest-neighbor only; photographic archival textures may use linear filtering.
- Preserve master Aseprite/Pixelorama/PSD/Blender source projects internally; only export approved runtime assets to production.
- Include exact dimensions, logical scale, atlas frame names, pivot and animation timing in a sidecar manifest. Version with content hashes.
- Validate maximum texture sizes on target GPUs; use atlases instead of uncontrolled dozens of independent draw calls.
- All screenshots for marketing generated from actual game assets and labeled gameplay. No competitor-derived promotional artwork.

### Performance budget (proposed)
Initial mobile art transfer **≤1.5 MB compressed** for first interactive world; first hero scene ≤6 parallax media payloads; total sprite atlas ≤2–3MB compressed additional on demand; min 30 FPS on measured mid-tier phone; 60 FPS target desktop. These are *planning budgets*, not claims about current performance. Device measurements override. Fall back to static composite on low-resource devices.

## Art acceptance scorecard, 0–4 each
1. Cohesive art direction; 2. historical-reference credibility; 3. side-scroll continuity; 4. mobile readability; 5. visual reward clarity; 6. legal provenance; 7. performance; 8. reduced-motion parity; 9. reusable editable source; 10. original identity. **Release target:** ≥34/40 with no zero in provenance, readability or performance. Rights failures always block regardless of score.

## Original commission briefs
Brief a pixel artist for **6 layers of a side-scrolling 1,500–3,000 logical-pixel environment** with reusable landscape slices, one 48–96px-tall courier, idle/walk frames, 4 environmental landmarks, 1 restrained HUD frame and separated alpha layers. Request original editable files, export atlas, commercial game+video marketing rights, modification rights, and portfolio-use agreement; no copied IP or unlicensed references. Use a paid assignment only with user authorization and a written deliverables/licensing agreement.

## Artistic references: look, not copy
- Archival visual language: Library of Congress WWI posters (record-level rights): https://www.loc.gov/free-to-use/wwi-posters/
- Palette inspiration: https://lospec.com/palette-list
- Atmospheric photo reference: https://www.loc.gov/free-to-use/
- Museum artifact morphology: https://www.si.edu/openaccess
- Existing games can be studied for composition and pacing, but **do not reuse frames, logos, sprites, typography treatments or distinctive composition** from them.

## Visual design sign-off test
Capture 375x812, 390x844, 768x1024, 1440x900, full-size vertical replay 1080x1920, square result 1200x1200, 200% text zoom, high contrast, keyboard open and reduced-motion. A player should immediately identify: prompt, timer, answer field, submit action, world progress and how to skip animation. If any competes visually with the vista, revise hierarchy, not font size downward.
