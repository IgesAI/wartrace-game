import { eq } from "drizzle-orm";
import { fetchWikidataCandidates } from "../src/modules/content/sources/wikidata";
import { evidenceSources, historicalEntities } from "../src/modules/db/schema";
import { arg, deployEnv, openDb } from "./_db";

/**
 * `npm run source:wikidata -- --qid Q12501,Q37200 [--write]`
 * Dry run prints candidates. --write stores them as tier-C *candidate* evidence (never reviewed) and links
 * matching entities by wikidata_qid. Nothing here can make content publishable.
 */
async function main() {
  const ids = (arg("qid") ?? "").split(",").filter(Boolean);
  if (!ids.length) {
    console.error("Usage: npm run source:wikidata -- --qid Q123[,Q456] [--write]");
    process.exit(2);
  }
  const candidates = await fetchWikidataCandidates(ids);
  console.log(JSON.stringify(candidates, null, 2));
  if (!process.argv.includes("--write")) return;
  if (deployEnv() === "production") {
    console.error("Refusing to write from the CLI in production; use the reviewed import path.");
    process.exit(1);
  }
  const h = await openDb();
  for (const c of candidates) {
    await h.db
      .insert(evidenceSources)
      .values({
        provider: "wikidata",
        sourceRecordId: c.qid,
        sourceUrl: c.sourceUrl,
        title: `Wikidata: ${c.label}`,
        publisher: "Wikidata",
        retrievedAt: new Date(c.retrievedAt),
        queryHash: c.queryHash,
        sourceTier: c.sourceTier,
        rightsStatement: c.rightsStatement,
        licenseCode: c.licenseCode,
        reviewStatus: c.reviewStatus,
      })
      .onConflictDoNothing();
    const [entity] = await h.db.select().from(historicalEntities).where(eq(historicalEntities.wikidataQid, c.qid));
    console.error(`${c.qid} stored as candidate evidence${entity ? ` (entity ${entity.canonicalName})` : " (no linked entity yet)"}`);
  }
  await h.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
