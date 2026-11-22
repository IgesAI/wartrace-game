# ADR-002: At most one clarification per round

**Status:** Accepted (2026-11-22)

## Context
Rules say ambiguous aliases need user confirmation and near-misses may get a suggestion, never silent autocorrection. Unlimited clarifications would let players probe the answer bank.

## Decision
A round may return `needs_clarification` once: either a choice between candidate entities or a "did you mean" suggestion. The response does not lock the round. The client re-submits with the same idempotency key to accept a choice, or with a fresh key to keep the typed answer, which then grades and locks. A second ambiguous input in the same round is graded as typed. The timer keeps running.

## Consequences
+ Honours the confirmation rule while limiting answer-bank oracle attacks to one bounded hint.
- Players get no second suggestion; this is accepted for fairness and simplicity.
