import { validateEvent } from "@/modules/analytics/events";
import { telemetryEvents } from "@/modules/db/schema";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { assertSameOrigin, handle, json, parseBody, rateLimit } from "@/server/http";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** First-party only. Disabled unless ANALYTICS_ENABLED=true; payloads failing the strict contract are dropped. */
export const POST = handle(async (req) => {
  await assertSameOrigin();
  if (!getEnv().ANALYTICS_ENABLED) return new Response(null, { status: 204 });
  await rateLimit("events");
  const raw = await parseBody(req, z.unknown());
  const ev = validateEvent(raw);
  if (!ev) return json({ accepted: false }, { status: 202 });
  await (await getDb()).insert(telemetryEvents).values({ eventName: ev.name, dateKey: ev.challengeDate ?? null, eventProperties: ev.props });
  return new Response(null, { status: 204 });
});
