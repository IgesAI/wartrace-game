import type { Tier } from "./scoring";

/** Immutable, checksummed answer snapshot frozen at publication. Server-only: never sent to clients. */
export type SnapshotEvidence = {
  title: string;
  publisher: string | null;
  url: string;
  sourceTier: "A" | "B" | "C" | "D";
  reviewStatus: string;
  retrievedAt: string;
};

export type SnapshotAnswer = {
  entityId: string;
  canonicalName: string;
  disambiguation: string | null;
  rarityScore: number;
  points: number;
  distanceM: number;
  tier: Tier;
  inclusionRationale: string;
  evidenceStatus: string;
  aliases: { normalized: string; display: string }[];
  evidence: SnapshotEvidence[];
};

export type SnapshotQuestion = {
  roundIndex: number;
  questionVersionId: string;
  familyKey: string;
  version: number;
  prompt: string;
  topic: string;
  coverageClass: string;
  answers: SnapshotAnswer[];
};

export type OperationSnapshot = {
  schema: 1;
  operationId: string;
  dateKey: string;
  version: number;
  title: string;
  contentClass: "verified" | "demo";
  scoringVersion: { identifier: string; algorithm: string; parameters: Record<string, number> };
  questions: SnapshotQuestion[];
};

/** Deterministic JSON (sorted keys) used for checksums. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}
