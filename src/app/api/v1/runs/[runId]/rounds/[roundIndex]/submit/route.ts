import { AppError } from "@/modules/domain/errors";
import { submitRound } from "@/modules/game/service";
import { roundIndexSchema, runIdSchema, submitBody } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { assertSameOrigin, gameConfig, handle, json, parseBody, rateLimit, requireGuestId } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ runId: string; roundIndex: string }> };

export const POST = handle<Ctx>(async (req, ctx) => {
  await assertSameOrigin();
  const cfg = gameConfig();
  const p = await ctx.params;
  const runId = runIdSchema.safeParse(p.runId);
  const roundIndex = roundIndexSchema.safeParse(p.roundIndex);
  if (!runId.success || !roundIndex.success) throw new AppError("NOT_FOUND", 404, "Round not found");
  const body = await parseBody(req, submitBody);
  const guestId = await requireGuestId();
  await rateLimit("submit", guestId);
  const res = await submitRound(
    await getDb(),
    { runId: runId.data, guestId, roundIndex: roundIndex.data, answer: body.answer, idempotencyKey: body.idempotencyKey, entityChoice: body.entityChoice },
    cfg,
  );
  if (res.kind === "clarify") {
    return json(res.reason === "ambiguous"
      ? { outcome: "ambiguous", options: res.options, deadlineAt: res.deadlineAt }
      : { outcome: "suggestion", suggestion: res.suggestion, deadlineAt: res.deadlineAt });
  }
  const r = res.round;
  return json({
    outcome: r.outcome,
    canonicalName: r.canonicalName ?? null,
    tier: r.tier ?? null,
    points: r.points ?? 0,
    distanceM: r.distanceM ?? 0,
    totalScore: res.run.score,
    totalDistanceM: res.run.distanceM,
    sourceCards: r.sourceCards ?? [],
    replayed: res.replayed,
    run: res.run,
  });
});
