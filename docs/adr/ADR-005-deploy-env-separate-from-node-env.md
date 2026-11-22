# ADR-005: Production rules keyed on WARTRACE_DEPLOY_ENV

**Status:** Accepted (2026-11-22)

## Context
`NODE_ENV=production` is set by `next build`/`next start`, including local e2e runs. Production safety rules (no mock auth, no demo content, required secrets) must not trigger locally, and must not be skippable in real production.

## Decision
Introduce `WARTRACE_DEPLOY_ENV` = `local` | `test` | `preview` | `production` (default `local`). Env validation, the demo gate, mock-auth refusal and asset `--production` behaviour all key on it.

## Consequences
+ Local production builds are testable, and real production fails closed when misconfigured.
- Operators must set the variable correctly; the deployment steps call this out.
