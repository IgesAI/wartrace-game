"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";

type Props = { operationId: string; status: string; canPublish: boolean; hardBlockers: number; waivable: number; demoAllowed: boolean };

export function OperationActions({ operationId, status, canPublish, hardBlockers, waivable, demoAllowed }: Props) {
  const router = useRouter();
  const [demo, setDemo] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; details?: string[] } | null>(null);

  const run = async (path: string, body: unknown, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/v1/admin/operations/${operationId}/${path}`, { method: "POST", body });
      setMsg({ ok: true, text: done });
      router.refresh();
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError("INTERNAL", 500, "Failed");
      const details = Array.isArray(err.details) ? (err.details as { code?: string; message?: string }[]).map((d) => `${d.code ?? ""} ${d.message ?? ""}`.trim()) : undefined;
      setMsg({ ok: false, text: `${err.code}: ${err.message}`, details });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="notice" style={{ display: "grid", gap: 12 }} aria-labelledby="actions-title">
      <h2 id="actions-title">Actions</h2>
      {!canPublish && <p className="hint">Your role cannot publish, roll back or disable. The server enforces this regardless of what this page shows.</p>}
      {status !== "published" && (
        <div style={{ display: "grid", gap: 8 }}>
          {waivable > 0 && hardBlockers === 0 && (
            <label className="row" style={{ fontWeight: 400 }}>
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} disabled={!demoAllowed} />
              Publish as labelled DEMO content ({waivable} demo-waivable issues){!demoAllowed ? " — refused in this environment" : ""}
            </label>
          )}
          <div className="row">
            <button type="button" className="btn" disabled={busy} onClick={() => run("publish", { allowDemoContent: demo }, "Published and frozen.")}>
              Publish {demo ? "as demo" : ""}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy || reason.trim().length < 5}
              onClick={() => run("restore", { reason }, "Restored as the live version for its date.")}
            >
              Restore this version
            </button>
          </div>
        </div>
      )}
      {status === "published" && (
        <div className="row">
          <button type="button" className="btn btn-ghost" disabled={busy || reason.trim().length < 5} onClick={() => run("disable", { reason }, "Disabled.")}>
            Disable (take offline)
          </button>
        </div>
      )}
      <div>
        <label htmlFor="reason">Reason (required for restore/disable, audit logged)</label>
        <input id="reason" className="field" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </div>
      {msg && (
        <div role="status" className={msg.ok ? "" : "error-text"}>
          <p>{msg.text}</p>
          {msg.details && (
            <ul className="issue-list">
              {msg.details.map((d, i) => (
                <li key={i} data-severity="error">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
