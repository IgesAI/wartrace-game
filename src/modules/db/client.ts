import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export type Executor = DB | Tx;

export const MIGRATIONS_FOLDER = path.resolve(process.cwd(), "drizzle");

type Handle = { db: DB; kind: "pglite" | "postgres"; close: () => Promise<void> };

/** In-memory or file-backed PGlite (real Postgres in WASM). Used for local dev and tests. */
export async function createPgliteDb(dataDir?: string): Promise<Handle> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const isMemory = !dataDir || dataDir === "memory://";
  if (!isMemory) {
    const fs = await import("node:fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(isMemory ? undefined : dataDir);
  const db = drizzle(client, { schema }) as unknown as DB;
  await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, kind: "pglite", close: () => client.close() };
}

export async function createPostgresDb(url: string): Promise<Handle> {
  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: url, max: 10 });
  const db = drizzle(pool, { schema }) as unknown as DB;
  return { db, kind: "postgres", close: () => pool.end() };
}

export async function runPostgresMigrations(db: DB) {
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  await migrate(db as never, { migrationsFolder: MIGRATIONS_FOLDER });
}
