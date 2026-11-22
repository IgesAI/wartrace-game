import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lintAssets } from "@/modules/assets/register";
import { validateEvent } from "@/modules/analytics/events";
import { issueAdminCookie, resolveAdmin } from "@/modules/auth/admin";
import { createGuest, resolveGuest } from "@/modules/auth/guest";
import { sha256Hex } from "@/modules/auth/tokens";
import { ensureDevAdmins } from "@/modules/content/seed";
import type { DB } from "@/modules/db/client";
import { adminUsers, guestSessions } from "@/modules/db/schema";
import { appealInputSchema, submitAppeal } from "@/modules/game/appeals";
import { newShareToken, openRound, startOrResumeRun, submitRound } from "@/modules/game/service";
import { takeToken } from "@/server/rate-limit";
import realRegister from "../../assets/asset-register.json";
import { DEMO_HISTORY_QUESTIONS } from "@/modules/content/demo-history";
import { SECRET, T0, cfgAt, guest, key, plus, seededDb } from "./helpers";

let db: DB;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await seededDb());
});
afterAll(async () => close());

describe("guest sessions (T-040/T-041)", () => {
  it("stores only a hash of the cookie secret and rejects forged or tampered cookies", async () => {
    const created = await createGuest(db, SECRET);
    const raw = created.cookieValue.slice(0, created.cookieValue.lastIndexOf("."));
    const [row] = await db.select().from(guestSessions).where(eq(guestSessions.id, created.guestId));
    expect(row!.secretHash).toBe(sha256Hex(raw));
    expect(row!.secretHash).not.toContain(raw);
    expect(await resolveGuest(db, created.cookieValue, SECRET)).toBe(created.guestId);
    expect(await resolveGuest(db, `${raw}.forged`, SECRET)).toBeNull();
    expect(await resolveGuest(db, created.cookieValue, "another-secret-another-secret-0002")).toBeNull();
    expect(await resolveGuest(db, `${created.guestId}.x`, SECRET)).toBeNull();
    expect(await resolveGuest(db, created.cookieValue, SECRET, new Date(Date.now() + 500 * 86_400_000))).toBeNull();
  });
});

describe("answer bank never reaches the client (T-046)", () => {
  it("run views expose only opened prompts and the player's own locked entity", async () => {
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    const opened = await openRound(db, run.runId, g, 1, cfgAt(T0));
    const payload = JSON.stringify(opened);
    expect(payload).not.toMatch(/rarity|alias|normalized|inclusionRationale/i);
    for (const q of DEMO_HISTORY_QUESTIONS.slice(1)) expect(payload).not.toContain(q.prompt);
    for (const a of DEMO_HISTORY_QUESTIONS[0]!.answers) expect(payload).not.toContain(a.canonicalName);
    const res = await submitRound(db, { runId: run.runId, guestId: g, roundIndex: 1, answer: "Pharos", idempotencyKey: key() }, cfgAt(plus(T0, 1000)));
    const after = JSON.stringify(res);
    expect(after).toContain("Lighthouse of Alexandria");
    expect(after).not.toContain("Mausoleum");
    expect(after).not.toMatch(/rarityScore|aliases/);
  });
});

describe("share tokens (T-042)", () => {
  it("are 192-bit random URL-safe strings with no collisions in 10k draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      const t = newShareToken();
      expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
      seen.add(t);
    }
    expect(seen.size).toBe(10_000);
  });
});

describe("admin sessions (T-043)", () => {
  it("rejects tampered, expired and deactivated admin cookies; role is re-read from the DB", async () => {
    const actor = await ensureDevAdmins(db);
    const pub = actor("dev:publisher");
    const c = issueAdminCookie(pub.id, SECRET);
    expect((await resolveAdmin(db, c.value, SECRET))?.role).toBe("publisher");
    expect(await resolveAdmin(db, c.value.replace(pub.id, actor("dev:owner").id), SECRET)).toBeNull();
    expect(await resolveAdmin(db, c.value, SECRET, new Date(Date.now() + 9 * 3600_000))).toBeNull();
    await db.update(adminUsers).set({ role: "reader" }).where(eq(adminUsers.id, pub.id));
    expect((await resolveAdmin(db, c.value, SECRET))?.role).toBe("reader");
    await db.update(adminUsers).set({ active: false }).where(eq(adminUsers.id, pub.id));
    expect(await resolveAdmin(db, c.value, SECRET)).toBeNull();
  });
});

