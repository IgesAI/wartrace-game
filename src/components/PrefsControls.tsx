"use client";

import { useEffect } from "react";
import { usePrefs } from "@/lib/prefs";

/** Motion and contrast toggles; applies data attributes to <html> so CSS honours them everywhere. */
export function PrefsControls({ compact = false }: { compact?: boolean }) {
  const { prefs, update, reducedMotion } = usePrefs();
  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.contrast = prefs.contrast;
  }, [reducedMotion, prefs.contrast]);
  return (
    <div className="hud-controls" role="group" aria-label="Display preferences">
      <button
        type="button"
        className="icon-btn"
        aria-pressed={reducedMotion}
        onClick={() => update({ motion: reducedMotion ? "full" : "reduced" })}
      >
        {compact ? "Motion" : reducedMotion ? "Motion: reduced" : "Motion: full"}
        <span className="sr-only">{compact ? (reducedMotion ? " reduced" : " full") : ""}</span>
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-pressed={prefs.contrast === "high"}
        onClick={() => update({ contrast: prefs.contrast === "high" ? "normal" : "high" })}
      >
        {compact ? "Contrast" : prefs.contrast === "high" ? "High contrast: on" : "High contrast: off"}
      </button>
    </div>
  );
}
