import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DB } from "@/modules/db/client";
import {
  dailyOperations,
  editorialAuditLogs,
  entityEvidence,
  evidenceSources,
  historicalEntities,
  operationQuestions,
  operationSnapshots,
  questionAnswerAliases,
  questionEligibleEntities,
  questionVersions,
} from "@/modules/db/schema";
import { AppError } from "@/modules/domain/errors";
import { normalizeAnswer } from "@/modules/domain/normalize";
import type { Actor } from "@/modules/content/audit";
import { buildSnapshot, disableOperation, publishOperation, restoreOperation, snapshotChecksum } from "@/modules/content/publish";
import { lintOperation } from "@/modules/content/readiness";
import { ensureDevAdmins, ensureScoringVersion } from "@/modules/content/seed";
import { getDailyOperation } from "@/modules/game/service";
import realRegister from "../../assets/asset-register.json";
import { cfgAt, freshDb } from "./helpers";

let db: DB;
let close: () => Promise<void>;
let actor: (s: string) => Actor;
let scoringId: string;

/** A test-only register in which the scene's assets are rights-approved. */
const approvedRegister = {
  ...realRegister,
  assets: realRegister.assets.map((a) => ({
    ...a,
    rights_status: "approved",
    approved_for_release: true,
    in_game_ok: true,
    commercial_ok: true,
    reviewed_by: "rights-reviewer",
    reviewed_at: "2026-11-22",
  })),
};

beforeEach(async () => {
  ({ db, close } = await freshDb());
  scoringId = (await ensureScoringVersion(db)).id;
  actor = await ensureDevAdmins(db);
});
afterEach(async () => close());

type QOpts = { sourced?: boolean; tier?: "A" | "B" | "C"; collide?: boolean; answers?: number };

async function verifiedQuestion(n: number, o: QOpts = {}) {
  const editor = actor("dev:editor");
  const reviewer = actor("dev:reviewer");
  const [q] = await db
    .insert(questionVersions)
    .values({
      questionFamilyKey: `test.q${n}.${Math.random()}`,
      version: 1,
      prompt: `Test prompt ${n}`,
      internalEligibilityRules: "Members of the test roster",
      topic: "Test",
      coverageClass: "finite_certified",
      editorialStatus: "approved",
      createdBy: editor.id,
      reviewedBy: reviewer.id,
    })
    .returning();
  const [src] = await db
    .insert(evidenceSources)
    .values({
      provider: "test-archive",
      sourceUrl: `https://archive.example/record/${n}-${Math.random()}`,
      title: `Record ${n}`,
      retrievedAt: new Date(),
      sourceTier: o.tier ?? "A",
      reviewStatus: "reviewed",
    })
    .returning();
  const count = o.answers ?? 3;
  for (let i = 0; i < count; i++) {
    const name = o.collide && i === 1 ? `Entity ${n}-0` : `Entity ${n}-${i}`;
    const [e] = await db.insert(historicalEntities).values({ canonicalName: name, entityType: "test", editorialStatus: "reviewed" }).returning();
    await db.insert(questionEligibleEntities).values({
      questionVersionId: q!.id,
      entityId: e!.id,
      rarityScore: [0.1, 0.5, 0.9][i % 3]!,
      inclusionRationale: "In roster",
      evidenceStatus: "reviewed",
    });
    const display = o.collide && i === 1 ? `${name} (b)` : name;
    await db.insert(questionAnswerAliases).values({ questionVersionId: q!.id, entityId: e!.id, normalizedAlias: normalizeAnswer(display), displayAlias: display });
    if (o.sourced !== false) {
      await db.insert(entityEvidence).values({ entityId: e!.id, evidenceId: src!.id, claimSummary: "Listed", claimStatus: "reviewed" });
    }
  }
  return q!.id;
}

