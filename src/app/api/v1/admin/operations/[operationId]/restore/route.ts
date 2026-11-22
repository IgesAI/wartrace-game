import { z } from "zod";
import { requireCapability } from "@/modules/content/audit";
import { restoreOperation } from "@/modules/content/publish";
import { AppError } from "@/modules/domain/errors";
import { getDb } from "@/server/db";
import { assertSameOrigin, currentAdmin, handle, json, parseBody, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({ reason: z.string().min(5).max(500) }).strict();
type Ctx = { params: Promise<{ operationId: string }> };

export const POST = handle<Ctx>(async (req, ctx) => {
  await assertSameOrigin(true);
  const actor = requireCapability(await currentAdmin(), "publish");
  await rateLimit("admin", actor.id);
  const { operationId } = await ctx.params;
  if (!z.string().uuid().safeParse(operationId).success) throw new AppError("NOT_FOUND", 404, "Operation not found");
  const { reason } = await parseBody(req, body);
  return json(await restoreOperation(await getDb(), operationId, actor, reason));
});
