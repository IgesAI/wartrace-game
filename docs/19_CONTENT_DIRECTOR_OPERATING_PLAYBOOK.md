# 19 — Content Director Operating Playbook
**Product:** WARTRACE | **Owner:** Editorial lead / community manager | **Version:** 1.0 | **Target:** Repeatable daily production with excellent history and viral distribution

## Editorial north star
Create **one fascinating, verifiable conversation per day**: a fair open-answer challenge + an insight players discover after submitting + one watchable share artifact. Engagement is earned through specificity and surprising knowledge, never through false claims, fabricated archival evidence, cruelty, outrage bait or tragedies treated as score bonuses.

## Content manager's job description
The content manager is accountable for: editorial queue (14+ days), topic diversity, source coverage, copywriting, launch channel copy, moderation, answer appeals, social experiments, creator briefs, performance review and a transparent corrections log. Does **not** independently override historical review, grant legal rights, purchase assets or change already-frozen scores.

## Audience clusters and content hooks
| Segment | Core interest | Hook style | Proof needed | Return trigger |
|---|---|---|---|---|
| General curious | surprising history | 'Most people know X. Name another...' | 1 plain-language citation card | daily group challenge |
| Aviation/engineering | obscure machines & designs | 'Name a WWII aircraft that actually flew...' | airframe role/service evidence | weekly aviation operation |
| Historical enthusiasts | nuance, detail, weird rarities | 'Not the obvious answer' | detailed historian-reviewed rule | rare answer discovery |
| Geography/history | maps, forgotten places | 'Name a battle fought near...' | period/date/place qualification | map trail series |
| Streamers | rapid debate and rivalry | 'Chat has 25 seconds' | deterministic accepted answers | versus-ready challenge |
| Teachers/museums (later) | serious learning | 'Why does this qualify?' | source links and non-sensational context | weekly exhibit |

## Six approved editorial pillars
1. **Machines That Changed History** (25%): aircraft, engines, ships, communications, transport; technical and shareable.
2. **Forgotten Fronts / Locations** (20%): places and geography, never implying exact tactical movements.
3. **People Behind the Record** (15%): inventors, medics, signalers, pioneers, photographers, historians; diverse context.
4. **Artifacts and Codes** (15%): cryptography, field gear, records, cartography; cite artifacts.
5. **Campaign Context & Turning Points** (15%): campaigns, chronology, institutions; sober treatment.
6. **History Beyond War** (10%): aviation firsts, archeology, exploration, science, history of technology; protects broad mainstream appeal.

Target mix for seven daily prompts: 2 accessible broad prompts, 3 mainstream enthusiast prompts, 2 deep-cut prompts **without requiring specialized knowledge to complete** because any valid common response still earns points. Avoid 7 consecutive prompts all on obscure plane model numbers. Vary answer universes (people, machines, places, inventions, organizations, years only when explicitly enumerated).

## Content card requirements — publishable issue
- `date_key`, `operation_id`, title, era, audience intent, topic pillar, estimated comprehension, sensitivity rating.
- One plain-language single-sentence prompt, canonical strict eligibility scope, explicit exclusions, accepted answer snapshot, historical/source citations.
- A 'most recognizable valid answer' and 3–5 obscure but verified candidates sampled to test scoring and coverage.
- At least 10 manual/automated QA submissions per prompt with invalid/ambiguous/alias cases.
- Player-facing 1–2 sentence insight, dated source, source-link preview; **never reveal answers before lock**.
- Social teaser copy, spoiler-free post copy, thread after daily closes, source/context cutdown, preview thumbnail.
- Source and image-rights ledger; curator and independent reviewer signatures; ready-by deadline.

## Weekly workflow — realistic solo/small-team cadence
| Day | Content lead | Historical reviewer | Creative/social | Technical owner |
|---|---|---|---|---|
| Monday | Audit prior week; choose next 7-day themes | Check disputed claims and eligibility | Review winning hooks | Analytics incident review |
| Tuesday | Draft 14–21 candidate prompts | Approve source selection plan | Script 3 creator-style variants | Ingest/update source candidates |
| Wednesday | Alias and obscure-answer coverage pass | Review contentious cases | Prepare post captions & templates | Run content lint / scoring sim |
| Thursday | Assemble 7-day schedule | Second review / signoff | Record teaser/replay examples | Publish to staging & E2E |
| Friday | Freeze 7 future daily operations | Approve final pack | Creator outreach with permission | Scheduled release validation |
| Saturday | Monitor live disputes; lightweight recap | On-call only for urgent content error | Community weekend play | Passive alerts |
| Sunday | Refresh issue inventory; plan next week | Availability planning | Publish week-in-history post | Backups & health report |

**Operational SLA suggestions:** question errors triaged within 24h, public correction when material; disputed factual claims require independent review before changing future data; respond to constructive reports without arguing on social. Aim for a rolling **14-day buffer** and **30-day draft backlog**, not ad-hoc nightly LLM generation.

