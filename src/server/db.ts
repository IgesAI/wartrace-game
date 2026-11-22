import "server-only";
import { createPgliteDb, createPostgresDb, type DB } from "@/modules/db/client";
import { ensureDemoContent } from "@/modules/content/seed";
import { getEnv } from "./env";

type State = { promise: Promise<DB> | null };
const g = globalThis as unknown as { __wartraceDb?: State };
const state: State = (g.__wartraceDb ??= { promise: null });

async function init(): Promise<DB> {
  const env = getEnv();
  if (env.DATABASE_URL) {
    // Migrations against managed Postgres run only via `npm run db:migrate` (controlled release step).
    return (await createPostgresDb(env.DATABASE_URL)).db;
  }
  const handle = await createPgliteDb(env.PGLITE_DATA_DIR);
  if (env.GAME_DEV_FIXTURE_MODE) await ensureDemoContent(handle.db, new Date());
  return handle.db;
}

export function getDb(): Promise<DB> {
  if (!state.promise) {
    state.promise = init().catch((err) => {
      state.promise = null;
      throw err;
    });
  }
  return state.promise;
}
