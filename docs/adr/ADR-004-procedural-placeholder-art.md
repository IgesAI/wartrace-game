# ADR-004: Procedural, code-drawn placeholder art

**Status:** Accepted (2026-11-22)

## Context
Final art needs a commissioned artist and rights review (docs 18, 21, 22). Archival media requires item-level clearance. Copying competitor art is prohibited.

## Decision
Draw every scene element from one pure scene description (`src/game/art/scene-spec.ts`), rendered by PixiJS live and as SVG for the fallback, share cards and replay. All entries are registered in `assets/asset-register.json` as `demo_placeholder` with recorded source hashes.

## Consequences
+ Original, coherent, licence-free placeholder that already matches tokens, layers and budgets. Swapping in commissioned bitmaps later only changes the renderers.
- Not final art quality. IP ownership of agent-authored output is an owner decision, and `assets:lint --production` fails until rights approval.
