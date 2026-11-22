import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/modules/db/client";
import { APPEAL_CATEGORIES, APPEAL_STATUSES, answerAppeals, gameRuns, runRounds } from "@/modules/db/schema";
import { requireCapability, writeAudit, type Actor } from "@/modules/content/audit";
import { AppError } from "@/modules/domain/errors";

const httpsUrl = z
  .string()
  .max(2048)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Only http(s) links are accepted");

export const appealInputSchema = z
  .object({
    runRoundId: z.string().uuid(),
    category: z.enum(APPEAL_CATEGORIES),
    explanation: z.string().trim().min(10).max(3000),
    evidenceUrl: httpsUrl.optional().or(z.literal("").transform(() => undefined)),
  })
  .strict();

export type AppealInput = z.infer<typeof appealInputSchema>;

/** Stored as plain text and only ever rendered through React escaping; never as HTML. */
export async function submitAppeal(db: DB, guestId: string, input: AppealInput) {
  const [row] = await db
    .select({ round: runRounds, run: gameRuns })
    .from(runRounds)
    .innerJoin(gameRuns, eq(gameRuns.id, runRounds.runId))
    .where(eq(runRounds.id, input.runRoundId));
  if (!row || row.run.guestSessionId !== guestId) throw new AppError("FORBIDDEN", 403, "You can only appeal your own rounds");
  if (!row.round.lockedAt) throw new AppError("CONFLICT", 409, "Round is still open");
  const [created] = await db
    .insert(answerAppeals)
    .values({
      guestSessionId: guestId,
      runRoundId: input.runRoundId,
      submittedText: row.round.submittedText ?? "",
      explanation: input.explanation,
      evidenceUrl: input.evidenceUrl ?? null,
      category: input.category,
    })
    .onConflictDoNothing()
    .returning({ id: answerAppeals.id, status: answerAppeals.status });
  if (!created) throw new AppError("CONFLICT", 409, "An appeal already exists for this round");
  return created;
}

export async function listAppeals(db: DB) {
  return db.select().from(answerAppeals).orderBy(desc(answerAppeals.createdAt)).limit(200);
}

export async function updateAppealStatus(
  db: DB,
  actor: Actor,
  appealId: string,
  status: (typeof APPEAL_STATUSES)[number],
  note: string,
) {
  requireCapability(actor, "triageAppeals");
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(answerAppeals).where(eq(answerAppeals.id, appealId)).for("update");
    if (!before) throw new AppError("NOT_FOUND", 404, "Appeal not found");
    await tx
      .update(answerAppeals)
      .set({ status, reviewerId: actor.id, reviewerNote: note || null, updatedAt: new Date() })
      .where(eq(answerAppeals.id, appealId));
    await writeAudit(tx, {
      actorId: actor.id,
      action: "appeal.status",
      subjectType: "answer_appeal",
      subjectId: appealId,
      before: { status: before.status },
      after: { status },
      reason: note || null,
    });
  });
}
