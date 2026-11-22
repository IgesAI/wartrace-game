import { createHash } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DB, Executor } from "@/modules/db/client";
import {
  dailyOperations,
  entityEvidence,
  evidenceSources,
  historicalEntities,
  operationQuestions,
  operationSnapshots,
  questionAnswerAliases,
  questionEligibleEntities,
  questionVersions,
  scoringVersions,
} from "@/modules/db/schema";
import { AppError } from "@/modules/domain/errors";
import { awardForRarity } from "@/modules/domain/scoring";
import { canonicalJson, type OperationSnapshot, type SnapshotQuestion } from "@/modules/domain/snapshot";
import { requireCapability, writeAudit, type Actor } from "./audit";
import { lintOperation } from "./readiness";

export async function buildSnapshot(db: Executor, operationId: string, contentClass: "verified" | "demo"): Promise<OperationSnapshot> {
  const [op] = await db.select().from(dailyOperations).where(eq(dailyOperations.id, operationId));
  if (!op) throw new AppError("NOT_FOUND", 404, "Operation not found");
  const [scoring] = await db.select().from(scoringVersions).where(eq(scoringVersions.id, op.scoreVersionId));
  if (!scoring) throw new AppError("CONFLICT", 409, "Scoring version missing");

  const rounds = await db
    .select({ roundIndex: operationQuestions.roundIndex, q: questionVersions })
    .from(operationQuestions)
    .innerJoin(questionVersions, eq(questionVersions.id, operationQuestions.questionVersionId))
    .where(eq(operationQuestions.operationId, operationId))
    .orderBy(asc(operationQuestions.roundIndex));
  const qvIds = rounds.map((r) => r.q.id);

  const eligible = qvIds.length
    ? await db
        .select({ e: questionEligibleEntities, entity: historicalEntities })
        .from(questionEligibleEntities)
        .innerJoin(historicalEntities, eq(historicalEntities.id, questionEligibleEntities.entityId))
        .where(inArray(questionEligibleEntities.questionVersionId, qvIds))
    : [];
  const aliases = qvIds.length
    ? await db.select().from(questionAnswerAliases).where(inArray(questionAnswerAliases.questionVersionId, qvIds))
    : [];
  const entityIds = [...new Set(eligible.map((e) => e.entity.id))];
  const evidence = entityIds.length
    ? await db
        .select({ link: entityEvidence, src: evidenceSources })
        .from(entityEvidence)
        .innerJoin(evidenceSources, eq(evidenceSources.id, entityEvidence.evidenceId))
        .where(inArray(entityEvidence.entityId, entityIds))
    : [];

  const questions: SnapshotQuestion[] = rounds.map(({ roundIndex, q }) => ({
    roundIndex,
    questionVersionId: q.id,
    familyKey: q.questionFamilyKey,
    version: q.version,
    prompt: q.prompt,
    topic: q.topic,
    coverageClass: q.coverageClass,
    answers: eligible
      .filter((e) => e.e.questionVersionId === q.id && e.e.evidenceStatus !== "retracted")
      .sort((a, b) => (a.entity.id < b.entity.id ? -1 : 1))
      .map(({ e, entity }) => {
        const award = awardForRarity(e.rarityScore);
        return {
          entityId: entity.id,
          canonicalName: entity.canonicalName,
          disambiguation: entity.disambiguation,
          rarityScore: e.rarityScore,
          points: award.points,
          distanceM: award.distanceM,
          tier: award.tier,
          inclusionRationale: e.inclusionRationale,
          evidenceStatus: e.evidenceStatus,
          aliases: aliases
            .filter((a) => a.questionVersionId === q.id && a.entityId === entity.id)
            .map((a) => ({ normalized: a.normalizedAlias, display: a.displayAlias }))
            .sort((a, b) => (a.normalized < b.normalized ? -1 : 1)),
          evidence: evidence
            .filter((x) => x.link.entityId === entity.id && x.link.claimStatus !== "retracted" && x.src.reviewStatus !== "rejected")
            .map((x) => ({
              title: x.src.title,
              publisher: x.src.publisher,
              url: x.src.sourceUrl,
              sourceTier: x.src.sourceTier,
              reviewStatus: x.src.reviewStatus,
              retrievedAt: x.src.retrievedAt.toISOString(),
            }))
            .sort((a, b) => (a.url < b.url ? -1 : 1)),
        };
      }),
  }));

  return {
    schema: 1,
    operationId: op.id,
    dateKey: op.dateKey,
    version: op.version,
    title: op.title,
    contentClass,
    scoringVersion: { identifier: scoring.identifier, algorithm: scoring.algorithm, parameters: scoring.parameters },
    questions,
  };
}

export function snapshotChecksum(snapshot: OperationSnapshot): string {
  return createHash("sha256").update(canonicalJson(snapshot)).digest("hex");
}

export type PublishOptions = { allowDemoContent?: boolean; demoAllowedByEnvironment: boolean; reason?: string; now?: Date; assetRegister?: unknown };

/**
 * Publishes a reviewed seven-question operation as an immutable checksummed snapshot.
 * Demo content can only be published when explicitly requested AND the environment permits it,
 * and is labelled content_class='demo' so production refuses to serve it.
 */
