# ADR-006: In-memory rate limiting for the single-instance MVP

**Status:** Accepted (2026-11-22)

## Context
The master prompt says to avoid Redis until required. Submit, start, appeal and analytics endpoints still need abuse limits.

## Decision
Use a per-process token bucket keyed by a hashed client IP or guest id (`src/server/http.ts`). Exceeding a limit returns 429 `RATE_LIMITED` in the standard error envelope.

## Consequences
+ No extra infrastructure.
- Ineffective across multiple instances and reset on restart. Before scaling out, move limits to a shared store such as a Postgres table or Redis. This is tracked as risk R7.
