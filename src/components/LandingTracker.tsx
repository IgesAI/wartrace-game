"use client";

import { useEffect } from "react";
import { usePrefs } from "@/lib/prefs";
import { track, viewportBucket } from "@/lib/track";

export function LandingTracker() {
  const { reducedMotion } = usePrefs();
  useEffect(() => {
    track("landing_viewed", { viewport: viewportBucket(), reducedMotion });
    // Once per page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
