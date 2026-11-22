import { startOrResumeRun } from "@/modules/game/service";
import { startRunBody } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { assertSameOrigin, ensureGuestId, gameConfig, handle, json, parseBody, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  await assertSameOrigin();
  const body = await parseBody(req, startRunBody);
  const guestId = await ensureGuestId();
  await rateLimit("runs", guestId);
  return json(await startOrResumeRun(await getDb(), guestId, gameConfig(), { referred: body.referred }));
});
