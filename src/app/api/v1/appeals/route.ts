import { appealInputSchema, submitAppeal } from "@/modules/game/appeals";
import { getDb } from "@/server/db";
import { assertSameOrigin, handle, json, parseBody, rateLimit, requireGuestId } from "@/server/http";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  await assertSameOrigin();
  const guestId = await requireGuestId();
  await rateLimit("appeal", guestId);
  const input = await parseBody(req, appealInputSchema);
  const created = await submitAppeal(await getDb(), guestId, input);
  return json(created, { status: 201 });
});
