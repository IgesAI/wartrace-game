import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import type { DB, Executor, Tx } from "@/modules/db/client";
import { dailyOperations, gameRuns, operationSnapshots, publicResults, runRounds } from "@/modules/db/schema";
import { dateKeyFor } from "@/modules/domain/dates";
import { AppError } from "@/modules/domain/errors";
import { matchAnswer, resolveChoice, type MatchResult } from "@/modules/domain/matcher";
import { isAnswerWithinLimit, normalizeAnswer } from "@/modules/domain/normalize";
import { ROUNDS_PER_OPERATION } from "@/modules/domain/scoring";
import type { OperationSnapshot, SnapshotAnswer, SnapshotQuestion } from "@/modules/domain/snapshot";

export type GameConfig = { now: Date; roundSeconds: number; demoAllowed: boolean; timeZone?: string };

export type SourceCard = { title: string; publisher: string | null; url: string; sourceTier: string; reviewStatus: string };

export type RoundView = {
  roundIndex: number;
  status: "unopened" | "open" | "locked";
  runRoundId?: string;
  prompt?: string;
  topic?: string;
  deadlineAt?: string;
  openedAt?: string;
  outcome?: "valid" | "invalid" | "timed_out";
  points?: number;
  distanceM?: number;
  tier?: string | null;
  canonicalName?: string | null;
  entityId?: string | null;
  submittedText?: string | null;
  sourceCards?: SourceCard[];
  evidenceStatus?: string | null;
};

export type RunView = {
  runId: string;
  state: "created" | "active" | "completed" | "invalidated";
  currentRound: number;
  score: number;
  distanceM: number;
  roundSeconds: number;
  serverNow: string;
  shareToken: string | null;
  operation: { id: string; dateKey: string; title: string; blurb: string; sceneKey: string; contentClass: "verified" | "demo" };
  rounds: RoundView[];
};

export type SubmitResponse =
  | { kind: "locked"; round: RoundView; run: RunView; replayed: boolean }
  | { kind: "clarify"; reason: "ambiguous"; options: { entityId: string; label: string }[]; deadlineAt: string }
  | { kind: "clarify"; reason: "suggestion"; suggestion: string; deadlineAt: string };

const snapshotCache = new Map<string, OperationSnapshot>();

export async function loadSnapshot(db: Executor, operationId: string): Promise<OperationSnapshot> {
  const hit = snapshotCache.get(operationId);
  if (hit) return hit;
  const [row] = await db.select().from(operationSnapshots).where(eq(operationSnapshots.operationId, operationId));
  if (!row) throw new AppError("CONFLICT", 409, "Operation has no frozen snapshot");
  const snap = row.snapshot as OperationSnapshot;
  snapshotCache.set(operationId, snap);
  return snap;
}

function questionFor(snap: OperationSnapshot, roundIndex: number): SnapshotQuestion {
  const q = snap.questions.find((x) => x.roundIndex === roundIndex);
  if (!q) throw new AppError("CONFLICT", 409, `Snapshot has no round ${roundIndex}`);
  return q;
}

/** Today's published operation by America/New_York calendar date. Demo content is refused where not allowed. */
export async function getDailyOperation(db: Executor, cfg: Pick<GameConfig, "now" | "demoAllowed" | "timeZone">) {
  const dateKey = dateKeyFor(cfg.now, cfg.timeZone);
  const [op] = await db
    .select()
    .from(dailyOperations)
    .where(and(eq(dailyOperations.dateKey, dateKey), eq(dailyOperations.status, "published")));
  if (!op || !op.contentChecksum) return { dateKey, operation: null };
  if (op.contentClass === "demo" && !cfg.demoAllowed) return { dateKey, operation: null };
  return { dateKey, operation: op };
}

