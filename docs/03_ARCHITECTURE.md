# 03 — System Architecture and Delivery Design

## Technical decision
Use a modular monolith for the MVP. Next.js/TypeScript serves HTML pages and limited server endpoints, Postgres is the authoritative state store, PixiJS v8 draws a single game-world canvas, and accessible HTML handles text entry/controls. Background ingestion/admin content review runs outside player paths. Store historical answer snapshots in a normalized database with publication versioning. Avoid microservices, dedicated vector search and streaming LLMs until a measured requirement emerges.

## Functional architecture
```
Mobile/Desktop Client (React + CSS + lazy Pixi renderer)
      | HTTPS, HttpOnly guest cookie
      v
Next.js API / Auth & Rate-limit Middleware
      +--> Challenge read service (published question text only)
      +--> Round state service (atomic locks, deadlines)
      +--> Answer service (canonical + reviewed aliases)
      +--> Score service (frozen scoring version)
      +--> Result/share service (public token, OG card)
      +--> Admin service (RBAC + audit + publishing)
      |
      v
PostgreSQL (entity/evidence, question snapshot, runs, results, appeals, audit)
      ^
Offline / scheduled ETL workers -> Candidate review queue -> Human approval
      ^
Wikidata, NARA, LoC, Smithsonian, specialist scholarship
```

## Why not client-only
Client-shipped answer lists invite trivial scraping/cheating, enable local scoring tampering, and cannot enforce unique rounds and exact publication versions. Keep official scoring and answer sets server-side; client sends text, never trusts locally computed points. Use pure shared functions only for non-sensitive display and derived UI.

## Monorepo suggestion
```
wartrace-game/
  apps/web/src/app/                 # pages, route handlers, SEO
  apps/web/src/components/          # accessible controls, overlays
  apps/web/src/game/                # PixiJS scene, parallax, transitions
  apps/web/src/styles/              # tokens, responsive system
  packages/domain/src/             # pure scoring, entity, dates, errors
  packages/db/src/                 # Drizzle schema, migrations, queries
  packages/content/src/            # ingestion adapters, validation and rights
  packages/shared/src/             # Zod schemas, typed API contracts
  packages/analytics/src/          # privacy-controlled typed events
  public/worlds/western-front/      # owned or licensed original assets
  scripts/                          # seeded dev content, maintenance
  tests/unit, tests/integration, tests/e2e
  docs/                             # ADRs, runbooks, launch reviews
  .github/workflows/ci.yml
```
If using a single Next.js repository is simpler, preserve these logical boundaries as `src/modules/*` instead. No unnecessary Turborepo complexity.

## Frontend
- Render HTML shell SSR, lazy import game scene on client to avoid `window` SSR exceptions.
- PixiJS controls camera/terrain/parallax and effects; HTML layer handles input, timer, buttons, results, keyboard, screen readers and mobile safe areas.
- Preload small compressed scene texture atlas, use asset manifest with dimensions and rights; optional high-res assets loaded after initial interaction.
- Tune for 375x812 and low-power mobile. Canvas must not intercept pointer events for input buttons. Respect pixel density; avoid devicePixelRatio >2 on mobile where memory limits matter.
- If GPU renderer unavailable, show lightweight animated CSS/SVG scene and keep gameplay fully playable.

## API and concurrency
- Request validation: Zod; structured error envelope, request ID, no stack traces to clients.
- Guest session generated server-side (cryptographically random opaque ID), cookie HttpOnly, Secure in production, SameSite=Lax; database stores hash, not raw cookie token.
- `start run` creates/retrieves existing daily run atomically for guest+game; one per daily. Unique index protects races.
- `open round` persist start/deadline exactly once; `submit round` transact using `SELECT ... FOR UPDATE` or conditional atomic update; idempotency key unique.
- `post result` does not accept score from client; it derives authoritative completed run.
- Date key from `America/New_York` on server; tests on DST changes (spring/fall), UTC day boundary, leap day.
- Share token is random, unguessable, revocable and separate from internal run ID. No public endpoint exposes answer key before cutoff.

## Data / caching
- Postgres relational tables are primary system. Index on `operation.date_key`, `round_attempt(run_id, round_index)`, `accepted_answer(question_version_id, normalized_alias)`, `result.share_token`, `evidence(entity_id,status)`.
- Cache only published non-secret question metadata; do not cache personal runs publicly. If introducing Redis, justify with measured DB contention; keep origin authoritative.
- API-source ingestion through rate-limited queued worker. Cache upstream responses with ETag/Last-Modified where supported, exponential retry and dead-letter queue. A missing upstream must never block a live daily game.
- Use transaction-based publication and checksums for question answer snapshots, store immutable source lineage and append-only editorial events.

## Content publishing
- Draft -> review -> approved -> published -> retired/disputed. Only users with `editor` may edit candidate questions; `publisher` or two-person rule authorizes publication. Dev seed access is local-only.
- At publish: ensure 7 distinct questions, every source approved, alias collisions none unresolved, score version fixed, rights checked. Generate `snapshot_hash` and freeze answer records.
- Rollback: choose last valid published version and record why. Never silently mutate already-finalized scores; correction policy may regenerate results only with transparent disclosure.

## Background processing
- Daily availability is based on pre-published records, not a midnight API call. An admin schedules challenges days in advance. No cron needs to execute at midnight for player availability; the server query selects date key automatically. This avoids schedule drift and timezone ambiguity.
- Optional daily housekeeping in background: refresh cache, expire old guest sessions, process anonymization, record analytics rollups, generate static public share media if justified.

## Authentication and authorization
- Guest is default, no PII collected to play. Additional sign-in optional in later phase with strong linking semantics (never merge via client-provided user IDs).
- Admin must use authenticated roles and server authorization on every action; no `'isAdmin'` flags in localStorage. Require CSRF protection for session-authenticated mutations as appropriate, origin checks and security headers.
- Admin preview cannot leak unreleased answer lists to public pages or embed tokens.

## Hosting environments
- Local: Postgres via Docker Compose or provider dev DB, `.env.local`, seed command; one command to run dev app.
- Preview: isolated DB, nonproduction content, password/role protection for admin; no production secrets.
- Production: Vercel or equivalent for Next.js, managed Postgres, object store/CDN, optional background worker host if heavy ingestion; HTTPS and signed sessions.
- Environment variables listed in `ops/ENVIRONMENT.example`. Never hard-code credentials or commit real tokens.

## CI/CD and release strategy
CI on PR: format/lint/typecheck/unit/integration/build/Playwright smoke/license check/secret scan. Only deploy if checks pass. Apply migrations in a controlled release step, use expand/contract for breaking schema changes. Feature flags enable preview replay/multiplayer and disable them cleanly. Include rollbacks, Sentry/observability or comparable error monitoring if configured.

## Observability
Structured request logs with request IDs (no raw player answer text in analytics), API duration/4xx/5xx, DB latency, round outcome codes, scene FPS on sampled opt-in clients, game abandonment, content-appeal counts, daily publication readiness and error budget. Protect admin dashboards.

## Recommended ADRs
ADR-001 modular monolith vs services; ADR-002 static rarity; ADR-003 authoritative server clocks; ADR-004 Pixi renderer vs Phaser; ADR-005 anonymous guest/session and token model; ADR-006 evidence review and publication; ADR-007 client replay fallback. Use template.
