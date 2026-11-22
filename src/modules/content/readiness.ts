import { and, asc, eq, inArray, ne } from "drizzle-orm";
import type { Executor } from "@/modules/db/client";
import {
  dailyOperations,
  entityEvidence,
  evidenceSources,
  historicalEntities,
  operationQuestions,
  questionAnswerAliases,
  questionEligibleEntities,
  questionVersions,
  scoringVersions,
} from "@/modules/db/schema";
import { assetRegisterSchema, unapprovedSceneAssets } from "@/modules/assets/register";
import { normalizeAnswer } from "@/modules/domain/normalize";
import assetRegisterJson from "../../../assets/asset-register.json";
import { ROUNDS_PER_OPERATION, awardForRarity } from "@/modules/domain/scoring";

export type Issue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  roundIndex?: number;
  /** Error that may be waived ONLY to publish explicitly-labelled demo content outside production. */
  demoWaivable?: boolean;
};

export type ReadinessReport = {
  operationId: string;
  dateKey: string;
  title: string;
  status: string;
  issues: Issue[];
  blocking: Issue[];
  waivable: Issue[];
  stats: {
    questions: number;
    eligibleAnswers: number;
    aliases: number;
    sourcedAnswers: number;
    collisions: number;
    tierCounts: Record<string, number>;
    pointsRange: [number, number] | null;
  };
};

export const MIN_ANSWERS_PER_QUESTION = 3;

