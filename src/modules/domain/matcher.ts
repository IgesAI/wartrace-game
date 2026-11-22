import { normalizeAnswer } from "./normalize";
import type { SnapshotAnswer, SnapshotQuestion } from "./snapshot";

export type MatchResult =
  | { kind: "blank" }
  | { kind: "match"; answer: SnapshotAnswer }
  | { kind: "ambiguous"; options: { entityId: string; canonicalName: string; disambiguation: string | null }[] }
  | { kind: "suggest"; suggestion: { entityId: string; display: string } }
  | { kind: "none" };

type Index = { byAlias: Map<string, SnapshotAnswer[]>; aliases: { normalized: string; display: string; answer: SnapshotAnswer }[] };
const indexCache = new WeakMap<SnapshotQuestion, Index>();

function indexFor(question: SnapshotQuestion): Index {
  const cached = indexCache.get(question);
  if (cached) return cached;
  const byAlias = new Map<string, SnapshotAnswer[]>();
  const aliases: Index["aliases"] = [];
  for (const answer of question.answers) {
    for (const alias of answer.aliases) {
      const list = byAlias.get(alias.normalized) ?? [];
      if (!list.includes(answer)) list.push(answer);
      byAlias.set(alias.normalized, list);
      aliases.push({ ...alias, answer });
    }
  }
  const idx = { byAlias, aliases };
  indexCache.set(question, idx);
  return idx;
}

export function levenshtein(a: string, b: string, max = Infinity): number {
  const A = [...a];
  const B = [...b];
  if (Math.abs(A.length - B.length) > max) return max + 1;
  let prev = Array.from({ length: B.length + 1 }, (_, i) => i);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= B.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (A[i - 1] === B[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[B.length]!;
}

/**
 * Exact approved-alias matching against a frozen question snapshot (docs/02_GAME_RULES.md).
 * Fuzzy results are suggestions only and never award points.
 */
export function matchAnswer(question: SnapshotQuestion, rawInput: string): MatchResult {
  const normalized = normalizeAnswer(rawInput);
  if (!normalized) return { kind: "blank" };
  const idx = indexFor(question);
  const hits = idx.byAlias.get(normalized);
  if (hits && hits.length === 1) return { kind: "match", answer: hits[0]! };
  if (hits && hits.length > 1) {
    return {
      kind: "ambiguous",
      options: hits.map((h) => ({ entityId: h.entityId, canonicalName: h.canonicalName, disambiguation: h.disambiguation })),
    };
  }
  if ([...normalized].length < 4) return { kind: "none" };
  const threshold = [...normalized].length <= 6 ? 1 : 2;
  let best: { distance: number; display: string; entityIds: Set<string> } | null = null;
  for (const alias of idx.aliases) {
    if ([...alias.normalized].length < 4) continue;
    const d = levenshtein(normalized, alias.normalized, threshold);
    if (d > threshold) continue;
    if (!best || d < best.distance) best = { distance: d, display: alias.display, entityIds: new Set([alias.answer.entityId]) };
    else if (d === best.distance) best.entityIds.add(alias.answer.entityId);
  }
  if (best && best.entityIds.size === 1) {
    return { kind: "suggest", suggestion: { entityId: [...best.entityIds][0]!, display: best.display } };
  }
  return { kind: "none" };
}

/** Resolves an explicit player choice between entities that share the typed alias. */
export function resolveChoice(question: SnapshotQuestion, rawInput: string, entityId: string): SnapshotAnswer | null {
  const hits = indexFor(question).byAlias.get(normalizeAnswer(rawInput)) ?? [];
  return hits.find((h) => h.entityId === entityId) ?? null;
}
