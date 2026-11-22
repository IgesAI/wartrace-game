"use client";

import { useCallback } from "react";
import { WorldScene } from "@/game/WorldScene";
import { track } from "@/lib/track";
import { usePrefs } from "@/lib/prefs";

/** Decorative scene for non-game pages (landing, results). */
export function LiveScene({ distanceM = 0, className }: { distanceM?: number; className?: string }) {
  const { reducedMotion } = usePrefs();
  const onRenderer = useCallback((info: { type: "pixi" | "svg-fallback"; reason?: string }) => {
    if (info.type === "svg-fallback" && (info.reason === "webgl_unavailable" || info.reason === "init_failed")) {
      track("renderer_fallback_used", { reason: info.reason });
    }
  }, []);
  return <WorldScene distanceM={distanceM} reducedMotion={reducedMotion} onRenderer={onRenderer} className={className} />;
}
