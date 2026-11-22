# 24 — Content Manager Dashboard, Asset CMS & Editorial Analytics Requirements
**Version:** 1.0 | **Companion to:** docs/10_ADMIN_OPERATIONS.md and docs/03_ARCHITECTURE.md

## Product requirement
A non-engineer editor must be able to prepare, review and schedule WARTRACE content without editing code or database rows. The same dashboard must inventory asset provenance, campaign copy and social outputs. Distinguish content statuses from deployed/runtime versions.

## Information architecture
### 1. Editorial Home
KPI tile set: next 14 days coverage, number of reviewed/queued questions, rights blocks, needs-approval, live disputes, daily scores flagged for fairness, social assets pending, published campaigns. Quick filters by era/pillar/owner/release date/status.

### 2. Question library
Create question, define eligibility, preview common/rare answers, source citations, alias collisions, negative test cases, rarity distribution and expected audience level. Reviewer action logs actor/time/reason. Inline diff of frozen snapshot versus proposed correction. No simple 'AI generate and publish' button.

### 3. Operations calendar
Calendar by `America/New_York` issue date showing 7 questions, scene key, reveal source cards, social hook, pre-release art/rights, channel schedules (draft only), freeze status, and owner. Week view includes editorial thematic balance and publish blockers.

### 4. Asset registry
Sortable table of `asset_id`, type, source, license, derivative rights, commercial rights, marketing rights, review status, hash, runtime size, credit. Asset inspection includes screenshot of license proof and cropped image preview. Only rights-approved hashes selectable by the game publisher.

### 5. Creative production board
Asset requests move through `briefed` → `draft` → `visual_qa` → `historical_qa` → `license_qa` → `approved` → `integrated`. Each ticket links to scene, owner, delivery date, creative brief, design tokens, editable source, preview and proof. Flags blocking art readiness visible in editorial calendar.

### 6. Social studio
Drafts only: generate share card/video from a published or internal-safe game run, edit approved caption, label spoiler-sensitivity, attach exact source, file export state, accessibility status, channel/status. Actual network publishing is a separate explicitly authorized integration/action.

### 7. Moderation & appeals
Queue answer appeals and media complaints with priority, historic evidence, proposed reviewer decision, public correction copy, and reply template. Never leak guest email/IP, unrevealed answer sets, private tokens or abuse-detection rules to social manager role.

### 8. Analytics
Content pillars, platform channels, device, source quality, actual share link → started → completed, retention cohorts, source-card opens, historical complaints. Events should not log free-text player answers; use answer-category IDs or reason codes after privacy review.

## Access roles
`creative_contributor` uploads candidate art (not publish), `content_editor` drafts/publishes social copy to internal calendar only, `historical_reviewer` verifies eligibility, `rights_reviewer` approves media, `publisher` schedules approved operation, `owner` manages roles/deploy/release settings. An individual may hold multiple roles but publish approval workflow must preserve independent review, not rubber-stamp itself.

## API/domain requirements
Add models for `assets`, `asset_license_evidence`, `asset_reviews`, `creative_briefs`, `social_posts`, `editorial_calendar`, `campaigns`, `content_topics`, `moderation_cases`, `audit_events`. Use stable unique IDs, approved-only read filters, optimistic concurrency versions, signed upload URLs, maximum file sizes, content-type sniffing, malware defense for untrusted uploads, authenticated preview URLs, and immutable published snapshots.

## The exact fields for `social_posts`
`id`, `title`, `format`, `channel`, `caption`, `tags`, `scheduled_at` (nullable draft), `spoiler_level`, `operation_id`, `asset_ids`, `source_ids`, `campaign_id`, `status`, `accessibility_review`, `factual_review`, `rights_review`, `owner_id`, `created_at`, `updated_at`, `approved_by`, `published_external_id` (nullable). **Never invent an external ID or mark sent merely after queueing.**

## The exact fields for `creative_briefs`
`brief_id`, `asset_type`, `required_dimensions`, `formats`, `design_token_version`, `layer_specs`, `animation_spec`, `scene_id`, `historical_reference_urls`, `excluded_motifs`, `creator_id`, `commission_approved`, `license_document`, `source_file_uri`, `rendered_preview_uri`, `approval_status`, `blockers`, `deadline`, `delivered_at`.

## Essential dashboard workflows (acceptance tests)
1. Editor creates an operation draft, adds seven reviewed questions, then attempts to publish with one missing asset license → **block with actionable reason**.
2. Rights reviewer approves exact version/hash of asset; publisher's preview updates; audit retained.
3. Editor creates a social clip draft with a source card and a real result token; preview reveals no unreleased answers.
4. Contributor uploads a PNG with suspicious MIME / oversized payload → rejected safely, no code execution.
5. Content reviewer rejects ambiguous WWII fighter criteria; version is returned to editorial with notes.
6. Player appeal after daily release → case opened; reviewer changes future eligibility, frozen prior score unchanged except transparent global correction process.
7. Dashboard owner sees 14-day deficit and can download a production queue report.
8. Social manager without rights approval cannot mark a media asset ready or post externally.

## Implementation order
P0: Question publishing + source evidence + asset rights registry/readiness gate. P1: calendar and creative production board. P2: social draft library, video composition and creator workflow. P3: authorized platform publishing, external integrations and campaign attribution after security/privacy design. A fancy CMS is never more important than the reliable actual game.