async function operation(dateKey: string, questionIds: string[]) {
  const [op] = await db
    .insert(dailyOperations)
    .values({ dateKey, title: `Op ${dateKey}`, blurb: "b", sceneKey: "western-front", scoreVersionId: scoringId, createdBy: actor("dev:editor").id })
    .returning();
  for (const [i, id] of questionIds.entries()) await db.insert(operationQuestions).values({ operationId: op!.id, roundIndex: i + 1, questionVersionId: id });
  return op!.id;
}

async function sevenVerified(o: QOpts = {}, overrides: Record<number, QOpts> = {}) {
  const ids: string[] = [];
  for (let i = 1; i <= 7; i++) ids.push(await verifiedQuestion(i, { ...o, ...overrides[i] }));
  return ids;
}

const opts = { demoAllowedByEnvironment: false, assetRegister: approvedRegister };
const codes = async (p: Promise<unknown>) => {
  try {
    await p;
    return [];
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
    return [e.code, ...((e.details as { code: string }[] | undefined) ?? []).map((d) => d.code)];
  }
};

describe("publication readiness gate", () => {
  it("T-054: publishes reviewed, sourced content as verified with a reproducible checksum and audit entry", async () => {
    const opId = await operation("2027-01-05", await sevenVerified());
    const res = await publishOperation(db, opId, actor("dev:publisher"), opts);
    expect(res.contentClass).toBe("verified");
    const [snap] = await db.select().from(operationSnapshots).where(eq(operationSnapshots.operationId, opId));
    expect(snap!.checksum).toBe(res.checksum);
    expect(snapshotChecksum(await buildSnapshot(db, opId, "verified"))).toBe(res.checksum);
    const audit = await db.select().from(editorialAuditLogs).where(eq(editorialAuditLogs.subjectId, opId));
    expect(audit.map((a) => a.action)).toEqual(["operation.publish"]);
    const daily = await getDailyOperation(db, cfgAt(new Date("2027-01-05T17:00:00Z"), { demoAllowed: false }));
    expect(daily.operation?.id).toBe(opId);
  });

  it("T-050: rejects an operation with six questions", async () => {
    const ids = await sevenVerified();
    const opId = await operation("2027-01-06", ids.slice(0, 6));
    expect(await codes(publishOperation(db, opId, actor("dev:publisher"), opts))).toContain("OP_ROUND_COUNT");
  });

  it("T-051: rejects unsourced answers and tier-C-only sources", async () => {
    const op1 = await operation("2027-01-07", await sevenVerified({}, { 3: { sourced: false } }));
    expect(await codes(publishOperation(db, op1, actor("dev:publisher"), opts))).toContain("A_NO_SOURCE");
    const op2 = await operation("2027-01-08", await sevenVerified({}, { 2: { tier: "C" } }));
    expect(await codes(publishOperation(db, op2, actor("dev:publisher"), opts))).toContain("A_NO_REVIEWED_AB_SOURCE");
  });

  it("T-052: rejects two entities sharing a canonical name within a question", async () => {
    const opId = await operation("2027-01-09", await sevenVerified({}, { 5: { collide: true } }));
    const report = await lintOperation(db, opId, { assetRegister: approvedRegister });
    expect(report.blocking.map((i) => i.code)).toContain("ALIAS_COLLISION");
    expect(await codes(publishOperation(db, opId, actor("dev:publisher"), opts))).toContain("PUBLISH_BLOCKED");
  });

  it("T-053: editors and reviewers cannot publish", async () => {
    const opId = await operation("2027-01-10", await sevenVerified());
    expect(await codes(publishOperation(db, opId, actor("dev:editor"), opts))).toEqual(["FORBIDDEN"]);
    expect(await codes(publishOperation(db, opId, actor("dev:reviewer"), opts))).toEqual(["FORBIDDEN"]);
  });

  it("addendum gate: blocks verified publication when scene assets are not rights-approved", async () => {
    const opId = await operation("2027-01-11", await sevenVerified());
    expect(await codes(publishOperation(db, opId, actor("dev:publisher"), { demoAllowedByEnvironment: false }))).toContain(
      "ASSET_RIGHTS_UNAPPROVED",
    );
  });

  it("demo content can only publish when explicitly requested AND allowed by environment", async () => {
    const ids = await sevenVerified({}, { 1: { answers: 2 } });
    const opId = await operation("2027-01-12", ids);
    expect(await codes(publishOperation(db, opId, actor("dev:publisher"), { ...opts, allowDemoContent: true }))).toContain("Q_TOO_FEW_ANSWERS");
    const res = await publishOperation(db, opId, actor("dev:publisher"), { ...opts, allowDemoContent: true, demoAllowedByEnvironment: true });
    expect(res.contentClass).toBe("demo");
    expect((await getDailyOperation(db, cfgAt(new Date("2027-01-12T17:00:00Z"), { demoAllowed: false }))).operation).toBeNull();
  });

  it("T-006: published snapshot, operation content and question membership are immutable", async () => {
    const opId = await operation("2027-01-13", await sevenVerified());
    await publishOperation(db, opId, actor("dev:publisher"), opts);
    const isImmutable = (e: Error & { cause?: Error }) => /IMMUTABLE/.test(`${e.message} ${e.cause?.message ?? ""}`);
    await expect(db.update(operationSnapshots).set({ checksum: "x" }).where(eq(operationSnapshots.operationId, opId))).rejects.toSatisfy(isImmutable);
    await expect(db.update(dailyOperations).set({ title: "Changed" }).where(eq(dailyOperations.id, opId))).rejects.toSatisfy(isImmutable);
    await expect(db.update(dailyOperations).set({ dateKey: "2027-02-01" }).where(eq(dailyOperations.id, opId))).rejects.toSatisfy(isImmutable);
    await expect(db.delete(operationQuestions).where(eq(operationQuestions.operationId, opId))).rejects.toSatisfy(isImmutable);
    await expect(db.update(questionEligibleEntities).set({ rarityScore: 1 })).rejects.toSatisfy(isImmutable);
    await expect(db.update(editorialAuditLogs).set({ reason: "rewrite" })).rejects.toSatisfy(isImmutable);
    expect(await codes(publishOperation(db, opId, actor("dev:publisher"), opts))).toEqual(["CONFLICT"]);
  });

  it("T-055: rollback restores a prior signed version and is audit logged; disable takes the day offline", async () => {
    const date = "2027-01-14";
    const v1 = await operation(date, await sevenVerified());
    await publishOperation(db, v1, actor("dev:publisher"), opts);
    const [v2] = await db
      .insert(dailyOperations)
      .values({ dateKey: date, version: 2, title: "Op v2", blurb: "b", sceneKey: "western-front", scoreVersionId: scoringId })
      .returning();
    const ids = await sevenVerified();
    for (const [i, id] of ids.entries()) await db.insert(operationQuestions).values({ operationId: v2!.id, roundIndex: i + 1, questionVersionId: id });
    expect(await codes(publishOperation(db, v2!.id, actor("dev:publisher"), opts))).toEqual(["CONFLICT"]);

    await disableOperation(db, v1, actor("dev:publisher"), "Incident: wrong answer accepted");
    await publishOperation(db, v2!.id, actor("dev:publisher"), opts);
    const live = await getDailyOperation(db, cfgAt(new Date(`${date}T17:00:00Z`), { demoAllowed: false }));
    expect(live.operation?.id).toBe(v2!.id);

    expect(await codes(restoreOperation(db, v1, actor("dev:editor"), "nope nope"))).toEqual(["FORBIDDEN"]);
    const r = await restoreOperation(db, v1, actor("dev:publisher"), "Roll back to v1 after review");
    expect(r.retiredOperationId).toBe(v2!.id);
    const after = await getDailyOperation(db, cfgAt(new Date(`${date}T17:00:00Z`), { demoAllowed: false }));
    expect(after.operation?.id).toBe(v1);
    const actions = (await db.select().from(editorialAuditLogs)).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["operation.publish", "operation.disable", "operation.restore"]));
  });
});
