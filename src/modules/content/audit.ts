import type { Executor } from "@/modules/db/client";
import { editorialAuditLogs, type AdminRole } from "@/modules/db/schema";
import { AppError } from "@/modules/domain/errors";

export type Actor = { id: string; role: AdminRole; displayName: string };

const RANK: Record<AdminRole, number> = { reader: 0, editor: 1, reviewer: 2, publisher: 3, owner: 4 };

/** Role capabilities per docs/10_ADMIN_OPERATIONS.md. Publisher/owner may also review; editor cannot publish. */
export const CAPABILITIES = {
  read: ["reader", "editor", "reviewer", "publisher", "owner"],
  edit: ["editor", "reviewer", "publisher", "owner"],
  review: ["reviewer", "publisher", "owner"],
  publish: ["publisher", "owner"],
  triageAppeals: ["editor", "reviewer", "publisher", "owner"],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(actor: Pick<Actor, "role"> | null | undefined, capability: Capability): boolean {
  return !!actor && (CAPABILITIES[capability] as readonly AdminRole[]).includes(actor.role);
}

export function requireCapability(actor: Actor | null | undefined, capability: Capability): Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", 401, "Admin sign-in required");
  if (!can(actor, capability)) throw new AppError("FORBIDDEN", 403, `Role '${actor.role}' cannot ${capability}`);
  return actor;
}

export function roleRank(role: AdminRole) {
  return RANK[role];
}

export async function writeAudit(
  db: Executor,
  entry: {
    actorId: string | null;
    action: string;
    subjectType: string;
    subjectId: string;
    before?: unknown;
    after?: unknown;
    reason?: string | null;
  },
) {
  await db.insert(editorialAuditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    subjectType: entry.subjectType,
    subjectId: entry.subjectId,
    beforeState: entry.before ?? null,
    afterState: entry.after ?? null,
    reason: entry.reason ?? null,
  });
}
