# WARTRACE

**How far can your knowledge take you?** A daily history knowledge game: seven prompts, one typed answer each, 25 seconds per round. Rarer valid answers carry an expedition courier farther across an original, fictionalised Western Front-inspired landscape.

> **Status: PLAYABLE DEMO — NOT LAUNCH READY · CONTENT BLOCKED.**
> The game loop, scoring, publishing gate, admin suite, sharing and tests work locally. Public launch is blocked on human-reviewed historical content, rights approval for the art, an admin identity provider, hosting, and legal review. See [`docs/RELEASE_REPORT.md`](docs/RELEASE_REPORT.md).

## Quick start

Requires Node.js ≥ 22.12. No database server, Docker, or secrets are needed for local development.

```bash
npm ci
npm run dev                      # http://localhost:3000 — embedded Postgres (PGlite) + DEMO content
```

With no `.env.local`, the app uses an embedded PGlite database at `.data/pglite`, auto-applies migrations, and (with `GAME_DEV_FIXTURE_MODE=true`, set in `.env.example`) seeds clearly labelled **DEMO** operations for today and the next two days. Copy `.env.example` to `.env.local` to change settings.

- Play: open `/` → **Play today’s operation**.
- Editorial suite: `/admin/login` → pick a development role (local only).
- Shorten the timer for manual testing: `GAME_ROUND_SECONDS_OVERRIDE=8 npm run dev`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Next.js dev server, production build, production server |
| `npm run lint` / `npm run typecheck` | ESLint (flat config) and `tsc --noEmit` |
| `npm test` | Vitest unit + integration (PGlite with real migrations and triggers) |
| `npm run test:security` | Security-focused integration suite only |
| `npm run test:e2e` | Playwright (builds must exist: run `npm run build` first) — mobile + desktop, axe, responsive screenshots |
| `npm run test:a11y` | axe accessibility checks only |
| `npm run db:migrate` | Apply migrations (Postgres when `DATABASE_URL` is set, else PGlite) |
| `npm run db:seed:demo` | Seed and publish DEMO operations (refused in production) |
| `npm run content:lint [-- --date YYYY-MM-DD] [--strict]` | Publication readiness report |
| `npm run content:verify -- --date YYYY-MM-DD` | Recompute and compare a published operation’s frozen checksum |
| `npm run content:publish -- --date D --actor dev:publisher [--demo]` | CLI publish through the same gate, role check and audit log |
| `npm run source:wikidata -- --qid Q1,Q2 [--write]` | Fetch Wikidata candidates (tier C, never auto-reviewed) |
| `npm run assets:lint [-- --production]` / `npm run assets:hash` | Asset rights/provenance gate; re-record hashes (revokes approval on change) |

PGlite is single-writer: stop `npm run dev` before running CLI scripts against the same `.data/pglite` directory.

### Real Postgres (optional)

```bash
docker compose up -d   # or any Postgres ≥ 15
export DATABASE_URL=postgresql://wartrace:local_only_password@localhost:5432/wartrace_dev
npm run db:migrate && npm run db:seed:demo && npm run dev
```

## How it fits together

- `src/modules/domain` — pure, tested rules: scoring (`wartrace-rarity-v1`), normalisation, matcher, New York date keys, snapshot canonical JSON.
- `src/modules/game` — server-authoritative run/round engine (persisted deadlines, atomic locks, idempotency, lazy timeouts), appeals.
- `src/modules/content` — readiness gate, publish/restore/disable with immutable checksummed snapshots, audit log, demo seed, Wikidata adapter.
- `src/modules/db` — Drizzle schema; `drizzle/` holds SQL migrations including immutability triggers.
- `src/game` — one scene description rendered by PixiJS v8 (live) and SVG (fallback, share card, replay).
- `src/app` — App Router pages and `/api/v1` route handlers; HTML owns every control, the canvas is decorative.

Architecture, decisions and the risk register: [`docs/IMPLEMENTATION_DECISIONS.md`](docs/IMPLEMENTATION_DECISIONS.md). Art pipeline: [`docs/ART_IMPLEMENTATION_DECISIONS.md`](docs/ART_IMPLEMENTATION_DECISIONS.md). ADRs: [`docs/adr/`](docs/adr). The original handoff package (product, rules, architecture, provenance, QA, ship gates and the creative addendum) lives in [`docs/`](docs), [`specs/`](specs), [`db/`](db), [`assets/`](assets), [`templates/`](templates) and [`ops/`](ops); start with [`docs/HANDOFF_README.md`](docs/HANDOFF_README.md) and [`MASTER_AGENT_PROMPT.md`](MASTER_AGENT_PROMPT.md).

## Ground rules (from `AGENTS.md`)

No live LLM scoring. No competitor art or data. No source-less historical claims — demo content is labelled and cannot publish as verified. No raw answers in telemetry. No secrets in the repo. No external deployments, accounts or spending without the owner’s explicit approval.
