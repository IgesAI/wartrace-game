import { AppError } from "@/modules/domain/errors";
import { openRound } from "@/modules/game/service";
import { roundIndexSchema, runIdSchema } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { assertSameOrigin, gameConfig, handle, json, rateLimit, requireGuestId } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ runId: string; roundIndex: string }> };

export const POST = handle<Ctx>(async (_req, ctx) => {
  await assertSameOrigin();
  const p = await ctx.params;
  const runId = runIdSchema.safeParse(p.runId);
  const roundIndex = roundIndexSchema.safeParse(p.roundIndex);
  if (!runId.success || !roundIndex.success) throw new AppError("NOT_FOUND", 404, "Round not found");
  const guestId = await requireGuestId();
  await rateLimit("open", guestId);
  return json(await openRound(await getDb(), runId.data, guestId, roundIndex.data, gameConfig()));
});
