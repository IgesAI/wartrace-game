import { asc, desc, eq, sql } from "drizzle-orm";
import type { DB } from "@/modules/db/client";
import {
  adminUsers,
  dailyOperations,
  editorialAuditLogs,
  entityEvidence,
  evidenceSources,
  historicalEntities,
  operationQuestions,
  questionAnswerAliases,
  questionEligibleEntities,
  questionVersions,
} from "@/modules/db/schema";

export async function listOperations(db: DB) {
  return db.select().from(dailyOperations).orderBy(asc(dailyOperations.dateKey), asc(dailyOperations.version));
}

export async function listQuestions(db: DB) {
  return db
    .select({
      q: questionVersions,
      answers: sql<number>`(select count(*)::int from ${questionEligibleEntities} e where e.question_version_id = ${questionVersions.id})`,
      aliases: sql<number>`(select count(*)::int from ${questionAnswerAliases} a where a.question_version_id = ${questionVersions.id})`,
    })
    .from(questionVersions)
    .orderBy(asc(questionVersions.questionFamilyKey));
}

/** Admin-only: full answer bank for a question. Never call from player-facing code. */
export async function questionDetail(db: DB, questionVersionId: string) {
  const [q] = await db.select().from(questionVersions).where(eq(questionVersions.id, questionVersionId));
  if (!q) return null;
  const answers = await db
    .select({ e: questionEligibleEntities, entity: historicalEntities })
    .from(questionEligibleEntities)
    .innerJoin(historicalEntities, eq(historicalEntities.id, questionEligibleEntities.entityId))
    .where(eq(questionEligibleEntities.questionVersionId, questionVersionId))
    .orderBy(asc(questionEligibleEntities.rarityScore));
  const aliases = await db.select().from(questionAnswerAliases).where(eq(questionAnswerAliases.questionVersionId, questionVersionId));
  const evidence = await db
    .select({ link: entityEvidence, src: evidenceSources })
    .from(entityEvidence)
    .innerJoin(evidenceSources, eq(evidenceSources.id, entityEvidence.evidenceId))
    .innerJoin(questionEligibleEntities, eq(questionEligibleEntities.entityId, entityEvidence.entityId))
    .where(eq(questionEligibleEntities.questionVersionId, questionVersionId));
  return { q, answers, aliases, evidence };
}

export async function operationQuestionsFor(db: DB, operationId: string) {
  return db
    .select({ roundIndex: operationQuestions.roundIndex, q: questionVersions })
    .from(operationQuestions)
    .innerJoin(questionVersions, eq(questionVersions.id, operationQuestions.questionVersionId))
    .where(eq(operationQuestions.operationId, operationId))
    .orderBy(asc(operationQuestions.roundIndex));
}

export async function listAudit(db: DB, limit = 200) {
  return db
    .select({ log: editorialAuditLogs, actor: adminUsers.displayName, role: adminUsers.role })
    .from(editorialAuditLogs)
    .leftJoin(adminUsers, eq(adminUsers.id, editorialAuditLogs.actorId))
    .orderBy(desc(editorialAuditLogs.createdAt))
    .limit(limit);
}
