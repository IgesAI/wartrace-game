# 22 — Artist, Motion Designer, Sound Designer & Creative-Agent Brief Library
**Version:** 1.0 | **Use:** Copy individual briefs to commissioned artists or agent subtasks. All works original and rights reviewed.

## BRIEF A — Signature Western Front-Inspired Environment
**Goal:** Create an original atmospheric side-scrolling 2.5D environment for WARTRACE; evoke historical landscapes without claiming to reconstruct a specific battle or promoting combat.

**Canvas:** source at 960×540 logical reference; 6 editable transparent parallax planes; segments covering at least 4–6 landmarks across roughly 2,400–3,200 logical pixels. Deliver continuous/loopable traversal with no seams. Maintain readable empty lower-central composition for a responsive question overlay.

**Motifs:** soft dawn fog; rolling earth, bent trees, wooden trench reinforcement, communication poles, weathered fence, scattered grasses, quiet village roof in distance, a marker post at distance transitions. No corpses, swastikas, nationalistic celebration, explosive fireballs, glossy stock photos, or signature scenery copied from another game.

**Palette:** tokens defined in `18_ART_DIRECTION_AND_PRODUCTION_SYSTEM.md`. Story path moves from pre-dawn dark to slightly warmer horizon; accurate readable landscape silhouettes. Mood = understated and mysterious, not grim spectacle.

**Deliverables:** editable native project file; layers `sky`, `distance`, `fog`, `architecture`, `ground`, `foreground`; seamless segments; 1x atlas + 2x preview; alpha integrity; color palette file; thumbnail montage; asset rights statement; visual at 375×812 / 1440×900.

**Acceptance:** smooth parallax, no obvious seams, no interfering props behind input, unique identity, clear commercial and marketing rights, no >1.5 MB initial mobile transfer without owner-approved exception.

## BRIEF B — Expedition Courier Sprite
**Goal:** A non-combat historian/explorer icon representing traversal, neither military shooter avatar nor copy of Krillion/submarine visual.

**Design:** small silhouette carrying notebook/map satchel; neutral uniform-inspired coat but no unit badges. Readable at 24–48 CSS px. 4–8 walk frames + idle 4 frames (adjust if interpolation too jittery). Turn/breath motion optional. Facing right and left, stable foot baseline, consistent palette and highlights.

**Handoff:** spritesheet PNG with named atlas JSON frame data, native editable layers, animation FPS/timing, pivot points, 1x/2x preview, written originality/rights grant.

## BRIEF C — Archival UI System
**Goal:** Handmade premium interface with readable actual HTML: prompt card, timer, seven-step marker, tier badge, answer confirmation, evidence modal, appeal link, final stat card.

**References:** historical type proportions and aged paper only; avoid literally cloning an archive letterhead, insignia or game screen. Buttons should feel tactile but accessible. Responsiveness > decorative texture. Keep text dynamic/localizable.

**Deliverables:** tokenized design in CSS + Figma/SVG editable equivalents; WCAG contrast checks; focus/error/loading states; mobile keyboard state; reduced-motion state. Include 1:1 and 9:16 share variants.

## BRIEF D — Soundscape
**Goal:** Quiet atmosphere: wind and canvas rustle, field radio static, pencil/click, rare-answer tonal motif, traversal pulse. Not a combat sound-effects showcase.

**Mixing:** audio initially OFF; user explicit enable; loop ambience unobtrusive; UI SFX subtle and short; no sudden spikes, combat gunfire celebrations or startling explosions. 24-bit originals for archive, compressed mono/stereo exports for web; mastering/peak-level QA across phone/desktop. Include cues table, attribution/license proof, fallback if unavailable.

**Cues:** `ui_select`, `answer_confirm`, `answer_reject_neutral`, `answer_rare`, `travel_start`, `travel_arrive`, `ambient_wind`, `ambient_rustle`. Avoid music before first play; licensed music terms require separate clearance.

## BRIEF E — Vertical Viral Replay
**Goal:** A delightful authentic 8–13 second 9:16 gameplay recap showing 7 segments traversed, one verified rarest answer (only after consent/finished run), progress and spoiler-safe CTA.

**Storyboard:** 0–1s brand/title, 1–3s battlefield route, 3–6s rare-answer reward and movement, 6–8s final scenic panorama, 8–11s scoreboard and CTA. Screen-reader equivalent: shareable text result and copy link. All motion skippable in-app; posted video includes captions and descriptive alt copy. Do not misrepresent historical battle outcome as quiz-driven action.

**Exports:** 1080×1920 MP4 or supported WebM plus 1200×1200 fallback card; optimized for organic social; must work for anonymous guest and be spoiler-safe pre-reveal.

## BRIEF F — Historical Exhibit Card
**Goal:** Reinforce credibility immediately after answer lock: concise 1-sentence fact, source institution, record title, date and link, rights-reviewed thumbnail if cleared. The card should educate but never spoil current unanswered rounds.

**Approval:** researcher signs factual claim; art reviewer signs image rights; product QA confirms responsive text; editorial manager confirms tone. If media rights unavailable, use a custom vector illustration and a text citation rather than unlicensed photo.

## BRIEF G — AI creative generation, constrained use
Creative assistance may suggest original compositions, palettes, icons, captions and new art variants if the tool grants necessary use rights, but **generation is not evidence of originality, historical accuracy, copyright clearance or commercial rights**. Do not request images 'in the exact style of' a named living artist or recognizable commercial game, or reproduce existing logos/brand icons. No historical photos generated and passed off as real. Tag all AI-assisted work with provenance and human review. If rights are uncertain, hold from shipping.

### Reusable agent subtask prompt
> Design an ORIGINAL WARTRACE [asset type] according to docs/18 and briefs in docs/22. Use the WARTRACE color palette and a coherent side-scrolling historical-expedition style. Deliver editable masters, optimized exports, atlas/animation metadata, expected dimensions, render screenshots at mobile/desktop, performance measurements and a rights manifest. Never copy a third-party game or claim a third-party archival photo is free merely because it appears online. If rights or imagery aren't approved, use a self-authored geometric placeholder and mark it `DEMO ONLY`. Show actual tests; do not assert work is finished without artifacts.

## Asset budget by release stage
**MVP must-have:** hero scene 6 layers, courier sprite, 2 distinctive landmarks, UI frame/icons, 4 cues, share background, archive card. **Post-MVP:** 3–5 more landmarks, alt weather palettes, weekly themed lighting, secondary campaigns, an authentic source-gallery experience. Never work on 10 different historical worlds until the initial world passes art quality and user-retention checks.
