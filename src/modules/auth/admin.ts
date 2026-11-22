import { eq } from "drizzle-orm";
import type { DB } from "@/modules/db/client";
import { adminUsers } from "@/modules/db/schema";
import type { Actor } from "@/modules/content/audit";
import { signValue, verifySignedValue } from "./tokens";

export const ADMIN_COOKIE = "wartrace_admin_session";
export const ADMIN_TTL_MS = 8 * 3600_000;

export function issueAdminCookie(adminId: string, secret: string, now = new Date()) {
  const exp = now.getTime() + ADMIN_TTL_MS;
  return { value: signValue(`${adminId}:${exp}`, secret), expires: new Date(exp) };
}

/** Verifies signature + expiry, then re-reads role and active flag from the DB on every request. */
export async function resolveAdmin(db: DB, cookieValue: string | undefined, secret: string, now = new Date()): Promise<Actor | null> {
  const payload = verifySignedValue(cookieValue, secret);
  if (!payload) return null;
  const [id, exp] = payload.split(":");
  if (!id || !exp || Number(exp) < now.getTime() || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  if (!row || !row.active) return null;
  return { id: row.id, role: row.role, displayName: row.displayName };
}
