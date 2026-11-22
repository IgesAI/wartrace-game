import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { LiveScene } from "@/components/LiveScene";
import { DemoBanner, SiteFooter } from "@/components/SiteFooter";
import { MAX_TOTAL_DISTANCE_M } from "@/modules/domain/scoring";
import { getOwnRunView, getPublicResult } from "@/modules/game/service";
import { getDb } from "@/server/db";
import { currentGuestId, gameConfig } from "@/server/http";
import { ResultTracker, ShareActions } from "./ShareActions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

const fmt = (n: number) => n.toLocaleString("en-US");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await getPublicResult(await getDb(), token);
  if (!result) return { title: "Result not found" };
  const v = result.view;
  const title = `${fmt(v.distanceM)} m on WARTRACE · ${v.dateKey}`;
  const description = `${v.roundsCorrect}/7 valid answers on ${v.title}. Same seven questions — can you travel farther?`;
  const image = `/api/v1/results/${token}/card?format=og`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: "WARTRACE expedition result card" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: { index: false },
  };
}

export default async function ResultPage({ params }: Props) {
  const { token } = await params;
  const db = await getDb();
  const result = await getPublicResult(db, token);
  if (!result) notFound();
  const v = result.view;
  const guestId = await currentGuestId();
  const isOwner = guestId === result.guestSessionId;
  const cfg = gameConfig();
  const own = isOwner ? await getOwnRunView(db, result.runId, cfg) : null;
  const pct = Math.min(100, (v.distanceM / MAX_TOTAL_DISTANCE_M) * 100);
  const rarest = own?.rounds
    .filter((r) => r.outcome === "valid")
    .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0];
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? (host ? `${h.get("x-forwarded-proto") ?? "http"}://${host}` : "");
  const challengePath = `/challenge/${v.dateKey}?from=${token}`;

  const ticks = v.rounds.reduce<number[]>((acc, r) => [...acc, (acc.at(-1) ?? 0) + (r.distanceM / MAX_TOTAL_DISTANCE_M) * 100], []);

  return (
    <div className="results">
      {v.contentClass === "demo" && <DemoBanner />}
      <ResultTracker ownResult={isOwner} />
      <section className="results-hero">
        <LiveScene distanceM={v.distanceM} />
        <div className="results-hero-inner">
          <div className="topbar">
            <Link href="/" className="brand">
              WARTRACE
            </Link>
            <span className="eyebrow">{v.dateKey}</span>
          </div>
        </div>
      </section>

      <main id="main" className="results-body">
        <section aria-labelledby="result-title" style={{ display: "grid", gap: "var(--space-3)" }}>
          <p className="eyebrow">{isOwner ? "Your expedition" : v.displayName ? `${v.displayName}’s expedition` : "A shared expedition"} · {v.title}</p>
          <h1 id="result-title" className="result-total">
            <span className="big num">{fmt(v.distanceM)}</span>
            <span className="unit">metres traversed</span>
          </h1>
          <p className="hint num">
            {fmt(v.score)} points · {v.roundsCorrect}/7 valid answers{rarest ? ` · rarest: ${rarest.canonicalName} (${rarest.tier})` : ""}
          </p>
          <div className="route" role="img" aria-label={`Route progress: ${Math.round(pct)} percent of the maximum ${fmt(MAX_TOTAL_DISTANCE_M)} metres`}>
            <div className="route-line" />
            <div className="route-progress" style={{ width: `${pct}%` }} />
            {ticks.map((t, i) => (
              <div key={i} className="route-tick" style={{ left: `${t}%` }} />
            ))}
          </div>
        </section>

        {own ? (
          <section aria-labelledby="ledger-title" style={{ display: "grid", gap: "var(--space-3)" }}>
            <h2 id="ledger-title">Round ledger</h2>
            <div className="table-wrap" style={{ border: 0 }}>
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Answer</th>
                    <th scope="col" className="ledger-tier">
                      Tier
                    </th>
                    <th scope="col" className="r">
                      Distance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {own.rounds.map((r) => (
                    <tr key={r.roundIndex}>
                      <td className="num">{r.roundIndex}</td>
                      <td>
                        <div className="answer">
                          {r.outcome === "valid" ? r.canonicalName : r.outcome === "timed_out" ? "Timed out" : r.submittedText ? `“${r.submittedText}” — not accepted` : "No answer"}
                        </div>
                        <span className="tier tier-inline" data-tier={r.outcome === "valid" ? r.tier : "None"}>
                          {r.outcome === "valid" ? r.tier : "None"}
                        </span>
                        <div className="prompt-small">{r.prompt}</div>
                        {r.outcome === "valid" && (r.sourceCards?.length ?? 0) > 0 && (
                          <details>
                            <summary className="prompt-small">Sources ({r.sourceCards!.length})</summary>
                            <ul className="sources">
                              {r.sourceCards!.map((s) => (
                                <li key={s.url} className="source-card">
                                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                                    {s.title}
                                  </a>
                                  <span className="meta">
                                    {s.publisher ?? "Unknown publisher"} · Tier {s.sourceTier} · {s.reviewStatus === "reviewed" ? "reviewed" : "candidate — awaiting review"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                        {r.outcome === "valid" && r.entityId && (
                          <>
                            <Link className="prompt-small" href={`/explore/${r.entityId}`}>
                              Evidence
                            </Link>{" "}
                            ·{" "}
                          </>
                        )}
                        {r.outcome !== "timed_out" && r.runRoundId && (
                          <Link className="prompt-small" href={`/appeal?round=${r.runRoundId}`}>
                            {r.outcome === "valid" ? "Report a problem" : "Appeal this round"}
                          </Link>
                        )}
                      </td>
                      <td className="ledger-tier">
                        <span className="tier" data-tier={r.outcome === "valid" ? r.tier : "None"}>
                          {r.outcome === "valid" ? r.tier : "None"}
                        </span>
                      </td>
                      <td className="r num">{fmt(r.distanceM ?? 0)} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section aria-labelledby="ledger-title" style={{ display: "grid", gap: "var(--space-3)" }}>
            <h2 id="ledger-title">Seven rounds</h2>
            <p className="hint">Answers stay hidden so the challenge isn&apos;t spoiled.</p>
            <ol className="steps" aria-label="Round outcomes" style={{ maxWidth: 420 }}>
              {v.rounds.map((r) => (
                <li key={r.roundIndex} data-state={r.outcome}>
                  <span className="sr-only">
                    Round {r.roundIndex}: {r.outcome === "valid" ? `${r.tier}, ${r.distanceM} metres` : "no distance"}
                  </span>
                </li>
              ))}
            </ol>
            <div className="panel-actions">
              <Link className="btn btn-hero" href={challengePath}>
                Take the same challenge
              </Link>
            </div>
          </section>
        )}

        {isOwner && (
          <ShareActions
            token={token}
            challengeUrl={`${base}${challengePath}`}
            replay={{ title: v.title, dateKey: v.dateKey, demo: v.contentClass === "demo", rounds: v.rounds.map((r) => ({ outcome: r.outcome, tier: r.tier, distanceM: r.distanceM })) }}
            distanceM={v.distanceM}
          />
        )}

        <Countdown serverNow={cfg.now.toISOString()} />
      </main>
      <SiteFooter />
    </div>
  );
}
