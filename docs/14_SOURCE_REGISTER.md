# 14 — Verified Documentation Sources and Research Register
**As-of:** November 22, 2026. Links are official provider documentation unless otherwise marked. Reverify terms, versions and access requirements when coding/publishing.

| ID | Provider | Official URL | Supports / limitations |
|---|---|---|---|
| SRC-01 | Wikidata data access | https://www.wikidata.org/wiki/Wikidata:Data_access | Structured graph/data reuse and supported query routes |
| SRC-02 | Wikidata Query Service manual | https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual | Public query etiquette, User-Agent and limits |
| SRC-03 | National Archives Catalog API | https://www.archives.gov/research/catalog/help/api | NARA public catalog API and links to current technical docs |
| SRC-04 | NARA Catalog API v2 guide | https://usnationalarchives.github.io/Catalog-API/ | v2 usage/API key guidance and examples |
| SRC-05 | NARA developer/open data | https://www.archives.gov/developer/national-archives-catalog-dataset | Snapshot availability/size; large data unnecessary for MVP |
| SRC-06 | Library of Congress API | https://www.loc.gov/apis/json-and-yaml/ | Public collection metadata via JSON/YAML |
| SRC-07 | LoC request format | https://www.loc.gov/apis/json-and-yaml/requests/ | Query structure, endpoints and parameters |
| SRC-08 | LoC reuse FAQ | https://guides.loc.gov/digital-scholarship/faq | Item-specific rights restrictions and use questions |
| SRC-09 | Smithsonian Open Access tools | https://www.si.edu/openaccess/devtools | API key/metadata access, eligible open assets |
| SRC-10 | Smithsonian Open Access FAQ | https://www.si.edu/openaccess/faq | Scope of Open Access and appropriate reuse |
| SRC-11 | PixiJS v8 migration | https://pixijs.com/8.x/guides/migrations/v8 | v8 lifecycle/renderer changes |
| SRC-12 | PixiJS releases | https://github.com/pixijs/pixijs/releases | Check tested stable packages; do not blindly pin unverified version |
| SRC-13 | Next.js documentation | https://nextjs.org/docs | App Router, Route Handlers and deployment basics |
| SRC-14 | Drizzle ORM documentation | https://orm.drizzle.team/docs/overview | PostgreSQL migrations and typed SQL modeling |
| SRC-15 | Web Content Accessibility Guidelines | https://www.w3.org/TR/WCAG22/ | Accessibility baseline |
| SRC-16 | Phaser docs (alternative) | https://www.phaser.io/oss/docs | Alternative engine, compare only if Pixi unsuitable |
| SRC-17 | Library of Congress rights advisory | https://www.loc.gov/rr/print/res/rights.html | Metadata vs media rights nuance |
| SRC-18 | U.S. Army Center of Military History | https://history.army.mil/ | Specialist historical sources, direct citations |
| SRC-19 | Europeana API / services | https://pro.europeana.eu/page/search | International cultural heritage discovery |
| SRC-20 | DVIDS API | https://api.dvidshub.net/docs | Military image/video discovery and metadata; review item permissions |
| SRC-21 | OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | Security test program baseline |

## Verification summary
- Confirmed from official documentation: public Wikidata entity/data routes; NARA catalog API v2; Library of Congress JSON API; Smithsonian Open Access API; PixiJS v8 guidance.
- Not claimed as verified: Krillion proprietary extraction cadence/rarity code, provider API quotas at future dates, live app domain availability, WARTRACE trademark clearance, total obtainable answer-set completeness, production licensing for any individual media item.

## Source lookup strategy for historical answers
Use links above to discover records, then write **per-answer source URLs** into the database. A source register URL for an API is *not evidence* that a particular aircraft/person/battle qualifies for a game prompt. Editors must capture the item's relevant museum/archive/scholarship record URL and review it. Source rights may differ per item.
