import { and, desc, eq } from "drizzle-orm";
import { publishOperation } from "../src/modules/content/publish";
import { adminUsers, dailyOperations } from "../src/modules/db/schema";
import { arg, deployEnv, openDb } from "./_db";

/**
 * Local/preview CLI publish: `npm run content:publish -- --date YYYY-MM-DD --actor dev:publisher [--demo]`.
 * Same readiness gate, role check and audit log as the admin UI.
 */
async function main() {
  const date = arg("date");
  const actorSubject = arg("actor");
  const demo = process.argv.includes("--demo");
  if (!date || !actorSubject) {
    console.error("Usage: npm run content:publish -- --date YYYY-MM-DD --actor <auth_subject> [--demo]");
    process.exit(2);
  }
  const env = deployEnv();
  const h = await openDb();
  const [actor] = await h.db.select().from(adminUsers).where(eq(adminUsers.authSubject, actorSubject));
  if (!actor || !actor.active) {
    console.error(`Unknown or inactive admin '${actorSubject}'.`);
    process.exit(1);
  }
  const [op] = await h.db
    .select()
    .from(dailyOperations)
    .where(and(eq(dailyOperations.dateKey, date), eq(dailyOperations.status, "draft")))
    .orderBy(desc(dailyOperations.version))
    .limit(1);
  if (!op) {
    console.error(`No draft operation for ${date}.`);
    process.exit(1);
  }
  try {
    const res = await publishOperation(h.db, op.id, { id: actor.id, role: actor.role, displayName: actor.displayName ?? actorSubject }, {
      allowDemoContent: demo,
      demoAllowedByEnvironment: env !== "production",
      reason: "CLI publish",
    });
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    const err = e as { code?: string; message: string; details?: unknown };
    console.error(`${err.code ?? "ERROR"}: ${err.message}`);
    if (err.details) console.error(JSON.stringify(err.details, null, 2));
    process.exitCode = 1;
  } finally {
    await h.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
