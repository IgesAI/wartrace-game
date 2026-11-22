import { and, eq } from "drizzle-orm";
import type { DB } from "@/modules/db/client";
import {
  adminUsers,
  dailyOperations,
  entityAliases,
  entityEvidence,
  evidenceSources,
  historicalEntities,
  operationQuestions,
  questionAnswerAliases,
  questionEligibleEntities,
  questionVersions,
  scoringVersions,
  type AdminRole,
} from "@/modules/db/schema";
import { addDays, dateKeyFor } from "@/modules/domain/dates";
import { normalizeAnswer } from "@/modules/domain/normalize";
import { SCORING_PARAMETERS, SCORING_VERSION_ID } from "@/modules/domain/scoring";
import fixture from "../../../specs/sample_challenge.json";
import type { Actor } from "./audit";
import { DEMO_HISTORY_OPERATION, DEMO_HISTORY_QUESTIONS, type DemoQuestion } from "./demo-history";
import { publishOperation } from "./publish";

export const DEV_ADMINS: { subject: string; name: string; role: AdminRole }[] = [
  { subject: "dev:reader", name: "Dev Reader", role: "reader" },
  { subject: "dev:editor", name: "Dev Editor", role: "editor" },
  { subject: "dev:reviewer", name: "Dev Reviewer", role: "reviewer" },
  { subject: "dev:publisher", name: "Dev Publisher", role: "publisher" },
  { subject: "dev:owner", name: "Dev Owner", role: "owner" },
];

export const DEMO_SCENE_KEY = "western-front";
export const FIXTURE_FAMILY_PREFIX = "fixture.fogline.";

export async function ensureScoringVersion(db: DB) {
  const [existing] = await db.select().from(scoringVersions).where(eq(scoringVersions.identifier, SCORING_VERSION_ID));
  if (existing) return existing;
  const [row] = await db
    .insert(scoringVersions)
    .values({
      identifier: SCORING_VERSION_ID,
      algorithm: "points = 100 + Math.round(900 * rarity^1.3); distance_m = Math.round(points * 0.8)",
      parameters: { ...SCORING_PARAMETERS },
      frozenAt: new Date(),
    })
    .returning();
  return row!;
}

/** Dev-only admin identities for the mock auth provider. Never seeded outside local fixture mode. */
export async function ensureDevAdmins(db: DB) {
  for (const a of DEV_ADMINS) {
    await db
      .insert(adminUsers)
      .values({ authSubject: a.subject, displayName: a.name, role: a.role, email: `${a.subject.replace(":", ".")}@localhost.invalid` })
      .onConflictDoNothing();
  }
  const rows = await db.select().from(adminUsers);
  const bySubject = new Map(rows.map((r) => [r.authSubject, r]));
  return (subject: string): Actor => {
    const r = bySubject.get(subject)!;
    return { id: r.id, role: r.role, displayName: r.displayName };
  };
}

async function insertQuestion(
  db: DB,
  q: DemoQuestion,
  opts: { createdBy: string; editorialStatus: string; evidenceTier: "C" | "D" },
): Promise<string> {
  const [existing] = await db.select().from(questionVersions).where(eq(questionVersions.questionFamilyKey, q.familyKey));
  if (existing) return existing.id;
  return db.transaction(async (tx) => {
    const [qv] = await tx
      .insert(questionVersions)
      .values({
        questionFamilyKey: q.familyKey,
        version: 1,
        prompt: q.prompt,
        internalEligibilityRules: q.eligibility,
        internalExclusionRules: q.exclusions,
        topic: q.topic,
        coverageClass: "experimental_not_publishable",
        coverageNote: q.coverageNote,
        isDemo: true,
        editorialStatus: opts.editorialStatus,
        createdBy: opts.createdBy,
      })
      .returning();
    let sourceId: string | null = null;
    if (q.source.url) {
      const [src] = await tx
        .insert(evidenceSources)
        .values({
          provider: "manual-candidate",
          sourceUrl: q.source.url,
          title: q.source.title,
          publisher: q.source.publisher,
          retrievedAt: new Date("2026-11-22T00:00:00Z"),
          sourceTier: opts.evidenceTier,
          rightsStatement: "Citation only; no media reused.",
          reviewStatus: "candidate",
        })
        .onConflictDoNothing()
        .returning();
      sourceId =
        src?.id ??
        (await tx.select().from(evidenceSources).where(and(eq(evidenceSources.provider, "manual-candidate"), eq(evidenceSources.sourceUrl, q.source.url))))[0]!.id;
    }
    for (const a of q.answers) {
      const [entity] = await tx
        .insert(historicalEntities)
        .values({
          canonicalName: a.canonicalName,
          entityType: a.entityType,
          disambiguation: a.disambiguation ?? null,
          isDemo: true,
          editorialStatus: "candidate",
          summary: `Candidate answer for: ${q.prompt}`,
        })
        .returning();
      await tx.insert(questionEligibleEntities).values({
        questionVersionId: qv!.id,
        entityId: entity!.id,
        rarityScore: a.rarity,
        inclusionRationale: q.eligibility,
        evidenceStatus: "candidate",
      });
      const seen = new Set<string>();
      for (const alias of a.aliases) {
        const normalized = normalizeAnswer(alias);
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        await tx.insert(entityAliases).values({ entityId: entity!.id, alias, normalizedAlias: normalized, aliasStatus: "candidate" });
        await tx.insert(questionAnswerAliases).values({ questionVersionId: qv!.id, entityId: entity!.id, normalizedAlias: normalized, displayAlias: alias });
      }
      if (sourceId) {
        await tx.insert(entityEvidence).values({
          entityId: entity!.id,
          evidenceId: sourceId,
          claimSummary: `Listed as a member of: ${q.eligibility}`,
          claimStatus: "candidate",
        });
      }
    }
    return qv!.id;
  });
}

