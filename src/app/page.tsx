import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { LandingTracker } from "@/components/LandingTracker";
import { LiveScene } from "@/components/LiveScene";
import { PrefsControls } from "@/components/PrefsControls";
import { DemoBanner, SiteFooter } from "@/components/SiteFooter";
import { findGuestRunForToday, getDailyOperation } from "@/modules/game/service";
import { getDb } from "@/server/db";
import { currentGuestId, gameConfig } from "@/server/http";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cfg = gameConfig();
  const db = await getDb();
  const { dateKey, operation } = await getDailyOperation(db, cfg);
  const guestId = await currentGuestId();
  const prior = guestId && operation ? await findGuestRunForToday(db, guestId, cfg) : null;
  const isDemo = operation?.contentClass === "demo";

  return (
    <div className="landing">
      {isDemo && <DemoBanner />}
      <LandingTracker />
      <section className="landing-hero" aria-labelledby="hero-title">
        <LiveScene distanceM={0} />
        <div className="landing-hero-inner">
          <div className="topbar">
            <span className="brand" aria-hidden="true">
              WARTRACE
            </span>
            <PrefsControls compact />
          </div>
          <main id="main" className="hero-copy">
            <p className="eyebrow">Daily history expedition</p>
            <h1 id="hero-title">
              <span className="sr-only">WARTRACE: </span>How far can your knowledge take you?
            </h1>
            <p className="hero-tagline">
              Seven rounds. Type one real answer each time. The rarer your valid answer, the farther your courier travels.
            </p>
            {operation ? (
              <div className="hero-op">
                <span className="eyebrow">Today · {dateKey}</span>
                <span className="hero-op-title">{operation.title}</span>
                {operation.blurb && <p className="hint">{operation.blurb}</p>}
              </div>
            ) : (
              <div className="hero-op" role="status">
                <span className="hero-op-title">No operation published yet</span>
                <p className="hint">Today&apos;s challenge is not live. Check back at the next release.</p>
              </div>
            )}
            {prior?.state === "completed" ? (
              <div className="prior-result">
                <span>
                  You traversed <strong className="num">{prior.distanceM.toLocaleString("en-US")} m</strong> today.
                </span>
                {prior.shareToken && (
                  <Link className="btn btn-small" href={`/results/${prior.shareToken}`}>
                    View result
                  </Link>
                )}
              </div>
            ) : (
              operation && (
                <div className="hero-actions">
                  <Link className="btn btn-hero" href="/daily" prefetch={false}>
                    {prior ? "Resume today’s operation" : "Play today’s operation"}
                  </Link>
                  <span className="hint">No sign-up. About 3 minutes.</span>
                </div>
              )
            )}
            <Countdown serverNow={cfg.now.toISOString()} />
          </main>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="how-title">
        <h2 id="how-title" className="sr-only">
          How to play
        </h2>
        <div className="landing-grid">
          <div className="landing-card">
            <h2>Type one real answer</h2>
            <p>Each prompt has a finite, sourced list of valid answers. You get 25 seconds and a single submission per round.</p>
          </div>
          <div className="landing-card">
            <h2>Rarer travels farther</h2>
            <p>Common answers always count. Less familiar valid answers earn up to ten times the distance. Scores are frozen at publication.</p>
          </div>
          <div className="landing-card">
            <h2>Same challenge worldwide</h2>
            <p>Everyone plays the same seven prompts. A new operation releases at midnight New York time. Sources appear after you lock.</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
