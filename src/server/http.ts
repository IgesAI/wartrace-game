import "server-only";
import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { ADMIN_COOKIE, resolveAdmin } from "@/modules/auth/admin";
import { GUEST_COOKIE, GUEST_TTL_DAYS, createGuest, resolveGuest } from "@/modules/auth/guest";
import { sha256Hex } from "@/modules/auth/tokens";
import type { Actor } from "@/modules/content/audit";
import { AppError } from "@/modules/domain/errors";
import type { GameConfig } from "@/modules/game/service";
import { getDb } from "./db";
import { demoContentAllowed, getEnv, roundSeconds } from "./env";
import { LIMITS, takeToken } from "./rate-limit";

export function gameConfig(): GameConfig {
  const env = getEnv();
  return { now: new Date(), roundSeconds: roundSeconds(), demoAllowed: demoContentAllowed(), timeZone: env.GAME_TIME_ZONE };
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "Cache-Control": "private, no-store", ...(init?.headers ?? {}) } });
}

/** Structured error envelope with request id; never leaks stack traces. */
export function handle<C>(fn: (req: Request, ctx: C, requestId: string) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    const requestId = randomUUID();
    try {
      return await fn(req, ctx, requestId);
    } catch (err) {
      if (err instanceof AppError) {
        return json({ error: { code: err.code, message: err.message, details: err.details, requestId } }, { status: err.status });
      }
      console.error(JSON.stringify({ level: "error", requestId, message: err instanceof Error ? err.message : String(err) }));
      return json({ error: { code: "INTERNAL", message: "Something went wrong", requestId } }, { status: 500 });
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > 16_384) throw new AppError("BAD_REQUEST", 413, "Request body too large");
    raw = text ? JSON.parse(text) : {};
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("BAD_REQUEST", 400, "Malformed JSON");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new AppError("BAD_REQUEST", 400, "Invalid request", parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  return parsed.data;
}

/** CSRF defence for cookie-authenticated mutations: same-origin Origin/Sec-Fetch-Site required when present. */
export async function assertSameOrigin(strict = false) {
  const h = await headers();
  const origin = h.get("origin");
  const site = h.get("sec-fetch-site");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (origin) {
    let ok = false;
    try {
      ok = new URL(origin).host === host;
    } catch {
      ok = false;
    }
    if (!ok) throw new AppError("FORBIDDEN", 403, "Cross-origin request rejected");
  } else if (site && site !== "same-origin" && site !== "none") {
    throw new AppError("FORBIDDEN", 403, "Cross-site request rejected");
  } else if (strict && !origin && !site) {
    throw new AppError("FORBIDDEN", 403, "Origin required");
  }
}

async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return sha256Hex(`ip:${ip}`).slice(0, 24);
}

export async function rateLimit(scope: keyof typeof LIMITS, key?: string) {
  const k = key ?? (await clientKey());
  if (!takeToken(scope, k)) throw new AppError("RATE_LIMITED", 429, "Too many requests — take a breath and try again shortly");
}

export async function currentGuestId(): Promise<string | null> {
  const store = await cookies();
  return resolveGuest(await getDb(), store.get(GUEST_COOKIE)?.value, getEnv().guestSecret);
}

export async function requireGuestId(): Promise<string> {
  const id = await currentGuestId();
  if (!id) throw new AppError("UNAUTHENTICATED", 401, "Guest session missing or expired");
  return id;
}

/** Creates a signed HttpOnly guest cookie on first play. No PII is collected. */
export async function ensureGuestId(): Promise<string> {
  const existing = await currentGuestId();
  if (existing) return existing;
  await rateLimit("runs");
  const env = getEnv();
  const created = await createGuest(await getDb(), env.guestSecret);
  const store = await cookies();
  store.set(GUEST_COOKIE, created.cookieValue, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_TTL_DAYS * 86_400,
  });
  return created.guestId;
}

export async function currentAdmin(): Promise<Actor | null> {
  const store = await cookies();
  return resolveAdmin(await getDb(), store.get(ADMIN_COOKIE)?.value, getEnv().adminSecret);
}