export function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashInput(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

function sourceCardsFor(answer: SnapshotAnswer | undefined): SourceCard[] {
  return (answer?.evidence ?? []).map((e) => ({
    title: e.title,
    publisher: e.publisher,
    url: e.url,
    sourceTier: e.sourceTier,
    reviewStatus: e.reviewStatus,
  }));
}

async function buildRunView(db: Executor, runId: string, cfg: GameConfig): Promise<RunView> {
  const [run] = await db.select().from(gameRuns).where(eq(gameRuns.id, runId));
  if (!run) throw new AppError("NOT_FOUND", 404, "Run not found");
  const [op] = await db.select().from(dailyOperations).where(eq(dailyOperations.id, run.operationId));
  const snap = await loadSnapshot(db, run.operationId);
  const rounds = await db.select().from(runRounds).where(eq(runRounds.runId, runId)).orderBy(asc(runRounds.roundIndex));
  const [pub] = await db.select().from(publicResults).where(eq(publicResults.runId, runId));
  const views: RoundView[] = [];
  for (let i = 1; i <= ROUNDS_PER_OPERATION; i++) {
    const r = rounds.find((x) => x.roundIndex === i);
    if (!r) {
      views.push({ roundIndex: i, status: "unopened" });
      continue;
    }
    const q = questionFor(snap, i);
    const base: RoundView = {
      roundIndex: i,
      status: r.lockedAt ? "locked" : "open",
      runRoundId: r.id,
      prompt: q.prompt,
      topic: q.topic,
      openedAt: r.openedAt.toISOString(),
      deadlineAt: r.deadlineAt.toISOString(),
    };
    if (r.lockedAt) {
      const answer = r.chosenEntityId ? q.answers.find((a) => a.entityId === r.chosenEntityId) : undefined;
      Object.assign(base, {
        outcome: r.outcome!,
        points: r.points ?? 0,
        distanceM: r.distanceM ?? 0,
        tier: r.rarityTier,
        canonicalName: answer?.canonicalName ?? null,
        entityId: answer?.entityId ?? null,
        submittedText: r.submittedText,
        sourceCards: sourceCardsFor(answer),
        evidenceStatus: answer?.evidenceStatus ?? null,
      });
    }
    views.push(base);
  }
  return {
    runId: run.id,
    state: run.state as RunView["state"],
    currentRound: run.currentRound,
    score: run.totalScore,
    distanceM: run.totalDistanceM,
    roundSeconds: cfg.roundSeconds,
    serverNow: cfg.now.toISOString(),
    shareToken: pub?.shareToken ?? null,
    operation: {
      id: op!.id,
      dateKey: op!.dateKey,
      title: op!.title,
      blurb: op!.blurb,
      sceneKey: op!.sceneKey,
      contentClass: (op!.contentClass ?? "demo") as "verified" | "demo",
    },
    rounds: views,
  };
}

type RunRow = typeof gameRuns.$inferSelect;
type RoundRow = typeof runRounds.$inferSelect;

async function lockRunForGuest(tx: Tx, runId: string, guestId: string): Promise<RunRow> {
  const [run] = await tx.select().from(gameRuns).where(eq(gameRuns.id, runId)).for("update");
  if (!run || run.guestSessionId !== guestId) throw new AppError("FORBIDDEN", 403, "This run belongs to another session");
  if (run.state === "invalidated") throw new AppError("FORBIDDEN", 403, "This run was invalidated");
  return run;
}

/** Locks a round exactly once and recomputes run totals from locked rounds (never from client input). */
async function lockRound(
  tx: Tx,
  run: RunRow,
  round: RoundRow,
  outcome: { outcome: "valid" | "invalid" | "timed_out"; answer?: SnapshotAnswer; text: string | null; idempotencyKey: string | null },
  now: Date,
) {
  const normalized = outcome.text ? normalizeAnswer(outcome.text) : "";
  const updated = await tx
    .update(runRounds)
    .set({
      lockedAt: now,
      outcome: outcome.outcome,
      chosenEntityId: outcome.answer?.entityId ?? null,
      submittedText: outcome.text,
      normalizedInputHash: normalized ? hashInput(normalized) : null,
      points: outcome.answer?.points ?? 0,
      distanceM: outcome.answer?.distanceM ?? 0,
      rarityTier: outcome.answer?.tier ?? null,
      idempotencyKey: outcome.idempotencyKey,
    })
    .where(and(eq(runRounds.id, round.id), isNull(runRounds.lockedAt)))
    .returning({ id: runRounds.id });
  if (updated.length !== 1) throw new AppError("ROUND_LOCKED", 409, "Round already locked");

  const [totals] = await tx
    .select({
      score: sql<number>`coalesce(sum(${runRounds.points}), 0)::int`,
      distance: sql<number>`coalesce(sum(${runRounds.distanceM}), 0)::int`,
    })
    .from(runRounds)
    .where(eq(runRounds.runId, run.id));
  const completed = round.roundIndex === ROUNDS_PER_OPERATION;
  await tx
    .update(gameRuns)
    .set({
      totalScore: totals!.score,
      totalDistanceM: totals!.distance,
      currentRound: round.roundIndex + 1,
      state: completed ? "completed" : "active",
      completedAt: completed ? now : null,
    })
    .where(eq(gameRuns.id, run.id));
  if (completed) {
    await tx.insert(publicResults).values({ runId: run.id, shareToken: newShareToken() }).onConflictDoNothing();
  }
  run.currentRound = round.roundIndex + 1;
  run.state = completed ? "completed" : "active";
}

/** Server-side timeout enforcement for rounds the client never submitted (tab closed, offline). */
async function expireOverdue(tx: Tx, run: RunRow, now: Date) {
  if (run.state === "completed") return;
  const [open] = await tx
    .select()
    .from(runRounds)
    .where(and(eq(runRounds.runId, run.id), eq(runRounds.roundIndex, run.currentRound), isNull(runRounds.lockedAt)))
    .for("update");
  if (open && now.getTime() > open.deadlineAt.getTime()) {
    await lockRound(tx, run, open, { outcome: "timed_out", text: null, idempotencyKey: null }, now);
  }
}

export async function startOrResumeRun(db: DB, guestId: string, cfg: GameConfig, opts: { referred?: boolean } = {}): Promise<RunView> {
  const { operation } = await getDailyOperation(db, cfg);
  if (!operation) throw new AppError("NO_DAILY", 503, "No reviewed daily operation is available right now");
  await db
    .insert(gameRuns)
    .values({ operationId: operation.id, guestSessionId: guestId, operationVersion: operation.version, referred: !!opts.referred })
    .onConflictDoNothing({ target: [gameRuns.operationId, gameRuns.guestSessionId] });
  const [run] = await db
    .select()
    .from(gameRuns)
    .where(and(eq(gameRuns.operationId, operation.id), eq(gameRuns.guestSessionId, guestId)));
  return getRunState(db, run!.id, guestId, cfg);
}

export async function getRunState(db: DB, runId: string, guestId: string, cfg: GameConfig): Promise<RunView> {
  await db.transaction(async (tx) => {
    const run = await lockRunForGuest(tx, runId, guestId);
    await expireOverdue(tx, run, cfg.now);
  });
  return buildRunView(db, runId, cfg);
}

export async function findGuestRunForToday(db: DB, guestId: string, cfg: GameConfig) {
  const { operation } = await getDailyOperation(db, cfg);
  if (!operation) return null;
  const [run] = await db
    .select()
    .from(gameRuns)
    .where(and(eq(gameRuns.operationId, operation.id), eq(gameRuns.guestSessionId, guestId)));
  if (!run) return null;
  const [pub] = await db.select().from(publicResults).where(eq(publicResults.runId, run.id));
  return { runId: run.id, state: run.state, score: run.totalScore, distanceM: run.totalDistanceM, shareToken: pub?.shareToken ?? null };
}

/** Opens a round and persists its deadline exactly once. Re-opening returns the original deadline. */
export async function openRound(db: DB, runId: string, guestId: string, roundIndex: number, cfg: GameConfig): Promise<RunView> {
  await db.transaction(async (tx) => {
    const run = await lockRunForGuest(tx, runId, guestId);
    await expireOverdue(tx, run, cfg.now);
    if (run.state === "completed") throw new AppError("RUN_COMPLETE", 409, "This expedition is complete");
    const [existing] = await tx
      .select()
      .from(runRounds)
      .where(and(eq(runRounds.runId, runId), eq(runRounds.roundIndex, roundIndex)));
    if (existing) {
      if (existing.lockedAt) throw new AppError("ROUND_LOCKED", 409, "Round already locked");
      return;
    }
    if (roundIndex !== run.currentRound) {
      throw new AppError("OUT_OF_SEQUENCE", 409, `Round ${run.currentRound} is next`);
    }
    const snap = await loadSnapshot(tx, run.operationId);
    const q = questionFor(snap, roundIndex);
    await tx.insert(runRounds).values({
      runId,
      roundIndex,
      questionVersionId: q.questionVersionId,
      openedAt: cfg.now,
      deadlineAt: new Date(cfg.now.getTime() + cfg.roundSeconds * 1000),
    });
    if (run.state === "created") await tx.update(gameRuns).set({ state: "active" }).where(eq(gameRuns.id, runId));
  });
  return buildRunView(db, runId, cfg);
}

export type SubmitInput = {
  runId: string;
  guestId: string;
  roundIndex: number;
  answer: string;
  idempotencyKey: string;
  entityChoice?: string | null;
};

/**
 * Atomically locks one answer for a round (docs/02_GAME_RULES.md):
 * same idempotency key -> identical stored result; different key on a locked round -> 409.
 * At most one non-locking clarification (ambiguous alias / spelling suggestion) per round.
 */
export async function submitRound(db: DB, input: SubmitInput, cfg: GameConfig): Promise<SubmitResponse> {
  if (!isAnswerWithinLimit(input.answer)) throw new AppError("BAD_REQUEST", 400, "Answer exceeds 120 characters");
  type Inner = { kind: "locked"; replayed: boolean } | Extract<SubmitResponse, { kind: "clarify" }>;
  const result: Inner = await db.transaction(async (tx): Promise<Inner> => {
    const run = await lockRunForGuest(tx, input.runId, input.guestId);
    const [round] = await tx
      .select()
      .from(runRounds)
      .where(and(eq(runRounds.runId, input.runId), eq(runRounds.roundIndex, input.roundIndex)))
      .for("update");
    if (!round) throw new AppError("ROUND_NOT_OPEN", 409, "Round has not been opened");
    if (round.lockedAt) {
      if (round.idempotencyKey === input.idempotencyKey) return { kind: "locked", replayed: true };
      throw new AppError("ROUND_LOCKED", 409, "Round already locked", { roundIndex: round.roundIndex });
    }
    const text = input.answer;
    if (cfg.now.getTime() > round.deadlineAt.getTime()) {
      await lockRound(tx, run, round, { outcome: "timed_out", text: text.trim() ? text : null, idempotencyKey: input.idempotencyKey }, cfg.now);
      return { kind: "locked", replayed: false };
    }
    const snap = await loadSnapshot(tx, run.operationId);
    const q = questionFor(snap, input.roundIndex);
    let match: MatchResult = matchAnswer(q, text);
    if (match.kind === "ambiguous" && input.entityChoice) {
      const chosen = resolveChoice(q, text, input.entityChoice);
      if (chosen) match = { kind: "match", answer: chosen };
    }
    const canClarify = round.clarifications === 0 || round.clarificationKey === input.idempotencyKey;
    if ((match.kind === "ambiguous" || match.kind === "suggest") && canClarify) {
      if (round.clarifications === 0) {
        await tx
          .update(runRounds)
          .set({ clarifications: 1, clarificationKey: input.idempotencyKey })
          .where(eq(runRounds.id, round.id));
      }
      const deadlineAt = round.deadlineAt.toISOString();
      return match.kind === "ambiguous"
        ? {
            kind: "clarify",
            reason: "ambiguous",
            deadlineAt,
            options: match.options.map((o) => ({ entityId: o.entityId, label: o.disambiguation ? `${o.canonicalName} (${o.disambiguation})` : o.canonicalName })),
          }
        : { kind: "clarify", reason: "suggestion", suggestion: match.suggestion.display, deadlineAt };
    }
    const lockText = text.trim() ? [...text].slice(0, 120).join("") : null;
    if (match.kind === "match") {
      await lockRound(tx, run, round, { outcome: "valid", answer: match.answer, text: lockText, idempotencyKey: input.idempotencyKey }, cfg.now);
    } else {
      await lockRound(tx, run, round, { outcome: "invalid", text: lockText, idempotencyKey: input.idempotencyKey }, cfg.now);
    }
    return { kind: "locked", replayed: false };
  });
  if (result.kind === "clarify") return result;
  const run = await buildRunView(db, input.runId, cfg);
  return { kind: "locked", replayed: result.replayed, run, round: run.rounds[input.roundIndex - 1]! };
}

export type PublicResultView = {
  dateKey: string;
  title: string;
  score: number;
  distanceM: number;
  roundsCorrect: number;
  displayName: string | null;
  contentClass: "verified" | "demo";
  completedAt: string | null;
  rounds: { roundIndex: number; outcome: string; tier: string | null; distanceM: number; points: number }[];
};

/** Spoiler-safe public result: no answers, prompts, guest IDs or run IDs. */
export async function getPublicResult(db: Executor, shareToken: string): Promise<{ view: PublicResultView; guestSessionId: string; runId: string } | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(shareToken)) return null;
  const [row] = await db
    .select({ pub: publicResults, run: gameRuns, op: dailyOperations })
    .from(publicResults)
    .innerJoin(gameRuns, eq(gameRuns.id, publicResults.runId))
    .innerJoin(dailyOperations, eq(dailyOperations.id, gameRuns.operationId))
    .where(eq(publicResults.shareToken, shareToken));
  if (!row || !row.pub.visible || row.run.state !== "completed") return null;
  const rounds = await db.select().from(runRounds).where(eq(runRounds.runId, row.run.id)).orderBy(asc(runRounds.roundIndex));
  return {
    runId: row.run.id,
    guestSessionId: row.run.guestSessionId,
    view: {
      dateKey: row.op.dateKey,
      title: row.op.title,
      score: row.run.totalScore,
      distanceM: row.run.totalDistanceM,
      roundsCorrect: rounds.filter((r) => r.outcome === "valid").length,
      displayName: row.pub.shareConsent ? row.pub.displayName : null,
      contentClass: (row.op.contentClass ?? "demo") as "verified" | "demo",
      completedAt: row.run.completedAt?.toISOString() ?? null,
      rounds: rounds.map((r) => ({ roundIndex: r.roundIndex, outcome: r.outcome ?? "timed_out", tier: r.rarityTier, distanceM: r.distanceM ?? 0, points: r.points ?? 0 })),
    },
  };
}

