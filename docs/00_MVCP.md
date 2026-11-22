# 00 — MVCP: Minimum Viable Context Package
**Project:** WARTRACE | **Type:** Mobile-first browser history/knowledge game | **State:** Pre-implementation

## Problem
Open-ended trivia usually looks like a form, produces a bland score, and struggles to fairly accept obscure yet correct answers. Players want a three-minute daily challenge whose outcomes are satisfying, competitive and shareable. Content editors need reliable and auditable factual judgments.

## Primary user outcome
A newcomer understands the premise in <10 seconds, plays seven rounds without signing in, finishes in approximately 3–4 minutes, sees how their answers changed the world, and sends a social challenge. A history enthusiast can inspect evidence for answer acceptance and appeal legitimate omissions.

## Stakeholders and users
- Guest player on mobile: fast, legible, rewarding, frictionless, no forced login.
- History/military enthusiast: factual precision, nuance, challenging but objective inclusion rules.
- Streamer/creator: high-contrast scenes, spoiler-safe share/replay, concise dramatic payoff.
- Content editor: source review and publish tools, protections against unsourced answers.
- Operator: low hosting cost, reproducible daily release, observability and rollback.

## Fixed constraints
- Exactly seven questions per Daily Operation; per-round answer timer initially 25 seconds.
- Each eligible answer has a frozen score for that challenge version; server is authoritative.
- Theme: respectful historical expedition rather than violent tactical simulation.
- Playable with guest session; email/social signup never gates P0.
- Historic references, answer aliases and rights metadata must be stored.
- One spectacular historical environment is better than many incomplete ones.
- Dark premium visual style, cinematic pixel-art-inspired original art, mobile first.
- The game shares inspiration from rarity trivia but must be original; no source-copying from competitors.
- Do not claim virality as assured; optimize and measure share activation.

## Decisions already made for the implementer
- Working brand WARTRACE; repository `wartrace-game`; clearance pending.
- Primary environment: Western Front-inspired atmospheric battlefield traversal (historical, not a battlefield reconstruction).
- Tech: Next.js/TS, PixiJS v8 scene, Postgres, Drizzle, server-grade APIs, Zod, Vitest/Playwright.
- Data: Wikidata discovery; archives/museums/scholarship for corroboration and media; human review gate.
- Scoring: fixed rarity_score, `100 + round(900 * rarity_score^1.3)` for accepted answer; `distance_m = round(points * 0.8)`; zero for unanswered/invalid.
- Publish calendar: America/New_York midnight with DST-safe date selection.
- Launch monetization: none; optional later packs/skins/ad-removal.

## Assumptions awaiting validation
- 25 seconds/question and 7 questions are enjoyable for the audience.
- One mobile scene can render at 30–60 FPS on target devices.
- Open-ended, bounded historical questions can be sourced with ≥30 useful valid answers per prompt for early editorial launch; availability differs by subject.
- Users understand 'distance' as metaphorical game progress, not actual battlefield distance.
- Share-video generation is viable client-side on supported browsers; alternative static card is mandatory.
- First target audience: English-speaking 16+ casual trivia/history fans, no under-13 targeting.

## Explicit non-goals for first release
Realistic military combat, player-versus-player shooting, propaganda, simulator accuracy, 3D multiplayer, heavy gamified spend, subscriptions, loot boxes, AI-only fact checking, infinite content, a complete digital archive, and dynamic paywalled answer validation.

## Open items / dependencies
Brand/trademark/domain clearance; archival media licensing; database credentials; production hosting access; editorial human reviewer; optional analytics provider; social-share encoder/browser support; privacy/legal approval. Work around unknowns locally without inventing success.

## Success rubric
A) **Playability:** core loop usable mobile and desktop. B) **Trust:** all published answers cited and deterministic. C) **Visual quality:** convincing scene with interactions. D) **Distribution:** spoiler-safe result card and challenge loop. E) **Operations:** curators publish and correct; automated daily release. F) **Security/legality:** no secrets/answer leaks or unlicensed art.
