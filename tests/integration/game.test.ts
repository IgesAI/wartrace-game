import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DB } from "@/modules/db/client";
import { dailyOperations, questionEligibleEntities, runRounds } from "@/modules/db/schema";
import { awardForRarity } from "@/modules/domain/scoring";
import { AppError } from "@/modules/domain/errors";
import {
  getDailyOperation,
  getPublicResult,
  getRunState,
  openRound,
  startOrResumeRun,
  submitRound,
} from "@/modules/game/service";
import { DEMO_ANSWERS, T0, cfgAt, guest, key, plus, seededDb } from "./helpers";

let db: DB;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await seededDb());
});
afterAll(async () => close());

const expectCode = async (p: Promise<unknown>, code: string) => {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
};

async function playRound(runId: string, g: string, i: number, answer: string, at: Date) {
  await openRound(db, runId, g, i, cfgAt(at));
  const res = await submitRound(db, { runId, guestId: g, roundIndex: i, answer, idempotencyKey: key() }, cfgAt(plus(at, 3000)));
  if (res.kind !== "locked") throw new Error(`unexpected ${res.kind}`);
  return res;
}

describe("daily selection", () => {
  it("selects today's published operation by America/New_York date", async () => {
    const { dateKey, operation } = await getDailyOperation(db, cfgAt(T0));
    expect(dateKey).toBe("2026-11-22");
    expect(operation?.contentClass).toBe("demo");
    // 23:30 EST on the 22nd is 04:30Z on the 23rd: still the 22nd's operation.
    expect((await getDailyOperation(db, cfgAt(new Date("2026-11-23T04:30:00Z")))).dateKey).toBe("2026-11-22");
  });

  it("T-056/T-005: a day without a published operation fails gracefully", async () => {
    const r = await getDailyOperation(db, cfgAt(new Date("2030-06-01T12:00:00Z")));
    expect(r.operation).toBeNull();
    await expectCode(startOrResumeRun(db, await guest(db), cfgAt(new Date("2030-06-01T12:00:00Z"))), "NO_DAILY");
  });

  it("demo content is refused when the environment forbids it", async () => {
    expect((await getDailyOperation(db, cfgAt(T0, { demoAllowed: false }))).operation).toBeNull();
  });

  it("the seed leaves an unpublished draft that the gate rejects", async () => {
    const drafts = await db.select().from(dailyOperations).where(eq(dailyOperations.status, "draft"));
    expect(drafts.length).toBeGreaterThan(0);
  });
});

describe("full seven-round expedition", () => {
  it("T-017: plays 7 rounds, totals derived server-side, share token issued, public view is spoiler-safe", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    expect(run.rounds.every((r) => r.status === "unopened" && !r.prompt)).toBe(true);
    let at = T0;
    let expectedScore = 0;
    let expectedDistance = 0;
    for (let i = 1; i <= 7; i++) {
      const a = DEMO_ANSWERS[i - 1]!;
      const res = await playRound(run.runId, g, i, a.alias, at);
      const award = awardForRarity(a.rarity);
      expect(res.round.outcome).toBe("valid");
      expect(res.round.points).toBe(award.points);
      expect(res.round.distanceM).toBe(award.distanceM);
      expect(res.round.sourceCards?.length).toBeGreaterThan(0);
      expectedScore += award.points;
      expectedDistance += award.distanceM;
      at = plus(at, 30_000);
    }
    const final = await getRunState(db, run.runId, g, cfgAt(at));
    expect(final.state).toBe("completed");
    expect(final.score).toBe(expectedScore);
    expect(final.distanceM).toBe(expectedDistance);
    expect(final.shareToken).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const pub = await getPublicResult(db, final.shareToken!);
    expect(pub!.view.score).toBe(expectedScore);
    expect(pub!.view.roundsCorrect).toBe(7);
    const publicJson = JSON.stringify(pub!.view);
    for (const a of DEMO_ANSWERS) expect(publicJson.toLowerCase()).not.toContain(a.alias.toLowerCase());
    expect(publicJson).not.toContain(g);
    expect(publicJson).not.toContain(run.runId);

    await expectCode(openRound(db, run.runId, g, 7, cfgAt(at)), "RUN_COMPLETE");
  });

  it("resumes the same run (one run per guest per operation)", async () => {
    const g = await guest(db);
    const a = await startOrResumeRun(db, g, cfgAt(T0));
    const b = await startOrResumeRun(db, g, cfgAt(plus(T0, 1000)));
    expect(b.runId).toBe(a.runId);
  });

  it("T-004: a run begun before NY midnight completes under its original operation", async () => {
    const lateEvening = new Date("2026-11-23T04:59:00Z"); // 23:59 EST on the 22nd
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(lateEvening));
    expect(run.operation.dateKey).toBe("2026-11-22");
    const afterMidnight = plus(lateEvening, 120_000);
    await openRound(db, run.runId, g, 1, cfgAt(afterMidnight));
    const state = await getRunState(db, run.runId, g, cfgAt(afterMidnight));
    expect(state.operation.dateKey).toBe("2026-11-22");
    const next = await startOrResumeRun(db, g, cfgAt(afterMidnight));
    expect(next.operation.dateKey).toBe("2026-11-23");
    expect(next.runId).not.toBe(run.runId);
  });
});