function fixtureQuestions(): DemoQuestion[] {
  return fixture.questions.map((q) => ({
    familyKey: `${FIXTURE_FAMILY_PREFIX}${q.roundIndex}`,
    topic: q.category,
    prompt: q.prompt,
    eligibility: q.eligibility,
    exclusions: "",
    coverageNote: "DEMO_ONLY_UNVERIFIED_FIXTURE_DO_NOT_PUBLISH (specs/sample_challenge.json)",
    source: { title: "", url: "", publisher: "" },
    answers: q.acceptedAnswers.map((a) => ({
      key: a.entityId,
      canonicalName: a.canonicalName,
      entityType: "fictional_demo",
      rarity: a.rarityScore,
      aliases: a.aliases,
    })),
  }));
}

async function ensureOperation(
  db: DB,
  args: { dateKey: string; title: string; blurb: string; questionIds: string[]; createdBy: string; scoreVersionId: string },
) {
  const [existing] = await db
    .select()
    .from(dailyOperations)
    .where(and(eq(dailyOperations.dateKey, args.dateKey), eq(dailyOperations.title, args.title)));
  if (existing) return existing;
  const [op] = await db
    .insert(dailyOperations)
    .values({
      dateKey: args.dateKey,
      version: 1,
      title: args.title,
      blurb: args.blurb,
      sceneKey: DEMO_SCENE_KEY,
      scoreVersionId: args.scoreVersionId,
      status: "draft",
      createdBy: args.createdBy,
    })
    .onConflictDoNothing()
    .returning();
  if (!op) return null;
  for (const [i, qid] of args.questionIds.entries()) {
    await db.insert(operationQuestions).values({ operationId: op.id, roundIndex: i + 1, questionVersionId: qid });
  }
  return op;
}

/**
 * Idempotently seeds NON-PRODUCTION demo content and publishes it as content_class='demo'
 * for today (America/New_York) and the next two days, plus one unpublished draft to exercise the gate.
 */
export async function ensureDemoContent(db: DB, now: Date, opts: { days?: number } = {}) {
  const scoring = await ensureScoringVersion(db);
  const actor = await ensureDevAdmins(db);
  const editor = actor("dev:editor");
  const publisher = actor("dev:publisher");

  const historyIds: string[] = [];
  for (const q of DEMO_HISTORY_QUESTIONS) {
    historyIds.push(await insertQuestion(db, q, { createdBy: editor.id, editorialStatus: "review", evidenceTier: "C" }));
  }
  const fixtureIds: string[] = [];
  for (const q of fixtureQuestions()) {
    fixtureIds.push(await insertQuestion(db, q, { createdBy: editor.id, editorialStatus: "draft", evidenceTier: "D" }));
  }

  const today = dateKeyFor(now);
  const days = opts.days ?? 3;
  const toPublish: string[] = [];
  for (let d = 0; d < days; d++) {
    const op = await ensureOperation(db, {
      dateKey: addDays(today, d),
      title: DEMO_HISTORY_OPERATION.title,
      blurb: DEMO_HISTORY_OPERATION.blurb,
      questionIds: historyIds,
      createdBy: editor.id,
      scoreVersionId: scoring.id,
    });
    if (op && op.status === "draft") toPublish.push(op.id);
  }
  const fixtureOp = await ensureOperation(db, {
    dateKey: fixture.dateKey,
    title: fixture.title,
    blurb: "Fictional schema/UX fixture from specs/sample_challenge.json. Not history.",
    questionIds: fixtureIds,
    createdBy: editor.id,
    scoreVersionId: scoring.id,
  });
  if (fixtureOp && fixtureOp.status === "draft") toPublish.push(fixtureOp.id);

  await ensureOperation(db, {
    dateKey: addDays(today, days),
    title: `${DEMO_HISTORY_OPERATION.title} (unpublished draft)`,
    blurb: "Draft left unpublished so the readiness gate can be inspected in the admin.",
    questionIds: historyIds,
    createdBy: editor.id,
    scoreVersionId: scoring.id,
  });

  for (const id of toPublish) {
    const [occupied] = await db
      .select({ id: dailyOperations.id })
      .from(dailyOperations)
      .innerJoin(operationQuestions, eq(operationQuestions.operationId, dailyOperations.id))
      .where(and(eq(dailyOperations.id, id)));
    if (!occupied) continue;
    try {
      await publishOperation(db, id, publisher, {
        allowDemoContent: true,
        demoAllowedByEnvironment: true,
        reason: "Local demo seed (non-production)",
        now,
      });
    } catch (err) {
      if (!(err instanceof Error && /already published/.test(err.message))) throw err;
    }
  }
  return { today, published: toPublish.length };
}
