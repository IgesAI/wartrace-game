import { nextReleaseAt } from "@/modules/domain/dates";
import { AppError } from "@/modules/domain/errors";
import { getDailyOperation } from "@/modules/game/service";
import { getDb } from "@/server/db";
import { gameConfig, handle, json } from "@/server/http";

export const dynamic = "force-dynamic";

/** Published question text only appears per-round after open; this endpoint is a teaser. */
export const GET = handle(async () => {
  const cfg = gameConfig();
  const { dateKey, operation } = await getDailyOperation(await getDb(), cfg);
  if (!operation) throw new AppError("NO_DAILY", 503, "No reviewed daily operation is ready", { dateKey });
  return json({
    dateKey,
    operationId: operation.id,
    title: operation.title,
    blurb: operation.blurb,
    questionCount: 7,
    timezone: cfg.timeZone,
    sceneKey: operation.sceneKey,
    contentClass: operation.contentClass,
    roundSeconds: cfg.roundSeconds,
    serverNow: cfg.now.toISOString(),
    nextReleaseAt: nextReleaseAt(cfg.now, cfg.timeZone).toISOString(),
  });
});
