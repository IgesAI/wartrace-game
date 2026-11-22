# 12 — Implementation Sequence, Priorities and Ship Gates

## P0 milestone 1: foundation
- [ ] Actual repository scaffold, lockfile and package scripts; no pseudo-app.
- [ ] Typed domain objects, Zod validation, Postgres migrations, config/secret validation, guest cookies.
- [ ] CI lint/typecheck/unit/build setup; sample environment instructions.
- [ ] Daily lookup using America/New_York with tests.

## P0 milestone 2: core engine
- [ ] Exactly 7-round state machine, server-started 25s timers, explicit submit/timeout flows.
- [ ] Atomic once-only answer lock and idempotency with HTTP 409 conflict handling.
- [ ] Canonical approved aliases only, deterministic rarity scorer, score versioning.
- [ ] Game results and public random share token; no pre-release answer-bank endpoint leak.

## P0 milestone 3: original playable world
- [ ] Original layered Western Front-inspired world, responsive Pixi canvas, camera/progress/particle movement.
- [ ] Accessible DOM question controls and effects, low-motion and GPU-free fallback.
- [ ] Beautiful landing, gameplay, result and error designs at 375, 768, 1440 widths.
- [ ] Source information and evidence path for accepted answers.

## P0 milestone 4: content and administration
- [ ] Source-backed data tables, alias ledger, item rights and review statuses.
- [ ] Working admin reviewer/publisher role and append-only editorial audit.
- [ ] Content linter rejects unreviewed/unsourced content.
- [ ] At least one working source adapter if access allows, clearly mocked if not.
- [ ] Seven verified publishable questions OR explicit PUBLIC-LAUNCH BLOCKER with demo-only local challenge.

## P0 milestone 5: sharing and reliability
- [ ] Share card with branded visuals and spoiler-safe content.
- [ ] Copy/share challenge link works on new device and in private mode.
- [ ] E2E main flow plus input/network/error, DST, security, accessibility tests.
- [ ] Manual screenshots, performance numbers, audit log, written runbook, preview deployment guide.

## P1 after P0 passes
- [ ] 9:16 animated WebM/MP4 or graceful browser fallback; optional server render.
- [ ] 14-day approved challenge queue; deep content editor UX.
- [ ] Referral dashboard and A/B tests limited to presentation.
- [ ] Optional linked account, historic campaign packs, Discord results.

## P2 only with evidence of retention
- [ ] New eras, many environments, live multiplayer, cosmetics, optional paid packs, sophisticated ranking/matches, educational partnerships.

## Hard release gates
**G1 Security:** no critical client scoring/answer leak, unauthorized admin access, or secret disclosure.
**G2 Historical integrity:** all public content has reviewed evidence and clearly defined eligible membership, no unlicensed media.
**G3 Stability:** complete guest play on iOS Safari and Android Chrome; tab resume, timeouts, 7-round completion, result token.
**G4 Visual:** curated original art, no layout clipping, clear text, reduced-motion and accessible keyboard.
**G5 Distribution:** 1:1 result card, spoiler-safe challenge URL, measurable share loop.
**G6 Operations:** dated daily data ready at midnight New York, monitoring, backup recovery and correction/appeal workflow.
**G7 Evidence:** build/test screenshots and results, not unverifiable claims.

If any gate fails, the status is **NOT LAUNCH READY**. A convincing local vertical slice can still be delivered and demoed honestly.

## Suggested sequence and effort expectations
Do the vertical slice first, then make it stunning. Approximate team effort differs drastically by art quality, historical content depth and agent/reviewer capability; do not promise one agent can publish a fully original polished and vetted game in a single uninterrupted pass. A practical development plan uses four overlapping workstreams: game/UI, backend/security, data/editorial, growth/QA. The prompt asks for maximum autonomous implementation, but the code must be examined and tested before shipping.

## Agent final answer format
1. Build status: PLAYABLE DEMO / PREVIEW READY / LAUNCH READY (only when justified).
2. Exact commands and environment requirements.
3. Feature matrix P0/P1 and missing items.
4. Actual test/build results with failures/skips.
5. Historical data source/rights list and human-review gaps.
6. Screenshots / test artifacts, device and performance notes.
7. Security findings, known limitations, blocked external services.
8. Next 10 tasks sorted by release risk and impact.
