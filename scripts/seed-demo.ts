import { ensureDemoContent } from "../src/modules/content/seed";
import { arg, deployEnv, openDb } from "./_db";

async function main() {
  if (deployEnv() === "production") {
    console.error("Refusing to seed DEMO content into a production deployment.");
    process.exit(1);
  }
  const days = Number(arg("days") ?? 3);
  const h = await openDb({ migrate: true });
  const res = await ensureDemoContent(h.db, new Date(), { days });
  console.log("Seeded DEMO content (fictional/candidate, not publishable as verified):", res);
  await h.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
