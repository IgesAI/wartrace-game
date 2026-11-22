"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";

const ROLES = [
  { subject: "dev:reader", label: "Reader", note: "read-only" },
  { subject: "dev:editor", label: "Editor", note: "edit, triage appeals — cannot publish" },
  { subject: "dev:reviewer", label: "Reviewer", note: "independent review" },
  { subject: "dev:publisher", label: "Publisher", note: "publish, rollback, disable" },
  { subject: "dev:owner", label: "Owner", note: "all capabilities" },
];

export function DevLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: "var(--space-2)" }}>
      {ROLES.map((r) => (
        <button
          key={r.subject}
          type="button"
          className="btn btn-ghost"
          style={{ justifyContent: "space-between" }}
          onClick={async () => {
            setError(null);
            try {
              await api("/api/v1/admin/session", { method: "POST", body: { subject: r.subject } });
              router.push("/admin");
              router.refresh();
            } catch (e) {
              setError(e instanceof ApiError ? e.message : "Sign-in failed");
            }
          }}
        >
          <span>Sign in as {r.label}</span>
          <span className="hint">{r.note}</span>
        </button>
      ))}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
