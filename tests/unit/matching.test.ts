import { describe, expect, it } from "vitest";
import { matchAnswer, resolveChoice } from "@/modules/domain/matcher";
import { isAnswerWithinLimit, normalizeAnswer } from "@/modules/domain/normalize";
import { awardForRarity } from "@/modules/domain/scoring";
import type { SnapshotAnswer, SnapshotQuestion } from "@/modules/domain/snapshot";

const answer = (entityId: string, name: string, rarity: number, aliases: string[], disambiguation: string | null = null): SnapshotAnswer => {
  const a = awardForRarity(rarity);
  return {
    entityId,
    canonicalName: name,
    disambiguation,
    rarityScore: rarity,
    ...a,
    inclusionRationale: "test",
    evidenceStatus: "reviewed",
    aliases: aliases.map((d) => ({ display: d, normalized: normalizeAnswer(d) })),
    evidence: [],
  };
};

const ships: SnapshotQuestion = {
  roundIndex: 1,
  questionVersionId: "q1",
  familyKey: "test.ships",
  version: 1,
  prompt: "Name a ship",
  topic: "Exploration",
  coverageClass: "finite_certified",
  answers: [
    answer("nina", "Niña", 0.25, ["Niña", "Nina", "La Niña"]),
    answer("pinta", "Pinta", 0.3, ["Pinta"]),
    answer("santa-maria", "Santa María", 0.1, ["Santa María", "Santa Maria"]),
  ],
};

const people: SnapshotQuestion = {
  ...ships,
  questionVersionId: "q2",
  answers: [
    answer("john-smith-a", "John Smith", 0.4, ["John Smith"], "explorer, 1580–1631"),
    answer("john-smith-b", "John Smith", 0.8, ["John Smith"], "aviator"),
    answer("tereshkova", "Valentina Tereshkova", 0.4, ["Valentina Tereshkova", "Tereshkova"]),
  ],
};

describe("normalization", () => {
  it("NFKC, case folding, whitespace collapse, punctuation variants", () => {
    expect(normalizeAnswer("  SANTA   maría ")).toBe("santa maría");
    expect(normalizeAnswer("Ｐｉｎｔａ")).toBe("pinta");
    expect(normalizeAnswer("Edwin \u2018Buzz\u2019 Aldrin")).toBe("edwin 'buzz' aldrin");
    expect(normalizeAnswer("Austria\u2013Hungary")).toBe("austria-hungary");
    expect(normalizeAnswer("Stra\u00DFe")).toBe("strasse");
    expect(normalizeAnswer("Pin\u200Bta")).toBe("pinta");
  });

  it("does not strip diacritics globally (T-021 requires reviewed aliases)", () => {
    expect(normalizeAnswer("Niña")).not.toBe(normalizeAnswer("Nina"));
    expect(normalizeAnswer("Nin\u0303a")).toBe(normalizeAnswer("Niña"));
  });

  it("T-016: 120 code point limit counts Unicode, not UTF-16 units", () => {
    expect(isAnswerWithinLimit("a".repeat(120))).toBe(true);
    expect(isAnswerWithinLimit("a".repeat(121))).toBe(false);
    expect(isAnswerWithinLimit("𝔸".repeat(120))).toBe(true);
  });
});

describe("answer matching", () => {
  it("T-020: canonical answer", () => {
    const r = matchAnswer(ships, "Pinta");
    expect(r.kind === "match" && r.answer.entityId).toBe("pinta");
  });

  it("T-021/T-023: diacritic and unaccented approved aliases both resolve", () => {
    for (const s of ["Niña", "nina", "LA NIÑA", "santa maria"]) expect(matchAnswer(ships, s).kind).toBe("match");
  });

  it("T-022: wrong answer is none", () => {
    expect(matchAnswer(ships, "Mayflower").kind).toBe("none");
  });

  it("blank is blank", () => {
    expect(matchAnswer(ships, "   \u200B ").kind).toBe("blank");
  });

  it("T-024: shared alias across two entities is ambiguous and resolvable only by explicit choice", () => {
    const r = matchAnswer(people, "john smith");
    expect(r.kind).toBe("ambiguous");
    expect(resolveChoice(people, "john smith", "john-smith-b")?.points).toBe(awardForRarity(0.8).points);
    expect(resolveChoice(people, "john smith", "tereshkova")).toBeNull();
  });

  it("T-025: HTML payloads never match and are treated as plain text", () => {
    expect(matchAnswer(ships, "<img src=x onerror=alert(1)>").kind).toBe("none");
    expect(matchAnswer(ships, "Pinta<script>").kind).not.toBe("match");
  });

  it("T-026: confusable Cyrillic letters are not accepted", () => {
    expect(matchAnswer(ships, "Pint\u0430").kind).not.toBe("match");
  });

  it("T-027: fuzzy typo yields a non-awarding suggestion only", () => {
    const r = matchAnswer(people, "Tereshkovva");
    expect(r).toEqual({ kind: "suggest", suggestion: { entityId: "tereshkova", display: "Tereshkova" } });
    expect(matchAnswer(people, "Valentina Tereshkovaa")).toEqual({ kind: "suggest", suggestion: { entityId: "tereshkova", display: "Valentina Tereshkova" } });
    expect(matchAnswer(people, "Teresh").kind).toBe("none");
  });

  it("fuzzy suggestion is withheld when two entities are equally close", () => {
    const q: SnapshotQuestion = { ...ships, answers: [answer("x", "Gold", 0.5, ["Gold Beach"]), answer("y", "Cold", 0.5, ["Cold Beach"])] };
    expect(matchAnswer(q, "Bold Beach").kind).toBe("none");
  });

  it("same input yields identical result across 100 repeats", () => {
    const first = JSON.stringify(matchAnswer(ships, "LA niña"));
    for (let i = 0; i < 100; i++) expect(JSON.stringify(matchAnswer(ships, "LA niña"))).toBe(first);
  });
});
