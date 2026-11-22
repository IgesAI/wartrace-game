# 08 — Product Analytics, Metrics and Event Schema

## Measurement principles
Measure behavior without logging free-text answers, raw IP, cookies or personally identifying info into third-party analytics. A player's answer text is treated as sensitive user-generated content in operational DB; analytics should include outcomes, categories and aggregate score, not the raw submission. Obtain consent as required for nonessential tracking. Document retention/deletion and opt-out.

## Event contract
| Event | Trigger | Attributes |
|---|---|---|
| `landing_viewed` | Homepage viewed | source, viewport_bucket, reduced_motion |
| `daily_cta_clicked` | Start clicked | date_key, acquisition_source |
| `game_started` | Run assigned | challenge_date, platform, anonymous_bucket |
| `round_started` | Server deadline assigned | index, question_category, version |
| `answer_submitted` | Lock attempt finalized | index, outcome, elapsed_ms_bucket, rarity_tier, score, distance_m |
| `round_completed` | Reveal ended | index, animation_skipped, renderer_type |
| `game_completed` | Round 7 finalized | score, distance_m, total_valid, seconds_total_bucket |
| `share_card_created` | Card export succeeds | format, origin |
| `share_intent` | Share/copy invoked | medium, privacy_choice |
| `challenge_link_opened` | Referral landing | channel, challenge_date, referral_token_present |
| `referral_game_started` | Shared-link visitor starts | challenge_date, source |
| `result_viewed` | Result rendered | own_result, share_context |
| `source_card_opened` | Evidence opened | question_category, source_tier |
| `answer_appeal_submitted` | Appeal created | question_category, reason_enum |
| `renderer_fallback_used` | GPU path unavailable | reason_enum, device_bucket |
| `client_error` | Recoverable client error | code, app_version, page_enum |

## Do not capture
Raw answer strings, evidence appeal free-text in telemetry, internal session token, full IP address, full URL query containing tokens, authentication headers, browser fingerprints, personal email, names without explicit consent, or unredacted server exception payloads.

## Derived metrics
- **Start conversion:** distinct sessions starting Daily / distinct relevant landing sessions.
- **Completion:** completed / game starts within a defined period; dedupe resume/duplicate tabs.
- **Share intent:** sessions clicking share/copy / completed games. Not equal to actual shares.
- **Referral conversion:** unique challenge-link visitors starting a game / unique referral visitors.
- **D1/D7:** returning first-time cohort after 1/7 local calendar days; signed guest accounts often undercount across browser/device.
- **Answer validity:** accepted submissions / all locked nonempty submissions by question; high rejection may signal missing data.
- **Content dispute rate:** appeals / round submissions, split by topic and editorial reviewer.
- **Technical reliability:** successful round locks / attempted locks, 5xx rate, P95 API time, editor publication failures, renderer fallback share.

## Suggested diagnostic dashboard
Daily: users (approximate), completed expeditions, 7-round funnel, median time, top error codes, API P95, shares, referral starts, D1/D7 cohorts, device breakdown, published challenge readiness, open appeals, disputed questions. Segmentation should be privacy-conscious and not deanonymize small groups.

## Experiment governance
Log experiment ID, date, allocation method, hypothesis, metrics, stop conditions, effect and caveats. Do not run experiments that vary fixed scoring or question eligibility in same Daily challenge. Do not claim statistical significance from tiny samples.

## Release checks
Event payload validation by Zod/JSON schema, opt-out respected, accidental PII tests, no double counting on refresh, referral link token sanitized, logging and metrics retention documented. Maintain the same event IDs across client/backend; backend is source of truth for completed games.
