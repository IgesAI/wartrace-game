import { asc } from "drizzle-orm";
import { lintOperation } from "../src/modules/content/readiness";
import { dailyOperations } from "../src/modules/db/schema";
import { arg, openDb } from "./_db";

/** Lints every operation (or one --date) and exits non-zero when any has hard (non-demo-waivable) blockers. */
async function main() {
  const date = arg("date");
  const h = await openDb();
  const ops = (await h.db.select().from(dailyOperations).orderBy(asc(dailyOperations.dateKey))).filter((o) => !date || o.dateKey === date);
  let hardTotal = 0;
  for (const op of ops) {
    const r = await lintOperation(h.db, op.id);
    const hard = r.blocking.filter((b) => !b.demoWaivable);
    hardTotal += hard.length;
    console.log(`\n${op.dateKey} v${op.version} [${op.status}${op.contentClass ? `/${op.contentClass}` : ""}] ${op.title}`);
    console.log(`  ${hard.length} hard blockers · ${r.waivable.length} demo-waivable · ${r.issues.filter((i) => i.severity === "warning").length} warnings`);
    for (const i of r.issues) console.log(`  ${i.severity === "error" ? (i.demoWaivable ? "~" : "✗") : "!"} ${i.code}${i.roundIndex ? ` r${i.roundIndex}` : ""}: ${i.message}`);
  }
  await h.close();
  if (!ops.length) console.log("No operations found.");
  process.exit(hardTotal > 0 && process.argv.includes("--strict") ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
