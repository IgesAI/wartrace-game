# ADR-001: PGlite for local development and tests

**Status:** Accepted (2026-11-22)

## Context
The handoff assumes Postgres everywhere. The build environment has no Docker, and contributors should be able to run `npm ci && npm run dev` without any database server.

## Decision
Use `@electric-sql/pglite` (Postgres compiled to WASM) when `DATABASE_URL` is unset, file-backed in `.data/pglite` for dev and in-memory per test file. When `DATABASE_URL` is set, use node-postgres. Both run the same Drizzle migrations, including hand-written immutability triggers, and the same queries, including `SELECT … FOR UPDATE`.

## Consequences
+ Zero-setup local play and fast, isolated integration tests against real Postgres semantics.
- PGlite is single-writer and runs in-process; it is never used in preview or production (env validation requires `DATABASE_URL` there).
- Concurrency behaviour has to be checked on real Postgres. The CI `postgres` job does this, and a 25-way parallel submit on Postgres 16 produced exactly one lock.
