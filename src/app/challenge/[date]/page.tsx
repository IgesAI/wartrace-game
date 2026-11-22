import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/Countdown";
import { LiveScene } from "@/components/LiveScene";
import { DemoBanner, SiteFooter } from "@/components/SiteFooter";
import { dateKeyFor, isDateKey } from "@/modules/domain/dates";
import { getDailyOperation, getPublicResult } from "@/modules/game/service";
import { getDb } from "@/server/db";
import { gameConfig } from "@/server/http";
import { ChallengeTracker } from "./ChallengeTracker";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ date: string }>; searchParams: Promise<{ from?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ date }, { from }] = await Promise.all([params, searchParams]);
  const result = from ? await getPublicResult(await getDb(), from) : null;
  const title = result ? `Beat ${result.view.distanceM.toLocaleString("en-US")} m · WARTRACE ${date}` : `WARTRACE challenge · ${date}`;
  const image = result ? `/api/v1/results/${from}/card?format=og` : undefined;
  return {
    title,
    description: "Same seven history questions. Rarer valid answers travel farther.",
    openGraph: { title, ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
    robots: { index: false },
  };
}

export default async function ChallengePage({ params, searchParams }: Props) {
  const [{ date }, { from }] = await Promise.all([params, searchParams]);
  if (!isDateKey(date)) notFound();
  const cfg = gameConfig();
  const db = await getDb();
  const today = dateKeyFor(cfg.now, cfg.timeZone);
  const { operation } = await getDailyOperation(db, cfg);
  const result = from ? await getPublicResult(db, from) : null;
  const sender = result && result.view.dateKey === date ? result.view : null;
  const live = date === today && !!operation;
  const fromParam = sender && from ? `?from=${encodeURIComponent(from)}` : "";

  return (
    <div className="landing">
      {operation?.contentClass === "demo" && <DemoBanner />}
      <ChallengeTracker date={date} referral={!!sender} />
      <section className="landing-hero" aria-labelledby="challenge-title">
        <LiveScene distanceM={sender?.distanceM ?? 0} />
        <div className="landing-hero-inner">
          <div className="topbar">
            <Link href="/" className="brand">
              WARTRACE
            </Link>
          </div>
          <main id="main" className="hero-copy">
            <p className="eyebrow">Challenge · {date}</p>
            {sender ? (
              <h1 id="challenge-title">
                Beat <span className="num">{sender.distanceM.toLocaleString("en-US")}</span> m
              </h1>
            ) : (
              <h1 id="challenge-title">How far can you go?</h1>
            )}
            {sender && (
              <p className="hero-tagline">
                {sender.displayName ? `${sender.displayName} answered` : "Your friend answered"} {sender.roundsCorrect}/7 rounds on {sender.title}. Their answers stay
                hidden.
              </p>
            )}
            {live ? (
              <div className="hero-actions">
                <Link className="btn btn-hero" href={`/daily${fromParam}`} prefetch={false}>
                  Play this challenge
                </Link>
                <span className="hint">Seven rounds · about 3 minutes · no sign-up</span>
              </div>
            ) : date > today ? (
              <p className="hint">This operation hasn&apos;t been released yet.</p>
            ) : (
              <>
                <p className="hint">This challenge has closed. Archive play arrives in a later release.</p>
                {operation && (
                  <div className="hero-actions">
                    <Link className="btn" href="/daily" prefetch={false}>
                      Play today&apos;s operation
                    </Link>
                  </div>
                )}
              </>
            )}
            <Countdown serverNow={cfg.now.toISOString()} />
          </main>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
