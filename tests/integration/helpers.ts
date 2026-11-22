import { randomUUID } from "node:crypto";
import { createPgliteDb, type DB } from "@/modules/db/client";
import { createGuest } from "@/modules/auth/guest";
import { DEMO_HISTORY_QUESTIONS } from "@/modules/content/demo-history";
import { ensureDemoContent } from "@/modules/content/seed";
import type { GameConfig } from "@/modules/game/service";

export const SECRET = "test-secret-test-secret-test-secret-0001";
export const T0 = new Date("2026-11-22T15:00:00Z"); // 10:00 EST, date key 2026-11-22

export async function freshDb(): Promise<{ db: DB; close: () => Promise<void> }> {
  const h = await createPgliteDb("memory://");
  return { db: h.db, close: h.close };
}

export async function seededDb(now = T0) {
  const h = await freshDb();
  await ensureDemoContent(h.db, now);
  return h;
}

export async function guest(db: DB) {
  return (await createGuest(db, SECRET)).guestId;
}

export const cfgAt = (now: Date, extra: Partial<GameConfig> = {}): GameConfig => ({ now, roundSeconds: 25, demoAllowed: true, ...extra });

export const plus = (d: Date, ms: number) => new Date(d.getTime() + ms);

export const key = () => randomUUID();

/** First alias of the rarest answer per demo round — used to drive full playthroughs. */
export const DEMO_ANSWERS = DEMO_HISTORY_QUESTIONS.map((q) => {
  const best = [...q.answers].sort((a, b) => b.rarity - a.rarity)[0]!;
  return { alias: best.aliases[0]!, rarity: best.rarity };
});
