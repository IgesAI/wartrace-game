import { ImageResponse } from "next/og";
import { sceneSvg, svgDataUri } from "@/game/art/scene-svg";
import { C } from "@/game/art/scene-spec";
import { MAX_TOTAL_DISTANCE_M } from "@/modules/domain/scoring";

export type CardData = {
  dateKey: string;
  title: string;
  distanceM: number;
  score: number;
  roundsCorrect: number;
  demo: boolean;
  rounds: { tier: string | null; outcome: string }[];
} | null;

const tierColor: Record<string, string> = { Common: C.olive, Curious: C.canvas, Uncommon: C.brass, Obscure: C.rust };

/** Spoiler-safe card: totals and tiers only — never answers, prompts or identities (SHARE-1x1 / SHARE-OG). */
export function renderCard(data: CardData, size: { width: number; height: number }) {
  const square = size.width === size.height;
  const bg = svgDataUri(sceneSvg({ offsetM: data ? Math.min(data.distanceM, 5600) : 1200, width: 960, cropW: square ? 540 : 960, cropX: square ? 120 : 0 }));
  const pct = data ? Math.round((data.distanceM / MAX_TOTAL_DISTANCE_M) * 100) : 0;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.ink, color: C.paper, fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={size.width} height={size.height} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg, rgba(17,23,21,0.15) 0%, rgba(17,23,21,0.35) 45%, rgba(17,23,21,0.92) 100%)" }} />
        <div style={{ position: "absolute", left: 64, right: 64, top: 56, display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: 6, color: C.brass }}>
          <span>WARTRACE</span>
          <span>{data ? data.dateKey : "DAILY EXPEDITION"}</span>
        </div>
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 64, display: "flex", flexDirection: "column", gap: 18 }}>
          {data ? (
            <>
              <div style={{ fontSize: 34, color: C.canvas, display: "flex" }}>{data.title}</div>
              <div style={{ fontSize: square ? 150 : 120, fontWeight: 800, lineHeight: 1, display: "flex" }}>{data.distanceM.toLocaleString("en-US")} m</div>
              <div style={{ fontSize: 30, color: C.canvas, display: "flex" }}>
                {data.roundsCorrect}/7 valid · {data.score.toLocaleString("en-US")} pts · {pct}% of the route
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {data.rounds.map((r, i) => (
                  <div key={i} style={{ width: 64, height: 18, display: "flex", background: r.outcome === "valid" && r.tier ? tierColor[r.tier] ?? C.olive : "rgba(239,233,218,0.18)" }} />
                ))}
              </div>
              <div style={{ fontSize: 32, color: C.brass, display: "flex" }}>Beat my expedition — same seven questions, today only.</div>
              {data.demo ? <div style={{ fontSize: 22, color: C.rust, display: "flex" }}>DEMO CONTENT · gameplay image, not a historical photograph</div> : null}
            </>
          ) : (
            <div style={{ fontSize: 72, fontWeight: 800, display: "flex" }}>How far can your knowledge take you?</div>
          )}
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=300" } },
  );
}