export async function lintOperation(db: Executor, operationId: string, opts: { assetRegister?: unknown } = {}): Promise<ReadinessReport> {
  const [op] = await db.select().from(dailyOperations).where(eq(dailyOperations.id, operationId));
  if (!op) throw new Error(`Operation ${operationId} not found`);
  const issues: Issue[] = [];

  const [scoring] = await db.select().from(scoringVersions).where(eq(scoringVersions.id, op.scoreVersionId));
  if (!scoring?.frozenAt) issues.push({ severity: "error", code: "SCORING_NOT_FROZEN", message: "Scoring version is not frozen" });

  const rounds = await db
    .select({ roundIndex: operationQuestions.roundIndex, q: questionVersions })
    .from(operationQuestions)
    .innerJoin(questionVersions, eq(questionVersions.id, operationQuestions.questionVersionId))
    .where(eq(operationQuestions.operationId, operationId))
    .orderBy(asc(operationQuestions.roundIndex));

  if (rounds.length !== ROUNDS_PER_OPERATION) {
    issues.push({
      severity: "error",
      code: "OP_ROUND_COUNT",
      message: `Operation has ${rounds.length} questions; exactly ${ROUNDS_PER_OPERATION} are required`,
    });
  }
  const indices = rounds.map((r) => r.roundIndex);
  for (let i = 1; i <= ROUNDS_PER_OPERATION; i++) {
    if (rounds.length === ROUNDS_PER_OPERATION && !indices.includes(i)) {
      issues.push({ severity: "error", code: "OP_ROUND_GAP", message: `Round ${i} missing` });
    }
  }
  const families = new Set(rounds.map((r) => r.q.questionFamilyKey));
  if (families.size !== rounds.length) {
    issues.push({ severity: "error", code: "OP_DUPLICATE_QUESTION", message: "Two rounds share a question family" });
  }

  const [conflict] = await db
    .select({ id: dailyOperations.id })
    .from(dailyOperations)
    .where(and(eq(dailyOperations.dateKey, op.dateKey), eq(dailyOperations.status, "published"), ne(dailyOperations.id, op.id)));
  if (conflict && op.status !== "published") {
    issues.push({
      severity: "warning",
      code: "OP_DATE_OCCUPIED",
      message: `Another operation is published for ${op.dateKey}; publishing requires the rollback/replace flow`,
    });
  }

  const stats: ReadinessReport["stats"] = {
    questions: rounds.length,
    eligibleAnswers: 0,
    aliases: 0,
    sourcedAnswers: 0,
    collisions: 0,
    tierCounts: { Common: 0, Curious: 0, Uncommon: 0, Obscure: 0 },
    pointsRange: null,
  };

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
  const entityIds = [...new Set(eligible.map((e) => e.e.entityId))];
  const evidence = entityIds.length
    ? await db
        .select({ link: entityEvidence, src: evidenceSources })
        .from(entityEvidence)
        .innerJoin(evidenceSources, eq(evidenceSources.id, entityEvidence.evidenceId))
        .where(inArray(entityEvidence.entityId, entityIds))
    : [];

  let minPts = Infinity;
  let maxPts = -Infinity;

  for (const { roundIndex, q } of rounds) {
    if (q.isDemo) {
      issues.push({ severity: "error", code: "Q_DEMO_CONTENT", message: `Round ${roundIndex} uses demo/unverified content`, roundIndex, demoWaivable: true });
    }
    if (!["approved", "published"].includes(q.editorialStatus)) {
      issues.push({ severity: "error", code: "Q_NOT_APPROVED", message: `Round ${roundIndex} question status is '${q.editorialStatus}'`, roundIndex, demoWaivable: true });
    }
    if (q.coverageClass === "experimental_not_publishable") {
      issues.push({ severity: "error", code: "Q_COVERAGE_EXPERIMENTAL", message: `Round ${roundIndex} coverage is experimental_not_publishable`, roundIndex, demoWaivable: true });
    }
    if (!q.reviewedBy || q.reviewedBy === q.createdBy) {
      issues.push({ severity: "error", code: "Q_NO_INDEPENDENT_REVIEW", message: `Round ${roundIndex} lacks an independent reviewer`, roundIndex, demoWaivable: true });
    }
    if (!q.internalEligibilityRules.trim()) {
      issues.push({ severity: "error", code: "Q_NO_ELIGIBILITY_RULES", message: `Round ${roundIndex} has no eligibility rules`, roundIndex });
    }

    const qEligible = eligible.filter((e) => e.e.questionVersionId === q.id && e.e.evidenceStatus !== "retracted");
    const qAliases = aliases.filter((a) => a.questionVersionId === q.id);
    stats.eligibleAnswers += qEligible.length;
    stats.aliases += qAliases.length;
    if (qEligible.length < MIN_ANSWERS_PER_QUESTION) {
      issues.push({
        severity: "error",
        code: "Q_TOO_FEW_ANSWERS",
        message: `Round ${roundIndex} has ${qEligible.length} eligible answers (min ${MIN_ANSWERS_PER_QUESTION})`,
        roundIndex,
        demoWaivable: true,
      });
    }
    if (!qEligible.some((e) => e.e.rarityScore < 0.25)) {
      issues.push({ severity: "warning", code: "Q_NO_COMMON_ANSWER", message: `Round ${roundIndex} has no Common-tier answer for casual players`, roundIndex });
    }

    const canonicalSeen = new Map<string, string>();
    for (const { e, entity } of qEligible) {
      const award = awardForRarity(e.rarityScore);
      stats.tierCounts[award.tier] = (stats.tierCounts[award.tier] ?? 0) + 1;
      minPts = Math.min(minPts, award.points);
      maxPts = Math.max(maxPts, award.points);

      const canon = normalizeAnswer(entity.canonicalName);
      if (canonicalSeen.has(canon) && canonicalSeen.get(canon) !== entity.id) {
        stats.collisions++;
        issues.push({ severity: "error", code: "ALIAS_COLLISION", message: `Round ${roundIndex}: two entities named '${entity.canonicalName}'`, roundIndex });
      }
      canonicalSeen.set(canon, entity.id);

      if (!qAliases.some((a) => a.entityId === e.entityId)) {
        issues.push({ severity: "error", code: "A_NO_ALIASES", message: `Round ${roundIndex}: '${entity.canonicalName}' has no approved alias`, roundIndex });
      }
      if (e.evidenceStatus === "disputed") {
        issues.push({ severity: "error", code: "A_DISPUTED", message: `Round ${roundIndex}: '${entity.canonicalName}' is disputed`, roundIndex });
      } else if (e.evidenceStatus !== "reviewed") {
        issues.push({ severity: "error", code: "A_EVIDENCE_UNREVIEWED", message: `Round ${roundIndex}: '${entity.canonicalName}' eligibility not reviewed`, roundIndex, demoWaivable: true });
      }
      const ev = evidence.filter((x) => x.link.entityId === e.entityId && x.link.claimStatus !== "retracted" && x.src.reviewStatus !== "rejected");
      const strong = ev.filter((x) => ["A", "B"].includes(x.src.sourceTier) && x.src.reviewStatus === "reviewed" && x.link.claimStatus === "reviewed");
      if (strong.length > 0) stats.sourcedAnswers++;
      if (ev.length === 0) {
        issues.push({ severity: "error", code: "A_NO_SOURCE", message: `Round ${roundIndex}: '${entity.canonicalName}' has no source`, roundIndex, demoWaivable: true });
      } else if (strong.length === 0) {
        issues.push({ severity: "error", code: "A_NO_REVIEWED_AB_SOURCE", message: `Round ${roundIndex}: '${entity.canonicalName}' lacks a reviewed tier A/B source`, roundIndex, demoWaivable: true });
      }
    }

    for (const a of qAliases) {
      if (normalizeAnswer(a.displayAlias) !== a.normalizedAlias) {
        issues.push({ severity: "error", code: "ALIAS_NOT_NORMALIZED", message: `Round ${roundIndex}: alias '${a.displayAlias}' stored with wrong normalization`, roundIndex });
      }
    }
  }
  stats.pointsRange = Number.isFinite(minPts) ? [minPts, maxPts] : null;

  const register = assetRegisterSchema.safeParse(opts.assetRegister ?? assetRegisterJson);
  if (!register.success) {
    issues.push({ severity: "error", code: "ASSET_REGISTER_INVALID", message: "assets/asset-register.json failed validation" });
  } else {
    const sceneAssets = register.data.assets.filter((a) => a.scene_keys.includes(op.sceneKey));
    if (sceneAssets.length === 0) {
      issues.push({ severity: "error", code: "ASSET_SCENE_UNREGISTERED", message: `Scene '${op.sceneKey}' has no registered assets` });
    }
    for (const a of unapprovedSceneAssets(register.data, op.sceneKey)) {
      issues.push({
        severity: "error",
        code: "ASSET_RIGHTS_UNAPPROVED",
        message: `Scene asset ${a.asset_id} is '${a.rights_status}', not rights-approved for release`,
        demoWaivable: true,
      });
    }
  }

  const blocking = issues.filter((i) => i.severity === "error" && !i.demoWaivable);
  const waivable = issues.filter((i) => i.severity === "error" && i.demoWaivable);
  return { operationId, dateKey: op.dateKey, title: op.title, status: op.status, issues, blocking, waivable, stats };
}
