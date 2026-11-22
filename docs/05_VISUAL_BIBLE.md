# 05 — Brand, UX, Visual and Animation Bible

## Experience standard
WARTRACE must look like a premium independent game inside the browser, not a generic SaaS site decorated with a battlefield stock photograph. It should feel cinematic, serious, readable, tactile and fast. The signature reward is a **physical feeling of traveling farther** because you know something unusually obscure.

## Brand / visual language
- Name: WARTRACE (working); tagline 'How far can your knowledge take you?'
- Personality: daring, exploratory, archival, intelligent, cinematic; never jingoistic or grisly.
- Colors: ink #111715, raised dark #1B241F, warm canvas #D6CAB0, brass #C4A46D, dusty olive #75806F, paper white #EFE9DA, signal orange #C57B4B, red only for errors and not as celebratory confetti.
- Typography: high-character condensed display face for hero/results; neutral highly legible humanist sans for all functional UI. Use licensed Google/system fonts without packaging font files in exports.
- Icons: thin simple line icons for gameplay controls; game art itself should be original drawn/vector scene art, not emoji.
- Text tone: minimal, intriguing; avoid 'killstreak', 'conquer', 'slaughter', 'body count', or militaristic glory framing.

## Responsive layout anatomy
**Mobile portrait 375x812:** scene fills upper ~48–56% with safe-area top overlay; bottom prompt/keyboard panel takes remaining space; timer large near prompt; CTA thumb-reachable. On soft keyboard opening, scene can shrink or pause camera animations but timer remains visible. iOS viewport/safe areas must be handled. First input must not zoom viewport unexpectedly.
**Tablet 768x1024:** wider scene upper or split, prompt maximum 560px width, easy thumb reach, no horizontal scroll.
**Desktop 1440x900:** cinematic edge-to-edge scene behind centered 480–640px glass/paper panel with visible horizon; keyboard and mouse equal first-class controls. No giant blank margins.

## Required pages / design states
1. Home hero — immersive moving horizon, brand, today's operation, CTA, how-to in 3 concise steps, audio and accessibility controls, countdown, latest result if completed.
2. Intro — operation title, historically careful context, seven segments and expected time. Instant skip.
3. Active round — unobscured prompt, countdown ring/bar, input with send action, 1/7 marker, non-overlapping scene. Status during network request visible.
4. Answer reveal — accepted/invalid/timed-out and tier, +score/+distance, factual reference link. No shaming.
5. Traverse — parallax camera movement scaled to reward, small environment cue, Skip Animation button, reduced-motion static position update.
6. Final — celebratory but restrained 2.5–5 second reveal, total, map-like progress bar, top answer, all 7 outcomes, copy link, create share video/card.
7. Source panel — credible source info with organization, title, link, date retrieved; appeal a wrong rejection.
8. Share preview — spoiler-safe art, mileage and player pseudonym only if explicitly opted in; share challenge CTA.
9. Admin editorial — functional utility UI, different theme allowed; evidence and alias safety above decoration.
10. Error states — 404 result, network lost, no challenge published, auth/admin forbidden, unsupported graphics, recorder unavailable.

## Single scene production brief
- Environment: generic Western Front-inspired historical landscape (not a geographically exact battlefield).
- Layer 1: pale pre-dawn sky, cloud bands, faint distant light.
- Layer 2: thin horizon, silhouettes of trees and roofs, fog.
- Layer 3: mid-ground trench structures, posts and wire at respectful distance.
- Layer 4: earthy terrain with worn boards, weeds and occasional props.
- Layer 5: foreground edges and sparse atmospheric particles.
- Layer 6: the player's small non-combat explorer silhouette and travel markers.
- Camera moves horizontally; use predesigned repeatable tiles/clips; no obvious seams and no derivative competitor silhouettes.
- Animation: gentle fog drift (8–20s loops), atmospheric cloud movement, rare subtle wind, responsive camera easing 500–1100ms depending distance, no screen-shaking explosions. Keep scene readable behind UI and honor reduced motion.
- Original sound optional: muted by default; use subtle wind/paper/mechanical click rather than constant battle audio. Include caption-friendly visual equivalent for any audio-only cue.

## Motion and feedback rules
- Submit button enters pending then confirmed; never fake success before server responds.
- Countdowns animate smoothly, but state authority is the backend.
- Invalid feedback uses neutral grayscale/brass not angry red flood.
- Tier indicators: Common/Curious/Uncommon/Obscure; don't imply 'rarity' measured with scientific certainty.
- Overlay controls must have focus rings and WCAG 2.2 AA contrast when feasible. No essential content conveyed by color or motion alone.
- Reveal duration configurable; skip enabled; keyboard 'Enter' locks only when appropriate and not composing IME input.

## Visual asset manifest
- `scene-sky.webp` 1920x1080 / or original procedural alternative
- `scene-horizon.webp`, `scene-midground.webp`, `scene-terrain.webp`, `scene-foreground.webp` with repeatable horizontal seams
- `explorer-idle.png` spritesheet, `explorer-walk.png` spritesheet
- `hud-frame.svg`, `timer-ring.svg`, `progress-marker.svg`, optional atmospheric textures
- 1:1 (1200x1200) share background and 9:16 (1080x1920) recap background, generated from original layers, not screenshots of licensed external games
- `source-license.csv` per asset: name, creator, URL, license, attribution, release rights and stored checksum

## Performance & accessibility budgets
Initial mobile compressed media target under ~1.5MB for first interactive scene (adjust after measurement); cap DPR on low-memory devices; sprite atlases and pooled particles; lazy-load replay encoder. FPS benchmark 30+ on mid-tier devices, 60 desired. Keep text DOM-based for accessible labeling and copying. `prefers-reduced-motion` stops parallax; animations may become instant cuts. Include a high-contrast option and game fully operable without sound.

## Visual QA
At every milestone capture screenshots at 375x812, 768x1024 and 1440x900; check overlays, safe areas, long prompt, 120-character input, zoom 200%, low-motion mode, soft keyboard, orientation changes and screenshot share frame composition. No placeholder art left on publish. Art brief in `assets/briefs/SCENE_01.md`.
