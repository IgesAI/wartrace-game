"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrefsControls } from "@/components/PrefsControls";
import { DemoBanner } from "@/components/SiteFooter";
import { WorldScene } from "@/game/WorldScene";
import { ApiError, api } from "@/lib/api";
import { usePrefs } from "@/lib/prefs";
import { track } from "@/lib/track";
import type { RoundView, RunView, SourceCard } from "@/modules/game/service";

type Phase = "intro" | "ready" | "active" | "submitting" | "clarify" | "reveal" | "complete" | "recovery" | "error";

type Clarify =
  | { reason: "ambiguous"; options: { entityId: string; label: string }[]; text: string }
  | { reason: "suggestion"; suggestion: string; text: string };

type LockedResponse = {
  outcome: "valid" | "invalid" | "timed_out";
  canonicalName: string | null;
  tier: string | null;
  points: number;
  distanceM: number;
  sourceCards: SourceCard[];
  replayed: boolean;
  run: RunView;
};
type ClarifyResponse =
  | { outcome: "ambiguous"; options: { entityId: string; label: string }[]; deadlineAt: string }
  | { outcome: "suggestion"; suggestion: string; deadlineAt: string };

const TIER_RARE = new Set(["Uncommon", "Obscure"]);

function newKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function initialPhase(run: RunView): Phase {
  if (run.state === "completed") return "complete";
  if (run.rounds.some((r) => r.status === "open")) return "active";
  if (run.rounds.every((r) => r.status === "unopened")) return "intro";
  return "ready";
}

const fmt = (n: number) => n.toLocaleString("en-US");

