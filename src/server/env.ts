import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const DEV_GUEST_SECRET = "dev-only-insecure-guest-cookie-secret-do-not-deploy-0000";
const DEV_ADMIN_SECRET = "dev-only-insecure-admin-cookie-secret-do-not-deploy-0000";

const schema = z
  .object({
    WARTRACE_DEPLOY_ENV: z.enum(["local", "preview", "production"]).default("local"),
    DATABASE_URL: z.string().url().optional().or(z.literal("").transform(() => undefined)),
    PGLITE_DATA_DIR: z.string().default(".data/pglite"),
    GUEST_COOKIE_SIGNING_SECRET: z.string().optional(),
    ADMIN_AUTH_PROVIDER: z.enum(["development_mock_only"]).default("development_mock_only"),
    ADMIN_AUTH_SECRET: z.string().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
    GAME_TIME_ZONE: z.string().default("America/New_York"),
    GAME_DEV_FIXTURE_MODE: bool,
    GAME_ROUND_SECONDS_OVERRIDE: z.coerce.number().int().min(3).max(120).optional(),
    SCENE_ASSET_BASE_PATH: z.string().default("/worlds/western-front"),
    ANALYTICS_ENABLED: bool,
    ERROR_MONITORING_DSN: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const deployed = env.WARTRACE_DEPLOY_ENV !== "local";
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: env.GAME_TIME_ZONE });
    } catch {
      ctx.addIssue({ code: "custom", path: ["GAME_TIME_ZONE"], message: "Invalid IANA time zone" });
    }
    if (deployed) {
      if (!env.DATABASE_URL) ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "Required outside local" });
      for (const key of ["GUEST_COOKIE_SIGNING_SECRET", "ADMIN_AUTH_SECRET"] as const) {
        const v = env[key];
        if (!v || v.length < 32 || v.startsWith("REPLACE_") || v.startsWith("dev-only")) {
          ctx.addIssue({ code: "custom", path: [key], message: "Must be a real random secret of 32+ chars" });
        }
      }
      if (env.GAME_ROUND_SECONDS_OVERRIDE) {
        ctx.addIssue({ code: "custom", path: ["GAME_ROUND_SECONDS_OVERRIDE"], message: "Local only" });
      }
    }
    if (env.WARTRACE_DEPLOY_ENV === "production") {
      if (env.GAME_DEV_FIXTURE_MODE) {
        ctx.addIssue({ code: "custom", path: ["GAME_DEV_FIXTURE_MODE"], message: "Demo fixtures are blocked in production" });
      }
      if (env.ADMIN_AUTH_PROVIDER === "development_mock_only") {
        ctx.addIssue({
          code: "custom",
          path: ["ADMIN_AUTH_PROVIDER"],
          message: "Development mock admin auth is blocked in production; configure a real provider",
        });
      }
    }
  });

export type Env = z.infer<typeof schema> & { guestSecret: string; adminSecret: string; secureCookies: boolean };

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid WARTRACE environment: ${issues}`);
  }
  const e = parsed.data;
  cached = {
    ...e,
    guestSecret: e.GUEST_COOKIE_SIGNING_SECRET || DEV_GUEST_SECRET,
    adminSecret: e.ADMIN_AUTH_SECRET || DEV_ADMIN_SECRET,
    secureCookies: e.NEXT_PUBLIC_BASE_URL.startsWith("https://"),
  };
  return cached;
}

export function resetEnvForTests() {
  cached = null;
}

export function roundSeconds(): number {
  const env = getEnv();
  return env.WARTRACE_DEPLOY_ENV === "local" && env.GAME_ROUND_SECONDS_OVERRIDE ? env.GAME_ROUND_SECONDS_OVERRIDE : 25;
}

/** Demo (unverified) content may be served only outside production. */
export function demoContentAllowed(): boolean {
  return getEnv().WARTRACE_DEPLOY_ENV !== "production";
}
