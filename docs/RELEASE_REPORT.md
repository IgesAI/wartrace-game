# WARTRACE — Agent Delivery / Release Evidence Report
**Date / commit:** 2026-11-22 · branch `cursor/mvcp-foundation-9189` (see PR for final SHA)
**Environment:** local only. No preview or production deployment exists or was attempted.
**Build classification:** **PLAYABLE DEMO** · **NOT LAUNCH READY** · **CONTENT BLOCKED**

## 1. Implemented features
| Feature ID | Completed? | File/route evidence | Notes |
|---|---|---|---|
| PRD-001 Guest daily start | Yes | `/` → `/daily` → `src/app/daily/StartRun.tsx`, `POST /api/v1/runs` | One tap from landing; signed guest cookie; no account |
| PRD-002 7 finite rounds | Yes | `src/modules/game/service.ts`, `src/app/game/[runId]/GameClient.tsx` | Server-persisted deadlines, sequential opening, resume after reload |
| PRD-003 Open-answer grading | Yes | `src/modules/domain/{normalize,matching}.ts` | Canonical names and reviewed aliases; one bounded clarification (ADR-002); invalid input gets 0 |
| PRD-004 Frozen scoring | Yes | `src/modules/domain/scoring.ts`, `operation_snapshots` + triggers | `100 + round(900·r^1.3)`; passes `specs/scoring_vectors.json` |
| PRD-005 Animated environment | Yes (demo art) | `src/game/*` | Pixi six-layer parallax; SVG fallback; reduced motion |
| PRD-006 Source transparency | Yes | Reveal "Why this counts", owner results ledger, `/explore/[entityId]` | Demo answers show "Demo — evidence pending" honestly |
| PRD-007 Spoiler-safe share | Yes | `/results/[token]` public view, `/challenge/[date]`, OG and 1:1 cards | Answers never in public views or images |
| PRD-008 Admin publish control | Yes | `/admin`, readiness gate, publish/restore/disable, audit log | Roles: editor, reviewer, publisher, admin (mock local auth only) |
| PRD-009 Accessibility | Yes | axe suite, keyboard e2e, prefs toggles, live regions | WCAG 2.2 AA serious/critical clean on tested pages |
| PRD-010 Security/privacy | Yes | `src/server/http.ts`, `src/modules/auth/*`, security suite | HMAC cookies, CSRF checks, rate limits, CSP |
| PRD-011 Error handling | Partial | Network/timeout/API/WebGL states; recovery phase | Offline banner and maintenance page are basic |
| PRD-012 Analytics | Yes (disabled) | `src/modules/analytics/*`, `POST /api/v1/analytics` | Strict schemas with no free text; first-party table; off by default |
| PRD-013 9:16 replay | Yes (client) | `src/game/replay.ts` | WebM via MediaRecorder; card fallback when unsupported (T-065 path) |
| PRD-014 Linked account | No | — | P1 |
| PRD-015 Multi-era library | No | — | P1, needs verified content |
| PRD-016 Multiplayer | No | — | P2 |
| Addendum: tokens, asset register, rights gate, credits | Yes | `assets/style_tokens.json` → `globals.css`/`scene-spec.ts`; `assets/asset-register.json`; `npm run assets:lint`; `/credits` | |
| Addendum: Wikidata source adapter | Yes | `src/modules/content/sources/wikidata.ts`, `npm run source:wikidata` | Live fetch verified; stored as tier C candidates only |

## 2. Working commands
- Install: `npm ci`
- Local database: none required (PGlite at `.data/pglite`). Optional Postgres: `docker compose up -d`.
- Migrations: `npm run db:migrate` (auto-applied for PGlite in dev)
- Seed: `npm run db:seed:demo` (refused when `WARTRACE_DEPLOY_ENV=production`; dev auto-seeds when `GAME_DEV_FIXTURE_MODE=true`)
- Development: `npm run dev`
- Build: `npm run build && npm start`
- Tests: `npm test`, `npm run lint`, `npm run typecheck`, `npm run assets:lint`
- E2E: `npm run build && npm run test:e2e` (set `E2E_DATABASE_URL` to run against Postgres)

## 3. Test results (actual, not projected)
| Suite | Run command | Pass/fail/skip | Evidence/log |
|---|---|---|---|
| lint | `npm run lint` | pass (0 problems) | local run, 2026-11-22 |
| typecheck | `npm run typecheck` | pass | local run |
| unit | `npm test` (`tests/unit`) | 38 pass / 0 fail | scoring 16 (vectors, T-030/031/033–036), matching 13 (T-010–T-017), dates 5 (T-001–T-005), wikidata 4 |
| integration | `npm test` (`tests/integration`) | 38 pass / 0 fail | game 20 (T-006, T-020–T-028, T-056), publish 9 (T-050–T-055, rights gate), security 9 (T-040–T-046) |
| E2E mobile (375×812, Pixel 7) | `npx playwright test` | 10 pass / 0 fail | full 7-round game and share, resume, keyboard plus reduced motion, timeout, API tamper, admin roles, CSRF, axe |
| E2E desktop (1440×900) | `npx playwright test` | 5 pass / 0 fail | axe; responsive 375/768/1440 with no horizontal overflow |
| E2E on real Postgres 16 | `E2E_DATABASE_URL=… npx playwright test --project mobile` | 10 pass / 0 fail | earlier run in this session |
| Concurrency on Postgres 16 | ad-hoc script: 25 parallel submits | 1 locked, 24 `ROUND_LOCKED`; score counted once | earlier run in this session |
| security checks | security suite + T-047 header check + T-048 bundle scan | pass | `Cache-Control: private, no-store` on API; no secret names in `.next/static` (also a CI step) |
| accessibility | `npm run test:a11y` | 4 pass | landing, policy pages, intro, active round, reveal, results |
| assets | `npm run assets:lint` / `-- --production` | 0 errors and 25 warnings / **25 errors (expected)** | production fails until rights approval |
| build | `npm run build` | pass | |