export async function publishOperation(db: DB, operationId: string, actor: Actor, opts: PublishOptions) {
  requireCapability(actor, "publish");
  return db.transaction(async (tx) => {
    const [op] = await tx.select().from(dailyOperations).where(eq(dailyOperations.id, operationId)).for("update");
    if (!op) throw new AppError("NOT_FOUND", 404, "Operation not found");
    if (op.status === "published") throw new AppError("CONFLICT", 409, "Operation is already published");
    if (op.publicationTimestamp) throw new AppError("CONFLICT", 409, "Operation was previously published; use rollback/restore");

    const report = await lintOperation(tx, operationId, { assetRegister: opts.assetRegister });
    if (report.blocking.length) {
      throw new AppError("PUBLISH_BLOCKED", 409, "Publication readiness gate failed", report.blocking);
    }
    let contentClass: "verified" | "demo" = "verified";
    if (report.waivable.length) {
      if (!opts.allowDemoContent || !opts.demoAllowedByEnvironment) {
        throw new AppError("PUBLISH_BLOCKED", 409, "Content is not reviewed/sourced; only demo publication outside production is possible", report.waivable);
      }
      contentClass = "demo";
    }
    const [occupied] = await tx
      .select({ id: dailyOperations.id })
      .from(dailyOperations)
      .where(and(eq(dailyOperations.dateKey, op.dateKey), eq(dailyOperations.status, "published")));
    if (occupied) throw new AppError("CONFLICT", 409, `An operation is already published for ${op.dateKey}`);

    const snapshot = await buildSnapshot(tx, operationId, contentClass);
    const checksum = snapshotChecksum(snapshot);
    const now = opts.now ?? new Date();
    await tx.insert(operationSnapshots).values({ operationId, snapshot, checksum });
    await tx
      .update(dailyOperations)
      .set({ status: "published", contentClass, contentChecksum: checksum, publicationTimestamp: now, approvedBy: actor.id })
      .where(eq(dailyOperations.id, operationId));
    if (contentClass === "verified") {
      const qvIds = snapshot.questions.map((q) => q.questionVersionId);
      await tx.update(questionVersions).set({ editorialStatus: "published" }).where(inArray(questionVersions.id, qvIds));
    }
    await writeAudit(tx, {
      actorId: actor.id,
      action: contentClass === "demo" ? "operation.publish_demo" : "operation.publish",
      subjectType: "daily_operation",
      subjectId: operationId,
      before: { status: op.status },
      after: { status: "published", contentClass, checksum, dateKey: op.dateKey, waived: report.waivable.map((w) => w.code) },
      reason: opts.reason ?? null,
    });
    return { operationId, dateKey: op.dateKey, checksum, contentClass, report };
  });
}

/** Replace the live operation for a date with another previously-published version (audit logged). */
export async function restoreOperation(db: DB, targetOperationId: string, actor: Actor, reason: string) {
  requireCapability(actor, "publish");
  if (!reason || reason.trim().length < 5) throw new AppError("BAD_REQUEST", 400, "A rollback reason is required");
  return db.transaction(async (tx) => {
    const [target] = await tx.select().from(dailyOperations).where(eq(dailyOperations.id, targetOperationId)).for("update");
    if (!target) throw new AppError("NOT_FOUND", 404, "Operation not found");
    if (!target.publicationTimestamp) throw new AppError("CONFLICT", 409, "Only previously published snapshots can be restored");
    if (target.status === "published") throw new AppError("CONFLICT", 409, "Operation is already live");
    const [snap] = await tx.select().from(operationSnapshots).where(eq(operationSnapshots.operationId, target.id));
    if (!snap || snap.checksum !== target.contentChecksum) throw new AppError("CONFLICT", 409, "Snapshot checksum mismatch");
    const [live] = await tx
      .select()
      .from(dailyOperations)
      .where(and(eq(dailyOperations.dateKey, target.dateKey), eq(dailyOperations.status, "published")))
      .for("update");
    if (live) {
      await tx.update(dailyOperations).set({ status: "retired" }).where(eq(dailyOperations.id, live.id));
    }
    await tx.update(dailyOperations).set({ status: "published" }).where(eq(dailyOperations.id, target.id));
    await writeAudit(tx, {
      actorId: actor.id,
      action: "operation.restore",
      subjectType: "daily_operation",
      subjectId: target.id,
      before: { liveOperationId: live?.id ?? null },
      after: { liveOperationId: target.id, dateKey: target.dateKey, checksum: target.contentChecksum },
      reason,
    });
    return { dateKey: target.dateKey, retiredOperationId: live?.id ?? null, liveOperationId: target.id };
  });
}

/** Take a live operation offline (maintenance). Players see the graceful no-challenge state. */
export async function disableOperation(db: DB, operationId: string, actor: Actor, reason: string) {
  requireCapability(actor, "publish");
  if (!reason || reason.trim().length < 5) throw new AppError("BAD_REQUEST", 400, "A reason is required");
  return db.transaction(async (tx) => {
    const [op] = await tx.select().from(dailyOperations).where(eq(dailyOperations.id, operationId)).for("update");
    if (!op || op.status !== "published") throw new AppError("CONFLICT", 409, "Operation is not live");
    await tx.update(dailyOperations).set({ status: "disabled" }).where(eq(dailyOperations.id, op.id));
    await writeAudit(tx, {
      actorId: actor.id,
      action: "operation.disable",
      subjectType: "daily_operation",
      subjectId: op.id,
      before: { status: "published" },
      after: { status: "disabled" },
      reason,
    });
  });
}
