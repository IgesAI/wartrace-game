# 15 — Architectural Decision Record Summary

| ADR | Decision | Rationale | Revisit trigger |
|---|---|---|---|
| 001 | Modular Next.js monolith | Fast implementation, simple deployment | Team scale or measured coupling |
| 002 | PixiJS v8 + DOM overlays | Cinematic scene and accessible inputs | Native game interactions require full engine |
| 003 | Managed Postgres + Drizzle | Relational evidence, migrations, transaction safety | Sustained throughput limits |
| 004 | Frozen rarity scoring | Player trust and fairness | Transparent versioned recalibration only |
| 005 | Named NY timezone date | Consistent synchronized daily operations | Global game-mode redesign |
| 006 | Human-reviewed historical data | Factual integrity / provenance | Better tooling, but never remove review gate |
| 007 | Guest-first private sessions | Minimize friction and PII | User requests cloud accounts/social features |
| 008 | Launch without payments | Focus core loop and retention | Demonstrated demand and compliance clearance |
| 009 | One polished scene first | Avoid over-scoping art production | Retention evidence and art budget |
| 010 | Original IP / working title | Avoid cloning and naming conflicts | Formal brand clearance outcome |
| 011 | Share card required; video gracefully optional | Browser encoder support varies | Reliable cross-browser video pipeline available |

## Required new decision procedure
Each deviation gets `docs/adr/ADR-###-name.md`: status, context, alternatives considered, decision, technical implications, security/rights implications, rollback trigger, date and owner. Update master prompt references if deviation changes the public product spec. Do not silently change core scoring or content eligibility.
