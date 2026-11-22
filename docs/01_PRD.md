# 01 — Product Requirements Document (PRD)
**Product:** WARTRACE | **Owner:** Product/engineering | **Version:** 1.0 | **Status:** Approved concept, unbuilt

## Executive statement
WARTRACE turns historical knowledge into cinematic progress. Rather than selecting A/B/C/D, players supply one historically valid answer per round. Unusual answers move an expedition through a rich original landscape. One global daily challenge generates comparable, evidentially defensible scores and short replayable stories. The product is a knowledge game, not a war fighting simulator.

## Market thesis and falsifiable proposition
Hypothesis: A polished daily game with uncommon-answer rewards and proof-backed fairness will outperform a conventional history quiz on shares per completed session. This is not a forecast. The MVP must measure funnel, repeat play and invitation conversion; after two weeks, invest in broader environments only if daily completion and sharing justify the expense.

## Player segments
1. **Curious casual (primary):** 18–40, short mobile game session, may know broad facts but not military minutiae. Needs accessible prompts, legible graphics and low intimidation.
2. **History enthusiast:** demands rigorous answer rules, nuanced context and rare rewards; will publicize flaws. Needs appeal and source features.
3. **Creator/streamer:** wants challenge, strong visual payoff and audience participation. Needs stable daily question sets, spoiler-safe comparisons and recap media.
4. **Teacher/educator (later):** needs accessible, accurate historical context; no targeted classroom marketing in MVP.

## Core product values
- Wonder, not sensationalized violence.
- Curiosity, not elitism: common valid answers always count.
- Verifiable knowledge, not vibes: content must carry sources.
- Fairness, not opaque shifting scores.
- Fun first, editorial rigor always.

## Player lifecycle / journey
**Discovery:** social replay or search -> a landing page showing scene and today's prompt teaser. CTA Play Today. No sign-in/upsell.
**Onboarding:** 3-panel maximum or tooltips over first game: 'Type one real answer', 'Rarer moves farther', 'Seven rounds. Same challenge worldwide.' Skip button.
**In game:** Enter daily -> prompt with 25-second answer timer -> user types and locks -> confirmation/review -> scene travels corresponding distance -> next. Zero-input/timeout receives graceful 'No distance this round' feedback. Sources displayed after response locks, not during answer window.
**Results:** clear total and rank label without implying real military ranks; rarest submitted valid answer, per-round ledger and citations -> spoiler-safe challenge link and social video/card -> source and correction path.
**Return:** 'Next operation in [time]' calculated in America/New_York; completed daily results persist per guest, accessible via signed cookie. No mobile push in MVP.

## Requirements with IDs
| ID | Priority | Requirement | Acceptance |
|---|---|---|---|
| PRD-001 | P0 | Start guest daily game | Under 2 meaningful taps from landing; no mandatory account |
| PRD-002 | P0 | 7 finite rounds | Timer/input/submit/results all usable; round progression locked |
| PRD-003 | P0 | Valid open-answer grading | Server recognizes canonical names and reviewed aliases; rejects invalids |
| PRD-004 | P0 | Frozen deterministic scoring | Same answer yields same score for challenge version |
| PRD-005 | P0 | Animated environment | Camera moves in response to points; mobile fallback |
| PRD-006 | P0 | Source transparency | Each scored answer can show source and editorial status |
| PRD-007 | P0 | Spoiler-safe share | Recipient sees challenge not answer keys |
| PRD-008 | P0 | Admin publish control | Reviewer can preview, approve and version challenge |
| PRD-009 | P0 | Accessible operation | Keyboard, reduced motion, contrast, focus, screen reader labels |
| PRD-010 | P0 | Security/privacy | Signed guest session, server checks, no open answer database |
| PRD-011 | P0 | Error handling | Network, timeout, API and unsupported renderer states designed |
| PRD-012 | P0 | Analytics | Events capture funnel with no free-text answers |
| PRD-013 | P1 | Shareable 9:16 rendered replay | Client export or safe platform fallback |
| PRD-014 | P1 | Optional linked account | Guest merge and basic privacy choices |
| PRD-015 | P1 | Multi-era campaign library | Separate content releases, verified evidence |
| PRD-016 | P2 | Real-time multiplayer | Anti-cheat/broadcast infrastructure only if demand proven |

## In-scope pages
`/` home; `/daily` challenge; `/game/[run]` active play (guest authorized); `/results/[publicToken]` shareable view; `/archive` explain coming/previous; `/explore/[entity]` evidence; `/appeal` answer issue; `/admin/*` restricted editorial suite; `/about`, `/privacy`, `/terms`, `/accessibility`, `/support`.

## Full session example
Daily issue 'Operation Fogline' opens with a moody hillside and trench horizon. Round 1 prompts an eligible aircraft category. A player submits a validated aircraft; 'Uncommon: +520 / +416m' appears briefly, then the camera tracks the expedition. Later a common answer yields +210, remaining satisfying. After seven attempts player sees e.g. '2,472m traversed', a 7-line ledger and 'Challenge a friend'. Result is visually exciting but does not pretend to map to literal troop movement.

## KPIs / test hypotheses (not promises)
North star: **verified, completed daily expeditions that generate at least one return or invitation event**. Instrument daily starts, round completion, challenge completion, next-day and 7-day return, share intent/actual use where observable, share-link click-through and started-from-share. Initial exploration gates: >65% complete after starting; >10% click share or copy result; >20% D1 return. These are *experiment thresholds* to evaluate, not baseline or expected traction. Investigate subgroup bias before broad scaling.

## Constraint-aware scope discipline
Must-haves: complete 7-round loop, one outstanding scene, deterministic results, trust and share. Avoid content/library/paid-feature explosion. Ship 7 reviewed questions/day first and maintain a 14-day published queue before broad marketing. If content quality gate isn't met, postpone release; don't substitute unsourced machine-generated answers.

## Monetization
No monetization in initial public beta. Evaluate ad-free paid campaign packs and cosmetics only after retention; public daily game and source transparency remain free. No pay-to-win score boosts, hidden penalties, gambling mechanics or purchasable leaderboard rank.

## Business and legal risks
Name clearance; copyright and public-domain assumptions; archival ambiguity; missed valid answers and factual controversies; sensitive wartime topics; PII leakage via share links; high costs from unrestricted search/data ingestion. Each is assigned a mitigation in the provenance, security and operations docs.

## Launch exit criteria
See `12_SHIP_CHECKLIST.md`: zero unresolved P0 security/content failures, 7 published reviewed prompts per daily, full guest game, satisfactory real-device responsiveness, social share, monitored deploy, staffed appeal queue, explicit privacy and attribution review. Virality cannot be guaranteed by implementation completeness.
