"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sceneSvg } from "./art/scene-svg";
import type { SceneHandle } from "./pixi-scene";

type Props = {
  distanceM: number;
  rare?: boolean;
  reducedMotion: boolean;
  /** Changing this value jumps the camera straight to `distanceM` (Skip Animation). */
  skipKey?: number;
  onTravelDone?: () => void;
  onRenderer?: (info: { type: "pixi" | "svg-fallback"; reason?: string }) => void;
  className?: string;
};

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class WebglUnavailable extends Error {}

/** Pixi renders the world; HTML owns every control. The SVG still frame is shown while Pixi loads and as the GPU-free fallback. */
export function WorldScene({ distanceM, rare, reducedMotion, skipKey = 0, onTravelDone, onRenderer, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<SceneHandle | null>(null);
  const [mode, setMode] = useState<"loading" | "pixi" | "svg">("loading");
  const [initialDistance] = useState(distanceM);
  const doneRef = useRef(onTravelDone);
  const rendererRef = useRef(onRenderer);
  useEffect(() => {
    doneRef.current = onTravelDone;
    rendererRef.current = onRenderer;
  });

  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    if (!el) return;
    Promise.resolve()
      .then(() => {
        if (!webglAvailable()) throw new WebglUnavailable();
        return import("./pixi-scene");
      })
      .then(({ createPixiScene }) => createPixiScene(el, { initialDistanceM: initialDistance, reducedMotion }))
      .then((h) => {
        if (cancelled) return h.destroy();
        handle.current = h;
        setMode("pixi");
        rendererRef.current?.({ type: "pixi" });
      })
      .catch((err) => {
        if (cancelled) return;
        const reason = err instanceof WebglUnavailable ? "webgl_unavailable" : "init_failed";
        if (reason === "init_failed") console.warn("WARTRACE renderer fallback", err);
        setMode("svg");
        rendererRef.current?.({ type: "svg-fallback", reason });
      });
    return () => {
      cancelled = true;
      handle.current?.destroy();
      handle.current = null;
    };
    // The renderer is created once; motion preference changes are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handle.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion, mode]);

  useEffect(() => {
    if (mode === "pixi" && handle.current) {
      handle.current.travelTo(distanceM, { rare }).then(() => doneRef.current?.());
    } else if (mode === "svg") {
      const t = setTimeout(() => doneRef.current?.(), reducedMotion ? 0 : 450);
      return () => clearTimeout(t);
    }
  }, [distanceM, rare, mode, reducedMotion]);

  useEffect(() => {
    if (skipKey > 0) handle.current?.travelTo(distanceM, { instant: true });
    // Only a new skip request should jump; distance changes are animated above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipKey]);

  const still = useMemo(() => sceneSvg({ offsetM: mode === "svg" ? distanceM : initialDistance, width: 960 }), [mode, distanceM, initialDistance]);

  return (
    <div className={`world ${className ?? ""}`} data-renderer={mode} aria-hidden="true">
      <div
        className={`world-still ${mode === "pixi" ? "is-hidden" : ""} ${mode === "svg" && !reducedMotion ? "is-animated" : ""}`}
        key={mode === "svg" ? distanceM : "still"}
        dangerouslySetInnerHTML={{ __html: still }}
      />
      <div ref={host} className="world-canvas" />
      <div className="world-vignette" />
    </div>
  );
}
