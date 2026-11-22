# 10 — Editorial Admin, Daily Publishing and Live Operations

## Roles and permissions
- `reader`: analytics and published content only.
- `editor`: create candidate entities/questions, attach evidence, stage aliases, respond to appeals.
- `reviewer`: independently review evidence and score coverage, approve or reject readiness.
- `publisher`: schedule, publish and rollback approved daily operations; cannot override unsourced content checks without documented exception requiring independent approval.
- `owner`: user administration and system configuration; strongly protected, MFA.

## Admin workflow
Dashboard shows 14-day challenge queue, coverage score, unreviewed aliases, unresolved disputes, question conflicts, planned art/rights dependencies and freshness. Editor creates question with eligibility and exclusion notes. Ingestion suggests candidates and aliases as **untrusted pending**. Reviewer verifies records and signs off. Publisher selects seven approved questions, preview plays them with an isolated fake guest, chooses release date, and commits immutable operation snapshot. A preview confirmation must show source coverage, score distribution and collision count.

## Publication readiness gate
Before scheduled challenge can become public:
- Seven distinct reviewed prompts, no missing IDs, stable answer bank snapshots and checksum.
- No fatal duplicate or ambiguous aliases; all eligible answers have at least one approved citation, evidence license metadata where relevant.
- Scoring distribution validated (points within 100–1000, consistent tiers), one rule version for all players.
- Rights-reviewed visual asset for operation scene; moderation check passed.
- `date_key` unique for active daily slot and covers next two weeks ideally.
- Site status and feature flags healthy; backup/restore recovery documented.

## Release strategy
Prepublish records days in advance. At midnight **America/New_York**, the app queries that date's *already-published* immutable operation. The release does not depend on a cron completing exactly at midnight. Cron is for content readiness warnings and housekeeping, not for creating the current day's challenge from scratch.

## During daily operation
Operator dashboard: play starts, completion rate, 429/500 spikes, editor appeals, missing answer complaints, suspicious scores, replay export failure rates. Any problem gets an incident ticket with affected question/version and extent. Admin cannot silently manipulate scoring for individual players.

## Appeals and corrections
Appeal entered -> moderation/triage -> scholarly validation -> `valid_missing`, `invalid`, `ambiguous`, `needs_research` -> proposed editorial change -> reviewer approval -> future snapshot update. If past daily result was materially unfair, choose one documented policy (issue public correction and optionally recompute all affected plays using revised snapshot). Never selectively change an influential user's score. Log old/new source IDs, rationale, reviewer and date.

## Incident severity and response
- **P0:** data leak, scoring exploit, major legal violation, inaccessible daily game. Disable affected surface, preserve evidence, restore known-good version, communicate appropriately.
- **P1:** erroneous widely accepted answer, major mobile crash, broken share result. Triage same day and communicate corrections.
- **P2:** minor alias gap, art bug, secondary analytics failure. Add backlog/patch.

## Operations runbook commands (agent must implement)
- `db:migrate`: idempotent migration process with safe error reporting.
- `db:seed:demo`: create **non-production** demonstration challenge and user (never production credentials).
- `content:lint`: scan all candidate/published questions for source, alias, scoring and license requirements.
- `content:publish --date YYYY-MM-DD`: role-authorized transaction (CLI must enforce permissions or only admin UI).
- `content:verify --date YYYY-MM-DD`: read-only content readiness report.
- `test:e2e`, `test:security`, `test:a11y` equivalents.
Agent must document actual commands and never suggest commands not created.

## Backup, recovery, monitoring
Daily Postgres snapshots with provider-managed PITR if available; periodic restore rehearsal on isolated database; asset manifest checksum; preserve prior immutable question snapshots. Log all admin state changes and source-review decisions. Alerts: daily challenge missing in next 48h, 5xx error spike, publish transaction failure, data import exceeded quotas, appeal backlog exceeded staffing target.

## Service economics
No need to import the entire National Archives. Prefer capped and scheduled entity queries, cached metadata and curated sources. Estimate budgets from actual usage metrics; set cost guardrails on API calls, object storage, event volume, and media exports. Never use a high-priced live LLM for each answer submission.