/**
 * Evidence page for an entity. Gated to entities this guest has already locked, so the
 * explorer can never be used to enumerate a live answer bank.
 */
export async function getEntityEvidenceForGuest(db: DB, guestId: string, entityId: string) {
  const [row] = await db
    .select({ round: runRounds, run: gameRuns })
    .from(runRounds)
    .innerJoin(gameRuns, eq(gameRuns.id, runRounds.runId))
    .where(and(eq(gameRuns.guestSessionId, guestId), eq(runRounds.chosenEntityId, entityId)))
    .limit(1);
  if (!row) return null;
  const snap = await loadSnapshot(db, row.run.operationId);
  const q = questionFor(snap, row.round.roundIndex);
  const a = q.answers.find((x) => x.entityId === entityId);
  if (!a) return null;
  return {
    canonicalName: a.canonicalName,
    disambiguation: a.disambiguation,
    tier: a.tier,
    inclusionRationale: a.inclusionRationale,
    evidenceStatus: a.evidenceStatus,
    prompt: q.prompt,
    topic: q.topic,
    dateKey: snap.dateKey,
    contentClass: snap.contentClass,
    evidence: sourceCardsFor(a).map((s, i) => ({ ...s, retrievedAt: a.evidence[i]?.retrievedAt ?? null })),
  };
}

export async function getOwnRunView(db: DB, runId: string, cfg: GameConfig) {
  return buildRunView(db, runId, cfg);
}
