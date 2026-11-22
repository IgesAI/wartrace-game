"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { track } from "@/lib/track";

const CATEGORIES = [
  { value: "missing_valid_answer", label: "My answer is valid but was rejected" },
  { value: "ambiguous_alias", label: "The answer matched the wrong thing" },
  { value: "incorrect_source", label: "A source or fact looks wrong" },
  { value: "other", label: "Something else" },
] as const;

export function AppealForm({ runRoundId }: { runRoundId: string }) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("missing_valid_answer");
  const [explanation, setExplanation] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "done") {
    return (
      <div className="notice" role="status">
        <h2>Appeal received</h2>
        <p>Thanks — an editor will review it. Accepted corrections are noted in the operation&apos;s change log.</p>
      </div>
    );
  }

  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setState("sending");
        try {
          await api("/api/v1/appeals", { method: "POST", body: { runRoundId, category, explanation, evidenceUrl } });
          track("answer_appeal_submitted", { category });
          setState("done");
        } catch (err) {
          setState("idle");
          if (err instanceof ApiError && err.code === "BAD_REQUEST" && Array.isArray(err.details)) {
            setError((err.details as { path: string; message: string }[]).map((d) => `${d.path || "form"}: ${d.message}`).join("; "));
          } else setError(err instanceof ApiError ? err.message : "Something went wrong");
        }
      }}
    >
      <div>
        <label htmlFor="category">What&apos;s wrong?</label>
        <select id="category" className="field" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="explanation">Explain (10–3000 characters)</label>
        <textarea id="explanation" className="field" value={explanation} onChange={(e) => setExplanation(e.target.value)} minLength={10} maxLength={3000} required />
      </div>
      <div>
        <label htmlFor="evidence">Evidence link (optional)</label>
        <input id="evidence" className="field" type="url" inputMode="url" placeholder="https://" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} maxLength={2048} />
      </div>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div>
        <button className="btn" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send appeal"}
        </button>
      </div>
    </form>
  );
}
