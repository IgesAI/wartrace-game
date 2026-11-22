import { describe, expect, it } from "vitest";
import vectors from "../../specs/scoring_vectors.json";
import * as reference from "../../specs/scoring_reference";
import {
  MAX_TOTAL_DISTANCE_M,
  MAX_TOTAL_SCORE,
  awardForOutcome,
  awardForRarity,
  compareResults,
  tierForRarity,
} from "@/modules/domain/scoring";

describe("scoring vectors (specs/scoring_vectors.json)", () => {
  it.each(vectors.cases)("rarity $rarityScore -> $points pts / $distanceM m / $tier", (c) => {
    expect(awardForRarity(c.rarityScore)).toEqual({ points: c.points, distanceM: c.distanceM, tier: c.tier });
  });

  it("invalid outcome matches vector", () => {
    expect(awardForOutcome(false)).toEqual(vectors.invalidOutcome);
  });

  it("uses the declared scoring version", () => {
    expect(vectors.version).toBe("wartrace-rarity-v1");
  });
});

describe("scoring properties", () => {
  // Deterministic PRNG so failures are reproducible.
  let seed = 0x9e3779b9;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
  };

  it("T-033: 1,000 random cases agree with the handoff reference and are repeatable", () => {
    for (let i = 0; i < 1000; i++) {
      const r = rand();
      const a = awardForRarity(r);
      expect(a).toEqual(reference.awardForRarity(r));
      for (let k = 0; k < 3; k++) expect(awardForRarity(r)).toEqual(a);
      expect(a.points).toBeGreaterThanOrEqual(100);
      expect(a.points).toBeLessThanOrEqual(1000);
      expect(a.distanceM).toBe(Math.round(a.points * 0.8));
      expect(a.tier).toBe(tierForRarity(r));
    }
  });

  it("T-031: points are monotonic non-decreasing in rarity", () => {
    let prev = 0;
    for (let i = 0; i <= 10_000; i++) {
      const p = awardForRarity(i / 10_000).points;
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });

  it("T-030: endpoints and range errors", () => {
    expect(awardForRarity(0).points).toBe(100);
    expect(awardForRarity(1).points).toBe(1000);
    for (const bad of [-0.0001, 1.0001, NaN, Infinity]) expect(() => awardForRarity(bad)).toThrow(RangeError);
    expect(() => awardForOutcome(true)).toThrow();
  });

  it("T-034: seven maximal rounds equal the documented totals", () => {
    const top = awardForRarity(1);
    expect(top.points * 7).toBe(MAX_TOTAL_SCORE);
    expect(top.distanceM * 7).toBe(MAX_TOTAL_DISTANCE_M);
    expect(awardForRarity(0).distanceM * 7).toBe(560);
  });

  it("T-035: tie-breaks score desc, valid count desc, earliest completion", () => {
    const t = (s: string) => new Date(s);
    const rows = [
      { id: "c", score: 2000, validCount: 6, completedAt: t("2026-01-01T12:00:00Z") },
      { id: "a", score: 2500, validCount: 5, completedAt: t("2026-01-01T13:00:00Z") },
      { id: "b", score: 2000, validCount: 7, completedAt: t("2026-01-01T14:00:00Z") },
      { id: "d", score: 2000, validCount: 6, completedAt: t("2026-01-01T11:00:00Z") },
    ];
    expect(rows.sort(compareResults).map((r) => r.id)).toEqual(["a", "b", "d", "c"]);
  });
});
