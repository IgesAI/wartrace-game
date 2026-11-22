/**
 * Canonical WARTRACE scoring (specs/scoring_reference.ts, scoring version wartrace-rarity-v1).
 * Uses JavaScript Math.round on nonnegative values; this is the cross-runtime contract.
 */
export const SCORING_VERSION_ID = "wartrace-rarity-v1";
export const SCORING_PARAMETERS = {
  basePoints: 100,
  rarityPoints: 900,
  exponent: 1.3,
  metresPerPoint: 0.8,
} as const;

export const ROUNDS_PER_OPERATION = 7;
export const ROUND_SECONDS = 25;
export const MAX_ANSWER_LENGTH = 120;
export const MAX_POINTS_PER_ROUND = 1000;
export const MAX_DISTANCE_PER_ROUND = 800;
export const MAX_TOTAL_SCORE = MAX_POINTS_PER_ROUND * ROUNDS_PER_OPERATION;
export const MAX_TOTAL_DISTANCE_M = MAX_DISTANCE_PER_ROUND * ROUNDS_PER_OPERATION;

export type Tier = "Common" | "Curious" | "Uncommon" | "Obscure";
export type Award = { points: number; distanceM: number; tier: Tier | "None" };

export function tierForRarity(rarityScore: number): Tier {
  return rarityScore < 0.25 ? "Common" : rarityScore < 0.5 ? "Curious" : rarityScore < 0.75 ? "Uncommon" : "Obscure";
}

export function awardForRarity(rarityScore: number): Award & { tier: Tier } {
  if (!Number.isFinite(rarityScore) || rarityScore < 0 || rarityScore > 1) {
    throw new RangeError("rarityScore must be finite within [0,1]");
  }
  const { basePoints, rarityPoints, exponent, metresPerPoint } = SCORING_PARAMETERS;
  const points = basePoints + Math.round(rarityPoints * Math.pow(rarityScore, exponent));
  const distanceM = Math.round(points * metresPerPoint);
  return { points, distanceM, tier: tierForRarity(rarityScore) };
}

export function awardForOutcome(valid: boolean, rarityScore?: number): Award {
  if (!valid) return { points: 0, distanceM: 0, tier: "None" };
  if (rarityScore === undefined) throw new Error("Missing published rarity");
  return awardForRarity(rarityScore);
}

export type RankableResult = { score: number; validCount: number; completedAt: Date };

/** Tie-break: score desc -> valid count desc -> earliest completion asc. */
export function compareResults(a: RankableResult, b: RankableResult): number {
  if (a.score !== b.score) return b.score - a.score;
  if (a.validCount !== b.validCount) return b.validCount - a.validCount;
  return a.completedAt.getTime() - b.completedAt.getTime();
}