Not run or not covered yet: real iOS Safari and Android Chrome devices (G3), T-064 actual video export in CI (MediaRecorder headless), T-071 manual screen-reader pass, load test, backup/restore drill, a CI run on GitHub (the workflow is committed but has not run before this PR).

## 4. Visual evidence
Screenshots from the final e2e run (procedural DEMO art): landing, active round, reveal and results at 375×812, 768×1024 and 1440×900. Attached to the PR; regenerate with `E2E_ARTIFACTS_DIR=<dir> npx playwright test tests/e2e/responsive.spec.ts`. Scene FPS and network payload have **not been measured** on target devices (P1). FPS is capped at 30 on small screens and 60 otherwise; there are no bitmap art assets.

## 5. Content/evidence
- **Reviewed questions ready for publication: 0.** Drafts: 7 DEMO questions (fictional "Operation Fogline" fixture) with 49 answers and 137 aliases. 0 answers have reviewed tier A/B sources. Contested: none recorded.
- Seed provenance: `src/modules/content/seed.ts`. Fictional demo fixture written for testing; rarity values are illustrative, not measured; marked `content_class=demo`, `is_demo=true`. The UI shows a DEMO banner. The fixture **cannot** publish as verified, and production refuses it.
- Sources: verified 0. Candidate: Wikidata (tier C, discovery only) via `npm run source:wikidata`. `docs/14_SOURCE_REGISTER.md` lists candidate institutions; none have been consulted for specific claims.
- Legal rights: see §6.

## 6. Privacy/security
- Secrets: none in the repo. `.env.example` has empty values. Local dev derives ephemeral secrets; preview/production env validation requires real secrets and `DATABASE_URL`, and rejects mock admin auth.
- Auth: guest cookie HMAC-signed and httpOnly (DB stores only the sha256 of the secret); admin cookie HMAC-signed, SameSite=strict, 8 h, role re-read from the DB on every request. **Admin auth is a development mock**: an identity provider is a P0 blocker.
- Anti-cheat: server-side grading, persisted deadlines, row lock plus idempotency, immutability triggers, answer bank never sent to the client (T-046).
- Rate limits: in-memory per process (ADR-006). Must move to a shared store before running multiple instances.
- Known vulnerabilities: production dependencies 0; dev-only esbuild advisory via drizzle-kit (4 moderate).
- Third-party processors: **none**. No analytics vendor, CDN, email or AI service is used. Analytics are disabled by default and first-party when enabled.
- Retention and deletion: guest sessions expire after 400 days (local default). Retention periods for runs, appeals and analytics and a deletion request flow are **owner decisions** (privacy page is a DRAFT).
- Admin ACL: role matrix enforced server-side; append-only `audit_events`.
- Rights ledger: `assets/asset-register.json`, 14 assets. Cleared: **0**. Unresolved: 14 (12 agent-authored procedural demo placeholders pending an IP/rights decision; 2 OFL fonts pending archived notices).

## 7. Blockers and assumptions
Historian review of every launch question and source; trademark clearance for "WARTRACE"; rights approval (or a commission) for art; font notice archival; a real admin identity provider; hosting and managed Postgres choice; legal review of privacy, terms and support copy; analytics and consent decision; shared rate-limit store; testing on real iOS and Android devices. Assumptions are recorded as ADR-001 to ADR-006.

## 8. Deployment and rollback steps
See `docs/IMPLEMENTATION_DECISIONS.md` §6. Nothing was deployed.

## 9. Next tasks by priority
| Priority | Task | Why needed | Proposed owner |
|---|---|---|---|
| P0 | Real verified content: ≥ 14 operations, tier A/B sources, independent review | G2; CONTENT BLOCKED | Content director + historian |
| P0 | Admin identity provider (OIDC/SSO) replacing the mock | G1 | Owner decision, then engineering |
| P0 | Hosting + managed Postgres, preview environment, backups and restore drill, monitoring | G3/G6 | Owner approval, then engineering |
| P0 | Rights approval of art or commissioned replacement; archive font notices | G2/G4 | Rights reviewer / art director |
| P0 | Trademark clearance; legal review of privacy, terms and support | Launch | Owner / counsel |
| P0 | Real-device QA (iOS Safari, Android Chrome), screen-reader pass | G3/T-071 | QA |
| P1 | Content calendar, rights queue, creative production board, social drafts, creator briefs (docs 19–24) | Addendum CMS | Engineering + content |
| P1 | Signed-URL asset upload with automatic hashing; `creative_contributor` / `rights_reviewer` roles | Addendum doc 24 | Engineering |
| P1 | Atlas pipeline and image regression tests once bitmaps exist; FPS and payload measurement | Visual budget | Engineering |
| P1 | Shared rate-limit store; offline and maintenance states; `Retry-After` | Scale / PRD-011 | Engineering |
| P1 | Linked accounts, practice mode, archive play | PRD-014 | Product |
| P2 | Multi-era library, multiplayer, monetization experiments | PRD-015/016, doc 16 | Product |

## 10. Final disposition
**NOT LAUNCH READY.** Gate status: G1 partial (admin auth is a mock); G2 **fail** (no reviewed content, no cleared assets); G3 partial (emulated mobile only); G4 partial (placeholder art); G5 pass locally (cards, spoiler-safe link, analytics contract); G6 partial (correction/appeal workflow done; monitoring and backups not provisioned); G7 pass (real tests and screenshots, no invented results). **CONTENT BLOCKED** per doc 25 until verified sourcing is complete.
