# ADR-003: Separate demo and verified content classes

**Status:** Accepted (2026-11-22)

## Context
There is no human-reviewed historical content yet, but the whole loop must be demonstrable. Candidate or fictional content must never appear as verified.

## Decision
`daily_operations.content_class` is `demo` or `verified`. Demo operations may waive evidence and rights blockers only through an explicit demo publish. Every demo surface shows a banner. `WARTRACE_DEPLOY_ENV=production` refuses to publish or serve demo content, and the seed script refuses to run there. The seed fixture uses fictional entities and is not publishable as verified.

## Consequences
+ End-to-end testing and review without fabricating history.
- Adds a column and gate branch. Launch remains CONTENT BLOCKED until verified operations exist.
