"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Prefs = { motion: "system" | "reduced" | "full"; contrast: "normal" | "high"; sound: boolean };

const KEY = "wartrace.prefs.v1";
const DEFAULTS: Prefs = { motion: "system", contrast: "normal", sound: false };
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Prefs } | null = null;

function read(): Prefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (cached && cached.raw === raw) return cached.value;
  let value = DEFAULTS;
  try {
    value = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULTS;
  } catch {
    value = DEFAULTS;
  }
  cached = { raw, value };
  return value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
    window.removeEventListener("storage", cb);
  };
}

function systemReduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefs() {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULTS);
  const sysReduced = useSyncExternalStore(subscribe, systemReduced, () => false);
  const update = useCallback((patch: Partial<Prefs>) => {
    const next = { ...read(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: preference lasts for this page only */
    }
    cached = null;
    listeners.forEach((l) => l());
  }, []);
  const reducedMotion = prefs.motion === "reduced" || (prefs.motion === "system" && sysReduced);
  return { prefs, update, reducedMotion };
}
