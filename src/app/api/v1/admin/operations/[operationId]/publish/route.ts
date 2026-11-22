import { z } from "zod";
import { requireCapability } from "@/modules/content/audit";
import { publishOperation } from "@/modules/content/publish";
import { AppError } from "@/modules/domain/errors";
import { getDb } from "@/server/db";
import { demoContentAllowed } from "@/server/env";
import { assertSameOrigin, currentAdmin, handle, json, parseBody, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({ allowDemoContent: z.boolean().optional(), reason: z.string().max(500).optional() }).strict();
type Ctx = { params: Promise<{ operationId: string }> };

export const POST = handle<Ctx>(async (req, ctx) => {
  await assertSameOrigin(true);
  const actor = requireCapability(await currentAdmin(), "publish");
  await rateLimit("admin", actor.id);
  const { operationId } = await ctx.params;
  if (!z.string().uuid().safeParse(operationId).success) throw new AppError("NOT_FOUND", 404, "Operation not found");
  const b = await parseBody(req, body);
  const res = await publishOperation(await getDb(), operationId, actor, {
    allowDemoContent: b.allowDemoContent,
    demoAllowedByEnvironment: demoContentAllowed(),
    reason: b.reason,
  });
  return json({ operationId: res.operationId, dateKey: res.dateKey, checksum: res.checksum, contentClass: res.contentClass });
});
