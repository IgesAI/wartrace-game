"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";

export function AppealTriage({ appealId, status, statuses, disabled }: { appealId: string; status: string; statuses: readonly string[]; disabled: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label htmlFor={`s-${appealId}`} className="sr-only">
        Appeal status
      </label>
      <select
        id={`s-${appealId}`}
        className="field"
        style={{ minHeight: 36, fontSize: "0.875rem" }}
        value={value}
        disabled={disabled}
        onChange={async (e) => {
          const next = e.target.value;
          setValue(next);
          setError(null);
          try {
            await api(`/api/v1/admin/appeals/${appealId}`, { method: "POST", body: { status: next, note: "" } });
            router.refresh();
          } catch (err) {
            setValue(status);
            setError(err instanceof ApiError ? err.message : "Failed");
          }
        }}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      {error && <span className="error-text hint">{error}</span>}
    </div>
  );
}
