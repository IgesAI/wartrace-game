# 02 — Game Rules, Scoring, and State Machine

## Terminology
- **Operation**: a published date-specific challenge with exactly seven ordered questions.
- **Question**: a prompt with explicit eligibility criteria, closed scoring version and answer set.
- **Entity**: canonical historical person/place/technology/event/object with approved aliases.
- **Run**: one guest's attempt at a specific operation; one final result per run.
- **Round**: one 25-second opportunity to lock a single answer.
- **Score version**: immutable ruleset and rarity values assigned when operation is published.
- **Distance**: fictional/scenic travel measured in integer meters, derived from valid points, not literal historical troop position.

## State machine
```
LOADING -> INTRO -> ROUND_ACTIVE -> ROUND_LOCKING -> ROUND_REVEAL -> TRAVEL_ANIMATION -> NEXT_ROUND
                                                                          |                |
                                                                          | last           | rounds < 7
                                                                          v                v
                                                                     GAME_COMPLETE     ROUND_ACTIVE
Any playable state -> NETWORK_RECOVERY (with authoritative server state reconciliation)
Any unrecoverable state -> EXPLICIT_ERROR (never silently lose user progress)
```
Server state: `created`, `active` (round_index), `completed`, `abandoned` (analytics only), `invalidated` (abuse/admin). Question state: `unopened`, `open`, `locked_valid`, `locked_invalid`, `timed_out`.

## Clock and locking rules
- Clock starts on server-issued `round_started_at` (wall clock), returning `deadline_at` (server UTC timestamp). Client displays estimated countdown, server enforces final deadline. Provide ≤300ms processing grace only if explicitly documented; default zero to avoid exploit complexity.
- Tab backgrounding does not stop the clock. On reconnect, fetch authoritative server round state. Animation time is not deducted from question time; the following round opens only after scene transition or explicit Skip Animation.
- User can edit until submit. Once submitted, canonical `entity_id` or invalid outcome, normalized input hash, points, distance, server time and score version become locked.
- Multiple submit attempts with same idempotency key return exact previously stored result; different keys for already-locked round return 409 with authoritative state.
- Missing/late round -> zero; no retries in Daily.
- Prompt order fixed for all players in a date's game; avoid selectively altering questions by cohort. Timezones affect release selection, not score fairness.

## Answer matching contract
1. trim and safely normalize player input using NFKC, casefold, permitted punctuation variants and whitespace collapse. Maximum 120 Unicode characters.
2. Look up exact approved normalized alias -> at most one canonical entity within this question's eligibility set.
3. If multiple eligible canonical entities share alias, return `AMBIGUOUS` and request an explicit choice before timer expires.
4. If no exact match, offer non-awarding fuzzy suggestion only if safely resolvable; never silently change player intent.
5. If entity is eligible, check published answer snapshot and scoring version. Record exact answer version, evidence status, score.
6. If unknown, return `INVALID` with 'We may have missed a valid answer' appeal path (the round is consumed under the one-submission rule).
7. Dynamic LLM analysis forbidden on scoring path.

## Initial numeric design
All rounding is JavaScript `Math.round` for nonnegative scores (equivalently floor(x + 0.5)), not Python banker's rounding. This is the cross-runtime canonical contract.
For each question at publish time, editorial data includes `rarity_score ∈ [0,1]` for every eligible entity. Higher means less commonly known.
```
valid_points = 100 + Math.round(900 * pow(rarity_score, 1.3))
invalid_points = 0
distance_m = Math.round(valid_points * 0.8)
total_score = sum(seven round points)
total_distance_m = sum(seven round distance)
```
- Valid answer: 100–1000 points; 80–800m.
- All seven correct: between 700 and 7000 points; 560–5600m.
- Tier words are presentation only: Common <0.25, Curious 0.25–<0.50, Uncommon 0.50–<0.75, Obscure ≥0.75.
- Tiers must be consistent with numeric rarity. The model is configurable in a scoring_version row, not hot edited after publish.
- Tie-breaks: score desc -> count valid desc -> earliest completed server time asc. Never expose raw player IDs in leaderboard.

## Initial rarity-model calibration
Build an offline static editorial familiarity estimate `F ∈ [0,1]` and prior historical player-popularity estimate `P ∈ [0,1]` from non-current completed past games if enough data is available. Draft `R = 0.7(1-F) + 0.3(1-P)`; when popularity sample is insufficient, default 100% to curated familiarity or equivalent neutral-calibrated prior and note the fallback. Normalize rarity scores within the question's pool; manually spot-check. Never use real-time same-day popularity to revise scores. Keep algorithm docs and factors transparent to editors, while not revealing accepted answers before release cutoff.

## Challenge publication invariants
- `date_key` is local YYYY-MM-DD in America/New_York and UNIQUE among published active daily operations.
- A publication creates a signed/hashable answer snapshot containing prompt IDs, entity IDs, aliases, scores, and evidence refs. It can be replaced only by a new version with logged reason; completed results retain their original version or a documented correction policy.
- Every published question: clear wording, source-backed eligibility, zero unresolved critical disputes, sufficient diversity, editorial approval and alias collision checks.
- A published game does not require a live LLM or third-party API to function.
- Don't publish a day with only six valid prompts; fail closed with graceful maintenance mode.

## Edge conditions
- Duplicate identical alias to one entity: accepted; ambiguous alias across two: ask for clarification or invalidate per time rules.
- Names with apostrophes, accents and non-English transliterations: only reviewed aliases, not unpredictable global stripping.
- Historical countries/territories: names bound to explicit period eligibility, avoid anachronistic substitutions.
- Historical-date uncertainty: avoid question or constrain wording with documented evidence; contested claims flagged editorially.
- Player changes system time: irrelevant to server date/deadline; request server time.
- Players cross midnight during a run: finish run under originally bound operation ID/version; new daily can be started afterward if eligible.
- Duplicate tab: server manages one active run per guest/operation, both tabs reconcile to one state.
- Browser offline: show specific loss-of-network state; no local speculative acceptance or score.
- Share URLs: public token reveals no private guest ID, answer list or secrets.

## Replay rules
The replay timeline uses server-recorded round outcomes and deterministic travel lengths; scene animation may be compressed. Never represent generated footage as a historical recording. Audio optional; subtitles/text alternative; privacy-safe metadata; choose readable safe text for social platforms.

## Quality proofs
Unit property tests on score bounds/monotonicity/tier boundaries/aliases; integration tests for race conditions/timeouts/DST/rate limiting; E2E for first play through result/share and source card; seed fixture results exactly reproducible across browsers.
