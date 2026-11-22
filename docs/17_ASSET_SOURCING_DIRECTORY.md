# 17 — WARTRACE Asset Sourcing Directory & Procurement Strategy
**Version:** 1.0 | **Researched:** 2026-11-22 | **Owner:** Art director + engineering lead + rights reviewer | **Status:** Approved sourcing strategy, individual assets NOT acquired or licensed.

## Executive recommendation
Build the one indispensable hero scene **originally**. Use verified CC0 packs for invisible scaffolding and UI prototyping, a small custom commission for the protagonist, scene landmarks and animations, and licensed professional sound for atmosphere. Historic archive images should inform visual authenticity and optionally appear in a separate sourced 'artifact' view; they are **not** a substitute for original game art. Source availability is not acquisition, and a search-result thumbnail is not usage permission.

## Source-selection decision tree
1. Does WARTRACE need this in its **signature hero environment**? If yes, prefer original commission or internally authored art. Stock is a temporary placeholder only.
2. Is it a generic prop/tool/UI icon? Favor CC0 Kenney; use Game-icons.net only with tracked CC BY 3.0 author attributions; rework into cohesive house style.
3. Does it need period accuracy? Research using records from Library of Congress, Smithsonian and National Archives, then draw an original interpretation. Retain the research link separately from the image-rights grant.
4. Is it ambience/audio? Favor Sonniss #GameAudioGDC or authored sounds. Prefer Freesound CC0; CC BY requires credits; block CC BY-NC for a commercial-capable release.
5. Is it a purchased pack? Confirm actual seller, listed usage rights, project restrictions, attribution, resale/source distribution restrictions, and whether it is *top-down*, *isometric*, or *side-view*. No purchase without user permission.
6. Any license uncertainty? Put it in `QUARANTINED`, not into production.

## Vetted starting directory — primary sources first
| Priority | Source | Verified entry point | Best for WARTRACE | License / rights fact | Decision |
|---|---|---|---|---|---|
| A | Kenney main assets | https://kenney.nl/assets | UI, fallback art, generic props | Kenney says game asset packs are CC0; check pack license.txt | **Approved candidate** |
| A | Kenney Tiny Battle | https://kenney.nl/assets/tiny-battle | Non-shipping prototype of war-game vocabulary | Page explicitly CC0 | **Prototype, not final hero art** |
| A | Kenney Roguelike/RPG | https://kenney.nl/assets/roguelike-rpg-pack | Tiny environmental/UI motifs; useful code fixtures | Page CC0; 16px family aesthetic | **Prototype only** |
| A | Kenney Roguelike Modern City | https://kenney.nl/assets/roguelike-modern-city | Ruined-city silhouette planning, not historical authenticity | Page CC0 | **Prototype only** |
| A | Smithsonian Open Access | https://www.si.edu/openaccess/faq | Period artifacts / optional evidence cards / shape studies | Only designated Open Access digital assets are CC0 | **Approved per-record** |
| A | LoC Free to Use & Reuse | https://www.loc.gov/free-to-use/ | Typography, papers, archive-like graphics, source cards | Selected items marked free to use; verify item and intended use | **Approved per-record** |
| A | LoC WWI posters | https://www.loc.gov/free-to-use/wwi-posters/ | Historic poster composition/visual studies | Collection-specific public domain US statement; verify record | **Strong art-direction research** |
| B | National Archives | https://www.archives.gov/faqs | Historical photos, artifact captions and reference | Vast majority public domain, but not all; item rights must be checked | **Research + qualified media** |
| B | Wikimedia Commons | https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en | Historical images, diagrams, flags, map references | Per-file license and author attribution; Commons is not uniform CC0 | **Per-record review** |
| B | Poly Haven | https://polyhaven.com/license | Original 3D props rendered into 2D sprites; texture/HDRIs | All its own assets CC0; live API conditions separately | **Approved candidate** |
| B | Freesound | https://freesound.org/help/faq/ | Footsteps, wind, paper, radios, clicks | Mixed CC0, CC BY, CC BY-NC: inspect each file | **CC0 preferred** |
| A | Sonniss GDC Audio | https://sonniss.com/gameaudiogdc/ | Natural ambience, cloth, mechanical SFX | Bundle license allows commercial audiovisual synchronization without attribution; no raw standalone resale or AI-training use | **Sound-first choice** |
| B | OpenGameArt | https://opengameart.org/content/faq | Texture studies, misc sprites, audio | Asset licenses vary; CC BY-SA/GPL may complicate closed product | **CC0 or individually approved only** |
| B | itch.io asset directory | https://itch.io/game-assets/tag-pixel-art/tag-world-war-i | Discover WWII/WWI themed specialists | Each creator's product/license governs; itch listing is NOT universal reuse permission | **Research + buy after review** |
| B | Cute SCKR WWI Tileset | https://comshadow.itch.io/world-war-i-trench-warfare-tileset-pixel-art-asset-pack | Trench shapes, objects, rough block-out | Product listing exists; full commercial grant **not yet confirmed** | **HOLD, permission review** |
| B | Turkraft Western Front pack | https://turkraftgames.itch.io/western-front | WWI sound, terrain, aircraft, top-down reference | Product exists; license/purchase terms **not independently confirmed**; top-down incompatible out of box | **HOLD, investigate** |
| B | Game-icons.net | https://game-icons.net/about.html | Hundreds of interface motifs before restyling | Primarily CC BY 3.0; credit actual author | **Approved conditionally** |
| A | Lospec Palette List | https://lospec.com/palette-list | Palette exploration and contrast inspiration | Palette resource, not blanket redistribution of each author's art | **Reference only** |
| B | Pixabay | https://pixabay.com/service/license-summary/ | Generic sound and low-risk texture overlays | License has standalone resale, trademark/people and use restrictions | **Manual per-file review** |
| A | Aseprite | https://www.aseprite.com/faq/ | Commissioned sprite creation, animation, export | Official FAQ permits creating art for commercial games | **Artist workflow** |
| A | Pixelorama | https://pixelorama.org/ | Free open-source pixel painting/animation | Editor is open-source; imported files retain third-party rights | **Free workflow** |
| A | LibreSprite | https://github.com/LibreSprite/LibreSprite | Free sprite editor | Free/open-source editor, separate asset rights | **Free workflow** |
| A | Tiled | https://www.mapeditor.org/ | Tile and parallax lane layout | Free/open source; exported map assets retain original rights | **Level layout** |
| A | LDtk | https://ldtk.io/ | Scene segment authoring, map metadata | Free to use without limitation (per site) | **Alternative layout** |
| A | Barlow Condensed (OFL) | https://github.com/google/fonts/blob/main/ofl/barlowcondensed/OFL.txt | Poster-like display headings | SIL OFL 1.1 license file available | **Suggested display face** |
| A | SIL OFL | https://openfontlicense.org/ | Review font terms | Open font license, check individual font's distribution | **Licensing framework** |

