import { AppError } from "@/modules/domain/errors";
import { getRunState } from "@/modules/game/service";
import { runIdSchema } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { gameConfig, handle, json, requireGuestId } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ runId: string }> };

export const GET = handle<Ctx>(async (_req, ctx) => {
  const { runId } = await ctx.params;
  if (!runIdSchema.safeParse(runId).success) throw new AppError("NOT_FOUND", 404, "Run not found");
  const guestId = await requireGuestId();
  return json(await getRunState(await getDb(), runId, guestId, gameConfig()));
});
