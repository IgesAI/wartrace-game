import { and, eq, gt, isNull } from "drizzle-orm";
import type { DB } from "@/modules/db/client";
import { guestSessions } from "@/modules/db/schema";
import { randomToken, sha256Hex, signValue, verifySignedValue } from "./tokens";

export const GUEST_COOKIE = "wartrace_guest";
export const GUEST_TTL_DAYS = 400;

/** Resolves a signed guest cookie to a session id. The DB stores only sha256(secret). */
export async function resolveGuest(db: DB, cookieValue: string | undefined, secret: string, now = new Date()) {
  const raw = verifySignedValue(cookieValue, secret);
  if (!raw) return null;
  const [row] = await db
    .select({ id: guestSessions.id })
    .from(guestSessions)
    .where(and(eq(guestSessions.secretHash, sha256Hex(raw)), isNull(guestSessions.revokedAt), gt(guestSessions.expiresAt, now)));
  return row?.id ?? null;
}

export async function createGuest(db: DB, secret: string, now = new Date()) {
  const raw = randomToken(32);
  const expiresAt = new Date(now.getTime() + GUEST_TTL_DAYS * 86_400_000);
  const [row] = await db.insert(guestSessions).values({ secretHash: sha256Hex(raw), expiresAt }).returning({ id: guestSessions.id });
  return { guestId: row!.id, cookieValue: signValue(raw, secret), expiresAt };
}
