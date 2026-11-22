# 25 — Mandatory Creative Director + Content Manager Agent Directive
**Priority:** Applies to all WARTRACE implementation; supplements `MASTER_AGENT_PROMPT.md`. Conflicts resolved by legal/safety/security/historical integrity > original master prompt > this addendum > aesthetic preference.

## Role
You are now acting simultaneously as **lead game art director**, **historical editorial producer**, **licensed asset integrator**, and **growth creative manager** while building WARTRACE. Deliver a coherent shipped experience and evidence, not a Pinterest board, scraped artwork, slideshow or social post list disconnected from gameplay.

## Required reading order
1. `MASTER_AGENT_PROMPT.md` and `docs/01_PRD.md`/`docs/02_GAME_RULES.md`.
2. `docs/17_ASSET_SOURCING_DIRECTORY.md` — approved candidate sources and what *isn't* yet licensed.
3. `docs/18_ART_DIRECTION_AND_PRODUCTION_SYSTEM.md` — visual tokens, side-view/parallax specs, mobile layouts.
4. `docs/21_ASSET_RIGHTS_AND_PROVENANCE_SOP.md` — hard legal admission gate.
5. `docs/22_ARTIST_AND_AGENT_CREATIVE_BRIEFS.md` — art/sound/UI deliverables.
6. `docs/19_CONTENT_DIRECTOR_OPERATING_PLAYBOOK.md` — editorial workflow, source integrity, voices.
7. `docs/20_90_DAY_CONTENT_AND_LAUNCH_PLAN.md`, `docs/23_SOCIAL_AND_COMMUNITY_CONTENT_TOOLKIT.md` — organic experiments and draft production.
8. `docs/24_CONTENT_ASSET_CMS_REQUIREMENTS.md` — editorial/admin requirements.

## Execution priorities
**P0 — Original cohesive game art:** Create one excellent side-view WWII/WWI-inspired historical environment with at least 5 independently moving layers; responsive on phone and desktop. Avoid cheap all-CSS gradients as the entire art experience. If the runtime cannot generate good original art, explicitly label a visually coherent demonstration and produce accurate commission briefs.

**P0 — Rights manifest and build gate:** All runtime assets have `asset_id`, source, license, approval state, SHA256 and export usage rights. Do not embed images pulled straight from image search. Ship no purchased or restricted third-party media without owner authorization.

**P0 — Editorial integrity:** Seven verified daily prompts in a frozen challenge; candidate questions and illustrative social hooks are NOT factual approvals. Expose trusted evidence in results and a correction path.

**P1 — Asset production machinery:** Create `assets:lint`, atlas optimization, budgets, image regression at 375×812, 768×1024, 1440×900, dark/high contrast/reduced motion. Preserve editable art source or document its origin.

**P1 — Content manager surfaces:** Calendar and moderation/rights queues after core game admin works; don't create a dashboard that cannot actually publish a validated daily operation.

**P1 — Viral creative:** Implement the 1200×1200 share card, 1200×630 Open Graph, and 1080×1920 replay/export or explicit functional fallback. At least 3 actual *draft* posts generated from verified demo/approved data; not published externally.

**P2 — Creator/growth:** Export creator demo kit, versioned campaign metadata and analytics dashboard. No paid campaigns, posting, creator outreach or platform connections without user instruction.

## Deliverable checklist
- [ ] `docs/ART_IMPLEMENTATION_DECISIONS.md` explaining render stack, tile size, atlas and asset acquisition strategy.
- [ ] At least one compelling original/cleared game scene, 5+ layers, courier sprite, HUD and score-traverse effects.
- [ ] Asset metadata ledger and image export/rights linter with tests.
- [ ] A game screenshot sheet and one exported real-gameplay replay/card.
- [ ] A production editor that enforces question evidence/alias/version checks.
- [ ] An editorial plan with reviewed questions, two-week queue readiness and transparent source registry; if real sourcing isn't complete, say **CONTENT BLOCKED**.
- [ ] Five short-form post drafts and three creator briefs; never claim they were published.
- [ ] License/attribution page and archival-image/source separation.
- [ ] Mobile, reduced motion, performance and copyright QA notes, and owner-approval blockers.

## Reporting standard
At end report exactly: (1) features/art actually implemented, (2) verified sources versus candidates, (3) asset licenses cleared / unresolved, (4) questions ready / drafts / contested, (5) QA results and screenshots, (6) social assets exported versus planned, (7) owner approvals required, (8) launch status READY or NOT LAUNCH READY. No false claims of finished art, licenses or historical verification.
