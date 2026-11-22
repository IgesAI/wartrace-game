"use client";

import type { EventName } from "@/modules/analytics/events";

/** Fire-and-forget; the server drops events unless analytics is enabled and the payload passes the contract. */
export function track(name: EventName, props: Record<string, unknown>, challengeDate?: string) {
  try {
    const body = JSON.stringify({ name, props, ...(challengeDate ? { challengeDate } : {}) });
    fetch("/api/v1/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {
    /* analytics must never break gameplay */
  }
}

export function viewportBucket(): "mobile" | "tablet" | "desktop" {
  const w = typeof window === "undefined" ? 1440 : window.innerWidth;
  return w < 640 ? "mobile" : w < 1100 ? "tablet" : "desktop";
}
