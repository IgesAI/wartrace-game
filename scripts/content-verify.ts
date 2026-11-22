import { and, eq } from "drizzle-orm";
import { buildSnapshot, snapshotChecksum } from "../src/modules/content/publish";
import { dailyOperations, operationSnapshots } from "../src/modules/db/schema";
import { arg, openDb } from "./_db";

/** Recomputes the frozen snapshot checksum for --date and compares it with the stored value (release step 2). */
async function main() {
  const date = arg("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("Usage: npm run content:verify -- --date YYYY-MM-DD");
    process.exit(2);
  }
  const h = await openDb();
  const [op] = await h.db.select().from(dailyOperations).where(and(eq(dailyOperations.dateKey, date), eq(dailyOperations.status, "published")));
  if (!op) {
    console.error(`No published operation for ${date}.`);
    await h.close();
    process.exit(1);
  }
  const [snap] = await h.db.select().from(operationSnapshots).where(eq(operationSnapshots.operationId, op.id));
  const stored = snap ? snapshotChecksum(snap.snapshot as never) : null;
  const rebuilt = snapshotChecksum(await buildSnapshot(h.db, op.id, (op.contentClass ?? "demo") as "verified" | "demo"));
  const ok = !!snap && stored === snap.checksum && snap.checksum === op.contentChecksum && rebuilt === op.contentChecksum;
  console.log(JSON.stringify({ date, operationId: op.id, contentClass: op.contentClass, operationChecksum: op.contentChecksum, snapshotChecksum: snap?.checksum, recomputedFromStoredSnapshot: stored, rebuiltFromSourceTables: rebuilt, ok }, null, 2));
  await h.close();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
