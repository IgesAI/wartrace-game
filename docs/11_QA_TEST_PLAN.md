# 11 — Comprehensive QA, Browser Matrix and Acceptance Tests

## Test philosophy
Pass/fail evidence, not aspirational checkboxes. Unit-test scoring and identity, integration-test server transactions, E2E-test all visible interactions, visually inspect real viewport screenshots and do limited manual historical source review. Keep known defects and skips visible in final release report.

## Required devices / viewports
- iPhone-class Safari 375x812, iPhone-class 390x844 or equivalent; check software keyboard, safe areas and audio permissions.
- Android Chrome 360x800 or 393x873 on mid-tier hardware; test 30fps fallback.
- iPad / tablet Safari 768x1024.
- Desktop Chrome and Firefox 1440x900; keyboard and tab sequence.
- Optional desktop Safari/Edge for production readiness.
- Slow 4G, 200ms latency, temporary offline, throttled CPU, reduced motion, 200% zoom, light/dark OS setting and no-audio permissions.

## Functional test suites
### Daily/time
T-001 NY midnight changes date key without UTC offset assumption; T-002 spring DST day; T-003 fall DST repeated local hour; T-004 run begun before midnight completes original version; T-005 missing upcoming challenge fails gracefully; T-006 challenge date immutable after publish.
### Round state
T-010 initial round opens once; T-011 25s deadline enforced by server; T-012 timer after tab background; T-013 Lock Answer twice idempotent; T-014 concurrent tabs cannot double-lock; T-015 network loss and resume fetches canonical state; T-016 input length and Unicode handling; T-017 7 rounds exactly, total derived server-side.
### Answer validity
T-020 approved canonical answer; T-021 alias with diacritic; T-022 wrong answer; T-023 historical variant alias; T-024 two entities share one alias; T-025 malicious HTML; T-026 confusable Unicode strings; T-027 fuzzy suggestion not auto-accepted; T-028 correct but omitted leads to appeal, no undocumented award.
### Scoring
T-030 endpoints 0 and 1; T-031 monotonic score; T-032 invalid/timeout=0; T-033 1,000 random property cases deterministic; T-034 totals correct; T-035 tie-breaking; T-036 frozen version remains stable after future popularity updates.
### Security
T-040 anonymous guest isolation; T-041 session cookie protections; T-042 share token unguessable and safe; T-043 unauthorized admin gets 403; T-044 CSRF/mutation protection; T-045 API rate-limiting; T-046 answer bank not returned to browser; T-047 private response not CDN cached; T-048 secrets not in production JS bundle.
### Publishing
T-050 reject 6 questions; T-051 reject unsourced entity; T-052 reject duplicate alias conflict; T-053 reject unauthorized publish; T-054 valid publish checksum; T-055 rollback audit log; T-056 day with no published operation displays friendly maintenance.
### Viral share
T-060 results public token works; T-061 OG image without spoiler; T-062 challenge link from another browser; T-063 copy/share API fallback; T-064 9:16 replay on supported browser; T-065 unsupported recorder offers card; T-066 long answer text cropped/sanitized; T-067 images not unlicensed/cross-origin tainted.
### Accessibility
T-070 keyboard-only start-to-result; T-071 screen reader announces prompts and result; T-072 correct label/focus states; T-073 contrast minimum WCAG; T-074 no motion-required info; T-075 reduced motion traverses instantly; T-076 no auto-audio; T-077 no pinch/zoom blocking; T-078 mobile keyboard doesn't hide submit.

## Performance acceptance goals
- P75 interaction responsiveness comparable to modern mobile sites, measured not asserted.
- Initial useful paint/interaction under ~3 seconds in realistic test setup; report actual median and p75.
- No routine frame drops causing input lag; 30fps minimum target on mid-tier mobile / 60fps on supported higher-tier devices; record device.
- Initial art compressed, cached and permission-checked; use lazy loading for optional replay encoder.
- Server P95 round validation target under 300ms excluding user's network delay, subject to host geography and DB location.
- Track first-byte, total JS, image payload, memory, GPU renderer fallback and errors.

## Manual historian review
At least two reviewers sample each of seven prompts, including rare and borderline cases. Validate dates, variants, transliterations, politically loaded descriptions and source links; run a rights ledger audit before public deployment. Test that no prompt inadvertently awards a victim-tragedy ranking.

## Reporting
For every suite record tool, commit, browser/runtime, date, pass/fail/skip, evidence location and remediation. Broken tests are not green. Screenshots should demonstrate the actual app. Flag content fixtures as demo-only. Generate final `ops/RELEASE_REPORT_TEMPLATE.md` with evidence links and P0 remediation status.