## Editorial quality rubric (0-5)
- **Clarity**: Does a player understand the exact answer category within 3 seconds?
- **Broadness**: Is the set big enough for rarity scoring, but bounded enough to verify?
- **Source quality**: Are eligibility and aliases evidence-backed?
- **Surprise**: Does the question produce entertaining obscure answers?
- **Accessibility**: Can casual players name at least one valid answer?
- **Historical responsibility**: Does it avoid celebrating deaths, atrocities, ideologies and historical distortions?
- **Distribution**: Can the question be phrased as a concise spoiler-free social challenge?

Candidate score 0–35, require **≥28/35 and no score below 3 in clarity, sources, accessibility, sensitivity** for publication. This is an internal suggested rule, not an objective historical truth metric.

## Sensitivity and accuracy policy
- No score based on body counts, concentration camps, victims, war crimes, atrocities, genocides or casualty statistics.
- No reward framing that implies celebration of real conflict or military conquest. Score is **fictional distance traversed** and historical knowledge.
- Discuss political military figures only with sober, documented context. Avoid algorithmically amplifying extremists or propaganda imagery; don't use dangerous symbols as marketing thumbnails.
- Distinguish a **museum object's actual provenance** from a generalized historical illustration.
- For contested facts, include qualification and choose a narrower prompt or exclude ambiguous items. If an answer cannot be reliably scored, rewrite the question.
- Distinguish 'WWII-era' from 'used in combat'; 'developed' from 'fielded'; 'prototype' from 'operational'; 'class' from 'individual vehicle'.

## Voice and brand writing rules
- Brand tone: sharp, curious, atmospheric, lightly competitive, credible. **Confident in the experience, humble about evidence**.
- Prefer: 'You know the Spitfire. What else flew in combat?' over 'Only geniuses know this.'
- Prefer: 'That was a deep cut' over 'Your enemies never saw it coming.'
- Never fabricate active player counts, historical quotations, scientist endorsements, partner affiliations, or archive photograph captions.
- No forced slang or swearing from the official account. Creator reactions may be playful but never cruel toward victims.
- Each article/video should contain at least one historical point that remains useful after a viewer scrolls away.

## Content lifecycle/status design
`idea` → `researching` → `evidence_ready` → `drafted` → `historian_review` → `rights_review` → `qa_pending` → `approved` → `scheduled` → `frozen` → `published` → `archived`. Branch to `disputed`, `retracted` or `corrected`; every move needs actor, timestamp and reason. Approved source records never silently mutate under frozen daily games.

## Per-release publishing checklist
- Seven original prompts; no duplicates with yesterday unless intentionally recurring.
- Timezone `America/New_York`; freeze by publication cutoff (e.g. 48h beforehand).
- Valid common and rare responses manually checked; 10 test vectors each; no exclusion disagreement.
- Associated public learning cards are non-spoiler until after answers lock.
- Art and sound mapped to approved asset IDs; attribution visible when required.
- Spoiler-free Open Graph, 1:1 and 9:16 composition tested.
- Community post scheduled, source citations ready, corrections form working.
- No history fabrication, no accuracy-breaking 'AI knows' copy.

## Appeals and reputational trust
1. Acknowledge report + preserve exact daily version.
2. Classify: missing valid, ambiguous alias, vague scope, scoring issue, historic controversy, license/media incident.
3. Research original record and two sources if disputed.
4. Review with independent editor; log decision + correction note.
5. If material systematic scoring error, publish consistent correction policy; never silently privilege a famous player.
6. Publish correction summary in weekly notes; cite why and what changed.

## Measurable content dashboard
- Daily start→complete; D1/D7 retention; attempts with invalid alias; appeal ratio per 1000 attempts; accepted-answer coverage sample.
- Share click rate; verified referral opens→start→complete; 7-second video hold; 50% watch-through; link conversions; source-card click rate.
- Social: posts published, reach, qualified comments, click-to-start, organic shares, negative/accuracy flags and corrections.
- Segment by topic pillar and device to avoid optimizing solely for extremists or controversy.

## Minimum staffing (can be same person with outside reviewer)
- Product/editorial lead: owns schedule and voice.
- Researcher: sources/answer sets.
- Independent historical reviewer: must be distinct from prompt author for production.
- Art director / designer: asset system and quality.
- Community/content manager: creators, posts, moderation.
- Engineer/operator: data and releases.
For a solo team, use an outside volunteer/paid competent reviewer for a narrow field rather than claiming a second independent internal review happened.

## Recommended weekly performance report
**Headline:** Player behavior and editorial trust. **Traffic:** players, completes, cohorts. **Distribution:** 3 content formats with actual referral starts. **Accuracy:** appeals by category and outcomes. **Art/experience:** asset production progress and licensing blockers. **Decisions:** 3 actions for next week. **Archive:** per-release score version, sources and social files.