describe("round state rules", () => {
  it("T-010: a round opens once; re-opening keeps the original deadline", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    const a = await openRound(db, run.runId, g, 1, cfgAt(T0));
    const b = await openRound(db, run.runId, g, 1, cfgAt(plus(T0, 10_000)));
    expect(b.rounds[0]!.deadlineAt).toBe(a.rounds[0]!.deadlineAt);
    expect(new Date(a.rounds[0]!.deadlineAt!).getTime() - T0.getTime()).toBe(25_000);
  });

  it("rejects out-of-sequence rounds and other guests' runs", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await expectCode(openRound(db, run.runId, g, 3, cfgAt(T0)), "OUT_OF_SEQUENCE");
    await expectCode(openRound(db, run.runId, await guest(db), 1, cfgAt(T0)), "FORBIDDEN");
    await expectCode(
      submitRound(db, { runId: run.runId, guestId: g, roundIndex: 1, answer: "x", idempotencyKey: key() }, cfgAt(T0)),
      "ROUND_NOT_OPEN",
    );
  });

  it("T-011: server deadline enforced — late correct answer scores zero", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const late = await submitRound(
      db,
      { runId: run.runId, guestId: g, roundIndex: 1, answer: DEMO_ANSWERS[0]!.alias, idempotencyKey: key() },
      cfgAt(plus(T0, 25_001)),
    );
    expect(late.kind === "locked" && late.round.outcome).toBe("timed_out");
    expect(late.kind === "locked" && late.round.points).toBe(0);
  });

  it("T-012/T-015: an abandoned open round is timed out on the next authoritative read", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const later = await getRunState(db, run.runId, g, cfgAt(plus(T0, 60_000)));
    expect(later.rounds[0]!.outcome).toBe("timed_out");
    expect(later.currentRound).toBe(2);
  });

  it("T-013: same idempotency key replays the identical result; a new key gets 409", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const k = key();
    const input = { runId: run.runId, guestId: g, roundIndex: 1, answer: DEMO_ANSWERS[0]!.alias, idempotencyKey: k };
    const first = await submitRound(db, input, cfgAt(plus(T0, 2000)));
    const again = await submitRound(db, { ...input, answer: "something else" }, cfgAt(plus(T0, 4000)));
    expect(first.kind === "locked" && again.kind === "locked").toBe(true);
    if (first.kind === "locked" && again.kind === "locked") {
      expect(again.replayed).toBe(true);
      expect(again.round).toEqual(first.round);
      expect(again.run.score).toBe(first.run.score);
    }
    await expectCode(submitRound(db, { ...input, idempotencyKey: key() }, cfgAt(plus(T0, 5000))), "ROUND_LOCKED");
  });

  it("T-014: concurrent submissions with different keys lock exactly once", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        submitRound(db, { runId: run.runId, guestId: g, roundIndex: 1, answer: DEMO_ANSWERS[0]!.alias, idempotencyKey: key() }, cfgAt(plus(T0, 1000))),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((a) => a.status === "rejected")).toHaveLength(4);
    const rows = await db.select().from(runRounds).where(eq(runRounds.runId, run.runId));
    expect(rows).toHaveLength(1);
    const state = await getRunState(db, run.runId, g, cfgAt(plus(T0, 2000)));
    expect(state.score).toBe(awardForRarity(DEMO_ANSWERS[0]!.rarity).points);
  });

  it("blank and wrong answers consume the round for zero; obvious answers still score", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    const blank = await playRound(run.runId, g, 1, "   ", T0);
    expect(blank.round.outcome).toBe("invalid");
    expect(blank.round.points).toBe(0);
    const wrong = await playRound(run.runId, g, 2, "Mayflower", plus(T0, 30_000));
    expect(wrong.round.outcome).toBe("invalid");
    const obvious = await playRound(run.runId, g, 3, "Germany", plus(T0, 60_000));
    expect(obvious.round.outcome).toBe("valid");
    expect(obvious.round.points).toBeGreaterThanOrEqual(100);
  });

  it("T-027: one non-locking spelling suggestion, then the round locks", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const base = { runId: run.runId, guestId: g, roundIndex: 1 };
    const k = key();
    const first = await submitRound(db, { ...base, answer: "Colossus of Rodes", idempotencyKey: k }, cfgAt(plus(T0, 1000)));
    expect(first).toMatchObject({ kind: "clarify", reason: "suggestion", suggestion: "Colossus of Rhodes" });
    const replay = await submitRound(db, { ...base, answer: "Colossus of Rodes", idempotencyKey: k }, cfgAt(plus(T0, 1500)));
    expect(replay.kind).toBe("clarify");
    const second = await submitRound(db, { ...base, answer: "Colossus of Rodes", idempotencyKey: key() }, cfgAt(plus(T0, 2000)));
    expect(second.kind === "locked" && second.round.outcome).toBe("invalid");
  });

  it("confirming a suggestion awards the exact alias", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const base = { runId: run.runId, guestId: g, roundIndex: 1 };
    await submitRound(db, { ...base, answer: "Colossus of Rodes", idempotencyKey: key() }, cfgAt(plus(T0, 1000)));
    const ok = await submitRound(db, { ...base, answer: "Colossus of Rhodes", idempotencyKey: key() }, cfgAt(plus(T0, 2000)));
    expect(ok.kind === "locked" && ok.round.outcome).toBe("valid");
  });

  it("rejects answers over 120 code points", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    await expectCode(
      submitRound(db, { runId: run.runId, guestId: g, roundIndex: 1, answer: "a".repeat(121), idempotencyKey: key() }, cfgAt(T0)),
      "BAD_REQUEST",
    );
  });
});