describe("appeals input safety (T-025/T-028)", () => {
  it("accepts plain text, rejects non-http evidence links and oversize text, and only for own rounds", async () => {
    expect(appealInputSchema.safeParse({ runRoundId: crypto.randomUUID(), category: "other", explanation: "x".repeat(3001) }).success).toBe(false);
    expect(
      appealInputSchema.safeParse({ runRoundId: crypto.randomUUID(), category: "other", explanation: "valid explanation", evidenceUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
    const g = await guest(db);
    const run = await startOrResumeRun(db, g, cfgAt(T0));
    await openRound(db, run.runId, g, 1, cfgAt(T0));
    const res = await submitRound(db, { runId: run.runId, guestId: g, roundIndex: 1, answer: "Temple of Apollo", idempotencyKey: key() }, cfgAt(plus(T0, 500)));
    if (res.kind !== "locked") throw new Error("expected lock");
    const input = appealInputSchema.parse({
      runRoundId: res.round.runRoundId,
      category: "missing_valid_answer",
      explanation: "<script>alert(1)</script> I believe this should count.",
      evidenceUrl: "https://example.org/source",
    });
    await expect(submitAppeal(db, await guest(db), input)).rejects.toThrow(/own rounds/);
    const created = await submitAppeal(db, g, input);
    expect(created.status).toBe("new");
    await expect(submitAppeal(db, g, input)).rejects.toThrow(/already exists/);
  });
});

describe("analytics redaction (docs/08)", () => {
  it("drops events carrying free text or unknown fields", () => {
    expect(validateEvent({ name: "answer_submitted", props: { roundIndex: 1, outcome: "valid", rarityTier: "Common", score: 100, distanceM: 80, elapsedMsBucket: "lt5s" } })).not.toBeNull();
    expect(
      validateEvent({ name: "answer_submitted", props: { roundIndex: 1, outcome: "valid", rarityTier: "Common", score: 100, distanceM: 80, elapsedMsBucket: "lt5s", answer: "Pinta" } }),
    ).toBeNull();
    expect(validateEvent({ name: "made_up_event", props: {} })).toBeNull();
    expect(validateEvent({ name: "client_error", props: { code: "Some free text", page: "game" } })).toBeNull();
  });
});

describe("rate limiting (T-045)", () => {
  it("token bucket exhausts and refills", () => {
    const k = `t-${Math.random()}`;
    const now = Date.now();
    let ok = 0;
    for (let i = 0; i < 40; i++) if (takeToken("submit", k, now)) ok++;
    expect(ok).toBe(30);
    expect(takeToken("submit", k, now + 4000)).toBe(true);
  });
});

describe("asset rights lint (addendum doc 21)", () => {
  const hashOf = () => "a".repeat(64);
  const base = (overrides: Record<string, unknown>) => ({
    version: "1.0",
    assets: [{ ...realRegister.assets[0]!, sha256: "a".repeat(64), ...overrides }],
  });

  it("allows labelled demo placeholders outside production but blocks them in production", () => {
    const nonProd = lintAssets({ register: base({}), hashOf, publicMediaFiles: [], referencedIds: [], production: false });
    expect(nonProd.issues.filter((i) => i.severity === "error")).toEqual([]);
    const prod = lintAssets({ register: base({}), hashOf, publicMediaFiles: [], referencedIds: [], production: true });
    expect(prod.issues.map((i) => i.code)).toContain("NOT_APPROVED");
  });

  it("rejects NC/ND licenses, missing credits, hash drift, unregistered files and references", () => {
    const codes = (reg: unknown, extra: Partial<Parameters<typeof lintAssets>[0]> = {}) =>
      lintAssets({ register: reg, hashOf, publicMediaFiles: [], referencedIds: [], production: false, ...extra }).issues.map((i) => i.code);
    expect(codes(base({ license_id: "CC-BY-NC-4.0" }))).toContain("LICENSE_BLOCKED");
    expect(codes(base({ license_id: "CC-BY-SA-4.0" }))).toContain("LICENSE_HOLD");
    expect(codes(base({ credit_required: true, credit_text: null }))).toContain("CREDIT_MISSING");
    expect(codes(base({ sha256: "b".repeat(64) }))).toContain("HASH_MISMATCH");
    expect(codes(base({}), { publicMediaFiles: ["public/worlds/scraped.png"] })).toContain("UNREGISTERED_FILE");
    expect(codes(base({}), { referencedIds: ["SFX-UNKNOWN"] })).toContain("UNREGISTERED_REFERENCE");
    expect(codes(base({ approved_for_release: true }))).toContain("INCONSISTENT_APPROVAL");
  });
});
