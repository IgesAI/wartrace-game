import { z } from "zod";
import { requireCapability } from "@/modules/content/audit";
import { APPEAL_STATUSES } from "@/modules/db/schema";
import { AppError } from "@/modules/domain/errors";
import { updateAppealStatus } from "@/modules/game/appeals";
import { getDb } from "@/server/db";
import { assertSameOrigin, currentAdmin, handle, json, parseBody, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({ status: z.enum(APPEAL_STATUSES), note: z.string().max(2000).default("") }).strict();
type Ctx = { params: Promise<{ appealId: string }> };

export const POST = handle<Ctx>(async (req, ctx) => {
  await assertSameOrigin(true);
  const actor = requireCapability(await currentAdmin(), "triageAppeals");
  await rateLimit("admin", actor.id);
  const { appealId } = await ctx.params;
  if (!z.string().uuid().safeParse(appealId).success) throw new AppError("NOT_FOUND", 404, "Appeal not found");
  const b = await parseBody(req, body);
  await updateAppealStatus(await getDb(), actor, appealId, b.status, b.note);
  return json({ ok: true });
});