export function GameClient({ initialRun }: { initialRun: RunView }) {
  const router = useRouter();
  const { reducedMotion } = usePrefs();
  const [run, setRun] = useState(initialRun);
  const [phase, setPhase] = useState<Phase>(() => initialPhase(initialRun));
  const [offset, setOffset] = useState(() => Date.parse(initialRun.serverNow) - Date.now());
  const [now, setNow] = useState(() => Date.parse(initialRun.serverNow));
  const [answer, setAnswer] = useState("");
  const [clarify, setClarify] = useState<Clarify | null>(null);
  const [revealed, setRevealed] = useState<RoundView | null>(() => {
    if (initialPhase(initialRun) !== "ready") return null;
    return [...initialRun.rounds].reverse().find((r) => r.status === "locked") ?? null;
  });
  const [travelDone, setTravelDone] = useState(true);
  const [skipKey, setSkipKey] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatal, setFatal] = useState<ApiError | null>(null);
  const [renderer, setRenderer] = useState<"pixi" | "svg-fallback">("svg-fallback");
  const [announce, setAnnounce] = useState("");

  const keyRef = useRef<string>(newKey());
  const pendingRef = useRef<null | (() => Promise<void>)>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const expiryRef = useRef(false);
  const completedTracked = useRef(initialRun.state === "completed");
  const openNextRef = useRef<() => Promise<void>>(async () => {});

  const openRoundView = run.rounds.find((r) => r.status === "open") ?? null;
  const roundNo = openRoundView?.roundIndex ?? Math.min(run.currentRound, 7);
  const deadline = openRoundView?.deadlineAt ? Date.parse(openRoundView.deadlineAt) : null;
  const remainingMs = deadline ? Math.max(0, deadline - now) : 0;
  const date = run.operation.dateKey;

  const adopt = useCallback((next: RunView) => {
    setRun(next);
    setOffset(Date.parse(next.serverNow) - Date.now());
    setNow(Date.parse(next.serverNow));
  }, []);

  // Authoritative clock tick (server-anchored).
  useEffect(() => {
    if (phase !== "active" && phase !== "clarify" && phase !== "submitting") return;
    const id = setInterval(() => setNow(Date.now() + offset), 200);
    return () => clearInterval(id);
  }, [phase, offset]);

  const showLocked = useCallback(
    (round: RoundView, nextRun: RunView, replayed: boolean) => {
      adopt(nextRun);
      setRevealed(round);
      setClarify(null);
      setAnswer("");
      // Zero-distance rounds have no camera travel to wait for.
      setTravelDone(!round.distanceM);
      setSkipped(false);
      setPhase("reveal");
      expiryRef.current = false;
      const label =
        round.outcome === "valid"
          ? `${round.canonicalName} accepted. ${round.tier}. Plus ${round.points} points and ${round.distanceM} metres.`
          : round.outcome === "timed_out"
            ? "Time’s up. No distance this round."
            : "Not on our list for this prompt. No distance this round.";
      setAnnounce(label);
      if (!replayed) {
        const opened = round.openedAt ? Date.parse(round.openedAt) : Date.now();
        const elapsed = Date.now() + offset - opened;
        track(
          "answer_submitted",
          {
            roundIndex: round.roundIndex,
            outcome: round.outcome ?? "timed_out",
            rarityTier: round.tier ?? "None",
            score: round.points ?? 0,
            distanceM: round.distanceM ?? 0,
            elapsedMsBucket: elapsed < 5000 ? "lt5s" : elapsed < 10000 ? "5to10s" : elapsed < 20000 ? "10to20s" : "gt20s",
          },
          date,
        );
      }
    },
    [adopt, offset, date],
  );

  const refresh = useCallback(async () => {
    const next = await api<RunView>(`/api/v1/runs/${run.runId}`);
    return next;
  }, [run.runId]);

  /** Reconciles UI with server state after errors or reconnects. */
  const reconcile = useCallback(async () => {
    const next = await refresh();
    const prevOpen = run.rounds.find((r) => r.status === "open");
    const nowLocked = prevOpen ? next.rounds[prevOpen.roundIndex - 1] : undefined;
    if (nowLocked?.status === "locked") {
      showLocked(nowLocked, next, true);
      return;
    }
    adopt(next);
    setPhase(initialPhase(next) === "intro" ? "ready" : initialPhase(next));
  }, [refresh, run.rounds, showLocked, adopt]);

  const fail = useCallback((e: unknown, retry: () => Promise<void>) => {
    const err = e instanceof ApiError ? e : new ApiError("INTERNAL", 500, "Something went wrong");
    if (err.code === "NETWORK" || err.status >= 500) {
      pendingRef.current = retry;
      setPhase("recovery");
      setAnnounce("Connection lost. Your progress is saved on the server.");
      return;
    }
    if (err.code === "UNAUTHENTICATED" || err.code === "NOT_FOUND") {
      setFatal(err);
      setPhase("error");
      return;
    }
    return err;
  }, []);

  const openNext = useCallback(async () => {
    const idx = run.currentRound;
    setMessage(null);
    setPhase("submitting");
    try {
      const next = await api<RunView>(`/api/v1/runs/${run.runId}/rounds/${idx}/open`, { method: "POST" });
      adopt(next);
      keyRef.current = newKey();
      expiryRef.current = false;
      setAnswer("");
      setClarify(null);
      setRevealed(null);
      setPhase("active");
      const r = next.rounds[idx - 1];
      setAnnounce(`Round ${idx} of 7. ${r?.prompt ?? ""}`);
      track("round_started", { roundIndex: idx, category: (r?.topic ?? "general").slice(0, 40) }, date);
    } catch (e) {
      const err = fail(e, () => openNextRef.current());
      if (err) {
        if (err.code === "RUN_COMPLETE" || err.code === "ROUND_LOCKED" || err.code === "OUT_OF_SEQUENCE") await reconcile().catch(() => {});
        else {
          setMessage(err.message);
          setPhase("ready");
        }
      }
    }
  }, [run.currentRound, run.runId, adopt, fail, reconcile, date]);

  useEffect(() => {
    openNextRef.current = openNext;
  }, [openNext]);

  const submit = useCallback(
    async (text: string, opts: { entityChoice?: string; freshKey?: boolean } = {}) => {
      if (!openRoundView) return;
      if (opts.freshKey) keyRef.current = newKey();
      const idx = openRoundView.roundIndex;
      const body = { answer: text, idempotencyKey: keyRef.current, ...(opts.entityChoice ? { entityChoice: opts.entityChoice } : {}) };
      setMessage(null);
      setPhase("submitting");
      const attempt = async () => {
        try {
          const res = await api<LockedResponse | ClarifyResponse>(`/api/v1/runs/${run.runId}/rounds/${idx}/submit`, { method: "POST", body });
          if (res.outcome === "ambiguous") {
            setClarify({ reason: "ambiguous", options: res.options, text });
            setPhase("clarify");
            setAnnounce("More than one answer matches. Choose which you meant.");
            return;
          }
          if (res.outcome === "suggestion") {
            setClarify({ reason: "suggestion", suggestion: res.suggestion, text });
            setPhase("clarify");
            setAnnounce(`Did you mean ${res.suggestion}?`);
            return;
          }
          showLocked(res.run.rounds[idx - 1]!, res.run, res.replayed);
        } catch (e) {
          const err = fail(e, attempt);
          if (!err) return;
          if (err.code === "ROUND_LOCKED" || err.code === "ROUND_NOT_OPEN" || err.code === "RUN_COMPLETE") {
            await reconcile().catch(() => {});
          } else {
            setMessage(err.code === "RATE_LIMITED" ? "Too many attempts — wait a moment, then submit again." : err.message);
            setPhase("active");
          }
        }
      };
      await attempt();
    },
    [openRoundView, run.runId, showLocked, fail, reconcile],
  );

  // Server enforces the deadline; when the local estimate passes it, fetch authoritative state.
  useEffect(() => {
    if ((phase !== "active" && phase !== "clarify") || !deadline || remainingMs > 0 || expiryRef.current) return;
    expiryRef.current = true;
    let tries = 0;
    const check = async () => {
      try {
        const next = await refresh();
        const r = next.rounds[roundNo - 1];
        if (r?.status === "locked") showLocked(r, next, false);
        else if (tries++ < 6) setTimeout(check, 600);
        else adopt(next);
      } catch (e) {
        fail(e, async () => {
          expiryRef.current = false;
          await reconcile();
        });
      }
    };
    void check();
  }, [phase, deadline, remainingMs, roundNo, refresh, showLocked, adopt, fail, reconcile]);

  const secs = Math.ceil(remainingMs / 1000);
  // Text changes only at the 10s and 5s thresholds, so screen readers announce each once.
  const timerAnnouncement = phase === "active" && secs > 0 && secs <= 10 ? (secs <= 5 ? "5 seconds left" : "10 seconds left") : "";

  useEffect(() => {
    if (phase === "active") inputRef.current?.focus({ preventScroll: true });
  }, [phase, roundNo]);

  useEffect(() => {
    if (phase === "reveal" && travelDone) nextRef.current?.focus({ preventScroll: true });
  }, [phase, travelDone]);

  useEffect(() => {
    if (run.state === "completed" && !completedTracked.current) {
      completedTracked.current = true;
      const valid = run.rounds.filter((r) => r.outcome === "valid").length;
      track("game_completed", { score: run.score, distanceM: run.distanceM, roundsCorrect: valid }, date);
    }
  }, [run, date]);

  // Network recovery: retry with backoff, then reconcile.
  useEffect(() => {
    if (phase !== "recovery") return;
    let delay = 2000;
    let timer: ReturnType<typeof setTimeout>;
    const go = () => {
      timer = setTimeout(async () => {
        const fn = pendingRef.current;
        if (!fn) return;
        if (!navigator.onLine) {
          delay = Math.min(delay * 2, 16000);
          go();
          return;
        }
        await fn();
      }, delay);
    };
    go();
    return () => clearTimeout(timer);
  }, [phase]);

  const onTravelDone = useCallback(() => {
    setTravelDone(true);
  }, []);

  const onRenderer = useCallback((info: { type: "pixi" | "svg-fallback"; reason?: string }) => {
    setRenderer(info.type);
    if (info.type === "svg-fallback" && (info.reason === "webgl_unavailable" || info.reason === "init_failed")) {
      track("renderer_fallback_used", { reason: info.reason });
    }
  }, []);

  const continueOn = useCallback(() => {
    if (revealed) track("round_completed", { roundIndex: revealed.roundIndex, animationSkipped: skipped, renderer }, date);
    if (run.state === "completed") {
      if (run.shareToken) router.push(`/results/${run.shareToken}`);
      else setPhase("complete");
      return;
    }
    void openNext();
  }, [revealed, skipped, renderer, date, run.state, run.shareToken, router, openNext]);

  const stepStates = useMemo(
    () =>
      run.rounds.map((r) => {
        if (r.status === "locked") return r.outcome ?? "invalid";
        if (r.status === "open" || (r.roundIndex === run.currentRound && run.state !== "completed")) return "current";
        return "pending";
      }),
    [run.rounds, run.currentRound, run.state],
  );

  const rare = !!revealed?.tier && TIER_RARE.has(revealed.tier);
  const ring = 2 * Math.PI * 28;
  const fraction = deadline ? remainingMs / (run.roundSeconds * 1000) : 1;

  return (
    <div className="game-shell">
      {run.operation.contentClass === "demo" && <DemoBanner />}
      <div className="game" data-phase={phase}>
        <WorldScene
          distanceM={run.distanceM}
          rare={rare}
          reducedMotion={reducedMotion}
          skipKey={skipKey}
          onTravelDone={onTravelDone}
          onRenderer={onRenderer}
        />
        <div className="game-hud">
          <div className="row">
            <Link href="/" className="hud-chip" style={{ textDecoration: "none" }}>
              <span className="label">Operation</span>
              <span className="value" style={{ color: "var(--paper)" }}>
                {run.operation.title}
              </span>
              <span className="sr-only"> — WARTRACE home</span>
            </Link>
            <div className="hud-chip" aria-label={`Distance ${fmt(run.distanceM)} metres, score ${fmt(run.score)}`}>
              <span className="label">Distance</span>
              <span className="value num">{fmt(run.distanceM)} m</span>
            </div>
          </div>
          <PrefsControls compact />
        </div>

        <main id="main" className="game-panel" aria-labelledby="round-heading">
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {announce}
          </div>
          <div className="sr-only" aria-live="assertive" aria-atomic="true">
            {timerAnnouncement}
          </div>
          <ol className="steps" aria-label={`Round ${roundNo} of 7`}>
            {stepStates.map((s, i) => (
              <li key={i} data-state={s}>
                <span className="sr-only">
                  Round {i + 1}: {s === "valid" ? "accepted" : s === "invalid" ? "not accepted" : s === "timed_out" ? "timed out" : s === "current" ? "current" : "not started"}
                </span>
              </li>
            ))}
          </ol>

          {phase === "intro" && (
            <section className="intro" aria-labelledby="round-heading">
              <p className="eyebrow">Daily operation · {date}</p>
              <h1 id="round-heading">{run.operation.title}</h1>
              {run.operation.blurb && <p className="hint">{run.operation.blurb}</p>}
              <ol className="how-to">
                <li>
                  <span>
                    <strong>Type one real answer.</strong> You get {run.roundSeconds} seconds and one submission per round.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Rarer travels farther.</strong> Every valid answer counts; less familiar ones earn more distance.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Seven rounds. Same challenge worldwide.</strong> About three minutes.
                  </span>
                </li>
              </ol>
              <div className="panel-actions">
                <button className="btn btn-hero" type="button" onClick={() => void openNext()} autoFocus>
                  Begin round 1
                </button>
              </div>
              <p className="hint">The timer starts when the round opens. Sources appear after you lock an answer.</p>
            </section>
          )}

          {phase === "ready" && (
            <section className="intro" aria-labelledby="round-heading">
              <h1 id="round-heading" className="prompt">
                Round {run.currentRound} of 7
              </h1>
              <p className="hint">Your expedition is saved. Open the next round when you&apos;re ready — the {run.roundSeconds}-second timer starts on open.</p>
              {message && <p className="status-line error-text">{message}</p>}
              <div className="panel-actions">
                <button className="btn" type="button" onClick={() => void openNext()} autoFocus>
                  Open round {run.currentRound}
                </button>
              </div>
            </section>
          )}

          {(phase === "active" || phase === "submitting" || phase === "clarify") && openRoundView && (
            <section aria-labelledby="round-heading" className="intro">
              <div className="round-head">
                <div>
                  <p className="eyebrow">
                    Round {openRoundView.roundIndex} of 7{openRoundView.topic ? ` · ${openRoundView.topic}` : ""}
                  </p>
                  <h1 id="round-heading" className="prompt">
                    {openRoundView.prompt}
                  </h1>
                </div>
                <div className="timer" data-urgent={secs <= 5} role="timer" aria-label={`${secs} seconds remaining`}>
                  <svg viewBox="0 0 64 64" aria-hidden="true">
                    <circle className="track" cx="32" cy="32" r="28" />
                    <circle className="bar" cx="32" cy="32" r="28" strokeDasharray={ring} strokeDashoffset={ring * (1 - fraction)} />
                  </svg>
                  <span className="timer-value num" aria-hidden="true">
                    {secs}
                  </span>
                </div>
              </div>

              {phase !== "clarify" && (
                <form
                  className="answer-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (phase === "active" && answer.trim()) void submit(answer);
                  }}
                >
                  <label htmlFor="answer" className="sr-only">
                    Your answer
                  </label>
                  <input
                    ref={inputRef}
                    id="answer"
                    className="field"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault();
                    }}
                    maxLength={120}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck={false}
                    enterKeyHint="send"
                    placeholder="Type one answer"
                    disabled={phase === "submitting"}
                    aria-describedby="answer-hint"
                  />
                  <button className="btn" type="submit" disabled={phase === "submitting" || !answer.trim()}>
                    {phase === "submitting" ? "Locking…" : "Lock"}
                  </button>
                </form>
              )}

              {phase === "clarify" && clarify && (
                <div className="clarify" role="group" aria-labelledby="clarify-title">
                  {clarify.reason === "ambiguous" ? (
                    <>
                      <p id="clarify-title">
                        <strong>“{clarify.text}”</strong> matches more than one answer. Which did you mean?
                      </p>
                      <div className="clarify-options">
                        {clarify.options.map((o, i) => (
                          <button key={o.entityId} type="button" className="btn btn-small" autoFocus={i === 0} onClick={() => void submit(clarify.text, { entityChoice: o.entityId })}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p id="clarify-title">
                        Did you mean <strong>{clarify.suggestion}</strong>?
                      </p>
                      <div className="clarify-options">
                        <button type="button" className="btn btn-small" autoFocus onClick={() => void submit(clarify.suggestion)}>
                          Yes, lock “{clarify.suggestion}”
                        </button>
                        <button type="button" className="btn btn-small btn-ghost" onClick={() => void submit(clarify.text, { freshKey: true })}>
                          No, lock “{clarify.text}”
                        </button>
                      </div>
                    </>
                  )}
                  <p className="hint">Your timer is still running. This is the only clarification this round.</p>
                </div>
              )}

              <p id="answer-hint" className="hint">
                One submission per round. Enter to lock. Spelling suggestions never change your answer without asking.
              </p>
              <p className="status-line" role="status">
                {phase === "submitting" ? "Checking with the server…" : message ? <span className="error-text">{message}</span> : null}
              </p>
            </section>
          )}

          {phase === "reveal" && revealed && (
            <section className="intro" aria-labelledby="round-heading">
              <div className="reveal">
                <div className="reveal-head">
                  <div>
                    <p className="eyebrow">Round {revealed.roundIndex} of 7</p>
                    <h1 id="round-heading" className="reveal-answer">
                      {revealed.outcome === "valid" ? revealed.canonicalName : revealed.outcome === "timed_out" ? "Time’s up" : "Not on our list"}
                    </h1>
                  </div>
                  {revealed.outcome === "valid" ? (
                    <span className="tier" data-tier={revealed.tier}>
                      {revealed.tier}
                    </span>
                  ) : (
                    <span className="tier" data-tier="None">
                      No distance
                    </span>
                  )}
                </div>
                {revealed.outcome === "valid" ? (
                  <p className="reveal-gain num">
                    +{fmt(revealed.points ?? 0)} pts · +{fmt(revealed.distanceM ?? 0)} m
                  </p>
                ) : (
                  <p className="hint">
                    {revealed.outcome === "timed_out"
                      ? "No distance this round. The expedition presses on."
                      : revealed.submittedText
                        ? `“${revealed.submittedText}” isn’t in this prompt’s reviewed answer list. We may have missed a valid answer.`
                        : "No distance this round."}
                  </p>
                )}
                {revealed.prompt && <p className="hint">Prompt: {revealed.prompt}</p>}
                {revealed.outcome === "valid" && (revealed.sourceCards?.length ?? 0) > 0 && (
                  <details>
                    <summary>Why this counts — {revealed.sourceCards!.length} source{revealed.sourceCards!.length > 1 ? "s" : ""}</summary>
                    <ul className="sources">
                      {revealed.sourceCards!.map((s) => (
                        <li key={s.url} className="source-card">
                          <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => track("source_card_opened", { category: (revealed.topic ?? "general").slice(0, 40), sourceTier: s.sourceTier })}>
                            {s.title}
                          </a>
                          <span className="meta">
                            {s.publisher ?? "Unknown publisher"} · Tier {s.sourceTier} ·{" "}
                            <span className={s.reviewStatus === "reviewed" ? "" : "badge badge-warn"}>{s.reviewStatus === "reviewed" ? "reviewed" : "candidate — awaiting review"}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {revealed.outcome !== "timed_out" && revealed.runRoundId && (
                  <Link className="hint" href={`/appeal?round=${revealed.runRoundId}`}>
                    {revealed.outcome === "valid" ? "Report a problem with this answer" : "Think this should count? Appeal"}
                  </Link>
                )}
              </div>
              <div className="panel-actions reveal-actions">
                {!travelDone && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setSkipped(true);
                      setSkipKey((k) => k + 1);
                      setTravelDone(true);
                    }}
                  >
                    Skip animation
                  </button>
                )}
                <button ref={nextRef} type="button" className="btn" onClick={continueOn} disabled={!travelDone} aria-disabled={!travelDone}>
                  {run.state === "completed" ? "See your expedition" : `Next: round ${run.currentRound}`}
                </button>
              </div>
            </section>
          )}

          {phase === "complete" && (
            <section className="intro" aria-labelledby="round-heading">
              <p className="eyebrow">Operation complete</p>
              <h1 id="round-heading" className="prompt num">
                {fmt(run.distanceM)} m traversed
              </h1>
              <p className="hint num">{fmt(run.score)} points</p>
              <div className="panel-actions">
                {run.shareToken ? (
                  <Link className="btn" href={`/results/${run.shareToken}`} autoFocus>
                    See your expedition
                  </Link>
                ) : (
                  <Link className="btn" href="/">
                    Back to start
                  </Link>
                )}
              </div>
            </section>
          )}

          {phase === "recovery" && (
            <section className="intro" aria-labelledby="round-heading" role="alert">
              <h1 id="round-heading" className="prompt">
                Reconnecting…
              </h1>
              <p className="hint">
                Your answers are stored on the server, and its clock keeps running. We&apos;ll retry automatically — any round whose timer ended while offline is scored as timed out.
              </p>
              <div className="panel-actions">
                <button className="btn" type="button" onClick={() => void pendingRef.current?.()}>
                  Retry now
                </button>
              </div>
            </section>
          )}

          {phase === "error" && (
            <section className="intro" aria-labelledby="round-heading" role="alert">
              <h1 id="round-heading" className="prompt">
                {fatal?.code === "UNAUTHENTICATED" ? "Session expired" : "Expedition unavailable"}
              </h1>
              <p className="hint">{fatal?.message ?? "Something went wrong."}</p>
              <div className="panel-actions">
                <Link className="btn" href="/">
                  Back to start
                </Link>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