### Practical search terms
**itch.io:** `WWI pixel side-scrolling parallax`, `trench pixel background`, `fog 2d parallax`, `battlefield ambient`, `industrial UI 2d`, `old paper texture pixel`. Filter for downloadable assets AND check perspective. Most WWI packs are top-down and will not fit the hero side view without substantial changes.

**Freesound / Sonniss:** `wind abandoned field`, `distant thunder`, `boots gravel single`, `cloth rustle`, `metal latch`, `paper folder`, `old radio static`, `field ambience`, `wind wire fence`. Avoid gunfire as a celebratory success sound; avoid large battle-loop audio in a casual trivia game.

**Museum/archive:** `World War I trench revetment`, `wooden duckboards`, `Brodie helmet`, `field telegraph`, `Western Front aerial reconnaissance`, `trench cross section`; search the record's **rights and access** field before downloading any image for shipping use.

## Source-to-purpose map
- Hero environment: original concept → licensed-reference research → original layered sprite artwork.
- Atmospherics: authored procedural fog/clouds + CC0/HDR textures if necessary.
- Character: commission original tiny expedition courier; no historically specific insignia in MVP.
- HUD controls: implement in CSS/SVG from design tokens; Kenney or CC BY icons only in concept phase.
- Fonts: Barlow Condensed for display; pick a documented open-licensed sans for UI after contrast/reading test.
- Exhibit cards: archival image only after per-item use clearance; always retain caption/date/creator/collection/identifier.
- Audio: composed or licensed; no automatically playing sound; user-selectable mute, reduce volume, preserve captions/visual equivalents.
- Share video/card: render from **WARTRACE-owned** game layers and typography. Third-party packs may forbid templates/media export; check all contracts.

## Asset-acquisition scoring matrix
Rate each candidate 1–5 on **brand fit ×3, side-view compatibility ×2, license clarity ×3, format/editability ×2, performance ×2, historical accuracy ×2, price ×1**. Reject regardless of score if rights are ambiguous, creator attribution cannot be tracked, graphic violence is exploitative, or asset resembles another game's proprietary art. Keep the scored decision in the ledger.

## What the artist should create from scratch
1. Logo wordmark and symbol, 2. WWI-inspired one-scene six parallax planes, 3. side-view courier/expedition silhouette, 4. source-card frame and atlas pin markers, 5. share/recap formats, 6. small era-specific reward landmarks. These are the identity-defining assets; outsource or generate as original work only with clear commercial rights and source files.

## Licensing verification status
The directory identifies public **source-level** claims, not a review of actual candidate downloads. The project includes **no third-party asset binaries**. Do not imply any listed asset was licensed/purchased. For each selected candidate, archive creator, exact URL, version, license screenshot/text, date, source hash, commercial rights, modification rights, attribution, sublicensing/redistribution restrictions, public-share-video allowance and reviewer signoff.

## Official source evidence (research register)
- Kenney support: https://kenney.nl/support
- Kenney Tiny Battle: https://kenney.nl/assets/tiny-battle
- Smithsonian Open Access: https://www.si.edu/openaccess/faq
- LoC Free to Use: https://www.loc.gov/free-to-use/
- LoC WWI poster rights: https://wwws.loc.gov/rr/print/res/243_wwipos.html
- NARA FAQ: https://www.archives.gov/faqs
- Commons reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en
- Sonniss GDC license: https://sonniss.com/gdc-bundle-license/
- Freesound FAQ: https://freesound.org/help/faq/
- OpenGameArt FAQ: https://opengameart.org/content/faq
- Poly Haven: https://polyhaven.com/license
- Game-icons licensing: https://game-icons.net/about.html
- itch.io WWI listings: https://itch.io/game-assets/tag-pixel-art/tag-world-war-i
- Pixelorama: https://pixelorama.org/
- Aseprite FAQ: https://www.aseprite.com/faq/
- LDtk: https://ldtk.io/
- Tiled: https://www.mapeditor.org/
- Lospec palettes: https://lospec.com/palette-list

**Disclaimer:** Commercial-use advice is a product review checklist, not legal counsel. License terms change; archive the exact grant at download or purchase time.
