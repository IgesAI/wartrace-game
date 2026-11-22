import { createPgliteDb, createPostgresDb, runPostgresMigrations } from "../src/modules/db/client";

/** Opens the same database the app would use. PGlite is single-writer: stop `next dev` before running scripts against it. */
export async function openDb(opts: { migrate?: boolean } = {}) {
  const url = process.env.DATABASE_URL;
  if (url) {
    const h = await createPostgresDb(url);
    if (opts.migrate) await runPostgresMigrations(h.db);
    return h;
  }
  return createPgliteDb(process.env.PGLITE_DATA_DIR ?? ".data/pglite");
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : "true";
}

export function deployEnv(): "local" | "preview" | "production" {
  const v = process.env.WARTRACE_DEPLOY_ENV ?? "local";
  return v === "production" || v === "preview" ? v : "local";
}
