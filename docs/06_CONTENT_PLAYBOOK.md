# 06 — Editorial Production and Historical Challenge Playbook

## Objectives
Produce genuinely intriguing, auditable prompts, each with broad eligible responses from obvious to obscure. The game celebrates curiosity, not trivia gatekeeping; an easy valid answer always advances a player. Prioritize depth, rigor and variety over quantity.

## Content pipeline
1. **Topic selection:** editor chooses period/theme, intended difficulty, sensitivity review and question category.
2. **Prompt drafting:** one unambiguous sentence with defined temporal and geographic scope. Write internal inclusion/exclusion criteria before populating eligible answers.
3. **Entity discovery:** curated catalogue from Wikidata and subject-specific institutional sources; never use a raw open-ended LLM dump as truth.
4. **Evidence verification:** every public eligible answer must have ≥1 accepted source; controversial cases require two reputable independent sources or exclusion.
5. **Alias review:** names, model numbers, historical variants, diacritics, national designations and deliberate disambiguation.
6. **Rarity review:** calibration against intuitive/common knowledge, sampled obscure names and balanced scoring. No bonus for traumatic/violent outcomes.
7. **Gameplay validation:** 10+ mock player answers, at least 2 common, 2 uncommon, 2 obscure, 2 invalid, 2 ambiguous/variant; verify consistent acceptance.
8. **Two-stage publication:** creator drafts, independent reviewer approves, publisher releases seven-question signed set for specific date.
9. **Post-publication:** monitor disputes, document corrections, recalibrate future versions only.

## Category candidates (not production-approved questions)
Each needs reviewed eligibility criteria and populated answer sets before launch. The suggestions below are prompts for editorial exploration, not verified exhaustive historical fact claims.
| Track | Candidate prompt | Critical eligibility definition |
|---|---|---|
| WWII aviation | Name a fighter aircraft type that saw combat in WWII | What counts as fighter/type/variant; verified operational combat |
| Naval history | Name a ship class used by a WWII navy | Class vs individual ship; commissions and dates |
| Cold War | Name a military aircraft developed in the Cold War | Development start vs service; role/category |
| Early flight | Name a pre-1920 aviator | Minimum evidence of powered/glider flight; chronology |
| Military engineering | Name a tank model fielded during WWII | Model vs subtype; fielded vs prototype; theater |
| Ancient history | Name an ancient city located in the Roman Empire at a defined date | Boundaries and anachronistic labels |
| Exploration | Name an Antarctic exploration expedition before 1950 | Official mission definitions and start dates |
| Space history | Name a launch vehicle family used for orbital missions | Family vs version; orbital vs suborbital |
| Intelligence history | Name a WWII cryptographic machine | Machine/system vs cipher, provenance |
| Defense industry | Name an aircraft engine type used during WWII | Engine families vs subvariants; usage evidence |
| Geopolitics | Name a state that joined NATO before a specified historical year | Membership date and legal successor rules |
| Historical figures | Name an individual who received a specified noncombat decoration | Award and identity source |
| Archaeology | Name a UNESCO World Heritage archaeological site in a defined region | Current site status, site type, location |
| Architecture | Name a fortification completed before 1800 in a defined region | Completion and fortification classification |
| Technology | Name a historically significant radar system in a defined period | 'Significant' too subjective; constrain to listed services |

## Seven-question daily composition
- One accessible question (wide recognition), two medium-breadth categories, two enthusiast-level categories, one unexpected crossover (engineering/geography/history), one 'wow' question with a surprising but clear category.
- Vary answer domains and avoid seven WWII questions in a row. Do not repeat identical question wording or heavily overlapping answer sets within 30 days.
- Keep at least 2 prompts friendly to casual players; consider explaining jargon in prompt while retaining historically valid rules.
- Avoid currently contested conflicts in initial launch, casualty rankings, atrocities, forced displacement, or trivia rewarding named victims.

## Prompt quality rubric (0–5 each)
**Clarity:** unambiguous membership; **coverage:** answer list plausibly comprehensive for bounded pool; **fun:** diverse obvious and obscure answers; **fact quality:** citations/temporal nuance; **replay:** discussion-provoking without trickery; **sensitivity:** respectful context; **fairness:** no hidden ambiguity. Reject below 4/5 in clarity, fact quality or sensitivity. Editorial total >=28/35 is a *proposed* acceptance threshold.

## Near-completeness vs 'open-ended'
An unbounded category with millions of names will be unfair unless acceptance uses a mature data graph. For version one, privilege bounded questions and smaller but diverse canonical sets. Label internal coverage class as `finite_certified`, `broad_reviewed`, or `experimental_not_publishable`. A minimum number of answers alone cannot prove coverage.

## Example answer issue flow
A player enters an accepted historical aircraft variant not in the published list. The system rejects politely and exposes 'I have a source for this'. Editor reviews issue, source, date and definition; if valid, adds canonical entity and aliases to the *next* scoring snapshot, emits a correction notice and decides whether earlier runs require a published adjustment. No automatic immediate score rewriting unless correction policy explicitly commits to it.

## Source cards
Cards should present: canonical display name; question-specific eligibility explanation (max ~25 words); 1–3 links to credible sources (publisher/title); date or range; whether evidence is disputed; editor timestamp. Never claim the page is an authoritative official archive unless its source really is official.

## Launch content operations
Prepublish at least 14 daily operations (98 reviewed prompts), while the playable MVP can initially use 7 fully verified prompts plus fixtures. Maintain next 14 days ahead of release, spot-review 10% of aliases randomly, run automated missing-source and ambiguity checks. Keep topical evergreen content pipeline separate from news so daily schedule never depends on live upstream availability.
