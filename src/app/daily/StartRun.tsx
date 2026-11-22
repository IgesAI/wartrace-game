"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/SiteFooter";
import { ApiError, api } from "@/lib/api";
import { track, viewportBucket } from "@/lib/track";

type Run = { runId: string; operation: { dateKey: string } };

export function StartRun({ referred }: { referred: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    api<Run>("/api/v1/runs", { method: "POST", body: { referred } })
      .then((run) => {
        track("game_started", { challengeDate: run.operation.dateKey, platform: viewportBucket() }, run.operation.dateKey);
        if (referred) track("referral_game_started", { challengeDate: run.operation.dateKey }, run.operation.dateKey);
        router.replace(`/game/${run.runId}`);
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e : new ApiError("INTERNAL", 500, "Something went wrong")));
  }, [attempt, referred, router]);

  return (
    <div className="page">
      <PageHeader />
      <main id="main" className="prose" aria-live="polite">
        {!error && (
          <>
            <h1>Preparing your expedition…</h1>
            <p>Loading today&apos;s operation.</p>
          </>
        )}
        {error?.code === "NO_DAILY" && (
          <>
            <h1>No operation today yet</h1>
            <p>Today&apos;s challenge has not been published. Please check back at the next release.</p>
            <p>
              <Link href="/">Back to start</Link>
            </p>
          </>
        )}
        {error && error.code !== "NO_DAILY" && (
          <>
            <h1>{error.code === "RATE_LIMITED" ? "Too many requests" : error.code === "NETWORK" ? "Connection lost" : "Couldn’t start"}</h1>
            <p>{error.message}</p>
            <div className="panel-actions">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setError(null);
                  setAttempt((a) => a + 1);
                }}
              >
                Try again
              </button>
              <Link className="btn btn-ghost" href="/">
                Back to start
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
