"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export function ChallengeTracker({ date, referral }: { date: string; referral: boolean }) {
  useEffect(() => {
    track("challenge_link_opened", { challengeDate: date, channel: "link", referralTokenPresent: referral }, date);
  }, [date, referral]);
  return null;
}
