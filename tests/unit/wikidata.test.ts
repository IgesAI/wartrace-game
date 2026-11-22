import { describe, expect, it } from "vitest";
import { WIKIDATA_USER_AGENT, buildEntitiesUrl, fetchWikidataCandidates } from "@/modules/content/sources/wikidata";

const body = {
  entities: {
    Q12501: {
      id: "Q12501",
      labels: { en: { value: "Great Wall of China" } },
      descriptions: { en: { value: "series of fortifications" } },
      aliases: { en: [{ value: "Great Wall" }, { value: "Great Wall of China" }, { value: "Great Wall" }] },
      sitelinks: { enwiki: { title: "Great Wall of China" } },
    },
    Q999999999: { id: "Q999999999", missing: "" },
  },
};

describe("Wikidata adapter", () => {
  it("builds a bounded wbgetentities request", () => {
    const url = new URL(buildEntitiesUrl(["Q1", "Q2"]));
    expect(url.hostname).toBe("www.wikidata.org");
    expect(url.searchParams.get("ids")).toBe("Q1|Q2");
    expect(url.searchParams.get("action")).toBe("wbgetentities");
  });

  it("maps entities to tier-C candidates only, with provenance and a descriptive User-Agent", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(body), { status: 200 });
    };
    const res = await fetchWikidataCandidates(["q12501", "Q999999999"], { fetchImpl, now: () => new Date("2026-11-22T00:00:00Z") });
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      qid: "Q12501",
      label: "Great Wall of China",
      aliases: ["Great Wall"],
      sourceTier: "C",
      reviewStatus: "candidate",
      licenseCode: "CC0-1.0",
      sourceUrl: "https://www.wikidata.org/wiki/Q12501",
      retrievedAt: "2026-11-22T00:00:00.000Z",
    });
    expect(res[0]!.queryHash).toMatch(/^[0-9a-f]{64}$/);
    expect((calls[0]!.init!.headers as Record<string, string>)["User-Agent"]).toBe(WIKIDATA_USER_AGENT);
  });

  it("batches at 50 ids with a pause between requests and rejects malformed ids", async () => {
    let requests = 0;
    const sleeps: number[] = [];
    const fetchImpl = async () => {
      requests++;
      return new Response(JSON.stringify({ entities: {} }), { status: 200 });
    };
    const ids = Array.from({ length: 120 }, (_, i) => `Q${i + 1}`);
    await fetchWikidataCandidates(ids, { fetchImpl, sleep: async (ms) => void sleeps.push(ms) });
    expect(requests).toBe(3);
    expect(sleeps).toEqual([1000, 1000]);
    await expect(fetchWikidataCandidates(["Q1|Q2"], { fetchImpl })).rejects.toThrow();
    await expect(fetchWikidataCandidates(["javascript:1"], { fetchImpl })).rejects.toThrow();
  });

  it("surfaces upstream failures instead of inventing data", async () => {
    const fetchImpl = async () => new Response("busy", { status: 503 });
    await expect(fetchWikidataCandidates(["Q1"], { fetchImpl })).rejects.toThrow(/HTTP 503/);
  });
});
