import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * Wikidata entity adapter (docs/04_DATA_PROVENANCE.md): discovery only. Every record it produces is a
 * tier-C *candidate*; it can never satisfy the publish gate's reviewed tier A/B requirement on its own.
 */
export const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
export const WIKIDATA_USER_AGENT = "WARTRACE-editorial-tooling/0.1 (local development; https://github.com/IgesAI/wartrace-game)";
const MAX_IDS_PER_REQUEST = 50;
const MIN_INTERVAL_MS = 1000;

const qid = z.string().regex(/^Q[1-9]\d{0,11}$/);

const apiSchema = z.object({
  entities: z.record(
    z.string(),
    z.object({
      id: z.string(),
      missing: z.string().optional(),
      labels: z.record(z.string(), z.object({ value: z.string() })).optional(),
      descriptions: z.record(z.string(), z.object({ value: z.string() })).optional(),
      aliases: z.record(z.string(), z.array(z.object({ value: z.string() }))).optional(),
      sitelinks: z.record(z.string(), z.object({ title: z.string() })).optional(),
    }),
  ),
});

export type WikidataCandidate = {
  qid: string;
  label: string;
  description: string | null;
  aliases: string[];
  enwikiTitle: string | null;
  sourceUrl: string;
  retrievedAt: string;
  queryHash: string;
  sourceTier: "C";
  reviewStatus: "candidate";
  licenseCode: "CC0-1.0";
  rightsStatement: string;
};

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export function buildEntitiesUrl(ids: string[], language = "en"): string {
  const p = new URLSearchParams({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "labels|descriptions|aliases|sitelinks",
    languages: language,
    sitefilter: `${language}wiki`,
    format: "json",
  });
  return `${WIKIDATA_API}?${p.toString()}`;
}

/** Fetches labels/aliases for up to N QIDs in polite, rate-limited batches. Unknown QIDs are skipped. */
export async function fetchWikidataCandidates(
  ids: string[],
  opts: { fetchImpl?: Fetch; now?: () => Date; sleep?: (ms: number) => Promise<void>; language?: string } = {},
): Promise<WikidataCandidate[]> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => new Date());
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const language = opts.language ?? "en";
  const unique = [...new Set(ids.map((i) => i.trim().toUpperCase()))];
  for (const id of unique) qid.parse(id);

  const out: WikidataCandidate[] = [];
  for (let i = 0; i < unique.length; i += MAX_IDS_PER_REQUEST) {
    if (i > 0) await sleep(MIN_INTERVAL_MS);
    const batch = unique.slice(i, i + MAX_IDS_PER_REQUEST);
    const url = buildEntitiesUrl(batch, language);
    const res = await fetchImpl(url, { headers: { "User-Agent": WIKIDATA_USER_AGENT, Accept: "application/json" } });
    if (!res.ok) throw new Error(`Wikidata request failed: HTTP ${res.status}`);
    const parsed = apiSchema.parse(await res.json());
    const retrievedAt = now().toISOString();
    const queryHash = createHash("sha256").update(url).digest("hex");
    for (const id of batch) {
      const e = parsed.entities[id];
      if (!e || e.missing !== undefined) continue;
      const label = e.labels?.[language]?.value;
      if (!label) continue;
      out.push({
        qid: id,
        label,
        description: e.descriptions?.[language]?.value ?? null,
        aliases: [...new Set((e.aliases?.[language] ?? []).map((a) => a.value).filter((a) => a !== label))],
        enwikiTitle: e.sitelinks?.[`${language}wiki`]?.title ?? null,
        sourceUrl: `https://www.wikidata.org/wiki/${id}`,
        retrievedAt,
        queryHash,
        sourceTier: "C",
        reviewStatus: "candidate",
        licenseCode: "CC0-1.0",
        rightsStatement: "Wikidata structured data is CC0 1.0. Linked media is licensed separately and is not imported.",
      });
    }
  }
  return out;
}
