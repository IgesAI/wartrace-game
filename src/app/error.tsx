"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track } from "@/lib/track";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    track("client_error", { code: "RENDER_ERROR", page: "other" });
  }, [error]);
  return (
    <div className="page">
      <main id="main" className="prose" role="alert">
        <h1>Something went wrong</h1>
        <p>Your game progress is stored on the server and hasn&apos;t been lost.</p>
        {error.digest && <p className="hint">Reference: {error.digest}</p>}
        <div className="panel-actions">
          <button className="btn" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-ghost" href="/">
            Back to start
          </Link>
        </div>
      </main>
    </div>
  );
}
