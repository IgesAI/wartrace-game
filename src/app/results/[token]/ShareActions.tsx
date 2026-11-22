"use client";

import { useEffect, useState } from "react";
import type { ReplayInput } from "@/game/replay";
import { track } from "@/lib/track";

export function ResultTracker({ ownResult }: { ownResult: boolean }) {
  useEffect(() => {
    track("result_viewed", { ownResult });
  }, [ownResult]);
  return null;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function ShareActions({ token, challengeUrl, replay, distanceM }: { token: string; challengeUrl: string; replay: ReplayInput; distanceM: number }) {
  const [status, setStatus] = useState("");
  const [recording, setRecording] = useState<number | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [canRecord, setCanRecord] = useState<boolean | null>(null);
  const url = challengeUrl;
  const text = `I traversed ${distanceM.toLocaleString("en-US")} m on WARTRACE ${replay.dateKey}. Same seven questions — can you go farther?`;
  const cardUrl = `/api/v1/results/${token}/card`;

  useEffect(() => {
    // Feature detection is client-only; deferred so server and first client render agree.
    const id = setTimeout(() => {
      setCanShare(typeof navigator.share === "function");
      import("@/game/replay").then((m) => setCanRecord(m.replaySupported())).catch(() => setCanRecord(false));
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setStatus("Challenge link copied.");
      track("share_intent", { medium: "copy_link" });
    } catch {
      setStatus("Couldn’t access the clipboard — select and copy the link below.");
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "WARTRACE", text, url });
      track("share_intent", { medium: "native_share" });
    } catch {
      /* user dismissed */
    }
  };

  const downloadCard = async () => {
    setStatus("Preparing card…");
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error();
      download(await res.blob(), `wartrace-${replay.dateKey}.png`);
      setStatus("Card downloaded.");
      track("share_card_created", { format: "square" });
      track("share_intent", { medium: "download_card" });
    } catch {
      setStatus("Couldn’t create the card. Please try again.");
    }
  };

  const recordVideo = async () => {
    setRecording(0);
    setStatus("Recording your 9:16 recap… keep this tab visible.");
    try {
      const { recordReplay } = await import("@/game/replay");
      const blob = await recordReplay(replay, (p) => setRecording(p));
      if (!blob) {
        setStatus("Video recording isn’t supported in this browser — download the card instead.");
        return;
      }
      download(blob, `wartrace-${replay.dateKey}.${blob.type.includes("mp4") ? "mp4" : "webm"}`);
      setStatus("Recap video downloaded.");
      track("share_card_created", { format: "vertical_webm" });
      track("share_intent", { medium: "download_video" });
    } catch {
      setStatus("Recording failed — download the card instead.");
    } finally {
      setRecording(null);
    }
  };

  return (
    <section className="share-box" aria-labelledby="share-title">
      <div>
        <h2 id="share-title">Challenge a friend</h2>
        <p className="hint">Shares show distance and tiers only — never your answers or the prompts.</p>
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="share-preview" src={cardUrl} alt={`Share card: ${distanceM.toLocaleString("en-US")} metres on ${replay.dateKey}`} width={360} height={360} />
        <div style={{ display: "grid", gap: "var(--space-2)", flex: "1 1 220px" }}>
          <button type="button" className="btn" onClick={copy}>
            Copy challenge link
          </button>
          {canShare && (
            <button type="button" className="btn btn-ghost" onClick={share}>
              Share…
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={downloadCard}>
            Download card (PNG)
          </button>
          {canRecord !== false && (
            <button type="button" className="btn btn-ghost" onClick={recordVideo} disabled={recording !== null || canRecord === null}>
              {recording !== null ? `Recording… ${Math.round(recording * 100)}%` : "Create 9:16 recap video"}
            </button>
          )}
          <label htmlFor="share-url" className="hint" style={{ marginTop: "var(--space-2)" }}>
            Challenge link
          </label>
          <input id="share-url" className="field" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        </div>
      </div>
      <p className="status-line" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
