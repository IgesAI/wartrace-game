import { openDb } from "./_db";

async function main() {
  const h = await openDb({ migrate: true });
  console.log(`Migrations applied (${h.kind}).`);
  await h.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
