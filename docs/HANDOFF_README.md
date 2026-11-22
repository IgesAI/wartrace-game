# WARTRACE — Game Build Handoff
**A source-backed historical knowledge expedition.** Working title / repo: `wartrace-game`.

## Start here
1. Read `MASTER_AGENT_PROMPT.md` and hand it to your coding agent.
2. Upload this entire directory (or `WARTRACE_Agent_Handoff.zip`) so it can reference every accompanying specification.
3. The agent must **implement the game**, not just summarize the plan. Review `docs/12_SHIP_CHECKLIST.md` before accepting delivery.
4. Review `WARTRACE_Executive_Report.pdf` separately for the product/market/technical overview.

## Package map
| Path | Purpose |
|---|---|
| `MASTER_AGENT_PROMPT.md` | Highest-priority build directive |
| `docs/00_MVCP.md` | Minimum viable context: confirmed constraints / assumptions |
| `docs/01_PRD.md` | Product requirements, personas, UX flow, business objectives |
| `docs/02_GAME_RULES.md` | Precise state machine, timing, scoring, fairness |
| `docs/03_ARCHITECTURE.md` | App, renderer, storage, auth, jobs and deployments |
| `docs/04_DATA_PROVENANCE.md` | Trust model, ingestion, rights and source-of-truth |
| `docs/05_VISUAL_BIBLE.md` | Screens, art bible, motion, responsive constraints |
| `docs/06_CONTENT_PLAYBOOK.md` | Editorial production, answer-set QA, launch themes |
| `docs/07_SHARE_AND_GROWTH.md` | Viral mechanics, experiments, launch distribution |
| `docs/08_ANALYTICS_AND_KPIS.md` | Event names, metrics, diagnostics, guardrails |
| `docs/09_SECURITY_PRIVACY.md` | Threat model, legal considerations, moderation |
| `docs/10_ADMIN_OPERATIONS.md` | Publishing runbook, disputes and incident processes |
| `docs/11_QA_TEST_PLAN.md` | Test cases, browser/device coverage, performance |
| `docs/12_SHIP_CHECKLIST.md` | Prioritized execution and hard acceptance criteria |
| `docs/13_COMPETITIVE_RESEARCH.md` | Krillion benchmark, known vs unknown, differentiation |
| `docs/14_SOURCE_REGISTER.md` | Official documentation and rights checking links |
| `docs/15_DECISION_LOG.md` | Accepted architectural decisions and tradeoffs |
| `docs/16_MONETIZATION.md` | Business models and sequencing |
| `db/schema.sql` | Proposed production-oriented PostgreSQL schema |
| `specs/openapi.yaml` | Endpoint-level contract starter |
| `specs/sample_challenge.json` | Clearly non-publishable demonstration content |
| `specs/analytics_events.json` | Event contract and redaction notes |
| `specs/scoring_reference.ts` / `scoring_vectors.json` | Canonical math and cross-runtime test vectors |
| `templates/ANSWER_REVIEW.md` | Editor/verifier checklist |
| `templates/ADR_TEMPLATE.md` | Engineering decisions format |
| `assets/briefs/SCENE_01.md` | Original Western Front environment brief |
| `ops/ENVIRONMENT.example` | No-secrets local environment template |
| `ops/RELEASE_REPORT_TEMPLATE.md` | Agent delivery-report template |

## Product in one sentence
A three-minute daily history expedition: unusual correct answers carry you farther through an unforgettable, beautifully animated historical world, and your result becomes a challenge to friends.

## P0 nonnegotiables
A seven-round daily game, a researched answer bank, server-side deterministic grading, original parallax visuals, guest play, mobile responsiveness, historical references, verified result links, share cards, admin publishing, tests and deployment documentation.

## P1, not part of the first release
Payment processing, multiplayer synchronous networking, generative narration, complex 3D worlds, public user-generated questions, dozens of environments, native mobile apps, and real-time player-driven answer scoring.

## Important caveats
This is a high-fidelity **build specification and handoff**, not an implemented game or guarantee of going viral. Third-party APIs need verification, keys where required, responsible rate limiting, and item-specific licensing. The proposed WARTRACE name has **not** been formally trademark-cleared; do a counsel-reviewed clearance search before publishing branded assets. The sample historical answer data are test fixtures, not complete or vetted production data. Do not fake demonstrations, analytics or test results.

## Research basis
The technical/data documentation is anchored to official Wikidata, NARA, Library of Congress, Smithsonian and PixiJS/Phaser sources listed in `docs/14_SOURCE_REGISTER.md`; publication and licensing claims must be rechecked before launch. Research snapshot: 2026-11-22.
