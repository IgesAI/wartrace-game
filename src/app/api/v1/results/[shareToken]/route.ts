import { AppError } from "@/modules/domain/errors";
import { getPublicResult } from "@/modules/game/service";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { handle, json } from "@/server/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ shareToken: string }> };

export const GET = handle<Ctx>(async (_req, ctx) => {
  const { shareToken } = await ctx.params;
  const result = await getPublicResult(await getDb(), shareToken);
  if (!result) throw new AppError("NOT_FOUND", 404, "Result not found");
  const base = getEnv().NEXT_PUBLIC_BASE_URL;
  return json({ ...result.view, challengeUrl: `${base}/challenge/${result.view.dateKey}?from=${shareToken}` });
});
