import { getPublicResult } from "@/modules/game/service";
import { renderCard } from "@/modules/share/card";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ shareToken: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { shareToken } = await ctx.params;
  const result = await getPublicResult(await getDb(), shareToken);
  if (!result) return new Response("Not found", { status: 404 });
  const v = result.view;
  const format = new URL(req.url).searchParams.get("format");
  const size = format === "og" ? { width: 1200, height: 630 } : { width: 1200, height: 1200 };
  return renderCard(
    { dateKey: v.dateKey, title: v.title, distanceM: v.distanceM, score: v.score, roundsCorrect: v.roundsCorrect, demo: v.contentClass === "demo", rounds: v.rounds },
    size,
  );
}
