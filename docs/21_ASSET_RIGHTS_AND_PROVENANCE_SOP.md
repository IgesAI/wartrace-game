# 21 — Asset Rights, Attribution, and Historical Media Provenance SOP
**Version:** 1.0 | **Policy owner:** Project owner / rights reviewer | **Status:** Mandatory for any production media

## Rights gates
**RED / BLOCKED:** source unknown; ripped competitor images/sounds; thumbnails from search results; unlicensed commercial art; CC BY-NC for commercial product; attribution unavailable; purchase license doesn't cover games or exports; source claims public domain without evidence.

**AMBER / HOLD:** a pack exists with no clear creator grant; historical archive record lists 'rights undetermined'; CC BY-SA derivative or GPL media compatibility requires counsel; 3D asset contains recognizable modern logos, military insignia, or third-party IP; AI provenance uncertain; artwork references a copyrighted game's distinctive scene.

**GREEN / CANDIDATE:** original work with written rights assignment/license; Kenney CC0 pack with archived license; Smithsonian per-item clearly CC0 Open Access; Freesound CC0 with item link; Sonniss GDC audio with the exact bundle license archive and download date; individually approved CC BY asset with complete attribution.

No *candidate* automatically becomes released. Track `reviewed_by`, date, evidence and SHA256 of exact bytes.

## Asset intake steps
1. Register stable `asset_id` and `purpose` before import.
2. Record full canonical URL, uploader/artist, title, SKU/order reference if purchased, item date/version, retrieval date, original filename, media format.
3. Save license text or PDF/screenshot, restrictions, jurisdiction note, credit requirement, permission for derivative edits, embedding, marketing video/thumbnail and commercial use.
4. Download to a quarantined local asset vault, never directly to `public/`.
5. Scan/check file type and hashes, confirm dimensions and metadata; don't execute imported code or unknown scripts from assets.
6. Historical sensitivity review; separate historical factual source from visual copyright source.
7. Engineer tests mobile performance, dimensions, resize artifacts, color consistency; art lead approves coherence.
8. Reviewer signs release with time-bound source evidence. Promote to versioned approved runtime path.
9. Generate credits automatically from ledger; exported social media also reviewed for license coverage.
10. Review again upon major remix/pack update or rights complaint; remove or replace on documented takedown process.

## License patterns and operational interpretation
- **CC0**: generally permits adaptation/commercial use without credit; still check publicity, trademarks, cultural/ethical concerns and that the depositor actually owns rights. Recommend voluntary credits.
- **CC BY**: attribution to creator, license link, changes; make credits screen/export plan. Source: https://creativecommons.org/licenses/by/4.0/deed.en
- **CC BY-SA**: share-alike condition for adaptations; **HOLD for legal review** when combined with proprietary asset pipeline/marketing derivatives. Source: https://creativecommons.org/licenses/by-sa/4.0/deed
- **CC BY-NC**: no commercial use; reject for commercial-capable WARTRACE regardless of free price. Source: https://creativecommons.org/licenses/by-nc/4.0/deed.en
- **CC BY-ND**: cannot share adaptations; unsuitable when resizing/cropping/recoloring could be considered derivative. Hold/reject without review.
- **OpenGameArt**: mixed licenses; must follow the individual asset's selected license and notices. Source: https://opengameart.org/content/faq
- **Paid asset marketplace**: purchase receipt alone is not permission for game redistribution/attribution use. Read exact creator EULA; don't assume stock marketplace-wide policy.
- **Sonniss GDC**: intended synchronization into games/film; verify terms for standalone files, AI training and project handoff. Source: https://sonniss.com/gdc-bundle-license/
- **LoC / NARA**: catalog custody and public-domain presumption are not identical; evaluate rights/advisory at item level. Sources: https://www.loc.gov/free-to-use/ ; https://www.archives.gov/faqs
- **Smithsonian**: designated Open Access CC0; not all collection content is Open Access. Source: https://www.si.edu/openaccess/faq
- **Fonts**: embed/distribute with license notice and any reserved font name conditions; OFL text: https://openfontlicense.org/

## Mandatory audit fields (implement in JSON or database)
`asset_id`, `title`, `creator`, `source_url`, `canonical_download_url`, `source_collection`, `license_id`, `license_url`, `license_text_snapshot_path`, `rights_status`, `commercial_ok`, `derivative_ok`, `in_game_ok`, `marketing_export_ok`, `credit_required`, `credit_text`, `artist_contract_ref`, `purchase_receipt_ref`, `retrieved_at`, `version`, `sha256`, `historical_source_ids`, `era`, `sensitivity`, `technical_qa`, `reviewed_by`, `reviewed_at`, `approved_for_release`, `replaced_by`.

## Example credit language
- `Environment prop adaptation from [Title] by [Creator], licensed under CC BY 4.0 (link). Modified for WARTRACE.`
- `Sound effect [Title] by [Creator], CC0; attribution offered voluntarily.`
- `Historical record: [Institution], [Title], [Date], [Collection/Identifier], [Permalink]. Historical citation; image reuse reviewed separately.`

## Brand/trademark protection
Do not treat historic battlefield insignia, present-day military unit emblems, national flags, or archive photographs as automatically clear for any commercial promotion. Product should avoid affiliation implications and not use protected modern unit badges as official branding. Commission the logo as a unique original design after name clearance.

## Copyright incident response
1. Disable the disputed asset behind remote manifest/feature flag or replace with fallback.
2. Preserve exact deployed file/hash and rights record; notify owner.
3. Acknowledge complaint with rights contact, not automatic admission/denial.
4. Investigate license text, identity, and provenance.
5. Document replacement/refund/credit remedy; counsel review for material claim.
6. Record affected releases and rerender share assets if necessary.

## QA automation requirement
Implement an `assets:lint` command scanning all referenced shipped media against signed asset IDs. Reject any `unregistered`, `rights_status != approved`, missing required credit, marketing-rights mismatch, missing source file hash or overly large export. CI should block deploy of new unapproved assets but permit explicitly labeled local demo placeholders in nonproduction builds.
