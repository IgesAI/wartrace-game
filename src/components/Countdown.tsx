"use client";

import { useEffect, useState } from "react";
import { formatCountdown, nextReleaseAt } from "@/modules/domain/dates";

/** Countdown to 00:00 America/New_York, anchored to server time to avoid client clock skew. */
export function Countdown({ serverNow, label = "Next operation in" }: { serverNow: string; label?: string }) {
  const [offset] = useState(() => Date.parse(serverNow) - Date.now());
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offset]);
  const at = now ?? Date.parse(serverNow);
  const ms = Math.max(0, nextReleaseAt(new Date(at)).getTime() - at);
  return (
    <p className="countdown">
      {label} <span className="num" suppressHydrationWarning>{formatCountdown(ms)}</span>{" "}
      <span className="sr-only">(midnight New York time)</span>
    </p>
  );
}
