/**
 * In-memory token bucket. Single-instance only: a multi-instance deployment needs a shared store
 * (documented in docs/IMPLEMENTATION_DECISIONS.md). Keys are hashed session/IP approximations.
 */
type Bucket = { tokens: number; updated: number };
const g = globalThis as unknown as { __wartraceBuckets?: Map<string, Bucket> };
const buckets = (g.__wartraceBuckets ??= new Map());

export const LIMITS = {
  runs: { capacity: 20, perMinute: 20 },
  open: { capacity: 30, perMinute: 30 },
  submit: { capacity: 30, perMinute: 30 },
  appeal: { capacity: 5, perMinute: 1 },
  events: { capacity: 120, perMinute: 120 },
  admin: { capacity: 60, perMinute: 60 },
} as const;

export function takeToken(scope: keyof typeof LIMITS, key: string, now = Date.now()): boolean {
  const { capacity, perMinute } = LIMITS[scope];
  const id = `${scope}:${key}`;
  const b = buckets.get(id) ?? { tokens: capacity, updated: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.updated) / 60_000) * perMinute);
  b.updated = now;
  const ok = b.tokens >= 1;
  if (ok) b.tokens -= 1;
  buckets.set(id, b);
  if (buckets.size > 50_000) buckets.clear();
  return ok;
}
