# 04 — Historical Data Acquisition, Provenance, Quality and Licensing

## Cardinal principle
Historical facts are not inherently safe to use just because they appear on the web. Separate **entity discovery**, **factual corroboration**, **answer eligibility**, **media rights**, and **rarity scoring**. Publishing an answer requires a durable evidence trail and an editorial decision.

## Recommended sources and roles
| Source | Entry point | Role | Validation caveats |
|---|---|---|---|
| Wikidata | https://www.wikidata.org/wiki/Wikidata:Data_access | Canonical IDs, aliases, basic relations, starting candidates | Community-edited; classification and temporal context may be incomplete; public WDQS has usage limits |
| National Archives Catalog API v2 | https://www.archives.gov/research/catalog/help/api | Primary archival records and bibliographic metadata | Historical item provenance and rights vary; API v2 key/usage may apply |
| Library of Congress JSON API | https://www.loc.gov/apis/json-and-yaml/ | Historical maps, archival records, search/display metadata | Records heterogeneous; item-specific rights/advisory statements |
| Smithsonian Open Access | https://www.si.edu/openaccess/devtools | Collection objects and eligible CC0 digital media | Open Access subset distinct from all collection holdings; correct item/license classification |
| U.S. Army CMH | https://history.army.mil/Publications/Publications-Catalog/ | Specialist campaign history references | Cite exact publication/page; check legal treatment of graphics/third-party content |
| Europeana | https://pro.europeana.eu/page/search | Additional European materials | Rights statements and rights for reuse vary across providers |
| DVIDS | https://api.dvidshub.net/docs | Contemporary military imagery/metadata | Inspect item credits, release restrictions and context before reuse |

## Proposed editorial source rules
Evidence tiers: **A** peer-reviewed scholarship, official historical/museum/archive primary record with clear subject context; **B** reliable professional reference works or institutional collection metadata; **C** Wikidata/Wikipedia/general secondary data, discovery only; **D** user submissions, AI suggestions, unsourced aggregators, never sufficient alone. A published eligibility judgment generally requires ≥1 A or B evidence record, plus corroborating second source when historically contested. Source confidence != factual certainty; explicitly note interpretive ambiguity.

## Data extraction jobs
1. Curator defines scope (e.g. `aircraft used in combat during WWII`) and exclusion/period rules before extraction.
2. Pull candidate entities from a targeted Wikidata query with a descriptive User-Agent and rate limits; capture query text/hash, timestamp, upstream IDs and returned statement qualifiers. Avoid unbounded high-load SPARQL requests.
3. Normalize names/aliases but preserve original labels, language, dates and source provenance. Keep diacritics and competing translations; never conflate family vs individual aircraft variants.
4. Enrich priority candidates through archives, museums, scholarly records or responsible manual research. Store source URL, retrieval time, organization, evidence excerpt in own words, rights metadata and verification status.
5. Determine question-specific membership using explicit rule (period, location, combat service, historical designation). Flag ambiguous cases for manual review.
6. Assign a global canonical entity ID and question-specific eligible answer row; de-duplicate names and detect alias collisions.
7. Score rarity offline by declared rubric; export scored reviewed answer snapshot. Sample common and obscure records for biased/error-prone scoring.
8. Reconcile published changes using append-only versioning; avoid silently replacing live question eligibility.

## Proposed answer record fields
- Source provenance: `provider`, `source_record_id`, `source_url`, `fetched_at`, `query_hash`, `publisher`, `language`, `title`, `license`, `rights_statement`, `attribution`, `retrieval_method`, `version`.
- Entity: `canonical_name`, `entity_type`, `wikidata_qid`, `valid_from/to`, `aliases[]`, `disambiguation`, `classification`, `temporal_scope`.
- Eligibility: `question_id`, `eligible=true/false`, `rationale`, `evidence_id[]`, `reviewer`, `reviewed_at`, `confidence`, `controversy_flag`, `score_version`.
- Media: `asset_id`, `origin_url`, `checksum`, `creator`, `license`, `credit_line`, `permission_document`, `derivative_of`, `display_context`.

## Data freshness and exact timing
Unlike a current-events feed, historical entities often change only when scholarship or source metadata is corrected. Suggested cadence: candidate source polling weekly for active categories, monthly sweep for external metadata, immediate manual corrections for successful appeals, quarterly calibration of rarity from aggregate behavior. These are *project recommendations*, NOT claims about Krillion or the archives. Rate-limit and cache per provider. Do not schedule giant full bulk downloads for the MVP.

## Licensing and intellectual-property checklist
- Wikidata structured data is published under CC0; check linked media separately.
- Smithsonian Open Access records carrying CC0 may be reusable under its program conditions, but do not assume every Smithsonian collection item is CC0.
- Library of Congress items require item-level rights review; metadata access does not imply rights to reproduce photos/maps.
- National Archives government provenance does not automatically clear third-party embedded works or rights restrictions.
- DVIDS material generally has public-release information but review individual item context, restrictions, endorsements and credits.
- Do not scrape/redistribute competitor artwork, game data dumps, branding or UI assets; build original art and original curated answer sets.
- Store exact source licensing with each asset. Record an attribution screen when required and avoid implying official agency endorsement.
- For automated summarization/AI support, preserve source-to-claim traceability and do not copy long copyrighted passages into the public game.

## Editorial standards by question type
- **Finite roster:** 'Name one of the X countries...' Prefer for initial launch when objective membership is agreed. Maintain near-complete valid set.
- **Broad class:** 'Name a WWII fighter aircraft...' May have hundreds of qualifying designations. Set scope, include variants policy, geographic forces and date limits. Do not publish until coverage review.
- **Historical claims:** 'Which commanders...' Define appointment dates, service and disputed titles; cite multiple sources when contested.
- **Chronological/event:** Questions requiring causal judgments are not appropriate for automatic free-text grading unless narrowly grounded.
- **Media recognition:** Only licensed/right-cleared material; captions cannot accidentally reveal answers.

## Correctness SLAs / operational targets
- P0 launch prompt: 7/7 with reviewed official published answer set, minimum source record for all accepted answers, zero unresolved ambiguous aliases, 0 unsourced auto-acceptances.
- A player missing-answer dispute is acknowledged in UI immediately; operator target review within 72h (staffing-dependent, not guaranteed).
- Verified error correction records affected question versions and whether correction changes future-only or historical scores; public correction note when material.
- Each prompt gets a coverage note: 'known finite set verified', 'open-ended sampled' or 'limited to reviewed published subset'; avoid presenting incomplete subsets as full domains.

## Privacy in familiarity scoring
Prefer external public corpus frequency when licensable and aggregate prior answers without retaining identifiable raw answer strings longer than operationally necessary. Respect disclosures and deletion requests. Do not rank obscure human tragedy facts with competitive rewards.

## Source quality gate
Reject if: no source URL; contested inclusion unsupported; unclear eligibility rules; suspected copyrighted art without license; alias maps to multiple entities; question has too few eligible varied responses; source terms-of-service conflict; or scoring rewards inappropriate historical harm.