describe("determinism and frozen scoring", () => {
  it("120 independent guests submitting the same answer get identical points", async () => {
    const points = new Set<number>();
    for (let i = 0; i < 120; i++) {
      const g = await guest(db);
      const run = await startOrResumeRun(db, g, cfgAt(T0));
      const res = await playRound(run.runId, g, 1, i % 2 ? "tomb of mausolus" : "  MAUSOLEUM AT HALICARNASSUS ", T0);
      points.add(res.round.points!);
    }
    expect([...points]).toEqual([awardForRarity(0.8).points]);
  });

  it("T-036: editing live rarity after publication does not change scores (snapshot is authoritative)", async () => {
    const { operation } = await getDailyOperation(db, cfgAt(T0));
    const g1 = await guest(db);
    const r1 = await startOrResumeRun(db, g1, cfgAt(T0));
    const before = await playRound(r1.runId, g1, 1, "Mausoleum at Halicarnassus", T0);
    await db.update(questionEligibleEntities).set({ rarityScore: 0 });
    const g2 = await guest(db);
    const r2 = await startOrResumeRun(db, g2, cfgAt(T0));
    expect(r2.operation.id).toBe(operation!.id);
    const after = await playRound(r2.runId, g2, 1, "Mausoleum at Halicarnassus", T0);
    expect(after.round.points).toBe(before.round.points);
  });

  it("locked rounds are immutable at the database level", async () => {
    const [locked] = await db.select().from(runRounds).where(eq(runRounds.outcome, "valid")).limit(1);
    await expect(db.update(runRounds).set({ points: 1000 }).where(eq(runRounds.id, locked!.id))).rejects.toSatisfy((e: Error & { cause?: Error }) =>
      /IMMUTABLE/.test(`${e.message} ${e.cause?.message ?? ""}`),
    );
  });
});
